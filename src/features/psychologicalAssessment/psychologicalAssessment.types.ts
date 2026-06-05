export type PsychologicalAssessmentInputType = 'slider' | 'text';

export interface PsychologicalAssessmentStepConfig {
  key: string;
  category: string;
  question: string;
  subtitle?: string;
  inputType: PsychologicalAssessmentInputType;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  textPlaceholder?: string;
}

export interface PsychologicalAssessmentRecord {
  id: string;
  user_id: string;
  completed_at: string;
  responses: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
