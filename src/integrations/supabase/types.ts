export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          details: string | null
          end_time: string
          id: string
          instrument_id: string
          purpose: string
          start_time: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          end_time: string
          id?: string
          instrument_id: string
          purpose: string
          start_time: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          end_time?: string
          id?: string
          instrument_id?: string
          purpose?: string
          start_time?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      instruments: {
        Row: {
          calibration_due: string | null
          created_at: string
          description: string
          id: string
          image: string | null
          location: string
          model: string | null
          name: string
          specifications: string
          status: string
          type: string | null
        }
        Insert: {
          calibration_due?: string | null
          created_at?: string
          description: string
          id?: string
          image?: string | null
          location: string
          model?: string | null
          name: string
          specifications: string
          status: string
          type?: string | null
        }
        Update: {
          calibration_due?: string | null
          created_at?: string
          description?: string
          id?: string
          image?: string | null
          location?: string
          model?: string | null
          name?: string
          specifications?: string
          status?: string
          type?: string | null
        }
        Relationships: []
      }
      maintenance_history: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          instrument_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          id?: string
          instrument_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          instrument_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_history_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          department: string | null
          email: string
          id: string
          name: string
          profile_image: string | null
          role: string
        }
        Insert: {
          department?: string | null
          email: string
          id: string
          name: string
          profile_image?: string | null
          role: string
        }
        Update: {
          department?: string | null
          email?: string
          id?: string
          name?: string
          profile_image?: string | null
          role?: string
        }
        Relationships: []
      }
      status_colors: {
        Row: {
          color: string
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          status: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
