export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  conversations: (userId: string) => ['conversations', userId] as const,
  userInsights: (userId: string) => ['userInsights', userId] as const,
  internalProfile: (userId: string) => ['internalProfile', userId] as const,
  sessionMemoryExtras: (userId: string) => ['sessionMemoryExtras', userId] as const,
  insightUnlockRules: () => ['insightUnlockRules'] as const,
  dailyLetter: (userId: string, date: string) => ['dailyLetter', userId, date] as const,
};
