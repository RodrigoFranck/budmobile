/**
 * Copy into App Store Connect → App Review Information → Notes.
 * Keep sandbox credentials filled in the ASC form fields separately.
 */
export const APP_STORE_REVIEW_NOTES = `Bud Premium IAP (sandbox)
• Products: premium_mensal_2 (monthly), premium_anual_2 (annual)
• Path: sign in with the demo account → open Conta / Paywall → Assinar o Bud Premium
• Paid Applications Agreement must be Active; both subscriptions Cleared for Sale and attached to this version

AI third-party consent (Guideline 5.1.1 / 5.1.2)
• During onboarding (first commitment step), the app requires explicit consent naming OpenAI (text) and ElevenLabs (voice), what data is sent, and a link to the Privacy Policy — before the user reaches the main app
• Existing accounts without consent see a full-screen consent gate after login
• Privacy Policy: https://falecombud.com.br/legal/privacidade-bud-2026
`;

export const APP_STORE_ASC_CHECKLIST = [
  'Agreements, Tax, and Banking → Paid Applications = Active (complete bank/tax if Action Needed)',
  'Subscriptions → Bud. Profundo → premium_mensal_2 and premium_anual_2: price, localization, review screenshot, Cleared for Sale',
  'App version page → In-App Purchases / Subscriptions → attach both *_2 products to the submission',
  'Sandbox Apple ID on device → open paywall → real store prices → purchase completes without error alert',
  'Paste APP_STORE_REVIEW_NOTES into App Review Information Notes; fill demo account + password',
  'Confirm Privacy Policy page names OpenAI and ElevenLabs before Submit',
] as const;
