import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Appearance,
  AppState,
  type AppStateStatus,
  type ColorSchemeName,
} from 'react-native';
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

function preferenceFromProfile(darkMode: boolean | null | undefined): ThemePreference {
  if (darkMode === true) return 'dark';
  if (darkMode === false) return 'light';
  return 'system';
}

function darkModeFromPreference(preference: ThemePreference): boolean | null {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return null;
}

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isPending, isFetched } = useAppProfileQuery();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);
  const [systemMode, setSystemMode] = useState<ThemeMode>(readSystemMode);

  useEffect(() => {
    const syncSystemMode = () => {
      setSystemMode(readSystemMode());
    };

    syncSystemMode();

    const appearanceSub = Appearance.addChangeListener(({ colorScheme: nextScheme }) => {
      setSystemMode(resolveSystemMode(nextScheme));
    });

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      syncSystemMode();
    });

    return () => {
      appearanceSub.remove();
      appStateSub.remove();
    };
  }, []);

  const resolvedMode: ThemeMode = preference === 'system' ? systemMode : preference;

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

    setPreferenceState(preferenceFromProfile(profile?.dark_mode));
    setLoaded(true);
  }, [user?.id, profile?.dark_mode, isPending, isFetched]);

  const setPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      setPreferenceState(nextPreference);
      if (!user?.id) return;
      try {
        const nextDark = darkModeFromPreference(nextPreference);
        const { error } = await supabase
          .from('profiles')
          .update({ dark_mode: nextDark })
          .eq('user_id', user.id);
        if (error) {
          setPreferenceState(preferenceFromProfile(profile?.dark_mode));
          appAlert({ title: 'Erro', message: 'Não foi possível salvar sua preferência de tema.' });
          return;
        }

        queryClient.setQueryData<AppProfile | null>(
          queryKeys.profile(user.id),
          (current) => (current ? { ...current, dark_mode: nextDark } : current),
        );
      } catch {
        setPreferenceState(preferenceFromProfile(profile?.dark_mode));
        appAlert({ title: 'Erro', message: 'Não foi possível salvar sua preferência de tema.' });
      }
    },
    [profile?.dark_mode, queryClient, user?.id],
  );

  const setMode = useCallback(
    async (nextMode: ThemeMode) => {
      await setPreference(nextMode);
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

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
