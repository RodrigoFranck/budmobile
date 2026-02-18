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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          conversation_date: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          is_consolidated: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_date?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_consolidated?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_date?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_consolidated?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_message_counts: {
        Row: {
          count: number
          created_at: string | null
          id: string
          message_date: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          id?: string
          message_date?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string | null
          id?: string
          message_date?: string
          user_id?: string
        }
        Relationships: []
      }
      explore_cards: {
        Row: {
          card_type: string
          category: string
          completed_at: string | null
          created_at: string
          description: string
          gradient: string
          id: string
          is_completed: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          card_type: string
          category: string
          completed_at?: string | null
          created_at?: string
          description: string
          gradient: string
          id?: string
          is_completed?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          card_type?: string
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          gradient?: string
          id?: string
          is_completed?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explore_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          insight_content: Json | null
          insight_headline: string | null
          insight_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          insight_content?: Json | null
          insight_headline?: string | null
          insight_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          insight_content?: Json | null
          insight_headline?: string | null
          insight_type?: string
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
          message_type: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
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
      profiles: {
        Row: {
          age: string | null
          avatar_url: string | null
          conversation_goal: string | null
          created_at: string
          dark_mode: boolean | null
          email_verified: boolean | null
          ethnicity: string | null
          gender: string | null
          hobbies: string[] | null
          id: string
          initial_thoughts: string | null
          location: string | null
          name: string | null
          occupation: string | null
          onboarding_completed: boolean | null
          relationship: string | null
          updated_at: string
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          conversation_goal?: string | null
          created_at?: string
          dark_mode?: boolean | null
          email_verified?: boolean | null
          ethnicity?: string | null
          gender?: string | null
          hobbies?: string[] | null
          id: string
          initial_thoughts?: string | null
          location?: string | null
          name?: string | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          relationship?: string | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          conversation_goal?: string | null
          created_at?: string
          dark_mode?: boolean | null
          email_verified?: boolean | null
          ethnicity?: string | null
          gender?: string | null
          hobbies?: string[] | null
          id?: string
          initial_thoughts?: string | null
          location?: string | null
          name?: string | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          relationship?: string | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          data: Json
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          data?: Json
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          data?: Json
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          blind_spots: Json | null
          communication_style: Json | null
          conversations_analyzed: number | null
          created_at: string | null
          effective_approaches: Json | null
          emotional_patterns: Json | null
          id: string
          journey_summary: string | null
          last_consolidated_at: string | null
          recurring_themes: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blind_spots?: Json | null
          communication_style?: Json | null
          conversations_analyzed?: number | null
          created_at?: string | null
          effective_approaches?: Json | null
          emotional_patterns?: Json | null
          id?: string
          journey_summary?: string | null
          last_consolidated_at?: string | null
          recurring_themes?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blind_spots?: Json | null
          communication_style?: Json | null
          conversations_analyzed?: number | null
          created_at?: string | null
          effective_approaches?: Json | null
          emotional_patterns?: Json | null
          id?: string
          journey_summary?: string | null
          last_consolidated_at?: string | null
          recurring_themes?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
