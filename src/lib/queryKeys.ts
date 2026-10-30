export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  conversations: (userId: string) => ['conversations', userId] as const,
  userInsights: (userId: string) => ['userInsights', userId] as const,
  internalProfile: (userId: string) => ['internalProfile', userId] as const,
  sessionMemoryExtras: (userId: string) => ['sessionMemoryExtras', userId] as const,
  declaredUserContext: (userId: string) => ['declaredUserContext', userId] as const,
  insightUnlockRules: () => ['insightUnlockRules'] as const,
  dailyLetter: (userId: string, date: string) => ['dailyLetter', userId, date] as const,
  recapPile: (userId: string) => ['recapPile', userId] as const,
  recapSnippets: (userId: string, ids: string[]) => ['recapSnippets', userId, ids] as const,
  historyDays: (userId: string) => ['historyDays', userId] as const,
};
