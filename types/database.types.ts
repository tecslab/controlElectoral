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
          created_by: string | null
          estado: string
          id: string
          id_colaborador: string
          id_junta: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_colaborador: string
          id_junta: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_colaborador?: string
          id_junta?: string
          updated_at?: string
          updated_by?: string | null
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
          created_by: string | null
          id: string
          id_recinto_asignado: string | null
          id_recinto_votacion: string | null
          nombres: string
          rol: string
          updated_at: string
          updated_by: string | null
          whatsapp: string
          ya_contactado: string
        }
        Insert: {
          apellidos: string
          asiste_capacitacion?: string
          created_at?: string
          created_by?: string | null
          id?: string
          id_recinto_asignado?: string | null
          id_recinto_votacion?: string | null
          nombres: string
          rol: string
          updated_at?: string
          updated_by?: string | null
          whatsapp: string
          ya_contactado?: string
        }
        Update: {
          apellidos?: string
          asiste_capacitacion?: string
          created_at?: string
          created_by?: string | null
          id?: string
          id_recinto_asignado?: string | null
          id_recinto_votacion?: string | null
          nombres?: string
          rol?: string
          updated_at?: string
          updated_by?: string | null
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
          created_by: string | null
          estado: string
          id: string
          id_recinto: string
          numero: number
          sexo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_recinto: string
          numero: number
          sexo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_recinto?: string
          numero?: number
          sexo?: string
          updated_at?: string
          updated_by?: string | null
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
          created_by: string | null
          id: string
          id_colaborador: string
          texto: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          id_colaborador: string
          texto: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          id_colaborador?: string
          texto?: string
          updated_at?: string
          updated_by?: string | null
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
      cantones: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          id: string
          nombre: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          nombre: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          nombre?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      circunscripciones: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          id: string
          id_canton: string
          nombre: string
          tipo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_canton: string
          nombre: string
          tipo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_canton?: string
          nombre?: string
          tipo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circunscripciones_id_canton_fkey"
            columns: ["id_canton"]
            isOneToOne: false
            referencedRelation: "cantones"
            referencedColumns: ["id"]
          }
        ]
      }
      parroquias: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          id: string
          id_canton: string | null
          id_circunscripcion: string | null
          nombre: string
          tipo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_canton?: string | null
          id_circunscripcion?: string | null
          nombre: string
          tipo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_canton?: string | null
          id_circunscripcion?: string | null
          nombre?: string
          tipo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parroquias_id_canton_fkey"
            columns: ["id_canton"]
            isOneToOne: false
            referencedRelation: "cantones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parroquias_id_circunscripcion_fkey"
            columns: ["id_circunscripcion"]
            isOneToOne: false
            referencedRelation: "circunscripciones"
            referencedColumns: ["id"]
          }
        ]
      }
      recintos: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          id: string
          id_parroquia: string
          id_zona: string | null
          nombre: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_parroquia: string
          id_zona?: string | null
          nombre: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_parroquia?: string
          id_zona?: string | null
          nombre?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recintos_id_parroquia_fkey"
            columns: ["id_parroquia"]
            isOneToOne: false
            referencedRelation: "parroquias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recintos_id_zona_fkey"
            columns: ["id_zona"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          }
        ]
      }
      zonas: {
        Row: {
          codigo: string | null
          created_at: string
          created_by: string | null
          estado: string
          id: string
          id_parroquia: string
          nombre: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_parroquia: string
          nombre: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          id_parroquia?: string
          nombre?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zonas_id_parroquia_fkey"
            columns: ["id_parroquia"]
            isOneToOne: false
            referencedRelation: "parroquias"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      user_profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          display_name?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_recinto_with_juntas: {
        Args: {
          p_nombre: string
          p_id_parroquia: string
          p_juntas_m_desde?: number
          p_juntas_m_hasta?: number
          p_juntas_f_desde?: number
          p_juntas_f_hasta?: number
        }
        Returns: string
      }
      update_juntas_count: {
        Args: { p_id_recinto: string; p_new_f: number; p_new_m: number }
        Returns: undefined
      }
      update_juntas_range: {
        Args: {
          p_id_recinto: string
          p_m_desde?: number
          p_m_hasta?: number
          p_f_desde?: number
          p_f_hasta?: number
        }
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
