import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export { supabase }