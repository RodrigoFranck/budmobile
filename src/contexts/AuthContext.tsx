import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/integrations/supabase/client';
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

    // Handle deep links for OAuth callback (iOS/Android)
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      // Ignore Expo development URLs - we only want app deep links
      if (url.startsWith('exp://')) {
        console.log('Ignoring Expo development URL');
        return;
      }
      
      // Check for OAuth errors in the callback
      if (url.includes('error=')) {
        const errorMatch = url.match(/error=([^&]+)/);
        const errorDescriptionMatch = url.match(/error_description=([^&]+)/);
        const error = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Erro desconhecido';
        const description = errorDescriptionMatch ? decodeURIComponent(errorDescriptionMatch[1]) : '';
        console.error('OAuth error:', error, description);
        
        // Show user-friendly error message
        if (error === 'server_error' || error === 'unexpected_failure') {
          console.error('OAuth server error - likely misconfiguration in Supabase Dashboard');
        }
        return;
      }
      
      // Check if it's an OAuth callback
      if (url.includes('#access_token=') || url.includes('?code=') || url.includes('access_token=') || url.includes('com.bud.app://')) {
        // Extract hash or query params from the URL
        try {
          // If URL contains hash fragment, Supabase needs to process it
          if (url.includes('#')) {
            const hash = url.split('#')[1];
            // Supabase will automatically process the session from the URL
            await supabase.auth.getSession();
          } else if (url.includes('?')) {
            // Handle query params
            await supabase.auth.getSession();
          } else {
            // Just check session
            await supabase.auth.getSession();
          }
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
        }
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
      // The web app's mobile callback page receives tokens from Supabase,
      // then redirects to the app's deep link scheme so the browser closes.
      const mobileCallbackUrl = 'https://falecombud.com.br/auth/mobile-callback';

      // IMPORTANT: Must be a full URL (with ://) so Expo can extract the scheme.
      // Passing just 'com.bud.app' without :// makes URL(string:).scheme return nil,
      // which prevents ASWebAuthenticationSession from detecting the callback redirect.
      const appCallbackUrl = 'com.bud.app://auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: mobileCallbackUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      // On mobile, open the OAuth URL in browser
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          appCallbackUrl // Full URL so iOS extracts 'com.bud.app' as the callback scheme
        );

        // Handle the result
        if (result.type === 'success' && result.url) {
          console.log('OAuth callback URL:', result.url);

          // Extract tokens from the hash fragment
          // URL format: com.bud.app://auth/callback#access_token=xxx&refresh_token=xxx&...
          const hashPart = result.url.split('#')[1];
          if (hashPart) {
            const params = new URLSearchParams(hashPart);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              // Set the session manually with the extracted tokens
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error('Error setting session:', sessionError);
                return { error: new Error(sessionError.message) };
              }
            }
          }

          return { error: null };
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          return { error: new Error('Login cancelado pelo usuário') };
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

