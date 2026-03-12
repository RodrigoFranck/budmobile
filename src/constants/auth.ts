/**
 * URLs usadas em auth/recovery — devem estar nas Redirect URLs do Supabase.
 *
 * No mobile, o fluxo OAuth precisa passar por uma URL HTTPS (obrigação do Google/Supabase)
 * e depois voltar para o app via deep link. Usamos o front do Bud no Lovable,
 * que já expõe a rota `/auth/mobile-callback`.
 */
export const SITE_ORIGIN = 'https://budmind.lovable.app';

export const PASSWORD_RESET_REDIRECT = `${SITE_ORIGIN}/reset-password`;

/**
 * Mesmo fluxo do budmind MobileAuthCallback:
 * Supabase redireciona para esta URL HTTPS após o Google; a página devolve o hash para o app.
 */
export const MOBILE_OAUTH_WEB_CALLBACK = `${SITE_ORIGIN}/auth/mobile-callback`;
