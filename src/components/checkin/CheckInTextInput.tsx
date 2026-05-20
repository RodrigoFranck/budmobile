import { TextInput } from 'react-native';

import { useActivitiesTheme } from '@/lib/activitiesTheme';
import { useCheckInFlowStyles } from './checkInFlow.styles';

interface CheckInTextInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function CheckInTextInput({ value, placeholder, onChange }: CheckInTextInputProps) {
  const styles = useCheckInFlowStyles();
  const theme = useActivitiesTheme();

  return (
    <TextInput
      style={styles.textInput}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.placeholder}
      multiline
      textAlignVertical="top"
      autoFocus
      accessibilityLabel={placeholder ?? 'Resposta'}
    />
  );
}
