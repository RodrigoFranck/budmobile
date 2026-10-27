import { supabase } from '@/integrations/supabase/client';
import type { ActivityId } from '@/pages/activitiesV3/activityFlows';

export async function persistActivity(params: {
  userId: string;
  activityId: ActivityId;
  answers: Record<string, string>;
  resultText: string;
}) {
  await supabase.from('activity_sessions' as never).insert({
    user_id: params.userId,
    activity_type: params.activityId,
    status: 'completed',
    responses: params.answers,
    result_text: params.resultText,
    completed_at: new Date().toISOString(),
  } as never);
}
