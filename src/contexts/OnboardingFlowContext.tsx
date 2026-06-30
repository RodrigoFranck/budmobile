import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type AgeRangeOption =
  | 'under-18'
  | '18-24'
  | '25-34'
  | '35-44'
  | '45-54'
  | '55-64'
  | '65+'
  | 'prefer_not_say';

interface OnboardingFlowState {
  displayName: string;
  ageRange: AgeRangeOption | null;
  initialThoughts: string;
  conversationGoal: string;
  shareConversations: boolean;
}

interface OnboardingFlowContextValue extends OnboardingFlowState {
  setDisplayName: (v: string) => void;
  setAgeRange: (v: AgeRangeOption | null) => void;
  setInitialThoughts: (v: string) => void;
  setConversationGoal: (v: string) => void;
  setShareConversations: (v: boolean) => void;
  reset: () => void;
}

const initialState: OnboardingFlowState = {
  displayName: '',
  ageRange: null,
  initialThoughts: '',
  conversationGoal: '',
  shareConversations: true,
};

const OnboardingFlowContext = createContext<OnboardingFlowContextValue | undefined>(undefined);

export function OnboardingFlowProvider({ children }: { children: React.ReactNode }) {
  const [displayName, setDisplayNameState] = useState('');
  const [ageRange, setAgeRangeState] = useState<AgeRangeOption | null>(null);
  const [initialThoughts, setInitialThoughtsState] = useState('');
  const [conversationGoal, setConversationGoalState] = useState('');
  const [shareConversations, setShareConversationsState] = useState(true);

  const setDisplayName = useCallback((v: string) => setDisplayNameState(v), []);
  const setAgeRange = useCallback((v: AgeRangeOption | null) => setAgeRangeState(v), []);
  const setInitialThoughts = useCallback((v: string) => setInitialThoughtsState(v), []);
  const setConversationGoal = useCallback((v: string) => setConversationGoalState(v), []);
  const setShareConversations = useCallback((v: boolean) => setShareConversationsState(v), []);

  const reset = useCallback(() => {
    setDisplayNameState(initialState.displayName);
    setAgeRangeState(initialState.ageRange);
    setInitialThoughtsState(initialState.initialThoughts);
    setConversationGoalState(initialState.conversationGoal);
    setShareConversationsState(initialState.shareConversations);
  }, []);

  const value = useMemo(
    () => ({
      displayName,
      ageRange,
      initialThoughts,
      conversationGoal,
      shareConversations,
      setDisplayName,
      setAgeRange,
      setInitialThoughts,
      setConversationGoal,
      setShareConversations,
      reset,
    }),
    [
      displayName,
      ageRange,
      initialThoughts,
      conversationGoal,
      shareConversations,
      setDisplayName,
      setAgeRange,
      setInitialThoughts,
      setConversationGoal,
      setShareConversations,
      reset,
    ],
  );

  return <OnboardingFlowContext.Provider value={value}>{children}</OnboardingFlowContext.Provider>;
}

export function useOnboardingFlow() {
  const ctx = useContext(OnboardingFlowContext);
  if (!ctx) {
    throw new Error('useOnboardingFlow must be used within OnboardingFlowProvider');
  }
  return ctx;
}
