import type { Database } from '~/types/database.types'

export interface Profile {
  id: string
  display_name: string | null
  is_admin: boolean
}

/**
 * Loads and caches the signed-in user's profile (display name + admin flag).
 * Shared across the app via useState.
 */
export function useProfile() {
  const profile = useState<Profile | null>('profile', () => null)
  const loading = useState<boolean>('profile-loading', () => false)
  const userId = useUserId()
  const supabase = useSupabaseClient<Database>()

  async function refresh() {
    if (!userId.value) {
      profile.value = null
      return
    }
    loading.value = true
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, is_admin')
      .eq('id', userId.value)
      .single()
    profile.value = data
    loading.value = false
  }

  // Load once when a user is present and profile not yet loaded.
  if (import.meta.client) {
    watch(
      userId,
      (id) => {
        if (id && !profile.value) refresh()
        if (!id) profile.value = null
      },
      { immediate: true },
    )
  }

  const isAdmin = computed(() => profile.value?.is_admin === true)

  return { profile, isAdmin, loading, refresh }
}
