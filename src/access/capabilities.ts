import type { AppAudience } from '@/access/audience';

export type Capability =
  | 'paywall'
  | 'referral'
  | 'health_survey'
  | 'clinical_screenings'
  | 'unlimited_chat';

const B2C_ONLY: ReadonlySet<Capability> = new Set(['paywall', 'referral']);

const INSTITUTION_ONLY: ReadonlySet<Capability> = new Set([
  'health_survey',
  'clinical_screenings',
  'unlimited_chat',
]);

export function canAccess(audience: AppAudience, capability: Capability): boolean {
  if (B2C_ONLY.has(capability)) return audience === 'b2c';
  if (INSTITUTION_ONLY.has(capability)) return audience === 'institution';
  return true;
}
