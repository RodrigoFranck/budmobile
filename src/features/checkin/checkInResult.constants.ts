import type { CheckinType } from '@/hooks/useCheckIns';

export const CHECKIN_LOADING_MESSAGES: Record<CheckinType, string[]> = {
  morning: [
    'Okay, deixa eu olhar com calma o que você trouxe...',
    'Tem algumas coisas aqui que me chamaram atenção...',
    'Tô conectando o que você disse sobre a sua manhã...',
    'Pensando no que isso pode dizer sobre o seu dia...',
    'Quase pronto, só fechando uma ideia...',
  ],
  post_training: [
    'Deixa eu sentir o que esse treino te deixou...',
    'Revisitando o que o corpo te disse hoje...',
    'Tem coisa interessante no que você trouxe...',
    'Conectando o esforço com o que ficou em você...',
    'Quase lá, só amarrando o último fio...',
  ],
};
