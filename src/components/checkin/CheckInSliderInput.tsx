import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Text,
  View,
  type GestureResponderEvent,
  type View as ViewType,
} from 'react-native';

import { useCheckInFlowStyles } from './checkInFlow.styles';

interface CheckInSliderInputProps {
  min: number;
  max: number;
  value: number;
  minLabel?: string;
  maxLabel?: string;
  onChange: (value: number) => void;
}

function clampValue(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function valueFromPosition(
  positionX: number,
  trackWidth: number,
  trackLeft: number,
  min: number,
  max: number,
) {
  if (trackWidth <= 0) return min;
  const x = positionX - trackLeft;
  const ratio = Math.max(0, Math.min(1, x / trackWidth));
  return Math.round(min + ratio * (max - min));
}

export function CheckInSliderInput({
  min,
  max,
  value,
  minLabel,
  maxLabel,
  onChange,
}: CheckInSliderInputProps) {
  const styles = useCheckInFlowStyles();
  const trackRef = useRef<ViewType>(null);
  const trackWidthRef = useRef(0);
  const trackLeftRef = useRef(0);
  const isDraggingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const boundsRef = useRef({ min, max });

  const [displayValue, setDisplayValue] = useState(value);

  onChangeRef.current = onChange;
  boundsRef.current = { min, max };

  useEffect(() => {
    if (!isDraggingRef.current) {
      setDisplayValue(value);
    }
  }, [value]);

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLeftRef.current = x;
      trackWidthRef.current = width;
    });
  }, []);

  const resolveValue = useCallback((evt: GestureResponderEvent) => {
    const { min: lo, max: hi } = boundsRef.current;
    return valueFromPosition(
      evt.nativeEvent.pageX,
      trackWidthRef.current,
      trackLeftRef.current,
      lo,
      hi,
    );
  }, []);

  const commitValue = useCallback((next: number) => {
    const clamped = clampValue(next, boundsRef.current.min, boundsRef.current.max);
    setDisplayValue(clamped);
    onChangeRef.current(clamped);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          isDraggingRef.current = true;
          const pageX = evt.nativeEvent.pageX;
          trackRef.current?.measureInWindow((x, _y, width) => {
            trackLeftRef.current = x;
            trackWidthRef.current = width;
            const { min: lo, max: hi } = boundsRef.current;
            const next = valueFromPosition(pageX, width, x, lo, hi);
            setDisplayValue(next);
          });
        },
        onPanResponderMove: (evt) => {
          const next = resolveValue(evt);
          setDisplayValue((prev) => (prev === next ? prev : next));
        },
        onPanResponderRelease: (evt) => {
          isDraggingRef.current = false;
          commitValue(resolveValue(evt));
        },
        onPanResponderTerminate: (evt) => {
          isDraggingRef.current = false;
          commitValue(resolveValue(evt));
        },
      }),
    [commitValue, resolveValue],
  );

  const percent =
    max === min ? 0 : ((displayValue - min) / (max - min)) * 100;

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
    measureTrack();
  };

  return (
    <View>
      <Text style={styles.sliderValue} accessibilityLiveRegion="polite">
        {displayValue}
      </Text>
      <View
        ref={trackRef}
        style={styles.sliderTrack}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityValue={{ min, max, now: displayValue }}
        accessibilityLabel={`Valor ${displayValue} de ${max}`}
      >
        <View style={[styles.sliderFill, { width: `${percent}%` }]} />
        <View style={[styles.sliderThumb, { left: `${percent}%` }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{minLabel}</Text>
        <Text style={[styles.sliderLabel, { textAlign: 'right' }]}>{maxLabel}</Text>
      </View>
    </View>
  );
}
