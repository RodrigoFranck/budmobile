import { Text, View } from 'react-native';

import { BudSkeletonBone, BudSkeletonPulse } from '@/components/v3/BudSkeleton';
import { fonts, useV3Colors, type V3Colors } from '@/theme';

function RecapCardSkeleton({ colors }: { colors: V3Colors }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 24,
        height: 224,
        overflow: 'hidden',
        paddingHorizontal: 20,
        paddingTop: 72,
        gap: 12,
      }}
    >
      <BudSkeletonBone width="100%" height={12} borderRadius={6} tone="line" colors={colors} />
      <BudSkeletonBone width="70%" height={12} borderRadius={6} tone="line" colors={colors} />
    </View>
  );
}

export function HomeLetterSkeleton() {
  const colors = useV3Colors();

  return (
    <BudSkeletonPulse
      accessibilityLabel="Preparando carta"
      style={{ alignItems: 'center', marginTop: 28 }}
    >
      <View style={{ transform: [{ rotate: '-6deg' }] }}>
        <BudSkeletonBone width={200} height={130} borderRadius={10} colors={colors} />
      </View>
    </BudSkeletonPulse>
  );
}

export function HomeRecapsSkeleton({ cardCount = 2 }: { cardCount?: number }) {
  const colors = useV3Colors();

  return (
    <BudSkeletonPulse accessibilityLabel="Preparando sugestões">
      <View
        style={{
          paddingHorizontal: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansSemi,
            fontSize: 11.5,
            lineHeight: 12,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            color: colors.text3,
          }}
        >
          Para começar
        </Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <BudSkeletonBone width={42} height={11} borderRadius={5.5} colors={colors} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, marginTop: 17, gap: 12 }}>
        {Array.from({ length: cardCount }, (_, index) => (
          <RecapCardSkeleton key={`recap-skeleton-${index}`} colors={colors} />
        ))}
      </View>
    </BudSkeletonPulse>
  );
}

export function HomeRecapGeneratingSkeleton() {
  const colors = useV3Colors();

  return (
    <BudSkeletonPulse accessibilityLabel="Atualizando sugestões">
      <RecapCardSkeleton colors={colors} />
    </BudSkeletonPulse>
  );
}
