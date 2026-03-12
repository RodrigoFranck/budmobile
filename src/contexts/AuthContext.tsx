import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/integrations/supabase/client';
import { MOBILE_OAUTH_WEB_CALLBACK } from '@/constants/auth';
import { z } from 'zod';

// Complete OAuth session in browser
WebBrowser.maybeCompleteAuthSession();

// Validation schemas
const emailSchema = z.string().email("Email inválido").max(255, "Email muito longo");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");
const nameSchema = z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo");

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to normalize onboarding_completed to strict boolean
function normalizeOnboardingCompleted(value: unknown): boolean {
  // Handle all possible types and convert to strict boolean
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  // Default to false for any other value (false, 'false', 0, '0', null, undefined, etc.)
  return false;
}

// Helper function to ensure strict boolean - never returns string
function ensureStrictBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);

  // Função para atualizar status de onboarding
  const refreshOnboardingStatus = async () => {
    if (!user?.id) {
      setOnboardingCompleted(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    
    // Ensure strict boolean conversion (Supabase may return as string in some cases)
    const completed = normalizeOnboardingCompleted(data?.onboarding_completed);
    setOnboardingCompleted(completed);
  };

  // Carrega status de onboarding do usuário
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.id) {
        setOnboardingCompleted(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        // Ensure strict boolean conversion (Supabase may return as string in some cases)
        const completed = normalizeOnboardingCompleted(data.onboarding_completed);
        setOnboardingCompleted(completed);
      } else {
        setOnboardingCompleted(false);
      }
    };

    loadUserPreferences();
  }, [user?.id]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session - COM TRATAMENTO DE ERRO
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        // Se houver erro, limpa sessão e continua
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      })
      .catch((error) => {
        // Fallback para qualquer erro inesperado
        console.error('Unexpected auth error:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const applySessionFromOAuthUrl = async (url: string): Promise<{ error: Error | null }> => {
      if (!url.includes('access_token') && !url.includes('error=')) {
        return { error: null };
      }
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) {
        return { error: null };
      }
      const fragment = url.slice(hashIndex + 1);
      const params = new URLSearchParams(fragment);
      const errorParam = params.get('error');
      const errorDescription = params.get('error_description');
      if (errorParam) {
        return {
          error: new Error(
            errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : errorParam
          ),
        };
      }
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) {
        return { error: null };
      }
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    };

    const handleDeepLink = async (url: string) => {
      if (!url.includes('auth/callback') && !url.includes('access_token')) {
        return;
      }
      try {
        const { error } = await applySessionFromOAuthUrl(url);
        if (error) {
          console.error('OAuth callback error:', error);
        }
      } catch (e) {
        console.error('Error processing OAuth callback:', e);
      }
    };

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    }).catch(() => {
      // Ignore errors
    });

    // Timeout de segurança - se após 5 segundos ainda não resolveu, para de mostrar loading
    const timeoutId = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn('Auth loading timeout - forcing completion');
          return false;
        }
        return current;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
      clearTimeout(timeoutId);
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);
      nameSchema.parse(name);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: new Error(error.issues[0]?.message || 'Erro de validação') };
      }
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: new Error(error.issues[0]?.message || 'Erro de validação') };
      }
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      /**
       * Alinhado ao budmind: redirect HTTPS para /auth/mobile-callback, que repassa
       * o hash para com.bud.app://auth/callback (MobileAuthCallback.tsx).
       */
      const redirectTo = MOBILE_OAUTH_WEB_CALLBACK;
      const appCallbackUrl = Linking.createURL('auth/callback', {
        scheme: 'com.bud.app',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (Platform.OS === 'web') {
        if (data?.url && typeof globalThis !== 'undefined' && 'location' in globalThis) {
          (globalThis as unknown as { location: { href: string } }).location.href = data.url;
        }
        return { error: null };
      }

      if (!data?.url) {
        return { error: new Error('URL de OAuth não retornada') };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, appCallbackUrl);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { error: new Error('Login cancelado pelo usuário') };
      }

      if (result.type === 'success' && result.url) {
        const hashIndex = result.url.indexOf('#');
        if (hashIndex !== -1) {
          const fragment = result.url.slice(hashIndex + 1);
          const params = new URLSearchParams(fragment);
          const errorParam = params.get('error');
          const errorDescription = params.get('error_description');
          if (errorParam) {
            return {
              error: new Error(
                errorDescription
                  ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
                  : errorParam
              ),
            };
          }
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) {
              return { error: new Error(sessionError.message) };
            }
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Ensure all values are properly typed with useMemo to prevent re-creation
  // Always normalize to ensure strict boolean, never string or null
  const contextValue: AuthContextType = useMemo(() => {
    // Use helper function to ensure strict boolean - handles all edge cases
    const normalizedOnboardingCompleted: boolean = ensureStrictBoolean(onboardingCompleted);
    const normalizedLoading: boolean = ensureStrictBoolean(loading);

    return {
      session,
      user,
      loading: normalizedLoading,
      onboardingCompleted: normalizedOnboardingCompleted,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshOnboardingStatus
    };
  }, [session, user, loading, onboardingCompleted, signUp, signIn, signInWithGoogle, signOut, refreshOnboardingStatus]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

