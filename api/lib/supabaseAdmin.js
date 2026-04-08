import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  'https://tzbbeleucvwgexfrwyrh.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)
