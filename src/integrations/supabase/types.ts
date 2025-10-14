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
      achievements: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
          points_reward: number
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          name: string
          points_reward?: number
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points_reward?: number
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          activity_type: string
          assignment_id: string | null
          course_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          assignment_id?: string | null
          course_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          assignment_id?: string | null
          course_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_global: boolean | null
          target_role: Database["public"]["Enums"]["user_role"] | null
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          target_role?: Database["public"]["Enums"]["user_role"] | null
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          target_role?: Database["public"]["Enums"]["user_role"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          auto_delete_at: string | null
          course_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          github_link: string | null
          id: string
          max_score: number | null
          teacher_id: string
          title: string
        }
        Insert: {
          auto_delete_at?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          github_link?: string | null
          id?: string
          max_score?: number | null
          teacher_id: string
          title: string
        }
        Update: {
          auto_delete_at?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          github_link?: string | null
          id?: string
          max_score?: number | null
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
          points_required: number
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          name: string
          points_required?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points_required?: number
        }
        Relationships: []
      }
      courses: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          grade_level: Database["public"]["Enums"]["grade_level"]
          id: string
          is_published: boolean | null
          language: Database["public"]["Enums"]["language_code"] | null
          teacher_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          grade_level: Database["public"]["Enums"]["grade_level"]
          id?: string
          is_published?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          grade_level?: Database["public"]["Enums"]["grade_level"]
          id?: string
          is_published?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_communications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          parent_email: string | null
          parent_phone: string | null
          read_at: string | null
          student_id: string
          subject: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          parent_email?: string | null
          parent_phone?: string | null
          read_at?: string | null
          student_id: string
          subject: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          parent_email?: string | null
          parent_phone?: string | null
          read_at?: string | null
          student_id?: string
          subject?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_communications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          grade_level: Database["public"]["Enums"]["grade_level"] | null
          id: string
          preferred_language:
            | Database["public"]["Enums"]["language_code"]
            | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          grade_level?: Database["public"]["Enums"]["grade_level"] | null
          id: string
          preferred_language?:
            | Database["public"]["Enums"]["language_code"]
            | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          grade_level?: Database["public"]["Enums"]["grade_level"] | null
          id?: string
          preferred_language?:
            | Database["public"]["Enums"]["language_code"]
            | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      sdg_content: {
        Row: {
          category: string
          content: Json
          created_at: string | null
          grade_level: Database["public"]["Enums"]["grade_level"]
          id: string
          is_offline_available: boolean | null
          language: Database["public"]["Enums"]["language_code"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: Json
          created_at?: string | null
          grade_level: Database["public"]["Enums"]["grade_level"]
          id?: string
          is_offline_available?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string | null
          grade_level?: Database["public"]["Enums"]["grade_level"]
          id?: string
          is_offline_available?: boolean | null
          language?: Database["public"]["Enums"]["language_code"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number | null
          student_id: string
          unlocked_at: string | null
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number | null
          student_id: string
          unlocked_at?: string | null
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number | null
          student_id?: string
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          completed_lessons: number | null
          completion_rate: number | null
          course_id: string
          current_streak: number | null
          id: string
          last_accessed: string | null
          last_activity_date: string | null
          level: number | null
          longest_streak: number | null
          points: number | null
          skills_data: Json | null
          student_id: string
          time_spent_minutes: number | null
          total_lessons: number | null
        }
        Insert: {
          completed_lessons?: number | null
          completion_rate?: number | null
          course_id: string
          current_streak?: number | null
          id?: string
          last_accessed?: string | null
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          points?: number | null
          skills_data?: Json | null
          student_id: string
          time_spent_minutes?: number | null
          total_lessons?: number | null
        }
        Update: {
          completed_lessons?: number | null
          completion_rate?: number | null
          course_id?: string
          current_streak?: number | null
          id?: string
          last_accessed?: string | null
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          points?: number | null
          skills_data?: Json | null
          student_id?: string
          time_spent_minutes?: number | null
          total_lessons?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_unlocks: {
        Row: {
          content_id: string
          id: string
          student_id: string
          unlocked_at: string | null
        }
        Insert: {
          content_id: string
          id?: string
          student_id: string
          unlocked_at?: string | null
        }
        Update: {
          content_id?: string
          id?: string
          student_id?: string
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_unlocks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "unlockable_content"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          github_link: string | null
          graded_at: string | null
          id: string
          score: number | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          github_link?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          github_link?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          facebook_link: string | null
          github_link: string | null
          id: string
          other_links: string[] | null
          qualifications: string | null
          rank: string | null
          twitter_link: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          facebook_link?: string | null
          github_link?: string | null
          id?: string
          other_links?: string[] | null
          qualifications?: string | null
          rank?: string | null
          twitter_link?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          facebook_link?: string | null
          github_link?: string | null
          id?: string
          other_links?: string[] | null
          qualifications?: string | null
          rank?: string | null
          twitter_link?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unlockable_content: {
        Row: {
          content_data: Json | null
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          level_required: number
          points_required: number
          title: string
        }
        Insert: {
          content_data?: Json | null
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          level_required?: number
          points_required?: number
          title: string
        }
        Update: {
          content_data?: Json | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          level_required?: number
          points_required?: number
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: { _course_id: string; _points: number; _student_id: string }
        Returns: Json
      }
      delete_old_assignments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      update_streak: {
        Args: { _course_id: string; _student_id: string }
        Returns: undefined
      }
    }
    Enums: {
      grade_level: "primary" | "secondary" | "university"
      language_code: "en" | "ha" | "ig" | "yo" | "pcm"
      user_role: "student" | "teacher" | "admin"
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
      grade_level: ["primary", "secondary", "university"],
      language_code: ["en", "ha", "ig", "yo", "pcm"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
