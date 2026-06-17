import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

export function useSupabaseAdmin() {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set')
    _client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  }
  return _client
}
