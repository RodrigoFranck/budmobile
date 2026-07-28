import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { useColorScheme } from 'nativewind';
import { appAlert } from '@/contexts/AppAlertContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

    let cancelled = false;
    setLoaded(false);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('dark_mode')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setPreferenceState('system');
        } else if (data?.dark_mode === true) {
          setPreferenceState('dark');
        } else {
          // null / false / missing → follow system (Appearance API).
          // Legacy DEFAULT false incorrectly forced light for every profile.
          setPreferenceState('system');
          if (data?.dark_mode === false) {
            void supabase
              .from('profiles')
              .update({ dark_mode: null })
              .eq('user_id', user.id);
          }
        }
      } catch {
        if (!cancelled) setPreferenceState('system');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const setPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      // Light is not persisted as an override — follow the device instead.
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
        }
      } catch {
        setPreferenceState((current) => (current === 'dark' ? 'system' : 'dark'));
        appAlert({ title: 'Erro', message: 'Não foi possível salvar sua preferência de tema.' });
      }
    },
    [user?.id],
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

