export type BillingInterval = 'monthly' | 'annual';
export type BillingStore = 'apple' | 'google';

export const IOS_BUNDLE_ID = 'com.bud.budios';
export const ANDROID_PACKAGE = 'com.falecombud.bud';

/** Product IDs used for new purchases (App Store Connect · * 2). */
export const PREMIUM_PRODUCT_IDS = {
  ios: {
    monthly: 'premium_mensal_2',
    annual: 'premium_anual_2',
  },
  android: {
    monthly: 'premium_mensal_2',
    annual: 'premium_anual_2',
  },
} as const;

/** Legacy IDs kept for entitlement / restore of older purchases. */
const LEGACY_PREMIUM_PRODUCT_IDS = {
  monthly: 'premium_mensal',
  annual: 'premium_anual',
} as const;

const PREMIUM_PRODUCT_ID_SET = new Set<string>([
  PREMIUM_PRODUCT_IDS.ios.monthly,
  PREMIUM_PRODUCT_IDS.ios.annual,
  PREMIUM_PRODUCT_IDS.android.monthly,
  PREMIUM_PRODUCT_IDS.android.annual,
  LEGACY_PREMIUM_PRODUCT_IDS.monthly,
  LEGACY_PREMIUM_PRODUCT_IDS.annual,
]);

export function isPremiumProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return PREMIUM_PRODUCT_ID_SET.has(productId);
}

export function intervalForProductId(productId: string): BillingInterval | null {
  if (
    productId === PREMIUM_PRODUCT_IDS.ios.monthly ||
    productId === PREMIUM_PRODUCT_IDS.android.monthly ||
    productId === LEGACY_PREMIUM_PRODUCT_IDS.monthly
  ) {
    return 'monthly';
  }
  if (
    productId === PREMIUM_PRODUCT_IDS.ios.annual ||
    productId === PREMIUM_PRODUCT_IDS.android.annual ||
    productId === LEGACY_PREMIUM_PRODUCT_IDS.annual
  ) {
    return 'annual';
  }
  return null;
}
