import Svg, { Path } from 'react-native-svg';

const STROKE = {
  strokeWidth: 1.55833,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function HistoryLockIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M6.41667 10.0833H15.5833C16.5959 10.0833 17.4167 10.9041 17.4167 11.9167V17.4167C17.4167 18.4292 16.5959 19.25 15.5833 19.25H6.41667C5.40414 19.25 4.58333 18.4292 4.58333 17.4167V11.9167C4.58333 10.9041 5.40414 10.0833 6.41667 10.0833Z"
        stroke={color}
        {...STROKE}
      />
      <Path
        d="M7.33333 10.0833V7.33333C7.33333 6.36087 7.71964 5.42824 8.40727 4.74061C9.09491 4.05297 10.0275 3.66667 11 3.66667C11.9725 3.66667 12.9051 4.05297 13.5927 4.74061C14.2804 5.42824 14.6667 6.36087 14.6667 7.33333V10.0833"
        stroke={color}
        {...STROKE}
      />
    </Svg>
  );
}

export function HistoryMessageIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4.58333 4.58333H17.4167V14.6667H9.16667L4.58333 18.3333V4.58333Z"
        stroke={color}
        {...STROKE}
      />
    </Svg>
  );
}

export function HistoryEnvelopeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4.58333 5.5H17.4167C18.4292 5.5 19.25 6.32081 19.25 7.33333V15.5833C19.25 16.5959 18.4292 17.4167 17.4167 17.4167H4.58333C3.57081 17.4167 2.75 16.5959 2.75 15.5833V7.33333C2.75 6.32081 3.57081 5.5 4.58333 5.5Z"
        stroke={color}
        {...STROKE}
      />
      <Path d="M2.75 7.33333L11 12.8333L19.25 7.33333" stroke={color} {...STROKE} />
    </Svg>
  );
}

export function HistoryChatFillIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4.58333 3.66667H17.4167C17.6598 3.66667 17.8929 3.76324 18.0648 3.93515C18.2368 4.10706 18.3333 4.34022 18.3333 4.58333V13.75C18.3333 13.9931 18.2368 14.2263 18.0648 14.3982C17.8929 14.5701 17.6598 14.6667 17.4167 14.6667H9.16667L4.58333 18.3333V4.58333C4.58333 4.34022 4.67991 4.10706 4.85182 3.93515C5.02373 3.76324 5.25688 3.66667 5.5 3.66667H4.58333Z"
        fill={color}
      />
    </Svg>
  );
}

export function HistoryShareIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M17.4167 9.16667V4.58333H12.8333M17.4167 4.58333L10.0833 11.9167M11 4.58333H4.58333V17.4167H17.4167V11"
        stroke={color}
        {...STROKE}
      />
    </Svg>
  );
}

export function HistoryChevronIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M6.75 3.75L12 9L6.75 14.25" stroke={color} strokeWidth={1.35} />
    </Svg>
  );
}
