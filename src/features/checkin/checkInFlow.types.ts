export type CheckInInputType = 'chips' | 'slider' | 'text';

export type CheckInChipOption = string | { label: string; subtitle?: string };

export interface CheckInStepConfig {
  key: string;
  category: string;
  question: string;
  subtitle?: string;
  inputType: CheckInInputType;
  options?: CheckInChipOption[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  textPlaceholder?: string;
  optional?: boolean;
  gradientColors: [string, string, string];
}
