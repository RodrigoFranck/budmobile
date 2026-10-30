import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { noteRelationError, relationAvailable } from '@/lib/schemaAvailability';
import {
  asStringRecord,
  type DeclaredAssessmentRecord,
  type DeclaredCheckInRecord,
  type DeclaredActivityRecord,
  type DeclaredScreeningRecord,
  type DeclaredUserRecords,
} from '@/utils/formatDeclaredUserContext';

function warnIfMissing(label: string, error: { message?: string } | null) {
  if (error && __DEV__ && !noteRelationError(label, error)) {
    console.warn(`[declaredUserContext] ${label}:`, error.message);
  }
}

async function fetchDeclaredUserRecords(userId: string): Promise<DeclaredUserRecords> {
  const [activitiesRes, screeningsRes, assessmentRes, checkinsRes] = await Promise.all([
    relationAvailable('activity_sessions')
      ? supabase
          .from('activity_sessions')
          .select('activity_type, result_text, responses, completed_at')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as Array<{
          activity_type: string;
          result_text: string | null;
          responses: unknown;
          completed_at: string;
        }>, error: null }),
    supabase
      .from('clinical_screenings' as never)
      .select('instrument, responses, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase
      .from('psychological_assessments')
      .select('responses, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('daily_checkins')
      .select('checkin_type, checkin_date, responses, ai_report')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  warnIfMissing('activity_sessions', activitiesRes.error);
  warnIfMissing('clinical_screenings', screeningsRes.error);
  warnIfMissing('psychological_assessments', assessmentRes.error);
  warnIfMissing('daily_checkins', checkinsRes.error);

  const activities: DeclaredActivityRecord[] = (activitiesRes.data ?? []).map((row) => ({
    activityType: row.activity_type,
    resultText: row.result_text,
    responses: asStringRecord(row.responses),
    completedAt: row.completed_at,
  }));

  const screenings: DeclaredScreeningRecord[] = (
    (screeningsRes.data ?? []) as Array<{
      instrument: string;
      responses: unknown;
      completed_at: string;
    }>
  ).map((row) => ({
    instrument: row.instrument,
    responses: asStringRecord(row.responses),
    completedAt: row.completed_at,
  }));

  const assessmentRow = assessmentRes.error ? null : assessmentRes.data;
  const assessment: DeclaredAssessmentRecord | null = assessmentRow
    ? {
        responses: asStringRecord(assessmentRow.responses),
        completedAt: assessmentRow.completed_at,
      }
    : null;

  const checkins: DeclaredCheckInRecord[] = (checkinsRes.data ?? []).map((row) => {
    const report =
      row.ai_report && typeof row.ai_report === 'object' && !Array.isArray(row.ai_report)
        ? (row.ai_report as { headline?: unknown; analysis?: unknown })
        : null;
    return {
      checkinType: row.checkin_type,
      checkinDate: row.checkin_date,
      responses: asStringRecord(row.responses),
      headline: typeof report?.headline === 'string' ? report.headline : null,
      analysis: typeof report?.analysis === 'string' ? report.analysis : null,
    };
  });

  return { activities, screenings, assessment, checkins };
}

export function useDeclaredUserContextQuery() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.declaredUserContext(userId ?? ''),
    queryFn: () => fetchDeclaredUserRecords(userId!),
    enabled: !!userId,
  });
}
