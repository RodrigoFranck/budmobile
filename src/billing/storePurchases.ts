import { Linking, Platform } from 'react-native';

import { supabase } from '@/integrations/supabase/client';
import {
  ANDROID_PACKAGE,
  PREMIUM_PRODUCT_IDS,
  type BillingInterval,
} from '@/billing/products';
import { FALLBACK_PLAN_PRICES, formatYearlyAsMonthly, type PlanPrices } from '@/billing/prices';
import type { ProductSubscription, Purchase } from 'react-native-iap';

export class PurchaseCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'PurchaseCancelled';
  }
}

type IapModule = typeof import('react-native-iap');

let connection: Promise<void> | null = null;
let cachedProducts: ProductSubscription[] = [];

async function loadIap(): Promise<IapModule> {
  return import('react-native-iap');
}

async function ensureConnection(): Promise<IapModule> {
  const iap = await loadIap();
  if (!connection) {
    connection = iap.initConnection().then(() => undefined).catch((error: unknown) => {
      connection = null;
      throw error;
    });
  }
  await connection;
  return iap;
}

function platformKey(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function productIdFor(interval: BillingInterval): string {
  return PREMIUM_PRODUCT_IDS[platformKey()][interval];
}

function isSubscription(product: { type?: string }): product is ProductSubscription {
  return product.type === 'subs';
}

function offerToken(product: ProductSubscription): string | null {
  if (product.platform !== 'android') return null;
  const offers = product.subscriptionOfferDetailsAndroid ?? [];
  const base = offers.find((offer) => !offer.offerId) ?? offers[0];
  if (!base?.offerToken) return null;
  return base.offerToken;
}

export function pricesFromProducts(products: ProductSubscription[]): PlanPrices {
  const ids = PREMIUM_PRODUCT_IDS[platformKey()];
  const monthly = products.find((product) => product.id === ids.monthly);
  const annual = products.find((product) => product.id === ids.annual);
  return {
    monthly: monthly?.displayPrice || FALLBACK_PLAN_PRICES.monthly,
    annualTotal: annual?.displayPrice || FALLBACK_PLAN_PRICES.annualTotal,
    annualPerMonth:
      annual?.price != null
        ? formatYearlyAsMonthly(annual.price, annual.currency)
        : FALLBACK_PLAN_PRICES.annualPerMonth,
  };
}

let pricesOnce: Promise<PlanPrices> | null = null;
let restoreOnce: Promise<boolean> | null = null;

export function loadPremiumPricesOnce(): Promise<PlanPrices> {
  if (!pricesOnce) {
    pricesOnce = loadPremiumPrices().catch((error: unknown) => {
      pricesOnce = null;
      throw error;
    });
  }
  return pricesOnce;
}

export function restorePremiumPurchasesOnce(): Promise<boolean> {
  if (!restoreOnce) {
    restoreOnce = restorePremiumPurchases().catch((error: unknown) => {
      restoreOnce = null;
      throw error;
    });
  }
  return restoreOnce;
}

export async function loadPremiumPrices(): Promise<PlanPrices> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return FALLBACK_PLAN_PRICES;
  const iap = await ensureConnection();
  const ids = PREMIUM_PRODUCT_IDS[platformKey()];
  const result = await iap.fetchProducts({ skus: [ids.monthly, ids.annual], type: 'subs' });
  cachedProducts = (result ?? []).filter(isSubscription);
  return pricesFromProducts(cachedProducts);
}

function purchasesOf(result: Purchase | Purchase[] | null | undefined): Purchase[] {
  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

function syncMessage(code: string, fallback: string): string {
  if (code === 'google_play_not_configured') {
    return 'A Play Store ainda não está ligada ao Bud. A assinatura no Android depende dessa configuração.';
  }
  if (code === 'account_mismatch') {
    return 'Essa compra pertence a outra conta Bud.';
  }
  if (code === 'product_not_allowed') {
    return 'Esse produto ainda não está configurado para o Bud Premium.';
  }
  return fallback;
}

async function syncPurchase(purchase: Purchase): Promise<boolean> {
  const purchaseToken = purchase.purchaseToken ?? null;
  if (!purchaseToken) {
    throw new Error('A loja não enviou o comprovante da compra.');
  }
  const transactionId = 'transactionId' in purchase ? purchase.transactionId : purchase.id;
  const { data, error } = await supabase.functions.invoke('sync-store-purchase', {
    body: {
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      productId: purchase.productId,
      transactionId,
      purchaseToken,
    },
  });
  if (error) {
    let code = '';
    try {
      const context = (error as { context?: Response }).context;
      if (context) {
        const payload = await context.json() as { error?: string };
        code = payload.error ?? '';
      }
    } catch {
      code = '';
    }
    throw new Error(syncMessage(code, 'Não foi possível confirmar a compra com a loja.'));
  }
  return Boolean((data as { active?: boolean } | null)?.active);
}

async function finishPurchase(iap: IapModule, purchase: Purchase): Promise<void> {
  try {
    await iap.finishTransaction({ purchase, isConsumable: false });
  } catch {
    // A compra já confirmada no servidor pode ser finalizada de novo no restore.
  }
}

function isCancelled(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'user-cancelled',
  );
}

function isAlreadyOwned(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'already-owned',
  );
}

export async function restorePremiumPurchases(): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  const iap = await ensureConnection();
  const purchases = await iap.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  const premium = purchases.filter((purchase) =>
    purchase.productId === PREMIUM_PRODUCT_IDS[platformKey()].monthly ||
    purchase.productId === PREMIUM_PRODUCT_IDS[platformKey()].annual,
  );
  let active = false;
  for (const purchase of premium) {
    const restored = await syncPurchase(purchase);
    await finishPurchase(iap, purchase);
    active = active || restored;
  }
  return active;
}

export async function purchasePremium(interval: BillingInterval, userId: string): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    throw new Error('A assinatura está disponível no app para iOS e Android.');
  }
  const sku = productIdFor(interval);
  if (!cachedProducts.some((product) => product.id === sku)) {
    await loadPremiumPrices();
  }
  const product = cachedProducts.find((item) => item.id === sku);
  if (!product) {
    throw new Error('Esse plano ainda não está disponível na loja.');
  }

  const iap = await ensureConnection();
  const token = offerToken(product);
  if (Platform.OS === 'android' && !token) {
    throw new Error('A assinatura ainda não tem um plano ativo na Play Store.');
  }

  try {
    const result = await iap.requestPurchase({
      type: 'subs',
      request: {
        apple: { sku, appAccountToken: userId },
        google: {
          skus: [sku],
          obfuscatedAccountIdAndroid: userId,
          subscriptionOffers: token ? [{ sku, offerToken: token }] : [],
        },
      },
    });
    const purchases = purchasesOf(result);
    if (purchases.length === 0) {
      throw new Error('A loja não confirmou a compra.');
    }
    for (const purchase of purchases) {
      const active = await syncPurchase(purchase);
      await finishPurchase(iap, purchase);
      if (!active) {
        throw new Error('A loja confirmou a compra, mas ela não está ativa.');
      }
    }
  } catch (error) {
    if (error instanceof PurchaseCancelled || isCancelled(error)) {
      throw new PurchaseCancelled();
    }
    if (isAlreadyOwned(error)) {
      const restored = await restorePremiumPurchases();
      if (!restored) {
        throw new Error('Essa assinatura já está ligada a outra conta da loja.');
      }
      return;
    }
    if (error instanceof Error) throw error;
    throw new Error('Não foi possível concluir a compra.');
  }
}

export async function openSubscriptionManagement(productId: string | null): Promise<void> {
  if (Platform.OS === 'ios') {
    const iap = await ensureConnection();
    await iap.showManageSubscriptionsIOS();
    return;
  }
  const sku = productId || PREMIUM_PRODUCT_IDS.android.monthly;
  await Linking.openURL(
    `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}&sku=${sku}`,
  );
}
