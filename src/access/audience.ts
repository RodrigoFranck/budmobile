export type AppAudience = 'b2c' | 'institution';

export type AudienceProfile = {
  app_mode?: string | null;
  organization_id?: string | null;
};

/** Institution product is not in this release. Flip when org join ships. */
export const INSTITUTION_AUDIENCE_ENABLED = false;

export function resolveAudience(profile?: AudienceProfile | null): AppAudience {
  if (!INSTITUTION_AUDIENCE_ENABLED) return 'b2c';
  if (profile?.app_mode === 'institution' || profile?.organization_id) {
    return 'institution';
  }
  return 'b2c';
}
