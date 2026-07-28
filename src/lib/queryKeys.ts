export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  conversations: (userId: string) => ['conversations', userId] as const,
  userInsights: (userId: string) => ['userInsights', userId] as const,
  internalProfile: (userId: string) => ['internalProfile', userId] as const,
  insightUnlockRules: () => ['insightUnlockRules'] as const,
};
