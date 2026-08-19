import { createClient } from '@supabase/supabase-js'

// This client bypasses RLS. Never use it in a client component or expose it.
// Only use for administrative tasks (like inserting AI assistant messages).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
