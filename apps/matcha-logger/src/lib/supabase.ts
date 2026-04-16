import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type MatchaCollection = {
  id: string
  name: string
  brand: string | null
  grade: 'ceremonial' | 'culinary' | 'premium' | 'other' | null
  is_default: boolean
  created_at: string
}

export type MatchaLog = {
  id: string
  matcha_id: string | null
  grams: number
  notes: string | null
  logged_at: string
  matcha_collection?: MatchaCollection
}
