import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { animatedGradientStyles } from '@/components/explore/AnimatedGradient.styles';

interface AnimatedGradientProps {
  children: React.ReactNode;
}

export function AnimatedGradient({ children }: AnimatedGradientProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    animate();
  }, [animValue]);

  // Interpolar as posições das cores no gradiente
  const color1 = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#1a1a2e', '#16213e', '#1a1a2e'],
  });

  const color2 = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#16213e', '#0f3460', '#16213e'],
  });

  const color3 = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#0f3460', '#1a1a2e', '#0f3460'],
  });

  const color4 = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#1a1a2e', '#16213e', '#1a1a2e'],
  });

  const color5 = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#16213e', '#0f3460', '#16213e'],
  });

  return (
    <Animated.View style={animatedGradientStyles.root}>
      <Animated.View
        style={animatedGradientStyles.absoluteFill}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: color1 as any,
          }}
        />
      </Animated.View>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          ...animatedGradientStyles.absoluteFill,
          opacity: animValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.7, 1],
          }) as any,
        }}
      />
      <View style={animatedGradientStyles.overlayContent}>{children}</View>
    </Animated.View>
  );
}

