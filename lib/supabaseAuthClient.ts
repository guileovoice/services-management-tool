import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getAuthClient(): SupabaseClient {
  if (!_client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase anon key is required for auth')
    }

    _client = createClient(supabaseUrl, anonKey)
  }
  return _client
}

export const supabaseAuth = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_, prop) {
    return getAuthClient()[prop as keyof SupabaseClient]
  },
})
