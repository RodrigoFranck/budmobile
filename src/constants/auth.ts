/**
 * URLs usadas em auth/recovery — devem estar nas Redirect URLs do Supabase.
 * Alinhado ao budmind send-auth-email (default redirectTo).
 */
export const SITE_ORIGIN =
  process.env.EXPO_PUBLIC_SITE_URL || 'https://falecombud.com.br';

export const PASSWORD_RESET_REDIRECT = `${SITE_ORIGIN}/reset-password`;

/**
 * Mesmo fluxo do budmind MobileAuthCallback:
 * Supabase redireciona para esta URL HTTPS após o Google; a página devolve o hash para o app.
 */
export const MOBILE_OAUTH_WEB_CALLBACK = `${SITE_ORIGIN}/auth/mobile-callback`;

/**
 * App budmind (Lovable) onde o chat por voz / ElevenLabs funciona no browser.
 * WebView de voz no mobile abre esta URL — não confundir com SITE_ORIGIN (site Bud/marketing).
 * @see https://budmind.lovable.app
 */
export const BUDMIND_WEB_ORIGIN =
  process.env.EXPO_PUBLIC_BUDMIND_WEB_URL || 'https://budmind.lovable.app/#';
