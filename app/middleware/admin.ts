import type { Database } from '~/types/database.types'

// Guards admin-only pages. Redirects non-admins home and guests to login.
export default defineNuxtRouteMiddleware(async () => {
  // Gate on the client where the Supabase client carries the user's auth.
  if (import.meta.server) return

  const userId = useUserId()
  if (!userId.value) return navigateTo('/login')

  const supabase = useSupabaseClient<Database>()
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId.value)
    .single()

  if (!data?.is_admin) return navigateTo('/')
})
