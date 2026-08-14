import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Appearance,
  AppState,
  View,
  type AppStateStatus,
  type ColorSchemeName,
} from 'react-native';
import { colorScheme as nativeWindColorScheme, vars } from 'nativewind';
import { useQueryClient } from '@tanstack/react-query';

import { appAlert } from '@/contexts/AppAlertContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { queryKeys } from '@/lib/queryKeys';
import type { AppProfile } from '@/services/profileQuery';

type ThemeMode = 'light' | 'dark';
type ThemePreference = ThemeMode | 'system';

function resolveSystemMode(scheme: ColorSchemeName): ThemeMode {
  return scheme === 'dark' ? 'dark' : 'light';
}

function readSystemMode(): ThemeMode {
  return resolveSystemMode(Appearance.getColorScheme());
}

function applyNativeColorScheme(next: ThemePreference) {
  if (next === 'dark') {
    nativeWindColorScheme.set('dark');
    return;
  }

  nativeWindColorScheme.set('system');
  Appearance.setColorScheme(null);
}

const lightCssVars = vars({
  '--background': '30 38% 95%',
  '--foreground': '20 16% 10%',
  '--foreground-muted': '20 12% 28%',
  '--card': '0 0% 100%',
  '--card-foreground': '20 16% 10%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '20 16% 10%',
  '--primary': '177 45% 33%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '24 24% 90%',
  '--secondary-foreground': '20 16% 10%',
  '--muted': '24 24% 90%',
  '--muted-foreground': '20 12% 32%',
  '--accent': '167 40% 82%',
  '--accent-foreground': '20 16% 10%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '0 0% 100%',
  '--border': '20 10% 82%',
  '--input': '0 0% 100%',
  '--ring': '20 12% 48%',
  '--chat-user-bg': '30 22% 92%',
  '--chat-assistant-bg': '30 38% 95%',
});

const darkCssVars = vars({
  '--background': '0 0% 11.8%',
  '--foreground': '0 0% 100%',
  '--foreground-muted': '0 0% 92%',
  '--card': '0 0% 16.5%',
  '--card-foreground': '0 0% 100%',
  '--popover': '0 0% 16.5%',
  '--popover-foreground': '0 0% 100%',
  '--primary': '0 0% 100%',
  '--primary-foreground': '0 0% 11.8%',
  '--secondary': '0 0% 18.4%',
  '--secondary-foreground': '0 0% 100%',
  '--muted': '0 0% 16.5%',
  '--muted-foreground': '0 0% 71%',
  '--accent': '167 40% 82%',
  '--accent-foreground': '0 0% 11.8%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '0 0% 100%',
  '--border': '0 0% 20%',
  '--input': '0 0% 16.5%',
  '--ring': '0 0% 71%',
  '--chat-user-bg': '0 0% 14%',
  '--chat-assistant-bg': '0 0% 11.8%',
});

interface ThemeContextType {
  mode: ThemeMode;
  preference: ThemePreference;
  isDarkMode: boolean;
  loaded: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
  setLightMode: () => Promise<void>;
  setDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeRootStyle = { flex: 1 } as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isPending, isFetched } = useAppProfileQuery();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);
  const [systemMode, setSystemMode] = useState<ThemeMode>(readSystemMode);
  const preferenceRef = useRef(preference);
  preferenceRef.current = preference;

  useEffect(() => {
    const syncSystemMode = () => {
      if (preferenceRef.current === 'dark') return;
      setSystemMode(readSystemMode());
    };

    syncSystemMode();
    const bootTimer = setTimeout(syncSystemMode, 80);

    const appearanceSub = Appearance.addChangeListener(({ colorScheme: nextScheme }) => {
      if (preferenceRef.current === 'dark') return;
      setSystemMode(resolveSystemMode(nextScheme));
    });

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      syncSystemMode();
      requestAnimationFrame(syncSystemMode);
    });

    return () => {
      clearTimeout(bootTimer);
      appearanceSub.remove();
      appStateSub.remove();
    };
  }, []);

  const resolvedMode: ThemeMode = preference === 'dark' ? 'dark' : systemMode;

  useEffect(() => {
    applyNativeColorScheme(preference);

    if (preference !== 'system') return;

    const frame = requestAnimationFrame(() => {
      applyNativeColorScheme('system');
      setSystemMode(readSystemMode());
    });

    return () => cancelAnimationFrame(frame);
  }, [preference]);

  useEffect(() => {
    if (!user?.id) {
      setPreferenceState('system');
      setLoaded(true);
      return;
    }

    if (isPending && !isFetched) {
      setLoaded(false);
      return;
    }

    if (profile?.dark_mode === true) {
      setPreferenceState('dark');
    } else {
      setPreferenceState('system');
      if (profile?.dark_mode === false) {
        void supabase
          .from('profiles')
          .update({ dark_mode: null })
          .eq('user_id', user.id)
          .then(() => {
            queryClient.setQueryData<AppProfile | null>(
              queryKeys.profile(user.id),
              (current) => (current ? { ...current, dark_mode: null } : current),
            );
          });
      }
    }
    setLoaded(true);
  }, [user?.id, profile?.dark_mode, isPending, isFetched, queryClient]);

  const setPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      const normalized: ThemePreference =
        nextPreference === 'light' ? 'system' : nextPreference;
      setPreferenceState(normalized);
      applyNativeColorScheme(normalized);
      if (normalized === 'system') {
        setSystemMode(readSystemMode());
      }
      if (!user?.id) return;
      try {
        const nextDark = normalized === 'dark' ? true : null;
        const { error } = await supabase
          .from('profiles')
          .update({ dark_mode: nextDark })
          .eq('user_id', user.id);
        if (error) {
          setPreferenceState((current) => (current === 'dark' ? 'system' : 'dark'));
          appAlert({ title: 'Erro', message: 'Não foi possível salvar sua preferência de tema.' });
          return;
        }

        queryClient.setQueryData<AppProfile | null>(
          queryKeys.profile(user.id),
          (current) => (current ? { ...current, dark_mode: nextDark } : current),
        );
      } catch {
        setPreferenceState((current) => (current === 'dark' ? 'system' : 'dark'));
        appAlert({ title: 'Erro', message: 'Não foi possível salvar sua preferência de tema.' });
      }
    },
    [queryClient, user?.id],
  );

  const setMode = useCallback(
    async (nextMode: ThemeMode) => {
      await setPreference(nextMode === 'light' ? 'system' : nextMode);
    },
    [setPreference],
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      mode: resolvedMode,
      preference,
      isDarkMode: resolvedMode === 'dark',
      loaded,
      setMode,
      setPreference,
      setLightMode: () => setMode('light'),
      setDarkMode: () => setMode('dark'),
    }),
    [loaded, preference, resolvedMode, setMode, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[themeRootStyle, resolvedMode === 'dark' ? darkCssVars : lightCssVars]}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
