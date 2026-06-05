import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import type { PsychologicalAssessmentRecord } from '@/features/psychologicalAssessment/psychologicalAssessment.types';
import { supabase } from '@/integrations/supabase/client';

export function usePsychologicalAssessment() {
  const { user } = useAuth();

  const submitAssessment = useCallback(
    async (responses: Record<string, unknown>): Promise<PsychologicalAssessmentRecord | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('psychological_assessments')
        .insert({
          user_id: user.id,
          responses: responses as never,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar avaliação psicológica:', error);
        return null;
      }

      return data as unknown as PsychologicalAssessmentRecord;
    },
    [user],
  );

  return { submitAssessment };
}
