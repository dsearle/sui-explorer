import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tzbbeleucvwgexfrwyrh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YmJlbGV1Y3Z3Z2V4ZnJ3eXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDM2NTIsImV4cCI6MjA5MTIxOTY1Mn0.vbG7r4-evDNc--mkrizYMJS73de2EBeizjlEdURYZ3A'

// Public client — respects RLS (only published protocols visible)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type DbProtocol = {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  color: string
  color_to: string
  emoji: string
  website: string | null
  github: string | null
  twitter: string | null
  packages: { id: string; label: string; description: string }[]
  key_objects: { id: string; label: string; description: string }[]
  tags: string[]
  featured: boolean
  status: 'published' | 'hidden'
  source: string
  created_at: string
  updated_at: string
}

export type DbScanResult = {
  id: string
  source: 'defilamma' | 'coingecko' | 'rpc'
  external_id: string | null
  raw_data: Record<string, unknown>
  suggested: Partial<DbProtocol>
  status: 'pending' | 'approved' | 'rejected' | 'duplicate'
  reviewed_at: string | null
  created_at: string
}

export type DbSubmission = {
  id: string
  protocol_id: string | null
  wallet_address: string
  name: string
  tagline: string | null
  description: string | null
  category: string | null
  website: string | null
  github: string | null
  twitter: string | null
  packages: { id: string; label: string; description: string }[]
  contact_email: string | null
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  created_at: string
}
