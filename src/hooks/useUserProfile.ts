import { useState, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useAppProfileQuery } from "@/hooks/useAppProfileQuery";
import type { Json } from "@/integrations/supabase/types";

/**
 * Dados do perfil do usuário
 *
 * IMPORTANTE: Contém dados sensíveis (PII) protegidos por RLS.
 * Acessível apenas pelo próprio usuário via auth.uid() = id.
 * Campos sensíveis: name, age, gender, relationship, hobbies, occupation
 */
export interface UserProfile {
  name: string | null;
  initial_thoughts: string | null;
  conversation_goal: string | null;
  occupation: string | null;
  age: string | null;
  gender: string | null;
  relationship: string | null;
  hobbies: string[] | null;
  app_mode: string | null;
  organization_id: string | null;
  selected_voice: string | null;
  v3_preferences: Json | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const { data, isLoading, isFetching } = useAppProfileQuery();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    if (!data) {
      return;
    }

    setProfile({
      name: data.name,
      initial_thoughts: data.initial_thoughts,
      conversation_goal: data.conversation_goal,
      occupation: data.occupation,
      age: data.age,
      gender: data.gender,
      relationship: data.relationship,
      hobbies: data.hobbies,
      app_mode: data.app_mode ?? 'b2c',
      organization_id: data.organization_id ?? null,
      selected_voice: data.selected_voice ?? null,
      v3_preferences: data.v3_preferences ?? null,
    });
  }, [data, user?.id]);

  return {
    profile,
    loading: !!user?.id && (isLoading || (isFetching && !profile)),
  };
}
