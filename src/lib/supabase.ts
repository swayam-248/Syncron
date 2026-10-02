import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          user_id?: string | null;
          title: string;
          content: string;
          created_at: number;
          updated_at: number;
          deleted_at: number | null;
          icon?: string | null;
          tags?: string[] | null;
          pinned?: boolean;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          title: string;
          content?: string;
          created_at?: number;
          updated_at?: number;
          deleted_at?: number | null;
          icon?: string | null;
          tags?: string[] | null;
          pinned?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          content?: string;
          created_at?: number;
          updated_at?: number;
          deleted_at?: number | null;
          icon?: string | null;
          tags?: string[] | null;
          pinned?: boolean;
        };
      };
    };
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.info(
    '[Syncron Supabase] Environment variables VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are not configured yet. Remote cloud synchronization will be disabled until values are supplied.'
  );
}

/**
 * Initialized Supabase client for remote replication and authentication infrastructure.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
