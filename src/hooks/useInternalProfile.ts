import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EmotionalPattern {
  pattern: string;
  frequency: string;
  context: string;
}

export interface RecurringTheme {
  theme: string;
  importance: string;
  evolution: string;
}

export interface CommunicationStyle {
  preferred_tone?: string;
  response_length?: string;
  needs_validation?: boolean;
  prefers_questions?: boolean;
  other_notes?: string;
}

export interface BlindSpot {
  area: string;
  approach: string;
}

export interface EffectiveApproach {
  approach: string;
  context: string;
}

export interface InternalProfile {
  emotional_patterns: EmotionalPattern[];
  recurring_themes: RecurringTheme[];
  communication_style: CommunicationStyle;
  blind_spots: BlindSpot[];
  journey_summary: string | null;
  effective_approaches: EffectiveApproach[];
  conversations_analyzed: number;
  last_consolidated_at: string | null;
}

export function useInternalProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<InternalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("user_internal_profile")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching internal profile:", error);
        }

        if (data) {
          setProfile({
            emotional_patterns: (data.emotional_patterns as unknown as EmotionalPattern[]) || [],
            recurring_themes: (data.recurring_themes as unknown as RecurringTheme[]) || [],
            communication_style: (data.communication_style as unknown as CommunicationStyle) || {},
            blind_spots: (data.blind_spots as unknown as BlindSpot[]) || [],
            journey_summary: data.journey_summary,
            effective_approaches: (data.effective_approaches as unknown as EffectiveApproach[]) || [],
            conversations_analyzed: data.conversations_analyzed || 0,
            last_consolidated_at: data.last_consolidated_at,
          });
        }
      } catch (error) {
        console.error("Error fetching internal profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
}

