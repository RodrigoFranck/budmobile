import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';

/** Figma onboarding icons (22×22, stroke 1.55833). */
function OnboardingIcon({ children }: { children: ReactNode }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      {children}
    </Svg>
  );
}

const stroke = {
  strokeWidth: 1.55833,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function OnboardingClockIcon({ color }: { color: string }) {
  return (
    <OnboardingIcon>
      <Path
        d="M19.25 11C19.25 15.5563 15.5563 19.25 11 19.25C6.44365 19.25 2.75 15.5563 2.75 11C2.75 6.44365 6.44365 2.75 11 2.75C15.5563 2.75 19.25 6.44365 19.25 11Z"
        stroke={color}
        {...stroke}
      />
      <Path d="M11 6.41667V11L13.75 12.8333" stroke={color} {...stroke} />
    </OnboardingIcon>
  );
}

export function OnboardingMessageIcon({ color }: { color: string }) {
  return (
    <OnboardingIcon>
      <Path
        d="M4.58333 4.58333H17.4167V14.6667H9.16667L4.58333 18.3333V4.58333Z"
        stroke={color}
        {...stroke}
      />
    </OnboardingIcon>
  );
}

export function OnboardingEnvelopeIcon({ color }: { color: string }) {
  return (
    <OnboardingIcon>
      <Path
        d="M4.58333 5.5H17.4167C18.4292 5.5 19.25 6.32081 19.25 7.33333V15.5833C19.25 16.5959 18.4292 17.4167 17.4167 17.4167H4.58333C3.57081 17.4167 2.75 16.5959 2.75 15.5833V7.33333C2.75 6.32081 3.57081 5.5 4.58333 5.5Z"
        stroke={color}
        {...stroke}
      />
      <Path d="M2.75 7.33333L11 12.8333L19.25 7.33333" stroke={color} {...stroke} />
    </OnboardingIcon>
  );
}

export function OnboardingShareIcon({ color }: { color: string }) {
  return (
    <OnboardingIcon>
      <Path
        d="M4.58333 5.5H12.8333M16.5 5.5H17.4167M4.58333 11H7.33333M11 11H17.4167M4.58333 16.5H14.6667M18.3333 16.5H17.4167"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M16.5 5.5C16.5 6.51252 15.6792 7.33333 14.6667 7.33333C13.6541 7.33333 12.8333 6.51252 12.8333 5.5C12.8333 4.48748 13.6541 3.66667 14.6667 3.66667C15.6792 3.66667 16.5 4.48748 16.5 5.5Z"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M11 11C11 12.0125 10.1792 12.8333 9.16667 12.8333C8.15414 12.8333 7.33333 12.0125 7.33333 11C7.33333 9.98748 8.15414 9.16667 9.16667 9.16667C10.1792 9.16667 11 9.98748 11 11Z"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M18.3333 16.5C18.3333 17.5125 17.5125 18.3333 16.5 18.3333C15.4875 18.3333 14.6667 17.5125 14.6667 16.5C14.6667 15.4875 15.4875 14.6667 16.5 14.6667C17.5125 14.6667 18.3333 15.4875 18.3333 16.5Z"
        stroke={color}
        {...stroke}
      />
    </OnboardingIcon>
  );
}

export function OnboardingPlusIcon({ color }: { color: string }) {
  return (
    <OnboardingIcon>
      <Path
        d="M11 4.58333V11M11 11V17.4167M11 11H4.58333M11 11H17.4167"
        stroke={color}
        {...stroke}
      />
    </OnboardingIcon>
  );
}

export function OnboardingCheckIcon({ color }: { color: string }) {
  return (
    <OnboardingIcon>
      <Path d="M4.58333 11.4583L8.70833 15.5833L17.4167 6.875" stroke={color} {...stroke} />
    </OnboardingIcon>
  );
}
