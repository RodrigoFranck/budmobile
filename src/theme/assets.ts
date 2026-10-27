import { useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

export const v3Assets = {
  envelopeClosedDark: require('@/assets/v3/envelopes/closed-dark.png'),
  envelopeClosedLight: require('@/assets/v3/envelopes/closed-light.png'),
  envelopeOpenDark: require('@/assets/v3/envelopes/open-cut.png'),
  envelopeOpenLight: require('@/assets/v3/envelopes/open-light.png'),
  envelopePaperDark: require('@/assets/v3/envelopes/paper-dark.png'),
  envelopePaperLight: require('@/assets/v3/envelopes/paper-light.png'),
  waxSeal: require('@/assets/v3/envelopes/wax-seal-cut.png'),
  voiceOrb: require('@/assets/v3/envelopes/voice-orb.png'),
  gizCoracao: require('@/assets/v3/giz/coracao-cut.png'),
  gizHumor1: require('@/assets/v3/giz/humor-1-cut.png'),
  gizOla: require('@/assets/v3/giz/personagem-ola-cut.png'),
  gizLoading: require('@/assets/v3/giz/rabisco-carregando-cut.png'),
  voiceAmanda: require('@/assets/v3/voices/amanda.png'),
  fieeLeaf: require('@/assets/v3/activities/fiee-leaf-cut.png'),
  mistPorquesDark: require('@/assets/v3/activities/mist-porques-cut.png'),
  mistPorquesLight: require('@/assets/v3/activities/mist-porques-light.png'),
  mapIconDark: require('@/assets/v3/activities/map-icon.png'),
  mapIconLight: require('@/assets/v3/activities/map-icon-light.png'),
  cardsIconDark: require('@/assets/v3/activities/cards-icon.png'),
  cardsIconLight: require('@/assets/v3/activities/cards-icon-light.png'),
  cincoPorquesMistDark: require('@/assets/v3/activities/cinco-porques-mist.png'),
  cincoPorquesMistLight: require('@/assets/v3/activities/cinco-porques-mist-light.png'),
  cincoPorquesGizDark: require('@/assets/v3/activities/cinco-porques-giz.png'),
  cincoPorquesGizLight: require('@/assets/v3/activities/cinco-porques-giz-light.png'),
  fieeMistDark: require('@/assets/v3/activities/fiee-mist.png'),
  fieeMistLight: require('@/assets/v3/activities/fiee-mist-light.png'),
  fieeGizDark: require('@/assets/v3/activities/fiee-giz.png'),
  fieeGizLight: require('@/assets/v3/activities/fiee-giz-light.png'),
  mapaMistDark: require('@/assets/v3/activities/mapa-mist.png'),
  mapaMistLight: require('@/assets/v3/activities/mapa-mist-light.png'),
  mapaGizDark: require('@/assets/v3/activities/mapa-giz.png'),
  mapaGizLight: require('@/assets/v3/activities/mapa-giz-light.png'),
  valoresMistDark: require('@/assets/v3/activities/valores-mist.png'),
  valoresMistLight: require('@/assets/v3/activities/valores-mist-light.png'),
  valoresGizDark: require('@/assets/v3/activities/valores-giz.png'),
  valoresGizLight: require('@/assets/v3/activities/valores-giz-light.png'),
  cincoPorquesCoverDark: require('@/assets/v3/activities/cinco-porques-cover.png'),
  cincoPorquesCoverLight: require('@/assets/v3/activities/cinco-porques-cover-light.png'),
  fieeCoverDark: require('@/assets/v3/activities/fiee-cover.png'),
  fieeCoverLight: require('@/assets/v3/activities/fiee-cover-light.png'),
  mapaCoverDark: require('@/assets/v3/activities/mapa-cover.png'),
  mapaCoverLight: require('@/assets/v3/activities/mapa-cover-light.png'),
  valoresCoverDark: require('@/assets/v3/activities/valores-cover.png'),
  valoresCoverLight: require('@/assets/v3/activities/valores-cover-light.png'),
  fieeCompassLeaf: require('@/assets/v3/activities/fiee-compass-leaf.png'),
  valoresCardsGiz: require('@/assets/v3/activities/valores-cards-giz.png'),
  splashTexture: require('@/assets/v3/auth/splash-texture.png'),
  wordmark: require('@/assets/v3/auth/wordmark.png'),
  welcomeGiz: require('@/assets/v3/auth/welcome-giz-cut.png'),
  onboardingMistDark: require('@/assets/v3/onboarding/mist-dark.png'),
  onboardingMistLight: require('@/assets/v3/onboarding/mist-light.png'),
  onboardingLockDark: require('@/assets/v3/onboarding/cadeado.png'),
  onboardingLockLight: require('@/assets/v3/onboarding/cadeado-light.png'),
  onboardingLeafStandDark: require('@/assets/v3/onboarding/folha-em-pe.png'),
  onboardingLeafStandLight: require('@/assets/v3/onboarding/folha-em-pe-light.png'),
  onboardingLeafSitDark: require('@/assets/v3/onboarding/folha-sentada.png'),
  onboardingLeafSitLight: require('@/assets/v3/onboarding/folha-sentada-light.png'),
  onboardingLeafWalkDark: require('@/assets/v3/onboarding/folha-andando.png'),
  onboardingLeafWalkLight: require('@/assets/v3/onboarding/folha-andando-light.png'),
  onboardingMoodDark: require('@/assets/v3/onboarding/humor-novelo.png'),
  onboardingMoodLight: require('@/assets/v3/onboarding/humor-novelo-light.png'),
  onboardingLoadingDark: require('@/assets/v3/onboarding/carregando.png'),
  onboardingLoadingLight: require('@/assets/v3/onboarding/carregando-light.png'),
  onboardingBellDark: require('@/assets/v3/onboarding/sino.png'),
  onboardingBellLight: require('@/assets/v3/onboarding/sino-light.png'),
  onboardingWavesDark: require('@/assets/v3/onboarding/ondas.png'),
  onboardingWavesLight: require('@/assets/v3/onboarding/ondas-light.png'),
  voiceAmandaLine: require('@/assets/v3/voices/amanda-line.png'),
  voiceMarceloLine: require('@/assets/v3/voices/marcelo-line.png'),
  shareHandsDark: require('@/assets/v3/menu/share-hands-dark.png'),
  shareHandsLight: require('@/assets/v3/menu/share-hands-light.png'),
  profileGizDark: require('@/assets/v3/menu/profile-giz-dark.png'),
  profileGizLight: require('@/assets/v3/menu/profile-giz-light.png'),
  notifBellDark: require('@/assets/v3/menu/notif-bell-dark.png'),
  notifBellLight: require('@/assets/v3/menu/notif-bell-light.png'),
  accountDeletedGizDark: require('@/assets/v3/menu/account-deleted-giz-dark.png'),
  accountDeletedGizLight: require('@/assets/v3/menu/account-deleted-giz-light.png'),
  accountDeletedMistDark: require('@/assets/v3/menu/account-deleted-mist-dark.png'),
  accountDeletedMistLight: require('@/assets/v3/menu/account-deleted-mist-light.png'),
  supportSentDark: require('@/assets/v3/menu/support-sent-dark.png'),
  supportSentLight: require('@/assets/v3/menu/support-sent-light.png'),
} as const;

export const voiceOptions = [
  {
    id: 'amanda',
    label: 'Amanda',
    bio: 'Calorosa e próxima. Como uma amiga que escuta.',
    image: v3Assets.voiceAmandaLine,
  },
  {
    id: 'carla',
    label: 'Carla',
    bio: 'Calorosa e próxima. Como uma amiga que escuta.',
    image: v3Assets.voiceAmandaLine,
  },
  {
    id: 'marcelo',
    label: 'Marcelo',
    bio: 'Grave e firme. Uma presença que acalma.',
    image: v3Assets.voiceMarceloLine,
  },
  {
    id: 'will',
    label: 'Will',
    bio: 'Grave e firme. Uma presença que acalma.',
    image: v3Assets.voiceMarceloLine,
  },
] as const;

export type VoiceId = (typeof voiceOptions)[number]['id'];

export type ActivityCardArt = ImageSourcePropType;

export type V3ThemedAssets = {
  envelopeClosed: ImageSourcePropType;
  envelopeOpen: ImageSourcePropType;
  envelopePaper: ImageSourcePropType;
  waxSeal: ImageSourcePropType;
  voiceOrb: ImageSourcePropType;
  gizCoracao: ImageSourcePropType;
  gizHumor1: ImageSourcePropType;
  gizOla: ImageSourcePropType;
  gizLoading: ImageSourcePropType;
  welcomeGiz: ImageSourcePropType;
  onboardingMist: ImageSourcePropType;
  onboardingLock: ImageSourcePropType;
  onboardingLeafStand: ImageSourcePropType;
  onboardingLeafSit: ImageSourcePropType;
  onboardingLeafWalk: ImageSourcePropType;
  onboardingMood: ImageSourcePropType;
  onboardingLoading: ImageSourcePropType;
  onboardingBell: ImageSourcePropType;
  onboardingWaves: ImageSourcePropType;
  shareHands: ImageSourcePropType;
  profileGiz: ImageSourcePropType;
  notifBell: ImageSourcePropType;
  accountDeletedGiz: ImageSourcePropType;
  accountDeletedMist: ImageSourcePropType;
  supportSent: ImageSourcePropType;
  fieeLeaf: ImageSourcePropType;
  fieeCompassLeaf: ImageSourcePropType;
  valoresCardsGiz: ImageSourcePropType;
  mistPorques: ImageSourcePropType;
  cincoPorquesGiz: ImageSourcePropType;
  fieeMist: ImageSourcePropType;
  fieeGiz: ImageSourcePropType;
  mapaMist: ImageSourcePropType;
  mapaGiz: ImageSourcePropType;
  valoresMist: ImageSourcePropType;
  valoresGiz: ImageSourcePropType;
  mapIcon: ImageSourcePropType;
  cardsIcon: ImageSourcePropType;
  activityCards: {
    cinco_porques: ActivityCardArt;
    fiee: ActivityCardArt;
    mapa_relacoes: ActivityCardArt;
    ordenacao_valores: ActivityCardArt;
  };
};

export function useV3Asset(): V3ThemedAssets {
  const { isDarkMode } = useTheme();
  return useMemo(
    () => ({
      envelopeClosed: isDarkMode ? v3Assets.envelopeClosedDark : v3Assets.envelopeClosedLight,
      envelopeOpen: isDarkMode ? v3Assets.envelopeOpenDark : v3Assets.envelopeOpenLight,
      envelopePaper: isDarkMode ? v3Assets.envelopePaperDark : v3Assets.envelopePaperLight,
      waxSeal: v3Assets.waxSeal,
      voiceOrb: v3Assets.voiceOrb,
      gizCoracao: v3Assets.gizCoracao,
      gizHumor1: v3Assets.gizHumor1,
      gizOla: v3Assets.gizOla,
      gizLoading: v3Assets.gizLoading,
      welcomeGiz: v3Assets.welcomeGiz,
      onboardingMist: isDarkMode ? v3Assets.onboardingMistDark : v3Assets.onboardingMistLight,
      onboardingLock: isDarkMode ? v3Assets.onboardingLockDark : v3Assets.onboardingLockLight,
      onboardingLeafStand: isDarkMode
        ? v3Assets.onboardingLeafStandDark
        : v3Assets.onboardingLeafStandLight,
      onboardingLeafSit: isDarkMode ? v3Assets.onboardingLeafSitDark : v3Assets.onboardingLeafSitLight,
      onboardingLeafWalk: isDarkMode
        ? v3Assets.onboardingLeafWalkDark
        : v3Assets.onboardingLeafWalkLight,
      onboardingMood: isDarkMode ? v3Assets.onboardingMoodDark : v3Assets.onboardingMoodLight,
      onboardingLoading: isDarkMode
        ? v3Assets.onboardingLoadingDark
        : v3Assets.onboardingLoadingLight,
      onboardingBell: isDarkMode ? v3Assets.onboardingBellDark : v3Assets.onboardingBellLight,
      onboardingWaves: isDarkMode ? v3Assets.onboardingWavesDark : v3Assets.onboardingWavesLight,
      shareHands: isDarkMode ? v3Assets.shareHandsDark : v3Assets.shareHandsLight,
      profileGiz: isDarkMode ? v3Assets.profileGizDark : v3Assets.profileGizLight,
      notifBell: isDarkMode ? v3Assets.notifBellDark : v3Assets.notifBellLight,
      accountDeletedGiz: isDarkMode
        ? v3Assets.accountDeletedGizDark
        : v3Assets.accountDeletedGizLight,
      accountDeletedMist: isDarkMode
        ? v3Assets.accountDeletedMistDark
        : v3Assets.accountDeletedMistLight,
      supportSent: isDarkMode ? v3Assets.supportSentDark : v3Assets.supportSentLight,
      fieeLeaf: v3Assets.fieeLeaf,
      fieeCompassLeaf: v3Assets.fieeCompassLeaf,
      valoresCardsGiz: v3Assets.valoresCardsGiz,
      mistPorques: isDarkMode ? v3Assets.cincoPorquesMistDark : v3Assets.cincoPorquesMistLight,
      cincoPorquesGiz: isDarkMode ? v3Assets.cincoPorquesGizDark : v3Assets.cincoPorquesGizLight,
      fieeMist: isDarkMode ? v3Assets.fieeMistDark : v3Assets.fieeMistLight,
      fieeGiz: isDarkMode ? v3Assets.fieeGizDark : v3Assets.fieeGizLight,
      mapaMist: isDarkMode ? v3Assets.mapaMistDark : v3Assets.mapaMistLight,
      mapaGiz: isDarkMode ? v3Assets.mapaGizDark : v3Assets.mapaGizLight,
      valoresMist: isDarkMode ? v3Assets.valoresMistDark : v3Assets.valoresMistLight,
      valoresGiz: isDarkMode ? v3Assets.valoresGizDark : v3Assets.valoresGizLight,
      mapIcon: isDarkMode ? v3Assets.mapIconDark : v3Assets.mapIconLight,
      cardsIcon: isDarkMode ? v3Assets.cardsIconDark : v3Assets.cardsIconLight,
      activityCards: {
        cinco_porques: isDarkMode ? v3Assets.cincoPorquesCoverDark : v3Assets.cincoPorquesCoverLight,
        fiee: isDarkMode ? v3Assets.fieeCoverDark : v3Assets.fieeCoverLight,
        mapa_relacoes: isDarkMode ? v3Assets.mapaCoverDark : v3Assets.mapaCoverLight,
        ordenacao_valores: isDarkMode ? v3Assets.valoresCoverDark : v3Assets.valoresCoverLight,
      },
    }),
    [isDarkMode],
  );
}
