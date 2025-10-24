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
      automation_enrollments: {
        Row: {
          id: number
          sequence_id: number
          member_id: number
          current_step_id: number | null
          status: string
          completed_at: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          sequence_id: number
          member_id: number
          current_step_id?: number | null
          status?: string
          completed_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          sequence_id?: number
          member_id?: number
          current_step_id?: number | null
          status?: string
          completed_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_enrollments_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "automation_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_enrollments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "automation_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_jobs: {
        Row: {
          id: number
          sequence_id: number | null
          step_id: number | null
          campaign_id: number
          member_id: number
          scheduled_at: string
          attempts: number | null
          status: string
          payload: Json | null
          last_error: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          sequence_id?: number | null
          step_id?: number | null
          campaign_id: number
          member_id: number
          scheduled_at: string
          attempts?: number | null
          status?: string
          payload?: Json | null
          last_error?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          sequence_id?: number | null
          step_id?: number | null
          campaign_id?: number
          member_id?: number
          scheduled_at?: string
          attempts?: number | null
          status?: string
          payload?: Json | null
          last_error?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_jobs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_jobs_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "automation_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_jobs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "automation_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_sequences: {
        Row: {
          id: number
          community_id: number
          name: string
          description: string | null
          trigger_event: string
          trigger_label: string | null
          status: string
          timezone: string
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          community_id: number
          name: string
          description?: string | null
          trigger_event: string
          trigger_label?: string | null
          status?: string
          timezone: string
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          community_id?: number
          name?: string
          description?: string | null
          trigger_event?: string
          trigger_label?: string | null
          status?: string
          timezone?: string
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_sequences_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_steps: {
        Row: {
          id: number
          sequence_id: number
          campaign_id: number
          position: number
          delay_value: number | null
          delay_unit: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          sequence_id: number
          campaign_id: number
          position: number
          delay_value?: number | null
          delay_unit?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          sequence_id?: number
          campaign_id?: number
          position?: number
          delay_value?: number | null
          delay_unit?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "automation_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      company_webhooks: {
        Row: {
          id: number
          whop_community_id: string
          community_id: number | null
          whop_webhook_id: string
          webhook_secret: string
          url: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          whop_community_id: string
          community_id?: number | null
          whop_webhook_id: string
          webhook_secret: string
          url: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          whop_community_id?: string
          community_id?: number | null
          whop_webhook_id?: string
          webhook_secret?: string
          url?: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_webhooks_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience: Json | null
          automation_sequence_id: number | null
          automation_status: string | null
          click_count: number | null
          community_id: number
          content_md: string | null
          content_json: Json | null
          created_at: string | null
          html_content: string
          id: number
          open_count: number | null
          preview_text: string | null
          recipient_count: number | null
          scheduled_for: string | null
          send_mode: string | null
          sent_at: string | null
          status: string | null
          subject: string
          trigger_delay_unit: string | null
          trigger_delay_value: number | null
          trigger_event: string | null
          quiet_hours_enabled: boolean | null
          quiet_hours_start: number | null
          quiet_hours_end: number | null
          updated_at: string | null
        }
        Insert: {
          audience?: Json | null
          automation_sequence_id?: number | null
          automation_status?: string | null
          click_count?: number | null
          community_id: number
          content_md?: string | null
          content_json?: Json | null
          created_at?: string | null
          html_content: string
          id?: number
          open_count?: number | null
          preview_text?: string | null
          recipient_count?: number | null
          scheduled_for?: string | null
          send_mode?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          trigger_delay_unit?: string | null
          trigger_delay_value?: number | null
          trigger_event?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_start?: number | null
          quiet_hours_end?: number | null
          updated_at?: string | null
        }
        Update: {
          audience?: Json | null
          automation_sequence_id?: number | null
          automation_status?: string | null
          click_count?: number | null
          community_id?: number
          content_md?: string | null
          content_json?: Json | null
          created_at?: string | null
          html_content?: string
          id?: number
          open_count?: number | null
          preview_text?: string | null
          recipient_count?: number | null
          scheduled_for?: string | null
          send_mode?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          trigger_delay_unit?: string | null
          trigger_delay_value?: number | null
          trigger_event?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_start?: number | null
          quiet_hours_end?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_automation_sequence_id_fkey"
            columns: ["automation_sequence_id"]
            isOneToOne: false
            referencedRelation: "automation_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string | null
          footer_text: string | null
          from_name: string | null
          id: number
          last_sync_at: string | null
          member_count: number | null
          name: string
          reply_to_email: string | null
          updated_at: string | null
          user_id: string
          whop_community_id: string
        }
        Insert: {
          created_at?: string | null
          footer_text?: string | null
          from_name?: string | null
          id?: number
          last_sync_at?: string | null
          member_count?: number | null
          name: string
          reply_to_email?: string | null
          updated_at?: string | null
          user_id: string
          whop_community_id: string
        }
        Update: {
          created_at?: string | null
          footer_text?: string | null
          from_name?: string | null
          id?: number
          last_sync_at?: string | null
          member_count?: number | null
          name?: string
          reply_to_email?: string | null
          updated_at?: string | null
          user_id?: string
          whop_community_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          id: string
          campaign_id: number | null
          user_id: string
          experience_id: string
          subject: string | null
          preview_text: string | null
          html_content: string | null
          editor_json: Json | null
          yjs_state: string | null
          is_draft: boolean | null
          last_edited_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          campaign_id?: number | null
          user_id: string
          experience_id: string
          subject?: string | null
          preview_text?: string | null
          html_content?: string | null
          editor_json?: Json | null
          yjs_state?: string | null
          is_draft?: boolean | null
          last_edited_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          campaign_id?: number | null
          user_id?: string
          experience_id?: string
          subject?: string | null
          preview_text?: string | null
          html_content?: string | null
          editor_json?: Json | null
          yjs_state?: string | null
          is_draft?: boolean | null
          last_edited_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drafts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: number
          created_at: string | null
          id: number
          member_id: number
          metadata: Json | null
          type: string
        }
        Insert: {
          campaign_id: number
          created_at?: string | null
          id?: number
          member_id: number
          metadata?: Json | null
          type: string
        }
        Update: {
          campaign_id?: number
          created_at?: string | null
          id?: number
          member_id?: number
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          community_id: number
          created_at: string | null
          email: string
          engagement_score: number | null
          id: number
          joined_at: string
          last_active_at: string | null
          membership_tier: string | null
          name: string | null
          status: string | null
          updated_at: string | null
          whop_member_id: string
        }
        Insert: {
          community_id: number
          created_at?: string | null
          email: string
          engagement_score?: number | null
          id?: number
          joined_at: string
          last_active_at?: string | null
          membership_tier?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          whop_member_id: string
        }
        Update: {
          community_id?: number
          created_at?: string | null
          email?: string
          engagement_score?: number | null
          id?: number
          joined_at?: string
          last_active_at?: string | null
          membership_tier?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          whop_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          mail_username: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          mail_username?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          mail_username?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string | null
          content_md: string | null
          content_json: Json | null
          created_at: string | null
          html_content: string | null
          id: number
          is_default: boolean | null
          name: string
          thumbnail: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content_md?: string | null
          content_json?: Json | null
          created_at?: string | null
          html_content?: string | null
          id?: number
          is_default?: boolean | null
          name: string
          thumbnail?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content_md?: string | null
          content_json?: Json | null
          created_at?: string | null
          html_content?: string | null
          id?: number
          is_default?: boolean | null
          name?: string
          thumbnail?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_campaign_click_count: {
        Args: { cid: number }
        Returns: undefined
      }
      increment_campaign_open_count: {
        Args: { cid: number }
        Returns: undefined
      }
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


