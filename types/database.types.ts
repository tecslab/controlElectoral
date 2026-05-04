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
      asignacion_juntas: {
        Row: {
          created_at: string
          estado: string
          id: string
          id_colaborador: string
          id_junta: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          id_colaborador: string
          id_junta: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          id_colaborador?: string
          id_junta?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignacion_juntas_id_colaborador_fkey"
            columns: ["id_colaborador"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignacion_juntas_id_junta_fkey"
            columns: ["id_junta"]
            isOneToOne: false
            referencedRelation: "juntas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          apellidos: string
          asiste_capacitacion: string
          created_at: string
          id: string
          id_recinto_asignado: string | null
          id_recinto_votacion: string | null
          nombres: string
          rol: string
          whatsapp: string
          ya_contactado: string
        }
        Insert: {
          apellidos: string
          asiste_capacitacion?: string
          created_at?: string
          id?: string
          id_recinto_asignado?: string | null
          id_recinto_votacion?: string | null
          nombres: string
          rol: string
          whatsapp: string
          ya_contactado?: string
        }
        Update: {
          apellidos?: string
          asiste_capacitacion?: string
          created_at?: string
          id?: string
          id_recinto_asignado?: string | null
          id_recinto_votacion?: string | null
          nombres?: string
          rol?: string
          whatsapp?: string
          ya_contactado?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_id_recinto_asignado_fkey"
            columns: ["id_recinto_asignado"]
            isOneToOne: false
            referencedRelation: "recintos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_id_recinto_votacion_fkey"
            columns: ["id_recinto_votacion"]
            isOneToOne: false
            referencedRelation: "recintos"
            referencedColumns: ["id"]
          },
        ]
      }
      juntas: {
        Row: {
          created_at: string
          estado: string
          id: string
          id_recinto: string
          numero: number
          sexo: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          id_recinto: string
          numero: number
          sexo: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          id_recinto?: string
          numero?: number
          sexo?: string
        }
        Relationships: [
          {
            foreignKeyName: "juntas_id_recinto_fkey"
            columns: ["id_recinto"]
            isOneToOne: false
            referencedRelation: "recintos"
            referencedColumns: ["id"]
          },
        ]
      }
      observaciones_colaboradores: {
        Row: {
          created_at: string
          id: string
          id_colaborador: string
          texto: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_colaborador: string
          texto: string
        }
        Update: {
          created_at?: string
          id?: string
          id_colaborador?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "observaciones_colaboradores_id_colaborador_fkey"
            columns: ["id_colaborador"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      parroquias: {
        Row: {
          created_at: string
          estado: string
          id: string
          nombre: string
          tipo: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          nombre: string
          tipo: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      recintos: {
        Row: {
          created_at: string
          estado: string
          id: string
          id_parroquia: string
          nombre: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          id_parroquia: string
          nombre: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          id_parroquia?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "recintos_id_parroquia_fkey"
            columns: ["id_parroquia"]
            isOneToOne: false
            referencedRelation: "parroquias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_recinto_with_juntas: {
        Args: {
          p_id_parroquia: string
          p_juntas_f: number
          p_juntas_m: number
          p_nombre: string
        }
        Returns: string
      }
      update_juntas_count: {
        Args: { p_id_recinto: string; p_new_f: number; p_new_m: number }
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
