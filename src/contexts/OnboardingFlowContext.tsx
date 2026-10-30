import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type AgeRangeOption =
  | '55 a 64'
  | '45 a 54'
  | '35 a 44'
  | '30 a 34'
  | '25 a 29'
  | '18 a 24'
  | 'Menos de 18';

export interface OnboardingFlowState {
  displayName: string;
  ageRange: AgeRangeOption | null;
  initialThoughts: string;
  conversationGoal: string;
  shareConversations: boolean;
  answers: Record<string, string>;
}

const AGE_RANGE_OPTIONS: AgeRangeOption[] = [
  '55 a 64',
  '45 a 54',
  '35 a 44',
  '30 a 34',
  '25 a 29',
  '18 a 24',
  'Menos de 18',
];

function asAgeRange(value: string | null | undefined): AgeRangeOption | null {
  if (!value) return null;
  return AGE_RANGE_OPTIONS.includes(value as AgeRangeOption) ? (value as AgeRangeOption) : null;
}

function joinPrefList(values: string[] | undefined): string | undefined {
  if (!values?.length) return undefined;
  return values.join(' · ');
}

export function flowStateFromSavedProfile(input: {
  displayName?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  therapy?: string | null;
  mood?: string | null;
  weight?: string[];
  relationships?: string[];
  focus?: string[];
  sixWeeks?: string[];
  helpStyle?: string[];
  strengths?: string[];
  blockers?: string[];
  faith?: string | null;
  neurodivergence?: string | null;
  interests?: string[];
  voice?: string | null;
  origin?: string | null;
  shareConversations?: boolean;
  initialThoughts?: string | null;
  conversationGoal?: string | null;
}): Partial<OnboardingFlowState> {
  const answers: Record<string, string> = {};
  const assign = (key: string, value: string | undefined | null) => {
    if (value?.trim()) answers[key] = value;
  };

  assign('gender', input.gender);
  assign('therapy', input.therapy);
  assign('mood', input.mood);
  assign('weight', joinPrefList(input.weight));
  assign('relationships', joinPrefList(input.relationships));
  assign('focus', joinPrefList(input.focus));
  assign('sixWeeks', joinPrefList(input.sixWeeks));
  assign('helpStyle', joinPrefList(input.helpStyle));
  assign('strengths', joinPrefList(input.strengths));
  assign('blockers', joinPrefList(input.blockers));
  assign('faith', input.faith);
  assign('neurodivergence', input.neurodivergence);
  assign('interests', joinPrefList(input.interests));
  assign('voice', input.voice);
  assign('origin', input.origin);
  assign('anythingElse', input.initialThoughts);

  return {
    displayName: input.displayName?.trim() ?? '',
    ageRange: asAgeRange(input.ageRange),
    initialThoughts: input.initialThoughts?.trim() ?? '',
    conversationGoal: input.conversationGoal?.trim() ?? '',
    shareConversations: input.shareConversations !== false,
    answers,
  };
}

interface OnboardingFlowContextValue extends OnboardingFlowState {
  setDisplayName: (v: string) => void;
  setAgeRange: (v: AgeRangeOption | null) => void;
  setInitialThoughts: (v: string) => void;
  setConversationGoal: (v: string) => void;
  setShareConversations: (v: boolean) => void;
  setAnswer: (key: string, value: string) => void;
  reset: () => void;
}

const initialState: OnboardingFlowState = {
  displayName: '',
  ageRange: null,
  initialThoughts: '',
  conversationGoal: '',
  shareConversations: true,
  answers: {},
};

const OnboardingFlowContext = createContext<OnboardingFlowContextValue | undefined>(undefined);

export function OnboardingFlowProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<OnboardingFlowState>;
}) {
  const [displayName, setDisplayNameState] = useState(initial?.displayName ?? '');
  const [ageRange, setAgeRangeState] = useState<AgeRangeOption | null>(initial?.ageRange ?? null);
  const [initialThoughts, setInitialThoughtsState] = useState(initial?.initialThoughts ?? '');
  const [conversationGoal, setConversationGoalState] = useState(initial?.conversationGoal ?? '');
  const [shareConversations, setShareConversationsState] = useState(
    initial?.shareConversations ?? true,
  );
  const [answers, setAnswersState] = useState<Record<string, string>>(initial?.answers ?? {});

  const setDisplayName = useCallback((v: string) => setDisplayNameState(v), []);
  const setAgeRange = useCallback((v: AgeRangeOption | null) => setAgeRangeState(v), []);
  const setInitialThoughts = useCallback((v: string) => setInitialThoughtsState(v), []);
  const setConversationGoal = useCallback((v: string) => setConversationGoalState(v), []);
  const setShareConversations = useCallback((v: boolean) => setShareConversationsState(v), []);
  const setAnswer = useCallback((key: string, value: string) => {
    setAnswersState((current) => ({ ...current, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setDisplayNameState(initialState.displayName);
    setAgeRangeState(initialState.ageRange);
    setInitialThoughtsState(initialState.initialThoughts);
    setConversationGoalState(initialState.conversationGoal);
    setShareConversationsState(initialState.shareConversations);
    setAnswersState({});
  }, []);

  const value = useMemo(
    () => ({
      displayName,
      ageRange,
      initialThoughts,
      conversationGoal,
      shareConversations,
      answers,
      setDisplayName,
      setAgeRange,
      setInitialThoughts,
      setConversationGoal,
      setShareConversations,
      setAnswer,
      reset,
    }),
    [
      displayName,
      ageRange,
      initialThoughts,
      conversationGoal,
      shareConversations,
      answers,
      setDisplayName,
      setAgeRange,
      setInitialThoughts,
      setConversationGoal,
      setShareConversations,
      setAnswer,
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
