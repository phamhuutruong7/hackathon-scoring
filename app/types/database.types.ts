export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: { judge_id: string; round_id: number; team_id: string }
        Insert: { judge_id: string; round_id: number; team_id: string }
        Update: { judge_id?: string; round_id?: number; team_id?: string }
        Relationships: []
      }
      profiles: {
        Row: { created_at: string; display_name: string | null; id: string; is_admin: boolean }
        Insert: { created_at?: string; display_name?: string | null; id: string; is_admin?: boolean }
        Update: { created_at?: string; display_name?: string | null; id?: string; is_admin?: boolean }
        Relationships: []
      }
      round_judges: {
        Row: { round_id: number; user_id: string }
        Insert: { round_id: number; user_id: string }
        Update: { round_id?: number; user_id?: string }
        Relationships: []
      }
      round_teams: {
        Row: { round_id: number; team_id: string }
        Insert: { round_id: number; team_id: string }
        Update: { round_id?: number; team_id?: string }
        Relationships: []
      }
      rounds: {
        Row: { id: number; name: string; status: string }
        Insert: { id: number; name: string; status?: string }
        Update: { id?: number; name?: string; status?: string }
        Relationships: []
      }
      scores: {
        Row: {
          bonus: number; c1: number; c2: number; c3: number; c4: number; c5: number
          comment: string | null; created_at: string; final_score: number | null; id: string
          judge_id: string; round_id: number; submitted: boolean; team_id: string; updated_at: string
        }
        Insert: {
          bonus?: number; c1?: number; c2?: number; c3?: number; c4?: number; c5?: number
          comment?: string | null; created_at?: string; final_score?: number | null; id?: string
          judge_id: string; round_id: number; submitted?: boolean; team_id: string; updated_at?: string
        }
        Update: {
          bonus?: number; c1?: number; c2?: number; c3?: number; c4?: number; c5?: number
          comment?: string | null; created_at?: string; final_score?: number | null; id?: string
          judge_id?: string; round_id?: number; submitted?: boolean; team_id?: string; updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: { created_at: string; id: string; name: string }
        Insert: { created_at?: string; id?: string; name: string }
        Update: { created_at?: string; id?: string; name?: string }
        Relationships: []
      }
    }
    Views: {
      v_round_rankings: {
        Row: {
          avg_score: number | null; judge_count: number | null; rank: number | null
          round_id: number | null; sum_score: number | null; team_id: string | null; team_name: string | null
        }
        Relationships: []
      }
      v_round_results: {
        Row: {
          avg_score: number | null; judge_count: number | null
          round_id: number | null; sum_score: number | null; team_id: string | null; team_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_score: { Args: { p_round: number; p_team: string; p_user: string }; Returns: boolean }
      claim_admin: { Args: { p_secret: string }; Returns: boolean }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      set_admin: { Args: { p_user: string; p_value: boolean }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
