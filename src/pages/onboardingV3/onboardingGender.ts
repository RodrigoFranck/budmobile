import {
  applyGenderedCopy,
  displayedOptionsFrom,
  genderVoiceFrom,
  optionsMatch,
  type GrammaticalVoice,
} from '@/copy/genderedCopy';
import type { OnboardingV3Step } from '@/pages/onboardingV3/onboardingSteps';

export type OnboardingVoice = GrammaticalVoice;

export {
  applyGenderedCopy as applyOnboardingVoice,
  displayedOptionsFrom,
  genderVoiceFrom,
  optionsMatch,
};

export function withOnboardingGender(
  step: OnboardingV3Step,
  gender: string | null | undefined,
): OnboardingV3Step {
  const voice = genderVoiceFrom(gender);
  return {
    ...step,
    title: {
      before: applyGenderedCopy(step.title.before, voice),
      accent: applyGenderedCopy(step.title.accent, voice),
      ...(step.title.after
        ? { after: applyGenderedCopy(step.title.after, voice) }
        : {}),
    },
    subtitle: step.subtitle ? applyGenderedCopy(step.subtitle, voice) : step.subtitle,
    cta: applyGenderedCopy(step.cta, voice),
    options: step.options
      ? step.options.map((option) => applyGenderedCopy(option, voice))
      : step.options,
  };
}
