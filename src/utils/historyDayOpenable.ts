export type HistoryDayOpenableLike = {
  messageCount: number;
  hasLetter: boolean;
  activities: unknown[];
};

/** Dia só com carta: abre a tela de carta aberta (sem detalhe de conversa). */
export function historyDayIsLetterOnly(day: HistoryDayOpenableLike) {
  return day.hasLetter && day.messageCount <= 0 && day.activities.length === 0;
}

/** Clicável com conversa, atividade ou carta disponível. */
export function historyDayIsOpenable(day: HistoryDayOpenableLike) {
  return day.messageCount > 0 || day.activities.length > 0 || day.hasLetter;
}
