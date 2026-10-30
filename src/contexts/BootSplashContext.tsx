import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';

import { LaunchSplash } from '@/components/SplashScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { v3DarkColors } from '@/theme';

type BootSplashContextType = {
  mainTabsReady: boolean;
  setMainTabsReady: (ready: boolean) => void;
};

const BootSplashContext = createContext<BootSplashContextType | undefined>(undefined);

export function BootSplashProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mainTabsReady, setMainTabsReadyState] = useState(false);
  const setMainTabsReady = useCallback((ready: boolean) => {
    setMainTabsReadyState((current) => (current === ready ? current : ready));
  }, []);

  useEffect(() => {
    if (user) return;
    setMainTabsReadyState(false);
  }, [user]);
  const value = useMemo(
    () => ({ mainTabsReady, setMainTabsReady }),
    [mainTabsReady, setMainTabsReady],
  );

  return <BootSplashContext.Provider value={value}>{children}</BootSplashContext.Provider>;
}

export function useBootSplash() {
  const context = useContext(BootSplashContext);
  if (!context) {
    throw new Error('useBootSplash must be used within a BootSplashProvider');
  }
  return context;
}

export function BootSplashLayer({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { loaded: themeLoaded } = useTheme();
  const {
    loading,
    user,
    onboardingCompleted,
    onboardingStatusLoaded,
    passwordRecoveryPending,
  } = useAuth();
  const { mainTabsReady } = useBootSplash();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const [interactionsDone, setInteractionsDone] = useState(false);
  const splashStartMsRef = useRef(Date.now());

  useEffect(() => {
    const minDurationMs = 700;
    const remaining = Math.max(0, minDurationMs - (Date.now() - splashStartMsRef.current));
    const timer = setTimeout(() => setMinSplashElapsed(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setInteractionsDone(true);
    });
    return () => task.cancel();
  }, []);

  const waitOnboarding = Boolean(user && !onboardingStatusLoaded && !passwordRecoveryPending);
  const showingMainTabs = Boolean(
    user && onboardingStatusLoaded && onboardingCompleted && !passwordRecoveryPending,
  );
  const bootstrapDone = fontsLoaded && themeLoaded && !loading && !waitOnboarding;
  const destinationReady = !showingMainTabs || mainTabsReady;
  const visible = !(bootstrapDone && minSplashElapsed && interactionsDone && destinationReady);

  if (!visible) return null;

  return (
    <View style={styles.cover} pointerEvents="auto">
      <LaunchSplash showSubtitle={fontsLoaded} />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: v3DarkColors.bg,
    zIndex: 100000,
    elevation: 100000,
  },
});
