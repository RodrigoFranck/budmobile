import { Linking, Modal, Pressable, Text, View } from 'react-native';

import { BudButton } from '@/components/v3';
import {
  AI_THIRD_PARTY_CONSENT_ACCEPT,
  AI_THIRD_PARTY_CONSENT_BODY,
  AI_THIRD_PARTY_CONSENT_DECLINE,
  AI_THIRD_PARTY_CONSENT_PRIVACY_LINK,
  AI_THIRD_PARTY_CONSENT_TITLE,
  PRIVACY_POLICY_URL,
} from '@/constants/aiConsent';
import { fonts, useV3Colors } from '@/theme';

type AiThirdPartyConsentModalProps = {
  visible: boolean;
  accepting?: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export function AiThirdPartyConsentModal({
  visible,
  accepting,
  onAccept,
  onDecline,
}: AiThirdPartyConsentModalProps) {
  const colors = useV3Colors();

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onDecline}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 28,
        }}
      >
        <View
          accessibilityRole="alert"
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 20,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              lineHeight: 28,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {AI_THIRD_PARTY_CONSENT_TITLE}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 15,
              lineHeight: 22,
              color: colors.text2,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {AI_THIRD_PARTY_CONSENT_BODY}
          </Text>
          <Pressable
            onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            accessibilityLabel={AI_THIRD_PARTY_CONSENT_PRIVACY_LINK}
            style={{ alignItems: 'center', marginBottom: 20 }}
          >
            <Text
              style={{
                fontFamily: fonts.sansSemi,
                fontSize: 14,
                lineHeight: 18,
                color: colors.accent,
                textDecorationLine: 'underline',
              }}
            >
              {AI_THIRD_PARTY_CONSENT_PRIVACY_LINK}
            </Text>
          </Pressable>
          <View style={{ gap: 10 }}>
            <BudButton
              label={AI_THIRD_PARTY_CONSENT_ACCEPT}
              loading={accepting}
              onPress={onAccept}
            />
            <BudButton
              label={AI_THIRD_PARTY_CONSENT_DECLINE}
              variant="outline"
              disabled={accepting}
              onPress={onDecline}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
