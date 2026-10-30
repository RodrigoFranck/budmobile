import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { BudButton, BudIconButton } from '@/components/v3';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, useV3Colors } from '@/theme';

export function MenuHeader({
  title,
  onBack,
  trailing,
}: {
  title?: string;
  onBack: () => void;
  trailing?: ReactNode;
}) {
  const colors = useV3Colors();
  return (
    <View
      style={{
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={onBack} />
      {title ? (
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.sansSemi,
            fontSize: 18,
            lineHeight: 18,
            color: colors.text,
          }}
        >
          {title}
        </Text>
      ) : (
        <View />
      )}
      {trailing ?? <View style={{ width: 48, height: 48 }} />}
    </View>
  );
}

export function AccentTitle({
  before,
  accent,
  after,
  size = 34,
  lineHeight = 40,
  align = 'left',
}: {
  before: string;
  accent: string;
  after?: string;
  size?: number;
  lineHeight?: number;
  align?: 'left' | 'center';
}) {
  const colors = useV3Colors();
  const { g } = useGenderedCopy();
  return (
    <Text
      style={{
        fontFamily: fonts.display,
        fontSize: size,
        lineHeight,
        letterSpacing: -0.4,
        color: colors.text,
        textAlign: align,
      }}
    >
      {g(before)}
      <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', color: colors.accent }}>
        {g(accent)}
      </Text>
      {after ? g(after) : ''}
    </Text>
  );
}

export function SectionLabel({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  const colors = useV3Colors();
  return (
    <Text
      style={[
        {
          fontFamily: fonts.sansSemi,
          fontSize: 11.5,
          lineHeight: 11.5,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: colors.text3,
          paddingHorizontal: 4,
        },
        style,
      ]}
    >
      {label}
    </Text>
  );
}

export function PrefGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useV3Colors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 20,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrefRow({
  label,
  value,
  hint,
  icon: Icon,
  onPress,
  trailing,
  last,
  tall,
}: {
  label: string;
  value?: string;
  hint?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  trailing?: ReactNode;
  last?: boolean;
  tall?: boolean;
}) {
  const colors = useV3Colors();
  const subtitle = hint;
  const height = tall || subtitle ? 72 : 58;
  const content = (
    <View
      style={{
        minHeight: height,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
      }}
    >
      {Icon ? <Icon color={colors.text} size={22} /> : null}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 16,
            lineHeight: 16,
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              lineHeight: 16.9,
              color: colors.text3,
              marginTop: 5,
            }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value && !hint ? (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 15,
            color: colors.text3,
            maxWidth: 160,
            textAlign: 'right',
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {trailing}
      {onPress && !trailing ? <ChevronRight color={colors.text3} size={18} /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </Pressable>
  );
}

export function BudToggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  const colors = useV3Colors();
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        backgroundColor: value ? colors.accent : colors.line,
        justifyContent: 'center',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? colors.onAccent : colors.text2,
          marginLeft: value ? 23 : 3,
        }}
      />
    </Pressable>
  );
}

export function SelectOption({
  label,
  selected,
  onPress,
  multi,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  const colors = useV3Colors();
  const { g } = useGenderedCopy();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        minHeight: 60,
        borderRadius: 20,
        paddingHorizontal: 22,
        backgroundColor: selected ? colors.accent : colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: multi ? 'space-between' : 'center',
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansSemi,
          fontSize: 16.5,
          lineHeight: 16.5,
          color: selected ? colors.onAccent : colors.text,
          flex: multi ? 1 : undefined,
          textAlign: multi ? 'left' : 'center',
        }}
      >
        {g(label)}
      </Text>
      {multi ? (
        selected ? (
          <Check color={colors.onAccent} size={22} strokeWidth={2.4} />
        ) : (
          <Plus color={colors.text} size={22} strokeWidth={2} opacity={0.7} />
        )
      ) : null}
    </Pressable>
  );
}

export function ScreenScaffold({
  children,
  padded = true,
  bottom,
  scroll = true,
}: {
  children: ReactNode;
  padded?: boolean;
  bottom?: ReactNode;
  scroll?: boolean;
}) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const body = padded ? <View style={{ paddingHorizontal: 20 }}>{children}</View> : children;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: insets.bottom + (bottom ? 108 : 40),
            flexGrow: 1,
          }}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingBottom: insets.bottom + (bottom ? 108 : 40) }}>{body}</View>
      )}
      {bottom ? (
        <View
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: insets.bottom + 16,
          }}
        >
          {bottom}
        </View>
      ) : null}
    </View>
  );
}

export function BottomSheet({
  visible,
  onClose,
  children,
  height,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  height: number;
}) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          style={{
            ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
            backgroundColor: colors.scrim,
            opacity: 0.55,
          }}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 28,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            minHeight: height,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.line,
              }}
            />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function PrefTextField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  const colors = useV3Colors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text3}
      autoCapitalize="words"
      style={{
        minHeight: 56,
        borderRadius: 18,
        backgroundColor: colors.surface2,
        paddingHorizontal: 22,
        fontFamily: fonts.sans,
        fontSize: 16,
        color: colors.text,
      }}
    />
  );
}

export { BudButton };
