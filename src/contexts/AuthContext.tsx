import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { CodedError } from 'expo-modules-core';
import { supabase } from '@/integrations/supabase/client';
import { unregisterPushNotificationsForUser } from '@/hooks/usePushNotifications';
import { MOBILE_OAUTH_WEB_CALLBACK } from '@/constants/auth';
import { z } from 'zod';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

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
  onboardingStatusLoaded: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: Error | null; userId: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  isAppleSignInAvailable: boolean;
  deleteAccount: () => Promise<{ error: Error | null }>;
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

function getAppleAuthErrorCode(error: unknown): string | undefined {
  if (error instanceof CodedError) {
    return error.code;
  }
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
}

function isAppleAuthCanceled(error: unknown): boolean {
  const code = getAppleAuthErrorCode(error);
  if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_REQUEST_UNKNOWN') {
    return true;
  }
  if (error instanceof Error) {
    if (error.message.includes('user canceled the authorization attempt')) {
      return true;
    }
  }
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [onboardingStatusLoaded, setOnboardingStatusLoaded] = useState(false);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    AppleAuthentication.isAvailableAsync()
      .then(setIsAppleSignInAvailable)
      .catch(() => setIsAppleSignInAvailable(false));
  }, []);

  useLayoutEffect(() => {
    if (user?.id) {
      setOnboardingStatusLoaded(false);
    }
  }, [user?.id]);

  // Função para atualizar status de onboarding
  const refreshOnboardingStatus = async () => {
    if (!user?.id) {
      setOnboardingCompleted(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();
    
    // Ensure strict boolean conversion (Supabase may return as string in some cases)
    const completed = normalizeOnboardingCompleted(data?.onboarding_completed);
    setOnboardingCompleted(completed);
  };

  // Carrega status de onboarding do usuário
  useEffect(() => {
    if (!user?.id) {
      setOnboardingCompleted(false);
      setOnboardingStatusLoaded(true);
      return;
    }

    let cancelled = false;
    setOnboardingStatusLoaded(false);

    const loadUserPreferences = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (data) {
        const completed = normalizeOnboardingCompleted(data.onboarding_completed);
        setOnboardingCompleted(completed);
      } else {
        setOnboardingCompleted(false);
      }
      setOnboardingStatusLoaded(true);
    };

    loadUserPreferences();
    return () => {
      cancelled = true;
    };
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message), userId: null };
      }

      return { error: null, userId: data.user?.id ?? null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          error: new Error(error.issues[0]?.message || 'Erro de validação'),
          userId: null,
        };
      }
      return { error: error as Error, userId: null };
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

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      return { error: new Error('Entrar com Apple está disponível apenas no iOS') };
    }

    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return { error: new Error('Entrar com Apple não está disponível neste dispositivo') };
      }

      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        return { error: new Error('Token Apple não recebido') };
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (signInError) {
        console.error('Apple signInWithIdToken error:', signInError.message);
        return { error: new Error(signInError.message) };
      }

      if (credential.fullName && signInData?.user?.id) {
        const givenName = credential.fullName.givenName?.trim() ?? '';
        const familyName = credential.fullName.familyName?.trim() ?? '';
        const fullName = [givenName, familyName].filter(Boolean).join(' ').trim();

        if (fullName) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ user_id: signInData.user.id, name: fullName }, { onConflict: 'user_id' });

          if (profileError) {
            console.warn('Apple sign-in profile upsert failed:', profileError.message);
          }
        }
      }

      return { error: null };
    } catch (error) {
      if (isAppleAuthCanceled(error)) {
        return { error: null };
      }
      console.error('Apple sign-in unexpected error:', error);
      return { error: error instanceof Error ? error : new Error('Erro ao entrar com Apple') };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const appCallbackUrl = Linking.createURL('auth/callback', {
        scheme: 'com.bud.app',
      });

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: MOBILE_OAUTH_WEB_CALLBACK,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: hashedNonce,
        prompt: 'select_account',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, appCallbackUrl);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { error: new Error('Login cancelado pelo usuário') };
      }

      if (result.type === 'success' && result.url) {
        const hashIndex = result.url.indexOf('#');
        if (hashIndex === -1) {
          return { error: new Error('Resposta do Google sem tokens') };
        }

        const fragment = result.url.slice(hashIndex + 1);
        const responseParams = new URLSearchParams(fragment);

        const errorParam = responseParams.get('error');
        if (errorParam) {
          const errorDescription = responseParams.get('error_description');
          return {
            error: new Error(
              errorDescription
                ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
                : errorParam
            ),
          };
        }

        const idToken = responseParams.get('id_token');
        if (!idToken) {
          return { error: new Error('ID token não recebido do Google') };
        }

        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          nonce: rawNonce,
        });

        if (signInError) {
          return { error: new Error(signInError.message) };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteAccount = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        return { error: new Error('Sessão inválida. Faça login novamente.') };
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        let message = error.message;

        const errorContext =
          typeof error === 'object' &&
          error !== null &&
          'context' in error &&
          error.context instanceof Response
            ? error.context
            : null;

        if (errorContext) {
          try {
            const body = (await errorContext.json()) as { error?: string; message?: string; code?: string };
            if (body.error) {
              message = body.error;
            } else if (body.code === 'NOT_FOUND') {
              message = 'Serviço de exclusão indisponível. Tente novamente mais tarde.';
            } else if (body.message) {
              message = body.message;
            }
          } catch {
            // keep default message
          }
        }

        return { error: new Error(message) };
      }

      if (data?.error) {
        return { error: new Error(String(data.error)) };
      }

      setSession(null);
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    const userId = user?.id;

    try {
      if (userId) {
        await unregisterPushNotificationsForUser(userId);
      }

      const { error } = await supabase.auth.signOut({ scope: 'global' });

      // Se a sessão já não existir mais, tratamos como "já está deslogado"
      if (error) {
        const message = error.message ?? '';
        const name = (error as { name?: string }).name ?? '';
        const status = (error as { status?: number }).status;

        const isSessionMissingError =
          message.includes('session_not_found') ||
          message.includes('Auth session missing') ||
          name === 'AuthSessionMissingError' ||
          status === 400;

        if (!isSessionMissingError) {
          console.error('Error signing out:', error);
        }
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    } finally {
      setSession(null);
      setUser(null);
    }
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
      onboardingStatusLoaded,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      isAppleSignInAvailable,
      deleteAccount,
      signOut,
      refreshOnboardingStatus
    };
  }, [session, user, loading, onboardingCompleted, onboardingStatusLoaded, isAppleSignInAvailable, signUp, signIn, signInWithGoogle, signInWithApple, deleteAccount, signOut, refreshOnboardingStatus]);

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

