// src/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          preferences: Json | null
          created_at: string
          updated_at: string
          subscription_tier: 'free' | 'pro' | 'premium'
          ai_calls_used: number
          ai_calls_limit: number
          last_ai_call: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          is_active: boolean
          last_login: string | null
          login_count: number
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at' | 'ai_calls_used' | 'login_count'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          text: string
          photo_url: string | null
          mood: number | null
          energy: number | null
          ai_analysis: Json | null
          guided_session: Json | null
          tags: string[] | null
          location: Json | null
          weather: Json | null
          created_at: string
          updated_at: string
          encrypted: boolean
          encryption_key_id: string | null
          client_hash: string | null
          synced_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['journal_entries']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['journal_entries']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      rate_limits: {
        Row: {
          user_id: string
          api_calls: number
          last_reset: string
          daily_calls: number
          last_daily_reset: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rate_limits']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rate_limits']['Insert']>
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          last_activity: string
          expires_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_sessions']['Row'], 'id' | 'created_at' | 'last_activity'>
        Update: Partial<Database['public']['Tables']['user_sessions']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_statistics: {
        Args: { p_user_id: string }
        Returns: {
          total_entries: number
          avg_mood: number | null
          avg_energy: number | null
          most_used_tags: string[] | null
          current_streak: number
          longest_streak: number
          total_words: number
        }
      }
      check_rate_limit: {
        Args: {
          p_user_id: string
          p_max_per_hour?: number
          p_max_per_day?: number
        }
        Returns: boolean
      }
      validate_session: {
        Args: {
          p_token: string
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      subscription_tier: 'free' | 'pro' | 'premium'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
