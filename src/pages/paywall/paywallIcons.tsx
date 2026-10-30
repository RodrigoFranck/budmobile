import type { ReactNode } from 'react';
import Svg, { Path } from 'react-native-svg';

/** Figma paywall icons (22×22, stroke 1.55833). */
function PaywallIcon({ children }: { children: ReactNode }) {
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

export function PaywallMessageIcon({ color }: { color: string }) {
  return (
    <PaywallIcon>
      <Path d="M4.58333 4.58333H17.4167V14.6667H9.16667L4.58333 18.3333V4.58333Z" stroke={color} {...stroke} />
    </PaywallIcon>
  );
}

export function PaywallSparkleIcon({ color }: { color: string }) {
  return (
    <PaywallIcon>
      <Path
        d="M11 3.66667L12.4667 7.88333L16.5 9.16667L12.4667 10.45L11 14.6667L9.53333 10.45L5.5 9.16667L9.53333 7.88333L11 3.66667Z"
        stroke={color}
        {...stroke}
      />
    </PaywallIcon>
  );
}

export function PaywallLeafIcon({ color }: { color: string }) {
  return (
    <PaywallIcon>
      <Path
        d="M4.58333 17.4167C4.58333 10.0833 9.16667 4.58333 17.4167 4.58333C17.4167 12.8333 11.9167 17.4167 4.58333 17.4167Z"
        stroke={color}
        {...stroke}
      />
      <Path d="M4.58333 17.4167L11.9167 10.0833" stroke={color} {...stroke} />
    </PaywallIcon>
  );
}

export function PaywallCheckIcon({ color }: { color: string }) {
  return (
    <PaywallIcon>
      <Path d="M4.58333 11.4583L8.70833 15.5833L17.4167 6.875" stroke={color} {...stroke} />
    </PaywallIcon>
  );
}

export function PaywallMicIcon({ color }: { color: string }) {
  return (
    <PaywallIcon>
      <Path
        d="M11 2.75C12.5188 2.75 13.75 3.98122 13.75 5.5V10.0833C13.75 11.6021 12.5188 12.8333 11 12.8333C9.48122 12.8333 8.25 11.6021 8.25 10.0833V5.5C8.25 3.98122 9.48122 2.75 11 2.75Z"
        stroke={color}
        {...stroke}
      />
      <Path
        d="M4.58333 10.0833C4.58333 11.7851 5.25937 13.4172 6.46273 14.6206C7.66609 15.824 9.29819 16.5 11 16.5M11 16.5C12.7018 16.5 14.3339 15.824 15.5373 14.6206C16.7406 13.4172 17.4167 11.7851 17.4167 10.0833M11 16.5V19.25"
        stroke={color}
        {...stroke}
      />
    </PaywallIcon>
  );
}
