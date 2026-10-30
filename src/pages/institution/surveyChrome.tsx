import { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ChevronLeft, X } from 'lucide-react-native';

import { BudIconButton } from '@/components/v3';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, useV3Colors } from '@/theme';

const ICON_STROKE = {
  strokeWidth: 1.55833,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function SurveyClockIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M19.25 11C19.25 15.5563 15.5563 19.25 11 19.25C6.44365 19.25 2.75 15.5563 2.75 11C2.75 6.44365 6.44365 2.75 11 2.75C15.5563 2.75 19.25 6.44365 19.25 11Z"
        stroke={color}
        {...ICON_STROKE}
      />
      <Path d="M11 6.41667V11L13.75 12.8333" stroke={color} {...ICON_STROKE} />
    </Svg>
  );
}

export function SurveyLockIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M6.41667 10.0833H15.5833C16.5959 10.0833 17.4167 10.9041 17.4167 11.9167V17.4167C17.4167 18.4292 16.5959 19.25 15.5833 19.25H6.41667C5.40414 19.25 4.58333 18.4292 4.58333 17.4167V11.9167C4.58333 10.9041 5.40414 10.0833 6.41667 10.0833Z"
        stroke={color}
        {...ICON_STROKE}
      />
      <Path
        d="M7.33333 10.0833V7.33333C7.33333 6.36087 7.71964 5.42824 8.40727 4.74061C9.09491 4.05297 10.0275 3.66667 11 3.66667C11.9725 3.66667 12.9051 4.05297 13.5927 4.74061C14.2804 5.42824 14.6667 6.36087 14.6667 7.33333V10.0833"
        stroke={color}
        {...ICON_STROKE}
      />
    </Svg>
  );
}

export function SurveyHeader({
  title,
  onBack,
  onClose,
  progress,
  titleAlign = 'center',
}: {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  progress?: number;
  titleAlign?: 'center' | 'left';
}) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const { g } = useGenderedCopy();

  return (
    <View style={{ paddingTop: insets.top }}>
      <View
        style={{
          height: 56,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {onBack ? (
          <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={onBack} />
        ) : null}
        <Text
          style={{
            flex: titleAlign === 'center' ? 1 : undefined,
            fontFamily: fonts.sansSemi,
            fontSize: 18,
            lineHeight: 18,
            color: colors.text,
            textAlign: titleAlign,
          }}
        >
          {g(title)}
        </Text>
        {onClose ? (
          <BudIconButton icon={X} accessibilityLabel="Fechar" onPress={onClose} />
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>
      {progress !== undefined ? (
        <View
          style={{
            height: 4,
            borderRadius: 2,
            marginHorizontal: 24,
            marginTop: 8,
            backgroundColor: colors.surface2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: 4,
              borderRadius: 2,
              width: `${Math.max(0, Math.min(100, progress * 100))}%`,
              backgroundColor: colors.accent,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

export function SurveyChoice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const colors = useV3Colors();
  const { g } = useGenderedCopy();
  const display = g(label);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={display}
      style={{
        minHeight: 58,
        borderRadius: 18,
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? colors.surface2 : colors.surface,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansSemi,
          fontSize: 15.5,
          lineHeight: 21,
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {display}
      </Text>
    </Pressable>
  );
}

export function SurveyField({
  value,
  placeholder,
  onChangeText,
  keyboardType = 'number-pad',
}: {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'number-pad' | 'decimal-pad';
}) {
  const colors = useV3Colors();
  const filled = value.length > 0;
  return (
    <View
      style={{
        height: 62,
        borderRadius: 20,
        backgroundColor: colors.surface2,
        paddingLeft: 22,
        paddingRight: 8,
        justifyContent: 'center',
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        keyboardType={keyboardType}
        returnKeyType="done"
        style={{
          fontFamily: fonts.sans,
          fontSize: filled ? 20 : 16,
          lineHeight: filled ? 20 : 16,
          color: colors.text,
          padding: 0,
        }}
      />
    </View>
  );
}

export function SurveyScale({
  value,
  min,
  max,
  minLabel,
  maxLabel,
  onChange,
}: {
  value: number | undefined;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  onChange: (next: number) => void;
}) {
  const colors = useV3Colors();
  const numbers = useMemo(() => {
    const items: number[] = [];
    for (let n = min; n <= max; n += 1) items.push(n);
    return items;
  }, [min, max]);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {numbers.map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={String(n)}
              style={{
                flex: 1,
                height: 52,
                maxWidth: 34,
                minWidth: 0,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.line,
                backgroundColor: selected ? colors.accent : 'transparent',
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansSemi,
                  fontSize: 15,
                  lineHeight: 15,
                  color: selected ? colors.onAccent : colors.text,
                }}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 18,
        }}
      >
        <Text
          style={{
            maxWidth: 170,
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 18,
            color: colors.text2,
          }}
        >
          {minLabel}
        </Text>
        <Text
          style={{
            maxWidth: 170,
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 18,
            color: colors.text2,
            textAlign: 'right',
          }}
        >
          {maxLabel}
        </Text>
      </View>
    </View>
  );
}

const VAS_TRACK = 330;
const VAS_THUMB = 40;
const VAS_RING = 8;

export function SurveyVas({
  value,
  minLabel,
  maxLabel,
  onChange,
}: {
  value: number;
  minLabel: string;
  maxLabel: string;
  onChange: (next: number) => void;
}) {
  const colors = useV3Colors();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const trackHRef = useRef(VAS_TRACK);
  const [trackH, setTrackH] = useState(VAS_TRACK);
  const centerY = ((100 - value) / 100) * trackH;
  const thumbTop = centerY - VAS_THUMB / 2;
  const fillHeight = trackH - centerY;

  const setFromY = (y: number) => {
    const height = trackHRef.current || VAS_TRACK;
    const next = Math.round(100 - (y / height) * 100);
    onChangeRef.current(Math.max(0, Math.min(100, next)));
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event: GestureResponderEvent) => {
          setFromY(event.nativeEvent.locationY);
        },
        onPanResponderMove: (event: GestureResponderEvent) => {
          setFromY(event.nativeEvent.locationY);
        },
      }),
    [],
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const height = Math.round(event.nativeEvent.layout.height);
    if (height > 0 && height !== trackHRef.current) {
      trackHRef.current = height;
      setTrackH(height);
    }
  };

  const labelStyle = {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14,
    color: colors.text2,
    marginLeft: 110,
  } as const;

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 56,
          lineHeight: 56,
          letterSpacing: -0.4,
          color: colors.accent,
          textAlign: 'center',
        }}
      >
        {value}
      </Text>
      <Text style={[labelStyle, { marginTop: 34 }]}>{maxLabel}</Text>
      <View
        {...pan.panHandlers}
        onLayout={onTrackLayout}
        style={{
          width: VAS_THUMB,
          flex: 1,
          maxHeight: VAS_TRACK,
          marginTop: 16,
          marginLeft: 53,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: 6,
            top: 0,
            bottom: 0,
            borderRadius: 3,
            backgroundColor: colors.surface2,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 6,
            borderRadius: 3,
            backgroundColor: colors.accent,
            bottom: 0,
            height: Math.max(6, fillHeight),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: VAS_THUMB + VAS_RING * 2,
            height: VAS_THUMB + VAS_RING * 2,
            borderRadius: VAS_THUMB / 2 + VAS_RING,
            backgroundColor: colors.bg,
            top: thumbTop - VAS_RING,
            left: -VAS_RING,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: VAS_THUMB,
              height: VAS_THUMB,
              borderRadius: VAS_THUMB / 2,
              backgroundColor: colors.btn,
            }}
          />
        </View>
      </View>
      <Text style={[labelStyle, { marginTop: 12 }]}>{minLabel}</Text>
    </View>
  );
}
