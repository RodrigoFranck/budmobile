/**
 * URLs de auth — Redirect URLs do Supabase / Google Cloud devem incluir estes valores.
 *
 * TF-81: o consent Google mostra o domínio do redirect_uri. Produção deve usar
 * o domínio próprio (app.falecombud.com.br), nunca lovable.app.
 * Override: EXPO_PUBLIC_SITE_ORIGIN (rollback temporário para budmind.lovable.app
 * enquanto o custom domain / OAuth branding não estiver no ar).
 *
 * Google OAuth exige callback HTTPS cadastrado no Google Cloud Console.
 * Reset de senha usa deep link nativo — sem dependência do front web.
 */
import * as Linking from 'expo-linking';

/** Origem HTTPS autorizada no Google OAuth / fluxos de e-mail. */
export const SITE_ORIGIN =
  process.env.EXPO_PUBLIC_SITE_ORIGIN?.trim() ||
  'https://app.falecombud.com.br';

/** Deep link nativo: com.bud.app://reset-password */
export const PASSWORD_RESET_REDIRECT = Linking.createURL('reset-password', {
  scheme: 'com.bud.app',
});

/**
 * Callback HTTPS do Google OAuth (deve bater com o redirect URI do Google Cloud).
 * A página devolve o hash para o app via deep link.
 */
export const MOBILE_OAUTH_WEB_CALLBACK = `${SITE_ORIGIN}/auth/mobile-callback`;
