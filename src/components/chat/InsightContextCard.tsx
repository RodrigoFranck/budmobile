import { Image, Text, View } from 'react-native';

import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type {
  InsightActivityType,
  InsightContextVariant,
} from '@/utils/insightContextVariant';

interface InsightContextCardProps {
  badge: string;
  title: string;
  description?: string;
  variant?: InsightContextVariant;
  activityType?: InsightActivityType;
}

function TitleWithAccent({ title, accentColor, textColor }: {
  title: string;
  accentColor: string;
  textColor: string;
}) {
  const parts = title.split(/(\*[^*]+\*)/g).filter(Boolean);
  if (parts.length === 1 && !title.includes('*')) {
    const words = title.trim().split(/\s+/);
    if (words.length <= 1) {
      return (
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 19,
            lineHeight: 24,
            letterSpacing: -0.4,
            color: textColor,
          }}
        >
          {title}
        </Text>
      );
    }
    const last = words[words.length - 1]!;
    const head = words.slice(0, -1).join(' ');
    return (
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 19,
          lineHeight: 24,
          letterSpacing: -0.4,
          color: textColor,
        }}
      >
        {head ? `${head} ` : ''}
        <Text style={{ fontFamily: fonts.displayItalic, color: accentColor }}>{last}</Text>
      </Text>
    );
  }

  return (
    <Text
      style={{
        fontFamily: fonts.display,
        fontSize: 19,
        lineHeight: 24,
        letterSpacing: -0.4,
        color: textColor,
      }}
    >
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <Text
              key={`${part}-${index}`}
              style={{ fontFamily: fonts.displayItalic, color: accentColor }}
            >
              {part.slice(1, -1)}
            </Text>
          );
        }
        return <Text key={`${part}-${index}`}>{part}</Text>;
      })}
    </Text>
  );
}

function activityGiz(
  assets: ReturnType<typeof useV3Asset>,
  activityType?: InsightActivityType,
) {
  switch (activityType) {
    case 'cinco_porques':
      return assets.cincoPorquesGiz;
    case 'valores':
      return assets.valoresGiz;
    case 'mapa_relacoes':
      return assets.mapaGiz;
    case 'fiee':
    default:
      return assets.fieeGiz;
  }
}

export function InsightContextCard({
  badge,
  title,
  description,
  variant = 'start',
  activityType,
}: InsightContextCardProps) {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const accessibilityText = description?.trim()
    ? `${badge}. ${title}. ${description}`
    : `${badge}. ${title}`;

  return (
    <View
      style={{
        alignSelf: 'stretch',
        marginBottom: 22,
        paddingHorizontal: 0,
      }}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityText}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          paddingVertical: 16,
          paddingLeft: 16,
          paddingRight: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          minHeight: variant === 'activity' ? 118 : variant === 'letter' ? 106 : 94,
        }}
      >
        {variant === 'letter' ? (
          <View style={{ width: 58, height: 74 }}>
            <View
              style={{
                width: 58,
                height: 74,
                borderRadius: 5,
                overflow: 'hidden',
                transform: [{ rotate: '-5deg' }],
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
              }}
            >
              <Image
                source={assets.envelopePaper}
                style={{ width: 58, height: 74 }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  left: 9,
                  top: 12,
                  width: 40,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: colors.line,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 9,
                  top: 21,
                  width: 33,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: colors.line,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 9,
                  top: 30,
                  width: 27,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: colors.line,
                }}
              />
              <Image
                source={assets.waxSeal}
                style={{
                  position: 'absolute',
                  width: 30,
                  height: 30,
                  right: -4,
                  bottom: -2,
                  transform: [{ rotate: '14deg' }],
                }}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : null}

        {variant === 'activity' ? (
          <Image
            source={activityGiz(assets, activityType)}
            style={{ width: 64, height: 64 }}
            resizeMode="contain"
          />
        ) : null}

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: fonts.sansSemi,
              fontSize: 11.5,
              lineHeight: 11.5,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: colors.text3,
            }}
          >
            {badge}
          </Text>

          {variant === 'start' ? (
            <View
              style={{
                marginTop: 10,
                borderLeftWidth: 2,
                borderLeftColor: colors.accent,
                paddingLeft: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansItalic,
                  fontSize: 15,
                  lineHeight: 21,
                  color: colors.text2,
                }}
              >
                {description?.trim() || title}
              </Text>
            </View>
          ) : (
            <>
              <View style={{ marginTop: 8 }}>
                <TitleWithAccent
                  title={title}
                  accentColor={colors.accent}
                  textColor={colors.text}
                />
              </View>
              {variant === 'activity' && description?.trim() ? (
                <Text
                  numberOfLines={2}
                  style={{
                    marginTop: 6,
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    lineHeight: 19,
                    color: colors.text2,
                  }}
                >
                  {description.trim()}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}
