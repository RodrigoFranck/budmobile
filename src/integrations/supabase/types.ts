export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      clinical_knowledge: {
        Row: {
          category: string
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          source_file: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          chunk_index?: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          source_file?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          source_file?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_analysis: {
        Row: {
          behavioral_analysis: Json | null
          created_at: string
          id: string
          session_id: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          behavioral_analysis?: Json | null
          created_at?: string
          id?: string
          session_id: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          behavioral_analysis?: Json | null
          created_at?: string
          id?: string
          session_id?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          conversation_date: string
          created_at: string
          id: string
          is_archived: boolean
          is_consolidated: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_date?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_consolidated?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_date?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_consolidated?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_analysis: {
        Row: {
          behavioral_analysis: Json | null
          created_at: string | null
          date: string
          id: string
          summary: string | null
          transcript: Json | null
          updated_at: string | null
          user_id: string
          well_being_score: number | null
        }
        Insert: {
          behavioral_analysis?: Json | null
          created_at?: string | null
          date: string
          id?: string
          summary?: string | null
          transcript?: Json | null
          updated_at?: string | null
          user_id: string
          well_being_score?: number | null
        }
        Update: {
          behavioral_analysis?: Json | null
          created_at?: string | null
          date?: string
          id?: string
          summary?: string | null
          transcript?: Json | null
          updated_at?: string | null
          user_id?: string
          well_being_score?: number | null
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          ai_report: Json | null
          checkin_date: string
          checkin_type: string
          created_at: string
          feedback_type: string | null
          id: string
          responses: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_report?: Json | null
          checkin_date?: string
          checkin_type: string
          created_at?: string
          feedback_type?: string | null
          id?: string
          responses?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_report?: Json | null
          checkin_date?: string
          checkin_type?: string
          created_at?: string
          feedback_type?: string | null
          id?: string
          responses?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emotion_snapshots: {
        Row: {
          confidence: number
          context: string | null
          created_at: string | null
          emotion: string
          id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          confidence: number
          context?: string | null
          created_at?: string | null
          emotion: string
          id?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          confidence?: number
          context?: string | null
          created_at?: string | null
          emotion?: string
          id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      insight_unlock_rules: {
        Row: {
          count_scope: string
          created_at: string
          display_order: number
          insight_type: string
          is_active: boolean
          locked_description: string
          locked_title: string
          required_conversations: number
          updated_at: string
        }
        Insert: {
          count_scope?: string
          created_at?: string
          display_order?: number
          insight_type: string
          is_active?: boolean
          locked_description: string
          locked_title: string
          required_conversations?: number
          updated_at?: string
        }
        Update: {
          count_scope?: string
          created_at?: string
          display_order?: number
          insight_type?: string
          is_active?: boolean
          locked_description?: string
          locked_title?: string
          required_conversations?: number
          updated_at?: string
        }
        Relationships: []
      }
      legacy_conversation_logs: {
        Row: {
          conversation_type: string | null
          created_at: string
          id: string
          is_user: boolean
          message: string
          session_id: string | null
          subagent_context: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string
          id?: string
          is_user: boolean
          message: string
          session_id?: string | null
          subagent_context?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          conversation_type?: string | null
          created_at?: string
          id?: string
          is_user?: boolean
          message?: string
          session_id?: string | null
          subagent_context?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          body: string
          dedupe_key: string
          id: string
          notification_type: string
          sent_at: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          dedupe_key: string
          id?: string
          notification_type: string
          sent_at?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          dedupe_key?: string
          id?: string
          notification_type?: string
          sent_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          company_name: string | null
          conversation_goal: string | null
          cpf: string | null
          created_at: string
          dark_mode: boolean | null
          department: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          has_seen_onboarding_modal: boolean | null
          hire_date: string | null
          hobbies: string[] | null
          id: string
          initial_thoughts: string | null
          last_name: string | null
          location_city: string | null
          location_state: string | null
          name: string | null
          notification_daily_time: string
          occupation: string | null
          onboarding_completed: boolean | null
          phone: string | null
          position: string | null
          push_notifications_enabled: boolean
          relationship: string | null
          state: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          company_name?: string | null
          conversation_goal?: string | null
          cpf?: string | null
          created_at?: string
          dark_mode?: boolean | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          has_seen_onboarding_modal?: boolean | null
          hire_date?: string | null
          hobbies?: string[] | null
          id?: string
          initial_thoughts?: string | null
          last_name?: string | null
          location_city?: string | null
          location_state?: string | null
          name?: string | null
          notification_daily_time?: string
          occupation?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          position?: string | null
          push_notifications_enabled?: boolean
          relationship?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          company_name?: string | null
          conversation_goal?: string | null
          cpf?: string | null
          created_at?: string
          dark_mode?: boolean | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          has_seen_onboarding_modal?: boolean | null
          hire_date?: string | null
          hobbies?: string[] | null
          id?: string
          initial_thoughts?: string | null
          last_name?: string | null
          location_city?: string | null
          location_state?: string | null
          name?: string | null
          notification_daily_time?: string
          occupation?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          position?: string | null
          push_notifications_enabled?: boolean
          relationship?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      psychological_assessments: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          responses: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          responses?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          responses?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          expo_push_token: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_emotion_preferences: {
        Row: {
          auto_start_in_chat: boolean | null
          created_at: string | null
          tracking_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_start_in_chat?: boolean | null
          created_at?: string | null
          tracking_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_start_in_chat?: boolean | null
          created_at?: string | null
          tracking_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      insight_unlock_rules: {
        Row: {
          count_scope: string
          created_at: string
          display_order: number
          insight_type: string
          is_active: boolean
          locked_description: string
          locked_title: string
          required_conversations: number
          updated_at: string
        }
        Insert: {
          count_scope?: string
          created_at?: string
          display_order?: number
          insight_type: string
          is_active?: boolean
          locked_description: string
          locked_title: string
          required_conversations?: number
          updated_at?: string
        }
        Update: {
          count_scope?: string
          created_at?: string
          display_order?: number
          insight_type?: string
          is_active?: boolean
          locked_description?: string
          locked_title?: string
          required_conversations?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_insights: {
        Row: {
          content_json: Json | null
          context_summary: string | null
          conversation_id: string | null
          created_at: string | null
          cycle_conversation_count: number | null
          description: string
          generated_at: string | null
          id: string
          insight_date: string | null
          insight_type: string
          internal_context: string | null
          locked: boolean | null
          remaining: number | null
          title: string
          updated_at: string | null
          user_id: string
          week_start: string | null
        }
        Insert: {
          content_json?: Json | null
          context_summary?: string | null
          conversation_id?: string | null
          created_at?: string | null
          cycle_conversation_count?: number | null
          description: string
          generated_at?: string | null
          id?: string
          insight_date?: string | null
          insight_type: string
          internal_context?: string | null
          locked?: boolean | null
          remaining?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          week_start?: string | null
        }
        Update: {
          content_json?: Json | null
          context_summary?: string | null
          conversation_id?: string | null
          created_at?: string | null
          cycle_conversation_count?: number | null
          description?: string
          generated_at?: string | null
          id?: string
          insight_date?: string | null
          insight_type?: string
          internal_context?: string | null
          locked?: boolean | null
          remaining?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_insights_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_internal_profile: {
        Row: {
          blind_spots: Json
          communication_style: Json
          conversations_analyzed: number
          created_at: string
          effective_approaches: Json
          emotional_patterns: Json
          id: string
          journey_summary: string | null
          last_consolidated_at: string | null
          recurring_themes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          blind_spots?: Json
          communication_style?: Json
          conversations_analyzed?: number
          created_at?: string
          effective_approaches?: Json
          emotional_patterns?: Json
          id?: string
          journey_summary?: string | null
          last_consolidated_at?: string | null
          recurring_themes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          blind_spots?: Json
          communication_style?: Json
          conversations_analyzed?: number
          created_at?: string
          effective_approaches?: Json
          emotional_patterns?: Json
          id?: string
          journey_summary?: string | null
          last_consolidated_at?: string | null
          recurring_themes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ocean_profile: {
        Row: {
          agreeableness_confidence: string | null
          agreeableness_score: number | null
          conscientiousness_confidence: string | null
          conscientiousness_score: number | null
          created_at: string | null
          extraversion_confidence: string | null
          extraversion_score: number | null
          id: string
          last_updated: string | null
          neuroticism_confidence: string | null
          neuroticism_score: number | null
          onboarding_completed_at: string | null
          openness_confidence: string | null
          openness_score: number | null
          recommended_subagent: string | null
          user_id: string
          user_summary: string | null
        }
        Insert: {
          agreeableness_confidence?: string | null
          agreeableness_score?: number | null
          conscientiousness_confidence?: string | null
          conscientiousness_score?: number | null
          created_at?: string | null
          extraversion_confidence?: string | null
          extraversion_score?: number | null
          id?: string
          last_updated?: string | null
          neuroticism_confidence?: string | null
          neuroticism_score?: number | null
          onboarding_completed_at?: string | null
          openness_confidence?: string | null
          openness_score?: number | null
          recommended_subagent?: string | null
          user_id: string
          user_summary?: string | null
        }
        Update: {
          agreeableness_confidence?: string | null
          agreeableness_score?: number | null
          conscientiousness_confidence?: string | null
          conscientiousness_score?: number | null
          created_at?: string | null
          extraversion_confidence?: string | null
          extraversion_score?: number | null
          id?: string
          last_updated?: string | null
          neuroticism_confidence?: string | null
          neuroticism_score?: number | null
          onboarding_completed_at?: string | null
          openness_confidence?: string | null
          openness_score?: number | null
          recommended_subagent?: string | null
          user_id?: string
          user_summary?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_terms_acceptance: {
        Row: {
          accepted_at: string | null
          accepted_version: string | null
          id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_version?: string | null
          id?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_version?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_analysis: {
        Row: {
          created_at: string | null
          emotional_progression: Json | null
          id: string
          key_patterns: Json | null
          progress_metrics: Json | null
          summary: string | null
          updated_at: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          emotional_progression?: Json | null
          id?: string
          key_patterns?: Json | null
          progress_metrics?: Json | null
          summary?: string | null
          updated_at?: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          emotional_progression?: Json | null
          id?: string
          key_patterns?: Json | null
          progress_metrics?: Json | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_employee_risk_scores: {
        Row: {
          agreeableness_score: number | null
          avg_wellbeing_7d: number | null
          company_name: string | null
          conscientiousness_score: number | null
          department: string | null
          email: string | null
          extraversion_score: number | null
          first_name: string | null
          last_analysis_date: string | null
          last_name: string | null
          latest_wellbeing_score: number | null
          location_city: string | null
          location_state: string | null
          neuroticism_score: number | null
          openness_score: number | null
          position: string | null
          recommended_subagent: string | null
          risk_level: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_daily_notification_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_reengagement_user_ids: {
        Args: { inactive_days?: number }
        Returns: {
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_clinical_knowledge_filtered: {
        Args: {
          filter_category?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "colaborador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "colaborador"],
    },
  },
} as const
