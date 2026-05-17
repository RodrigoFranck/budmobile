import { Pressable, Text, View } from 'react-native';

import type { CheckInChipOption } from '@/features/checkin/checkInFlow.types';
import { getOptionLabel, getOptionSubtitle } from '@/features/checkin/checkInSteps';
import { useCheckInFlowStyles } from './checkInFlow.styles';

interface CheckInChipListProps {
  options: CheckInChipOption[];
  value: string | string[] | undefined;
  multi?: boolean;
  onChange: (value: string | string[]) => void;
}

export function CheckInChipList({ options, value, multi = false, onChange }: CheckInChipListProps) {
  const styles = useCheckInFlowStyles();

  return (
    <View>
      {options.map((opt) => {
        const label = getOptionLabel(opt);
        const subtitle = getOptionSubtitle(opt);
        const selected = multi
          ? ((value as string[] | undefined) ?? []).includes(label)
          : value === label;

        const handlePress = () => {
          if (multi) {
            const current = (value as string[] | undefined) ?? [];
            const next = selected ? current.filter((x) => x !== label) : [...current, label];
            onChange(next);
            return;
          }
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
