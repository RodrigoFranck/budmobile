export type OnboardingField =
  | "displayName"
  | "ageRange"
  | "gender"
  | "therapy"
  | "mood"
  | "weight"
  | "relationships"
  | "focus"
  | "sixWeeks"
  | "helpStyle"
  | "strengths"
  | "blockers"
  | "faith"
  | "neurodivergence"
  | "voice"
  | "interests"
  | "notifications"
  | "microphone"
  | "anythingElse"
  | "origin";

export type OnboardingLayout =
  | "commitment"
  | "mistHero"
  | "text"
  | "ageWheel"
  | "choiceAdvance"
  | "multiSelect"
  | "mood"
  | "deepen"
  | "voice"
  | "notify"
  | "microphone"
  | "anythingElse"
  | "loading"
  | "paywall"
  | "ready";

export type OnboardingArt =
  | "lock"
  | "leafStand"
  | "leafSit"
  | "leafWalk"
  | "mood"
  | "bell"
  | "waves";

export type OnboardingTitle = {
  before: string;
  accent: string;
  after?: string;
};

export type OnboardingV3Step = {
  key: string;
  title: OnboardingTitle;
  subtitle?: string;
  field?: OnboardingField;
  options?: string[] | readonly string[];
  layout: OnboardingLayout;
  art?: OnboardingArt;
  cta: string;
  skippable?: boolean;
  maxSelect?: number;
  group: "core" | "deep" | "prefs";
  placeholder?: string;
  prompts?: string[];
};

export const AGE_OPTIONS = [
  "55 a 64",
  "45 a 54",
  "35 a 44",
  "30 a 34",
  "25 a 29",
  "18 a 24",
  "Menos de 18",
] as const;

export const MOOD_STOPS = [
  { label: "Sem energia", hint: "Vamos começar devagar." },
  { label: "Sem energia", hint: "Vamos começar devagar." },
  { label: "Altos e baixos", hint: "A gente vai no seu ritmo." },
  { label: "Levando", hint: "Bora buscar ainda melhor." },
  { label: "Levando", hint: "Bora buscar ainda melhor." },
] as const;

export const ONBOARDING_V3_STEPS: OnboardingV3Step[] = [
  {
    key: "commitment",
    group: "core",
    layout: "commitment",
    art: "lock",
    title: { before: "Nosso compromisso com ", accent: "você" },
    subtitle:
      "Sua saúde mental é pessoal e privada. Suas conversas ficam protegidas, e você pode apagar sua conta quando quiser.",
    cta: "Continuar",
  },
  {
    key: "simple",
    group: "core",
    layout: "mistHero",
    art: "leafStand",
    title: { before: "Vamos começar ", accent: "simples" },
    subtitle:
      "O Bud funciona melhor com contexto. Quanto mais ele souber, melhor será a primeira conversa.",
    cta: "Estou pronta",
  },
  {
    key: "name",
    group: "core",
    layout: "text",
    field: "displayName",
    title: { before: "Como você quer ser ", accent: "chamada", after: "?" },
    subtitle: "É assim que o Bud vai falar com você.",
    placeholder: "Seu nome",
    cta: "Continuar",
  },
  {
    key: "age",
    group: "core",
    layout: "ageWheel",
    field: "ageRange",
    title: { before: "Quantos anos você ", accent: "tem", after: "?" },
    subtitle: "Role para escolher.",
    options: [...AGE_OPTIONS],
    cta: "Continuar",
  },
  {
    key: "gender",
    group: "core",
    layout: "choiceAdvance",
    field: "gender",
    title: { before: "Como você se ", accent: "identifica", after: "?" },
    subtitle: "O Bud vai levar isso em conta.",
    options: ["Mulher", "Homem", "Não binário", "Outro", "Prefiro não dizer"],
    cta: "",
  },
  {
    key: "therapy",
    group: "core",
    layout: "choiceAdvance",
    field: "therapy",
    title: { before: "Você já fez ", accent: "terapia", after: "?" },
    subtitle: "Isso ajuda a ajustar a sua experiência.",
    options: [
      "Sim, faço agora",
      "Sim, no passado",
      "Tentei, mas não foi pra mim",
      "Não, mas já pensei",
      "Não, nunca pensei nisso",
      "Prefiro não dizer",
    ],
    cta: "",
  },
  {
    key: "deepen",
    group: "core",
    layout: "deepen",
    art: "leafSit",
    title: {
      before: "Quer que o Bud te conheça ",
      accent: "melhor",
      after: "?",
    },
    subtitle:
      "São mais 16 perguntas rápidas sobre o que te trouxe aqui e como você quer ser cuidada. Quanto mais o Bud souber, melhor fica a experiência.",
    cta: "Continuar · 4 min",
    skippable: true,
  },
  {
    key: "fundo",
    group: "deep",
    layout: "mistHero",
    art: "leafStand",
    title: { before: "Agora, um pouco mais ", accent: "fundo" },
    subtitle:
      "Algumas perguntas rápidas para o Bud entender por que você chegou aqui.",
    cta: "Estou pronta",
    skippable: true,
  },
  {
    key: "mood",
    group: "deep",
    layout: "mood",
    field: "mood",
    art: "mood",
    title: { before: "Como você tem se ", accent: "sentido", after: "?" },
    subtitle: "Deslize até o que combina com você.",
    cta: "Combinado",
    skippable: true,
  },
  {
    key: "weight",
    group: "deep",
    layout: "multiSelect",
    field: "weight",
    title: { before: "O que mais pesa em você ", accent: "agora", after: "?" },
    subtitle: "Escolha quantas fizerem sentido.",
    options: [
      "Trabalho ou estudos",
      "Um relacionamento",
      "Amizades",
      "Família",
      "Minha saúde",
      "Para onde minha vida está indo",
      "Como me sinto comigo",
    ],
    cta: "Continuar",
    skippable: true,
  },
  {
    key: "relationships",
    group: "deep",
    layout: "multiSelect",
    field: "relationships",
    title: {
      before: "Que relações mais importam para ",
      accent: "você",
      after: "?",
    },
    subtitle: "Escolha quantas fizerem sentido.",
    options: [
      "Parceria amorosa",
      "Amizades próximas",
      "Família",
      "Filhos",
      "Animais de estimação",
      "Difícil dizer",
    ],
    cta: "Continuar",
    skippable: true,
  },
  {
    key: "focus",
    group: "deep",
    layout: "multiSelect",
    field: "focus",
    title: { before: "No que vamos focar ", accent: "juntos", after: "?" },
    subtitle: "Escolha até 3.",
    options: [
      "Lidar com estresse e ansiedade",
      "Estabilizar meu humor",
      "Ganhar confiança",
      "Pensar menos em círculos",
      "Melhorar minhas relações",
      "Me entender melhor",
      "Dormir melhor",
    ],
    maxSelect: 3,
    cta: "Continuar",
    skippable: true,
  },
  {
    key: "sixWeeks",
    group: "deep",
    layout: "multiSelect",
    field: "sixWeeks",
    title: {
      before: "Daqui a seis semanas, como você quer se ",
      accent: "sentir",
      after: "?",
    },
    subtitle: "Escolha quantas fizerem sentido.",
    options: [
      "Mais calma",
      "Mais confiante",
      "Mais perto das pessoas",
      "Mais parecida comigo",
      "Com mais esperança",
      "Orgulhosa do caminho",
    ],
    cta: "Continuar",
    skippable: true,
  },
  {
    key: "conhecer",
    group: "deep",
    layout: "mistHero",
    art: "leafStand",
    title: { before: "Agora, conhecer você um pouco ", accent: "melhor" },
    subtitle:
      "Ajude o Bud a ver o quadro inteiro. Quanto mais você compartilhar, mais ele consegue ajudar.",
    cta: "Estou pronta",
    skippable: true,
  },
  {
    key: "help",
    group: "deep",
    layout: "multiSelect",
    field: "helpStyle",
    title: {
      before: "O que te ajuda a voltar a ser ",
      accent: "você",
      after: "?",
    },
    subtitle: "Escolha quantas quiser.",
    options: [
      "Tempo sozinha",
      "Tempo com pessoas",
      "Estar ao ar livre",
      "Criar alguma coisa",
      "Mexer o corpo",
      "Descansar de verdade",
    ],
    cta: "Continuar",
    skippable: true,
  },
  {
    key: "strengths",
    group: "deep",
    layout: "multiSelect",
    field: "strengths",
    title: {
      before: "Quais são algumas das suas ",
      accent: "forças",
      after: "?",
    },
    subtitle: "Pense um pouco. Depois, escolha as que fizerem sentido.",
    options: [
      "Manter a calma sob pressão",
      "Seguir em frente quando está difícil",
      "Ver o lado engraçado das coisas",
      "Estar presente para os outros",
      "Achar soluções",
      "Pedir ajuda quando preciso",
    ],
    cta: "Continuar",
    skippable: true,
  },
  {
    key: "blockers",
    group: "deep",
    layout: "multiSelect",
    field: "blockers",
    title: { before: "O que te impede de ", accent: "agir", after: "?" },
    subtitle: "Vale ser o mais honesta possível.",
    options: [
      "Não saber por onde começar",
      "Pensar demais",
      "Medo de errar",
      "Falta de energia",
      "Nenhuma dessas",
    ],
    cta: "Continuar",
    skippable: true,
  },
  {
    key: "faith",
    group: "deep",
    layout: "choiceAdvance",
    field: "faith",
    title: {
      before: "Fé ou espiritualidade são importantes para ",
      accent: "você",
      after: "?",
    },
    subtitle: "O que você escolher, o Bud vai respeitar.",
    options: [
      "Sim, tenho uma religião",
      "Sim, sou espiritualizada",
      "Um pouco",
      "Não muito",
      "Prefiro não dizer",
    ],
    cta: "",
    skippable: true,
  },
  {
    key: "neuro",
    group: "deep",
    layout: "choiceAdvance",
    field: "neurodivergence",
    title: {
      before: "Você se considera ",
      accent: "neurodivergente",
      after: "?",
    },
    subtitle:
      "Neurodivergente é quem pensa, sente ou processa o mundo de um jeito diferente do típico — como autismo, TDAH ou dislexia. Talvez você tenha um diagnóstico, ou só sinta que sua cabeça funciona de outro jeito. Escolha o que for mais verdadeiro.",
    options: ["Sim", "Não", "Não sei", "Prefiro não dizer"],
    cta: "",
    skippable: true,
  },
  {
    key: "quase",
    group: "prefs",
    layout: "mistHero",
    art: "leafStand",
    title: { before: "Você está quase ", accent: "lá" },
    subtitle: "Obrigado por se abrir. Agora vamos deixar o Bud do seu jeito.",
    cta: "Vamos lá",
    skippable: true,
  },
  {
    key: "voice",
    group: "prefs",
    layout: "voice",
    field: "voice",
    title: { before: "Qual voz você ", accent: "prefere", after: "?" },
    subtitle: "Você pode trocar a voz do Bud quando quiser.",
    cta: "É essa",
    skippable: true,
  },
  {
    key: "interests",
    group: "prefs",
    layout: "multiSelect",
    field: "interests",
    title: { before: "Quais são seus ", accent: "interesses", after: "?" },
    subtitle: "Ajuda o Bud a saber do que você gosta de conversar.",
    options: [
      "Livros",
      "Filmes e séries",
      "Música",
      "Natureza",
      "Culinária",
      "Viagens",
    ],
    cta: "Confirmar",
    skippable: true,
  },
  {
    key: "notifications",
    group: "prefs",
    layout: "notify",
    field: "notifications",
    art: "bell",
    title: { before: "Um lembrete, quando ", accent: "ajudar" },
    subtitle: "Receba check-ins do Bud. Dá para desligar quando quiser.",
    cta: "Ativar lembretes",
    skippable: true,
  },
  {
    key: "microphone",
    group: "prefs",
    layout: "microphone",
    field: "microphone",
    art: "waves",
    title: {
      before: "O Bud funciona melhor quando a gente ",
      accent: "conversa",
    },
    subtitle:
      "Ligue o microfone para falar em voz alta. Dá para voltar a digitar a qualquer momento.",
    cta: "Permitir microfone",
    skippable: true,
  },
  {
    key: "anythingElse",
    group: "prefs",
    layout: "anythingElse",
    field: "anythingElse",
    title: { before: "Quer contar mais ", accent: "alguma coisa", after: "?" },
    placeholder: "O Bud está ouvindo.",
    prompts: ["O que está acontecendo agora", "O que não perguntamos"],
    cta: "Continuar",
    skippable: true,
  },
  {
    key: "origin",
    group: "prefs",
    layout: "choiceAdvance",
    field: "origin",
    title: { before: "Como você conheceu o ", accent: "Bud", after: "?" },
    options: [
      "Instagram",
      "TikTok",
      "Busca no Google ou na loja",
      "Alguém que eu sigo",
      "Matéria ou blog",
      "Podcast",
      "Amigos ou família",
      "Minha empresa ou escola",
      "Outro",
    ],
    cta: "",
    skippable: true,
  },
  {
    key: "loading",
    group: "prefs",
    layout: "loading",
    title: { before: "Entendendo", accent: "." },
    cta: "",
  },
  {
    key: "ready",
    group: "prefs",
    layout: "ready",
    art: "leafWalk",
    title: { before: "Seu Bud está ", accent: "pronto" },
    subtitle:
      "Obrigado por contar tanto sobre você. A partir de agora, o Bud se adapta aos seus objetivos e ao seu jeito.",
    cta: "Vamos lá",
  },
  {
    key: "paywall",
    group: "prefs",
    layout: "paywall",
    title: { before: "Siga com o Bud ", accent: "Premium" },
    subtitle:
      "Conversas sem limite, uma memória que acompanha você e o modo de voz.",
    cta: "Assinar o Bud Premium",
  },
];
