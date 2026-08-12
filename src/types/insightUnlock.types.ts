export type ExploreInsightType =
  | 'yesterday_journey'
  | 'general_insight'
  | 'frequency'
  | 'habit';

export const EXPLORE_INSIGHT_TYPES: ExploreInsightType[] = [
  'yesterday_journey',
  'general_insight',
  'frequency',
  'habit',
];

export const DEEP_INSIGHT_TYPE = 'deep_insight' as const;

export type InsightCountScope =
  | 'total_with_messages'
  | 'weekly_with_messages'
  | 'yesterday_with_messages'
  | 'total_active_days'
  | 'weekly_active_days';

export interface InsightUnlockRule {
  insight_type: string;
  required_conversations: number;
  count_scope: InsightCountScope;
  locked_title: string;
  locked_description: string;
  display_order: number;
}

export interface InsightUnlockProgress {
  conversationCount: number;
  required: number;
  remaining: number;
  progress: number;
  locked: boolean;
}
