import { createClient } from "@supabase/supabase-js"

// Fallback values allow the module to load at build time without env vars set.
// API routes using this client will only run at request time (not during build).
const supabaseUrl = process.env.NEXT_PUBLIC_HOLIDAY_BAZAAR_SUPABASE_URL ?? "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_HOLIDAY_BAZAAR_SUPABASE_ANON_KEY ?? "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
