import { createClient } from '@supabase/supabase-js'

// Add error handling for missing environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase configuration check:')
console.log('URL exists:', !!supabaseUrl)
console.log('Anon key exists:', !!supabaseAnonKey)

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is missing from environment variables')
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.')
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is missing from environment variables')
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.')
}

console.log('Creating Supabase client...')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

console.log('Supabase client created successfully')

export type Database = {
  public: {
    Tables: {
      emotional_posts: {
        Row: {
          id: string
          content: string
          emotions: string[]
          hearts: number
          comments: number
          user_name: string
          user_email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          emotions: string[]
          hearts?: number
          comments?: number
          user_name: string
          user_email?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          emotions?: string[]
          hearts?: number
          comments?: number
          user_name?: string
          user_email?: string
          created_at?: string
          updated_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          content: string
          user_name: string
          user_email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          content: string
          user_name: string
          user_email?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          content?: string
          user_name?: string
          user_email?: string
          created_at?: string
          updated_at?: string
        }
      }
      companion_conversations: {
        Row: {
          id: string
          session_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      companion_messages: {
        Row: {
          id: string
          conversation_id: string
          content: string
          is_user: boolean
          message_type: 'normal' | 'warning' | 'resource'
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          content: string
          is_user: boolean
          message_type?: 'normal' | 'warning' | 'resource'
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          content?: string
          is_user?: boolean
          message_type?: 'normal' | 'warning' | 'resource'
          created_at?: string
        }
      }
      companion_reactions: {
        Row: {
          id: string
          message_id: string
          reaction_type: 'helpful' | 'not_helpful' | 'heart' | 'thumbs_up' | 'thumbs_down'
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          reaction_type: 'helpful' | 'not_helpful' | 'heart' | 'thumbs_up' | 'thumbs_down'
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          reaction_type?: 'helpful' | 'not_helpful' | 'heart' | 'thumbs_up' | 'thumbs_down'
          created_at?: string
        }
      }
    }
  }
}