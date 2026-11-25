import { Linking, Pressable, Text, View } from 'react-native';

import { BudToggle } from '@/components/v3';
import {
  AI_THIRD_PARTY_CONSENT_BODY,
  AI_THIRD_PARTY_CONSENT_PRIVACY_LINK,
  AI_THIRD_PARTY_CONSENT_TOGGLE,
  PRIVACY_POLICY_URL,
} from '@/constants/aiConsent';
import { fonts, useV3Colors } from '@/theme';

type AiThirdPartyConsentCopyProps = {
  accepted: boolean;
  onAcceptedChange: (next: boolean) => void;
  cardStyle?: object;
  copyStyle?: object;
};

/** Shared disclosure + required toggle used in onboarding commitment and the post-login gate. */
export function AiThirdPartyConsentCopy({
  accepted,
  onAcceptedChange,
  cardStyle,
  copyStyle,
}: AiThirdPartyConsentCopyProps) {
  const colors = useV3Colors();

  return (
    <View>
      <Text
        style={[
          {
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 22,
            color: colors.text2,
            marginHorizontal: 24,
            marginBottom: 16,
          },
          copyStyle,
        ]}
      >
        {AI_THIRD_PARTY_CONSENT_BODY}
      </Text>
      <Pressable
        onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        accessibilityRole="link"
        accessibilityLabel={AI_THIRD_PARTY_CONSENT_PRIVACY_LINK}
        style={{ marginHorizontal: 24, marginBottom: 18 }}
      >
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            lineHeight: 18,
            color: colors.text3,
          }}
        >
          {AI_THIRD_PARTY_CONSENT_PRIVACY_LINK}
        </Text>
      </Pressable>
      <View
        style={[
          {
            marginHorizontal: 24,
            marginBottom: 26,
            borderRadius: 22,
            padding: 22,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 18,
            backgroundColor: colors.surface,
          },
          cardStyle,
        ]}
      >
        <BudToggle
          value={accepted}
          onValueChange={onAcceptedChange}
          accessibilityLabel={AI_THIRD_PARTY_CONSENT_TOGGLE}
        />
        <Pressable
          onPress={() => onAcceptedChange(!accepted)}
          accessibilityRole="button"
          accessibilityLabel={AI_THIRD_PARTY_CONSENT_TOGGLE}
          style={{ flex: 1 }}
        >
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.sans,
              fontSize: 15,
              lineHeight: 21,
              color: colors.text,
            }}
          >
            {AI_THIRD_PARTY_CONSENT_TOGGLE}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
