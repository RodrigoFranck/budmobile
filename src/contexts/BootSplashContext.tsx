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
import {
  bootMark,
  bootMarkOnce,
  isBootSplashDismissed,
  markBootSplashDismissed,
  shouldShowBootSplash,
} from '@/utils/bootTiming';

type BootSplashContextType = {
  mainTabsReady: boolean;
  setMainTabsReady: (ready: boolean) => void;
};

const BootSplashContext = createContext<BootSplashContextType | undefined>(undefined);

export function BootSplashProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mainTabsReady, setMainTabsReadyState] = useState(false);
  const setMainTabsReady = useCallback((ready: boolean) => {
    setMainTabsReadyState((current) => {
      if (current === ready) return current;
      if (ready) {
        bootMarkOnce('main_tabs_ready');
      }
      return ready;
    });
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
  const lastVisibleRef = useRef(true);

  useEffect(() => {
    bootMarkOnce('splash_mounted');
    const minDurationMs = 400;
    const remaining = Math.max(0, minDurationMs - (Date.now() - splashStartMsRef.current));
    const timer = setTimeout(() => setMinSplashElapsed(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setInteractionsDone(true);
      bootMarkOnce('interactions_idle');
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (fontsLoaded) bootMarkOnce('fonts_loaded');
  }, [fontsLoaded]);

  useEffect(() => {
    if (themeLoaded) bootMarkOnce('theme_loaded');
  }, [themeLoaded]);

  useEffect(() => {
    if (!loading) bootMarkOnce('auth_session_ready', { hasUser: Boolean(user) });
  }, [loading, user]);

  useEffect(() => {
    if (onboardingStatusLoaded) {
      bootMarkOnce('onboarding_status_ready', {
        completed: onboardingCompleted,
      });
    }
  }, [onboardingCompleted, onboardingStatusLoaded]);

  const waitOnboarding = Boolean(user && !onboardingStatusLoaded && !passwordRecoveryPending);
  const showingMainTabs = Boolean(
    user && onboardingStatusLoaded && onboardingCompleted && !passwordRecoveryPending,
  );
  const bootstrapDone = fontsLoaded && themeLoaded && !loading && !waitOnboarding;
  // Home shell signals ready as soon as it mounts; secondary Home sections load after.
  const destinationReady = !showingMainTabs || mainTabsReady;
  const gatesReady = bootstrapDone && minSplashElapsed && interactionsDone && destinationReady;
  const visible = shouldShowBootSplash() && !gatesReady;

  useEffect(() => {
    if (visible === lastVisibleRef.current) return;
    lastVisibleRef.current = visible;
    if (visible) {
      bootMark('splash_visible', {
        fontsLoaded,
        themeLoaded,
        authLoading: loading,
        waitOnboarding,
        mainTabsReady,
        showingMainTabs,
      });
      return;
    }
    markBootSplashDismissed({
      fontsLoaded,
      themeLoaded,
      authLoading: loading,
      waitOnboarding,
      mainTabsReady,
      showingMainTabs,
    });
  }, [
    fontsLoaded,
    loading,
    mainTabsReady,
    showingMainTabs,
    themeLoaded,
    visible,
    waitOnboarding,
  ]);

  useEffect(() => {
    if (!visible || isBootSplashDismissed()) return;
    bootMark('splash_gate', {
      fontsLoaded,
      themeLoaded,
      authLoading: loading,
      waitOnboarding,
      minSplashElapsed,
      interactionsDone,
      mainTabsReady,
      showingMainTabs,
      bootstrapDone,
      destinationReady,
    });
  }, [
    bootstrapDone,
    destinationReady,
    fontsLoaded,
    interactionsDone,
    loading,
    mainTabsReady,
    minSplashElapsed,
    showingMainTabs,
    themeLoaded,
    visible,
    waitOnboarding,
  ]);

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
