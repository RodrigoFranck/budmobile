import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, initial_thoughts, conversation_goal, occupation, age, gender, relationship, hobbies")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading };
}

