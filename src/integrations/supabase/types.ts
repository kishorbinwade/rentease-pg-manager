export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      complaints: {
        Row: {
          created_at: string
          description: string
          id: string
          owner_id: string
          priority: Database["public"]["Enums"]["complaint_priority"]
          room_id: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          owner_id: string
          priority?: Database["public"]["Enums"]["complaint_priority"]
          room_id?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          priority?: Database["public"]["Enums"]["complaint_priority"]
          room_id?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rent_records: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          owner_id: string
          paid_date: string | null
          room_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          owner_id: string
          paid_date?: string | null
          room_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          owner_id?: string
          paid_date?: string | null
          room_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_records_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_records_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      room_edit_history: {
        Row: {
          edited_at: string
          edited_by: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          room_id: string
        }
        Insert: {
          edited_at?: string
          edited_by: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          room_id: string
        }
        Update: {
          edited_at?: string
          edited_by?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_edit_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_edit_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          floor: number | null
          id: string
          owner_id: string
          rent_amount: number
          room_number: string
          room_type: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          floor?: number | null
          id?: string
          owner_id: string
          rent_amount: number
          room_number: string
          room_type: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          floor?: number | null
          id?: string
          owner_id?: string
          rent_amount?: number
          room_number?: string
          room_type?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          agreement_url: string | null
          check_in_date: string | null
          check_out_date: string | null
          checked_out_by: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          id_proof_url: string | null
          join_date: string
          owner_id: string
          phone: string
          room_id: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agreement_url?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          checked_out_by?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          id_proof_url?: string | null
          join_date?: string
          owner_id: string
          phone: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agreement_url?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          checked_out_by?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          id_proof_url?: string | null
          join_date?: string
          owner_id?: string
          phone?: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      room_availability: {
        Row: {
          available_beds: number | null
          capacity: number | null
          created_at: string | null
          current_occupancy: number | null
          floor: number | null
          id: string | null
          owner_id: string | null
          rent_amount: number | null
          room_number: string | null
          room_type: string | null
          status: Database["public"]["Enums"]["room_status"] | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      validate_file_upload: {
        Args: { file_name: string; file_size: number; mime_type: string }
        Returns: boolean
      }
    }
    Enums: {
      complaint_priority: "low" | "medium" | "high"
      complaint_status: "open" | "in_progress" | "resolved"
      room_status: "occupied" | "vacant" | "under_maintenance"
      tenant_status: "active" | "notice_period" | "inactive"
      user_role: "admin" | "tenant"
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
    Enums: {
      complaint_priority: ["low", "medium", "high"],
      complaint_status: ["open", "in_progress", "resolved"],
      room_status: ["occupied", "vacant", "under_maintenance"],
      tenant_status: ["active", "notice_period", "inactive"],
      user_role: ["admin", "tenant"],
    },
  },
} as const
