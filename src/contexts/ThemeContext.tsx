import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useQueryClient } from '@tanstack/react-query';

import { appAlert } from '@/contexts/AppAlertContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { queryKeys } from '@/lib/queryKeys';
import type { AppProfile } from '@/services/profileQuery';

type ThemeMode = 'light' | 'dark';
type ThemePreference = ThemeMode | 'system';

function resolveSystemMode(scheme: string | null | undefined): ThemeMode {
  return scheme === 'light' ? 'light' : 'dark';
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
  const { colorScheme, setColorScheme } = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);
  const [systemMode, setSystemMode] = useState<ThemeMode>(() =>
    resolveSystemMode(Appearance.getColorScheme()),
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: nextScheme }) => {
      setSystemMode(resolveSystemMode(nextScheme));
    });
    return () => subscription.remove();
  }, []);

  const resolvedMode: ThemeMode = useMemo(() => {
    if (preference !== 'system') {
      return preference;
    }
    if (colorScheme === 'light' || colorScheme === 'dark') {
      return colorScheme;
    }
    return systemMode;
  }, [colorScheme, preference, systemMode]);

  useEffect(() => {
    if (preference === 'system') {
      setColorScheme('system');
      return;
    }
    setColorScheme(preference);
  }, [preference, setColorScheme]);

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

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
