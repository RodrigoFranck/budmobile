import { Pressable, Text, View } from 'react-native';

import type { CheckInChipOption } from '@/features/checkin/checkInFlow.types';
import { getOptionLabel, getOptionSubtitle } from '@/features/checkin/checkInSteps';
import { useCheckInFlowStyles } from './checkInFlow.styles';

interface CheckInChipListProps {
  options: CheckInChipOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export function CheckInChipList({ options, value, onChange }: CheckInChipListProps) {
  const styles = useCheckInFlowStyles();

  return (
    <View>
      {options.map((opt) => {
        const label = getOptionLabel(opt);
        const subtitle = getOptionSubtitle(opt);
        const selected = value === label;

        const handlePress = () => {
          onChange(label);
        };

        return (
          <Pressable
            key={label}
            onPress={handlePress}
            style={[
              styles.chipOption,
              subtitle ? styles.chipOptionWithSubtitle : styles.chipOptionCompact,
              selected && styles.chipOptionSelected,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
            {subtitle ? (
              <Text style={[styles.chipSubtitle, selected && styles.chipSubtitleSelected]}>
                {subtitle}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
