import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/** Symmetric 5-bar waveform matching the chat voice control mock. */
const BAR_HEIGHT_RATIOS = [0.38, 0.62, 1, 0.62, 0.38] as const;

interface WavesIconProps {
  size?: number;
  color?: string;
}

export function WavesIcon({ size = 22, color = '#1D1916' }: WavesIconProps) {
  const width = size;
  const height = size;
  const barCount = BAR_HEIGHT_RATIOS.length;
  const gap = size * 0.1;
  const barWidth = (width - gap * (barCount - 1)) / barCount;
  const radius = barWidth / 2;

  return (
    <View style={{ width, height }} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {BAR_HEIGHT_RATIOS.map((ratio, index) => {
          const barHeight = height * ratio;
          const x = index * (barWidth + gap);
          const y = (height - barHeight) / 2;
          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={radius}
              ry={radius}
              fill={color}
            />
          );
        })}
      </Svg>
    </View>
  );
}
