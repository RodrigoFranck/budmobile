import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

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
      signOut,
      refreshOnboardingStatus
    };
  }, [session, user, loading, onboardingCompleted, signUp, signIn, signOut, refreshOnboardingStatus]);

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

