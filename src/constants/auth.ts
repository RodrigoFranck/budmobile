/**
 * URLs de auth — Redirect URLs do Supabase / Google Cloud devem incluir estes valores.
 *
 * Google OAuth exige callback HTTPS cadastrado no Google Cloud Console.
 * Reset de senha usa deep link nativo — sem dependência do front web.
 */
import * as Linking from 'expo-linking';

/** Origem HTTPS já autorizada no Google OAuth / fluxos de e-mail. */
export const SITE_ORIGIN = 'https://budmind.lovable.app';

/** Deep link nativo: com.bud.app://reset-password */
export const PASSWORD_RESET_REDIRECT = Linking.createURL('reset-password', {
  scheme: 'com.bud.app',
});

/**
 * Callback HTTPS do Google OAuth (deve bater com o redirect URI do Google Cloud).
 * A página devolve o hash para o app via deep link.
 */
export const MOBILE_OAUTH_WEB_CALLBACK = `${SITE_ORIGIN}/auth/mobile-callback`;
