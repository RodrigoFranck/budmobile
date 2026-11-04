import { activityColors } from '@/theme';

export type ActivityId = 'cinco_porques' | 'fiee' | 'mapa_relacoes' | 'ordenacao_valores';

export type ActivityIntroCopy = {
  titleBefore?: string;
  titleAccent: string;
  titleAfter?: string;
  duration: string;
  category: string;
  lead: string;
  how: string;
  why: string;
  heroMist: 'mistPorques' | 'fieeMist' | 'mapaMist' | 'valoresMist';
  heroGiz: 'cincoPorquesGiz' | 'fieeGiz' | 'mapaGiz' | 'valoresGiz';
};

export type CincoPorquesStep = {
  key: string;
  kicker: string;
  title: string;
  placeholder: string;
};

export type FieeValence = -1 | 0 | 1;

export type FieeWord = {
  label: string;
  valence: FieeValence;
};

export type FieeDimension = {
  key: string;
  letter: string;
  title: string;
  prompt: string;
  color: string;
  words: FieeWord[];
};

export type ValueCard = {
  title: string;
  body: string;
  origem?: 'fixa' | 'ia';
};

export const ACTIVITY_INTROS: Record<ActivityId, ActivityIntroCopy> = {
  cinco_porques: {
    titleBefore: 'Cinco ',
    titleAccent: 'Porquês',
    duration: '5 min',
    category: 'Reflexão',
    lead: 'Uma técnica simples para ir além da primeira resposta e chegar ao que realmente está por baixo.',
    how: 'Comece com o que está na sua cabeça: um incômodo, uma decisão travada, um sentimento. O Bud vai perguntar "por quê?" de jeitos diferentes, uma camada mais fundo a cada vez.',
    why: 'A primeira explicação quase nunca é a história inteira. Seguir o próprio pensamento por alguns passos, com calma, ajuda a enxergar o que de fato pesa.',
    heroMist: 'mistPorques',
    heroGiz: 'cincoPorquesGiz',
  },
  fiee: {
    titleAccent: 'FIEE?',
    duration: '1 min',
    category: 'Autoconhecimento',
    lead: 'Um check-in rápido em quatro partes de você: corpo, cabeça, emoções e relações.',
    how: 'Escolha uma palavra para cada parte, ou escreva a sua. No fim, o Bud junta as quatro num retrato curto de como você está, com perguntas para ir mais fundo.',
    why: 'A gente costuma olhar só para o que grita mais alto. Passar pelas quatro partes mostra o quadro inteiro, inclusive o que está indo bem.',
    heroMist: 'fieeMist',
    heroGiz: 'fieeGiz',
  },
  mapa_relacoes: {
    titleBefore: 'Mapa de ',
    titleAccent: 'Relações',
    duration: '5 min',
    category: 'Reflexão',
    lead: 'Olhe com calma para uma relação que importa: como ela está, o que você valoriza nela e para onde quer que ela vá.',
    how: 'Responda algumas perguntas sobre uma pessoa. As próximas perguntas se adaptam ao que você disser, e no fim o Bud devolve uma leitura do que apareceu.',
    why: 'A gente carrega suposições sobre as relações que nunca para pra olhar. Desacelerar e olhar uma de cada vez mostra o que funciona e do que você quer mais.',
    heroMist: 'mapaMist',
    heroGiz: 'mapaGiz',
  },
  ordenacao_valores: {
    titleBefore: 'Ordenação de ',
    titleAccent: 'Valores',
    duration: '4 min',
    category: 'Autoconhecimento',
    lead: 'Descubra o que está guiando as suas escolhas agora, e o que talvez esteja pedindo mais espaço.',
    how: 'Você vai ver uma carta de cada vez. Arraste para a esquerda se esse valor importa menos agora, para cima se importa muito, e para a direita se você quer mais dele na sua vida.',
    why: 'Quando a gente está sobrecarregada, decide no automático. Ver os próprios valores lado a lado ajuda a escolher com mais intenção, e a entender por que algumas coisas cansam tanto.',
    heroMist: 'valoresMist',
    heroGiz: 'valoresGiz',
  },
};

export const CINCO_PORQUES: CincoPorquesStep[] = [
  {
    key: 'p1',
    kicker: 'Comece por aqui',
    title: 'O que está na sua cabeça agora?',
    placeholder: 'Escreva aqui…',
  },
  {
    key: 'p2',
    kicker: 'Camada 2 de 5',
    title: 'Por que isso parece tão difícil agora?',
    placeholder: 'Escreva aqui…',
  },
  {
    key: 'p3',
    kicker: 'Camada 3 de 5',
    title: 'O que aconteceria se isso não mudasse?',
    placeholder: 'Escreva aqui…',
  },
  {
    key: 'p4',
    kicker: 'Camada 4 de 5',
    title: 'Por que isso importa tanto pra você?',
    placeholder: 'Escreva aqui…',
  },
  {
    key: 'p5',
    kicker: 'Camada 5 de 5',
    title: 'O que você teme perder se deixar isso aparecer?',
    placeholder: 'Escreva aqui…',
  },
];

export const FIEE_DIMENSIONS: FieeDimension[] = [
  {
    key: 'fisico',
    letter: 'F',
    title: 'Físico',
    prompt: 'Como você está se sentindo fisicamente?',
    color: activityColors.folha,
    words: [
      { label: 'Lenta', valence: -1 },
      { label: 'Pesada', valence: -1 },
      { label: 'Cansada', valence: -1 },
      { label: 'Tensa', valence: -1 },
      { label: 'Dolorida', valence: -1 },
      { label: 'Inquieta', valence: -1 },
      { label: 'Desconfortável', valence: -1 },
      { label: 'Esgotada', valence: -1 },
      { label: 'Forte', valence: 1 },
      { label: 'Com energia', valence: 1 },
      { label: 'Alerta', valence: 1 },
      { label: 'Leve', valence: 1 },
      { label: 'Descansada', valence: 1 },
      { label: 'Calma', valence: 1 },
      { label: 'Relaxada', valence: 1 },
      { label: 'Confortável', valence: 1 },
    ],
  },
  {
    key: 'intelectual',
    letter: 'I',
    title: 'Intelectual',
    prompt: 'Como está a sua cabeça hoje?',
    color: activityColors.menta,
    words: [
      { label: 'Acelerada', valence: -1 },
      { label: 'Em branco', valence: -1 },
      { label: 'Nublada', valence: -1 },
      { label: 'Sobrecarregada', valence: -1 },
      { label: 'Dispersa', valence: -1 },
      { label: 'Travada', valence: -1 },
      { label: 'Confusa', valence: -1 },
      { label: 'Distraída', valence: -1 },
      { label: 'Clara', valence: 1 },
      { label: 'Afiada', valence: 1 },
      { label: 'Envolvida', valence: 1 },
      { label: 'Criativa', valence: 1 },
      { label: 'Focada', valence: 1 },
      { label: 'Inspirada', valence: 1 },
      { label: 'Curiosa', valence: 1 },
      { label: 'Confiante', valence: 1 },
    ],
  },
  {
    key: 'emocional',
    letter: 'E',
    title: 'Emocional',
    prompt: 'Como você está se sentindo por dentro?',
    color: activityColors.ardosia,
    words: [
      { label: 'Triste', valence: -1 },
      { label: 'Anestesiada', valence: -1 },
      { label: 'Ansiosa', valence: -1 },
      { label: 'Pesada', valence: -1 },
      { label: 'Apática', valence: -1 },
      { label: 'Preocupada', valence: -1 },
      { label: 'Irritada', valence: -1 },
      { label: 'Frustrada', valence: -1 },
      { label: 'Animada', valence: 1 },
      { label: 'Satisfeita', valence: 1 },
      { label: 'Em paz', valence: 1 },
      { label: 'Grata', valence: 1 },
      { label: 'Esperançosa', valence: 1 },
      { label: 'Estável', valence: 1 },
      { label: 'Leve', valence: 1 },
      { label: 'Alegre', valence: 1 },
    ],
  },
  {
    key: 'social',
    letter: 'S',
    title: 'Social',
    prompt: 'Como você está com as pessoas ao seu redor?',
    color: activityColors.argila,
    words: [
      { label: 'Sem jeito', valence: -1 },
      { label: 'Esgotada', valence: -1 },
      { label: 'Sozinha', valence: -1 },
      { label: 'Isolada', valence: -1 },
      { label: 'Retraída', valence: -1 },
      { label: 'Distante', valence: -1 },
      { label: 'À parte', valence: -1 },
      { label: 'Incompreendida', valence: -1 },
      { label: 'Apoiada', valence: 1 },
      { label: 'Conectada', valence: 1 },
      { label: 'À vontade', valence: 1 },
      { label: 'Valorizada', valence: 1 },
      { label: 'Envolvida', valence: 1 },
      { label: 'Vista', valence: 1 },
      { label: 'Presente', valence: 1 },
      { label: 'Pertencendo', valence: 1 },
    ],
  },
];

export function shuffleFieeChipSet(words: FieeWord[], size = 6): FieeWord[] {
  const negative = words.filter((word) => word.valence < 0);
  const positive = words.filter((word) => word.valence > 0);
  const half = Math.ceil(size / 2);
  const pickedNeg = [...negative].sort(() => Math.random() - 0.5).slice(0, half);
  const pickedPos = [...positive].sort(() => Math.random() - 0.5).slice(0, size - pickedNeg.length);
  const mixed = [...pickedNeg, ...pickedPos];
  for (let i = mixed.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  return mixed.slice(0, size);
}

/** Full dimension table, shuffled, for the horizontal chip strip (TF-70). */
export function shuffleFieeWords(words: FieeWord[]): FieeWord[] {
  const pool = [...words];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export const RELATION_TYPES = [
  'Parceria amorosa',
  'Mãe ou pai',
  'Filho ou filha',
  'Irmão ou irmã',
  'Amizade próxima',
  'Colega de trabalho',
  'Outra pessoa',
] as const;

export const RELATION_ROLES = [
  'Sou mais quem cuida e escuta',
  'Somos parceiras, de igual pra igual',
  'Sou mais quem recebe apoio',
  'Muda bastante, depende do momento',
  'Outra coisa',
] as const;

export const RELATION_FREQUENCY = [
  'Quase sempre guardo pra mim',
  'Às vezes, quando acho que ela está ocupada',
  'Raramente, conto quase tudo',
  'Nunca pensei nisso',
  'Outra coisa',
] as const;

export function relationRankingItems(name: string, bond: 'amizade' | 'relação' = 'amizade') {
  return [
    `Poder ser eu mesma perto de ${name}`,
    `Saber que ${name} está por perto quando eu preciso`,
    'Ter momentos leves e divertidos juntas',
    `Sentir que a ${bond} vai e volta, nos dois sentidos`,
  ];
}

export const VALUE_CARDS: ValueCard[] = [
  {
    title: 'Família',
    body: 'Estar perto e cuidar de quem é a sua base, mesmo de longe.',
  },
  {
    title: 'Saúde',
    body: 'Cuidar do corpo e da cabeça para ter energia para o que importa.',
  },
  {
    title: 'Honestidade',
    body: 'Dizer o que é verdade, mesmo quando é mais fácil suavizar.',
  },
  {
    title: 'Descanso',
    body: 'Ter tempo de verdade para parar, sem culpa.',
  },
  {
    title: 'Amizades',
    body: 'Estar com gente que te vê de verdade, não só de passagem.',
  },
  {
    title: 'Criatividade',
    body: 'Fazer, inventar e se expressar sem precisar de um motivo.',
  },
  {
    title: 'Natureza',
    body: 'Estar perto do que não é tela: céu, chão, silêncio.',
  },
  {
    title: 'Aprender',
    body: 'Continuar curiosa, mesmo quando já parece que você deveria saber.',
  },
  {
    title: 'Reconhecimento',
    body: 'Ter o seu trabalho e o seu esforço vistos pelos outros.',
  },
  {
    title: 'Segurança financeira',
    body: 'Saber que o básico está coberto, sem viver no susto.',
  },
  {
    title: 'Aventura',
    body: 'Sair do conhecido e sentir que a vida ainda pode surpreender.',
  },
  {
    title: 'Status',
    body: 'Ser vista, escolhida, e ocupar um lugar que os outros notam.',
  },
];

export const VALUE_PILES = [
  { key: 'muito', label: 'MUITO', hint: '↑ MUITO', color: activityColors.menta },
  { key: 'mais', label: 'MAIS', hint: 'MAIS →', color: activityColors.folha },
  { key: 'menos', label: 'MENOS', hint: '← MENOS', color: activityColors.ardosia },
] as const;

export type ValuePileKey = (typeof VALUE_PILES)[number]['key'];

export const ACTIVITY_FOLLOWUPS: Record<ActivityId, string[]> = {
  cinco_porques: [
    'Que parte disso daria pra olhar hoje, sem resolver o resto?',
    'Quando você aprendeu que mostrar dúvida podia custar alguma coisa?',
    'Como seria tratar isso como um treino, e não como uma prova?',
  ],
  fiee: [
    'Qual é a menor pausa possível que caberia no seu dia?',
    'O que o corpo está pedindo que a cabeça ainda não ouviu?',
    'Quem perto de você aguentaria saber como você está de verdade?',
  ],
  mapa_relacoes: [
    'Como seria contar uma coisa pequena que você anda guardando?',
    'O que te faz achar que vai pesar, e de onde vem esse cuidado?',
    'O que você gostaria que essa pessoa soubesse, sem precisar resolver?',
  ],
  ordenacao_valores: [
    'Qual desses valores do "mais" caberia numa coisa pequena hoje?',
    'Como a saúde, que importa muito, aparece na sua agenda de verdade?',
    'O que você está sustentando que já não cabe no que importa agora?',
  ],
};
