import { useCallback, useMemo, useRef, useState } from 'react';

import { AiThirdPartyConsentModal } from '@/components/privacy/AiThirdPartyConsentModal';
import { AI_THIRD_PARTY_CONSENT_VERSION } from '@/constants/aiConsent';
import { useV3Preferences } from '@/hooks/useV3Preferences';

function hasValidConsent(
  consent: boolean | undefined,
  version: string | undefined,
): boolean {
  return Boolean(consent) && version === AI_THIRD_PARTY_CONSENT_VERSION;
}

export function useAiThirdPartyConsent() {
  const { prefs, persist } = useV3Preferences();
  const consented = hasValidConsent(prefs.aiThirdPartyConsent, prefs.aiThirdPartyConsentVersion);
  const [visible, setVisible] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const resolverRef = useRef<((allowed: boolean) => void) | null>(null);

  const settle = useCallback((allowed: boolean) => {
    setVisible(false);
    setAccepting(false);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(allowed);
  }, []);

  const ensureConsent = useCallback((): Promise<boolean> => {
    if (consented) return Promise.resolve(true);
    if (resolverRef.current) {
      return new Promise<boolean>((resolve) => {
        const previous = resolverRef.current;
        resolverRef.current = (allowed) => {
          previous?.(allowed);
          resolve(allowed);
        };
      });
    }
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setVisible(true);
    });
  }, [consented]);

  const onAccept = useCallback(() => {
    void (async () => {
      setAccepting(true);
      try {
        const saved = await persist({
          aiThirdPartyConsent: true,
          aiThirdPartyConsentVersion: AI_THIRD_PARTY_CONSENT_VERSION,
        });
        if (!saved) {
          settle(false);
          return;
        }
        settle(true);
      } catch {
        settle(false);
      }
    })();
  }, [persist, settle]);

  const onDecline = useCallback(() => {
    settle(false);
  }, [settle]);

  const consentModal = useMemo(
    () => (
      <AiThirdPartyConsentModal
        visible={visible}
        accepting={accepting}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    ),
    [accepting, onAccept, onDecline, visible],
  );

  return {
    hasConsent: consented,
    ensureConsent,
    consentModal,
  };
}
