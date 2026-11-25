import { useCallback, useMemo } from 'react';

import { AI_THIRD_PARTY_CONSENT_VERSION } from '@/constants/aiConsent';
import { useV3Preferences } from '@/hooks/useV3Preferences';

export function hasValidAiThirdPartyConsent(
  consent: boolean | undefined,
  version: string | undefined,
): boolean {
  return Boolean(consent) && version === AI_THIRD_PARTY_CONSENT_VERSION;
}

export function useAiThirdPartyConsent() {
  const { prefs, persist } = useV3Preferences();
  const hasConsent = useMemo(
    () => hasValidAiThirdPartyConsent(prefs.aiThirdPartyConsent, prefs.aiThirdPartyConsentVersion),
    [prefs.aiThirdPartyConsent, prefs.aiThirdPartyConsentVersion],
  );

  const acceptConsent = useCallback(async (): Promise<boolean> => {
    if (hasConsent) return true;
    try {
      return await persist({
        aiThirdPartyConsent: true,
        aiThirdPartyConsentVersion: AI_THIRD_PARTY_CONSENT_VERSION,
      });
    } catch {
      return false;
    }
  }, [hasConsent, persist]);

  return {
    hasConsent,
    acceptConsent,
  };
}
