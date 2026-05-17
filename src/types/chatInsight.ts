export type ChatInsightParam = {
  insightType: string;
  badge?: string;
  title: string;
  contextSummary: string;
  internalContext: string;
  backgroundType?: 'yesterday' | 'inspired' | 'frequency' | 'habit';
  /** Mensagem do usuário enviada ao abrir o chat (ex.: pergunta de reflexão) */
  initialUserMessage?: string;
  /** Explorar: abre modo voz ao entrar no chat */
  autoStartVoice?: boolean;
};
