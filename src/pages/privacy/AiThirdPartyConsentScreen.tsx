import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton } from '@/components/v3';
import { AiThirdPartyConsentCopy } from '@/components/privacy/AiThirdPartyConsentCopy';
import { AI_THIRD_PARTY_CONSENT_TITLE } from '@/constants/aiConsent';
import { TOGGLE_SAVE_FAILED_MESSAGE } from '@/components/v3/BudToggle';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useAiThirdPartyConsent } from '@/hooks/useAiThirdPartyConsent';
import { fonts, useV3Asset, useV3Colors } from '@/theme';

/**
 * Full-screen gate for accounts that finished onboarding before AI consent existed.
 * New users accept during the onboarding commitment step instead.
 */
export default function AiThirdPartyConsentScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAppAlert();
  const { hasConsent, acceptConsent } = useAiThirdPartyConsent();
  const [accepted, setAccepted] = useState(hasConsent);
  const [saving, setSaving] = useState(false);

  const handleContinue = useCallback(async () => {
    if (!accepted) return;
    setSaving(true);
    try {
      const saved = await acceptConsent();
      if (!saved) {
        showAlert({ title: TOGGLE_SAVE_FAILED_MESSAGE });
      }
    } finally {
      setSaving(false);
    }
  }, [acceptConsent, accepted, showAlert]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom, 24) + 88,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 34,
            lineHeight: 40,
            color: colors.text,
            marginHorizontal: 24,
            marginBottom: 12,
          }}
        >
          {AI_THIRD_PARTY_CONSENT_TITLE}
        </Text>
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Image
            source={assets.onboardingLock}
            style={{ width: 120, height: 120 }}
            resizeMode="contain"
          />
        </View>
        <AiThirdPartyConsentCopy accepted={accepted} onAcceptedChange={setAccepted} />
      </ScrollView>
      <View
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: Math.max(insets.bottom, 20),
        }}
      >
        <BudButton
          label="Continuar"
          loading={saving}
          disabled={!accepted}
          onPress={() => void handleContinue()}
        />
      </View>
    </View>
  );
}
