export type ScreeningId =
  | 'gad7'
  | 'phq9'
  | 'assq'
  | 'edeqs'
  | 'audit'
  | 'ptsd'
  | 'cage'
  | 'substance'
  | 'sleep'
  | 'food'
  | 'attention'
  | 'energy'
  | 'gambling'
  | 'grief'
  | 'rituals'
  | 'perceptions'
  | 'prescribed_checkin';

export type ScreeningStep = {
  key: string;
  title: string;
  options: string[];
  crisisIfNotNone?: boolean;
};

const LIKERT = ['Nada', 'Vários dias', 'Mais da metade', 'Quase todos'];
const FREQ = ['Nunca', 'Às vezes', 'Frequentemente', 'Sempre'];

export const SCREENINGS: Record<
  ScreeningId,
  { title: string; intro: string; battery?: 'A' | 'B' | 'C' | 'core'; steps: ScreeningStep[] }
> = {
  gad7: {
    title: 'Como você tem se sentido',
    intro: 'Algumas perguntas sobre ansiedade. Não há resposta certa.',
    battery: 'core',
    steps: [
      { key: 'q1', title: 'Nervosismo, ansiedade ou tensão', options: LIKERT },
      { key: 'q2', title: 'Preocupação difícil de controlar', options: LIKERT },
      { key: 'q3', title: 'Preocupação com várias coisas', options: LIKERT },
      { key: 'q4', title: 'Dificuldade para relaxar', options: LIKERT },
      { key: 'q5', title: 'Inquietação, difícil ficar parado', options: LIKERT },
      { key: 'q6', title: 'Ficar facilmente irritado', options: LIKERT },
      { key: 'q7', title: 'Medo de que algo ruim aconteça', options: LIKERT },
    ],
  },
  phq9: {
    title: 'Humor nestas duas semanas',
    intro: 'Perguntas sobre humor. Se algo for pesado, você pode parar.',
    battery: 'core',
    steps: [
      { key: 'q1', title: 'Pouco interesse ou prazer', options: LIKERT },
      { key: 'q2', title: 'Pra baixo, deprimido ou sem esperança', options: LIKERT },
      { key: 'q3', title: 'Dificuldade para dormir ou dormir demais', options: LIKERT },
      { key: 'q4', title: 'Cansaço ou pouca energia', options: LIKERT },
      { key: 'q5', title: 'Apetite diminuído ou aumentado', options: LIKERT },
      { key: 'q6', title: 'Sentir-se mal consigo mesmo', options: LIKERT },
      { key: 'q7', title: 'Dificuldade de concentração', options: LIKERT },
      { key: 'q8', title: 'Lentidão ou inquietação', options: LIKERT },
      {
        key: 'q9',
        title: 'Pensamentos de que seria melhor não estar aqui',
        options: LIKERT,
        crisisIfNotNone: true,
      },
    ],
  },
  assq: {
    title: 'Sono',
    intro: 'Como tem sido dormir.',
    battery: 'A',
    steps: [
      { key: 'q1', title: 'Dificuldade para pegar no sono', options: FREQ },
      { key: 'q2', title: 'Acordar no meio da noite', options: FREQ },
      { key: 'q3', title: 'Acordar muito cedo', options: FREQ },
      { key: 'q4', title: 'Sono que não descansa', options: FREQ },
    ],
  },
  edeqs: {
    title: 'Relação com comida',
    intro: 'Perguntas opcionais sobre alimentação.',
    battery: 'B',
    steps: [
      { key: 'q1', title: 'Preocupação com o corpo', options: ['Nada', 'Um pouco', 'Bastante', 'Muito'] },
      { key: 'q2', title: 'Restrição alimentar', options: ['Nada', 'Um pouco', 'Bastante', 'Muito'] },
      { key: 'q3', title: 'Culpa depois de comer', options: ['Nada', 'Um pouco', 'Bastante', 'Muito'] },
    ],
  },
  audit: {
    title: 'Álcool',
    intro: 'Sobre o uso de álcool. Sem julgamento.',
    battery: 'C',
    steps: [
      { key: 'q1', title: 'Com que frequência você bebe?', options: ['Nunca', 'Mensal', 'Semanal', 'Quase diário'] },
      { key: 'q2', title: 'Quantas doses, num dia típico?', options: ['Nenhuma', '1–2', '3–4', '5 ou mais'] },
      { key: 'q3', title: 'Já sentiu que deveria diminuir?', options: ['Não', 'Sim'] },
    ],
  },
  ptsd: {
    title: 'Experiências difíceis',
    intro: 'Só continue se fizer sentido agora.',
    battery: 'B',
    steps: [
      { key: 'filtro', title: 'Você passou por algo muito assustador?', options: ['Não', 'Sim', 'Prefiro não responder'] },
      { key: 'q2', title: 'Lembranças que voltam sem querer', options: FREQ },
      { key: 'q3', title: 'Evitar lugares ou conversas', options: FREQ },
    ],
  },
  cage: {
    title: 'Checklist breve',
    intro: 'Quatro perguntas simples.',
    battery: 'C',
    steps: [
      { key: 'q1', title: 'Já sentiu que deveria diminuir?', options: ['Não', 'Sim'] },
      { key: 'q2', title: 'Já se irritou com críticas sobre isso?', options: ['Não', 'Sim'] },
      { key: 'q3', title: 'Já se sentiu culpado?', options: ['Não', 'Sim'] },
      { key: 'q4', title: 'Já usou pela manhã para se sentir melhor?', options: ['Não', 'Sim'] },
    ],
  },
  substance: {
    title: 'Substâncias',
    intro: 'Uso de outras substâncias, se fizer sentido.',
    battery: 'C',
    steps: [
      { key: 'q1', title: 'Isso faz parte da sua rotina agora?', options: ['Não', 'Às vezes', 'Sim'] },
    ],
  },
  sleep: {
    title: 'Rastreio de sono',
    intro: 'Opcional. Só se a instituição pedir.',
    battery: 'A',
    steps: [{ key: 'q1', title: 'Seu sono tem sido suficiente?', options: ['Sim', 'Às vezes', 'Não'] }],
  },
  food: {
    title: 'Rastreio de alimentação',
    intro: 'Opcional.',
    battery: 'A',
    steps: [{ key: 'q1', title: 'Comer tem sido um tema difícil?', options: ['Não', 'Um pouco', 'Sim'] }],
  },
  attention: {
    title: 'Atenção',
    intro: 'Opcional.',
    battery: 'A',
    steps: [{ key: 'q1', title: 'Tem sido difícil manter o foco?', options: FREQ }],
  },
  energy: {
    title: 'Energia',
    intro: 'Opcional.',
    battery: 'A',
    steps: [{ key: 'q1', title: 'Como está sua energia?', options: ['Baixa', 'Média', 'Boa'] }],
  },
  gambling: {
    title: 'Jogo',
    intro: 'Opcional.',
    battery: 'C',
    steps: [{ key: 'q1', title: 'Jogo tem ocupado espaço na sua vida?', options: ['Não', 'Um pouco', 'Sim'] }],
  },
  grief: {
    title: 'Luto',
    intro: 'Opcional.',
    battery: 'B',
    steps: [{ key: 'q1', title: 'Você está passando por uma perda?', options: ['Não', 'Sim', 'Prefiro não responder'] }],
  },
  rituals: {
    title: 'Rituais',
    intro: 'Opcional.',
    battery: 'B',
    steps: [{ key: 'q1', title: 'Rituais ou checagens ocupam muito tempo?', options: FREQ }],
  },
  perceptions: {
    title: 'Percepções',
    intro: 'Opcional.',
    battery: 'B',
    steps: [{ key: 'q1', title: 'Tem notado percepções estranhas?', options: ['Não', 'Às vezes', 'Sim'] }],
  },
  prescribed_checkin: {
    title: 'Check-in prescrito',
    intro: 'Um check-in pedido pela sua instituição.',
    battery: 'core',
    steps: [
      { key: 'humor', title: 'Como você está hoje?', options: ['Mal', 'Mais ou menos', 'Bem', 'Muito bem'] },
      { key: 'sono', title: 'Como dormiu?', options: ['Mal', 'Mais ou menos', 'Bem'] },
      { key: 'nota', title: 'O que precisa de cuidado?', options: ['Corpo', 'Sono', 'Relações', 'Trabalho'] },
    ],
  },
};

const OPTION_SCORE: Record<string, number> = {
  Nada: 0,
  Nunca: 0,
  Não: 0,
  Nenhuma: 0,
  'Vários dias': 1,
  'Às vezes': 1,
  'Um pouco': 1,
  Mensal: 1,
  '1–2': 1,
  Sim: 1,
  'Mais da metade': 2,
  Frequentemente: 2,
  Bastante: 2,
  Semanal: 2,
  '3–4': 2,
  'Quase todos': 3,
  Sempre: 3,
  Muito: 3,
  'Quase diário': 3,
  '5 ou mais': 3,
};

/** Score stays server-side. UI must never render this number. */
export function scoreInternal(answers: Record<string, string>): number {
  return Object.values(answers).reduce((sum, value) => sum + (OPTION_SCORE[value] ?? 0), 0);
}

export function shouldOfferCrisisSupport(
  instrument: ScreeningId,
  answers: Record<string, string>,
): boolean {
  const catalog = SCREENINGS[instrument];
  return catalog.steps.some(
    (step) => step.crisisIfNotNone && answers[step.key] && answers[step.key] !== 'Nada',
  );
}
