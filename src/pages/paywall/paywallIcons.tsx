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
