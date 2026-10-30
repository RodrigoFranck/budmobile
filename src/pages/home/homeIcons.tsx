import Svg, { Path } from 'react-native-svg';

/** Figma núcleo icons (22×22, stroke 1.55833). */
const stroke = {
  strokeWidth: 1.55833,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function HomeArrowIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M4.58333 11H17.4167M11.9167 16.5L17.4167 11L11.9167 5.5" stroke={color} {...stroke} />
    </Svg>
  );
}

export function HomeChatFillIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4.58333 3.66667H17.4167C17.6598 3.66667 17.8929 3.76324 18.0648 3.93515C18.2368 4.10706 18.3333 4.34022 18.3333 4.58333V13.75C18.3333 13.9931 18.2368 14.2263 18.0648 14.3982C17.8929 14.5701 17.6598 14.6667 17.4167 14.6667H9.16667L4.58333 18.3333V4.58333C4.58333 4.34022 4.67991 4.10706 4.85182 3.93515C5.02373 3.76324 5.25688 3.66667 5.5 3.66667H4.58333Z"
        fill={color}
      />
    </Svg>
  );
}
