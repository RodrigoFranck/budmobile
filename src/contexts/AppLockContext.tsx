import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, BackHandler, Platform, StyleSheet, View, type AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SplashScreen } from '@/components/SplashScreen';
import { BudButton } from '@/components/v3';
import { appAlert } from '@/contexts/AppAlertContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { parseV3Preferences } from '@/hooks/useV3Preferences';
import {
  authenticateWithDevice,
  readAppLockFlag,
  writeAppLockFlag,
} from '@/services/appLock';

type AppLockContextType = {
  enabled: boolean;
  ready: boolean;
  busy: boolean;
  setEnabled: (next: boolean) => Promise<boolean>;
};

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

const UNAVAILABLE_ALERT = {
  title: 'Não foi possível ativar',
  message:
    'Configure o Face ID, a digital ou um código de bloqueio nas configurações do telefone para usar o bloqueio do app.',
};

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { loaded: themeLoaded } = useTheme();
  const { data: profile } = useAppProfileQuery();
  const [ready, setReady] = useState(Platform.OS === 'web');
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const enabledRef = useRef(false);
  const lockedRef = useRef(false);
  const hasLocalFlagRef = useRef(Platform.OS === 'web');
  const authenticatingRef = useRef(false);

  const unlock = useCallback(async () => {
    if (!enabledRef.current || authenticatingRef.current) return false;
    authenticatingRef.current = true;
    setBusy(true);
    try {
      await wait(150);
      const result = await authenticateWithDevice('Desbloqueie o Bud');
      if (result.ok) {
        lockedRef.current = false;
        setLocked(false);
        return true;
      }
      lockedRef.current = true;
      setLocked(true);
      return false;
    } finally {
      authenticatingRef.current = false;
      setBusy(false);
    }
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    if (next === enabledRef.current) return true;
    if (authenticatingRef.current) return false;

    authenticatingRef.current = true;
    setBusy(true);
    try {
      const result = await authenticateWithDevice(
        next
          ? 'Confirme sua identidade para ativar o bloqueio do app'
          : 'Confirme sua identidade para desativar o bloqueio do app',
      );
      if (!result.ok) {
        if (result.unavailable) {
          appAlert(UNAVAILABLE_ALERT);
        }
        return false;
      }

      await writeAppLockFlag(next);
      hasLocalFlagRef.current = true;
      enabledRef.current = next;
      lockedRef.current = false;
      setEnabledState(next);
      setLocked(false);
      return true;
    } finally {
      authenticatingRef.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    void readAppLockFlag().then((flag) => {
      if (cancelled) return;
      const on = flag === true;
      hasLocalFlagRef.current = flag !== null;
      enabledRef.current = on;
      lockedRef.current = on;
      setEnabledState(on);
      setLocked(on);
      setReady(true);
      if (on && AppState.currentState === 'active') {
        void unlock();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [unlock]);

  useEffect(() => {
    if (Platform.OS === 'web' || !profile || hasLocalFlagRef.current) return;
    const profileEnabled = Boolean(parseV3Preferences(profile.v3_preferences).appLock);
    if (!profileEnabled) return;
    hasLocalFlagRef.current = true;
    enabledRef.current = true;
    lockedRef.current = true;
    void writeAppLockFlag(true);
    setEnabledState(true);
    setLocked(true);
    if (AppState.currentState === 'active') {
      void unlock();
    }
  }, [profile, unlock]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const onChange = (next: AppStateStatus) => {
      if (!enabledRef.current) return;
      if (next === 'background' || next === 'inactive') {
        if (!authenticatingRef.current) {
          lockedRef.current = true;
          setLocked(true);
        }
        return;
      }
      if (next === 'active' && lockedRef.current) {
        void unlock();
      }
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [unlock]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (ready && !(enabled && locked)) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [enabled, locked, ready]);

  const value = useMemo(
    () => ({ enabled, ready, busy, setEnabled }),
    [enabled, ready, busy, setEnabled],
  );

  const showLockScreen = !ready || (enabled && locked);

  return (
    <AppLockContext.Provider value={value}>
      {children}
      {showLockScreen ? (
        <View
          style={styles.cover}
          pointerEvents="auto"
          accessibilityViewIsModal
          importantForAccessibility="yes"
        >
          {ready && themeLoaded ? (
            <SplashScreen visible />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#171310' }]} />
          )}
          {ready ? (
            <View style={[styles.unlockButton, { bottom: insets.bottom + 16 }]}>
              <BudButton
                label="Desbloquear"
                onPress={() => void unlock()}
                loading={busy}
                variant="accent"
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </AppLockContext.Provider>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
  unlockButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 10000,
  },
});

export function useAppLock(): AppLockContextType {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
