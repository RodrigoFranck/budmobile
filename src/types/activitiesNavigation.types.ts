import type { CheckinReport, CheckinType } from '@/hooks/useCheckIns';

export type ActivitiesStackParamList = {
  ActivitiesHome: undefined;
  CheckInIntro: undefined;
  CheckInActivities: undefined;
  CheckInFlow: { type: CheckinType };
  CheckInResult: {
    type: CheckinType;
    checkinId: string;
    report: CheckinReport | null;
    /** Gera relatório na tela de resultado (com loader), igual ao budmind web */
    pendingReport?: boolean;
    responses?: Record<string, unknown>;
    /** Respostas brutas do check-in (para contexto no chat) */
    checkinResponses?: Record<string, unknown>;
  };
};
