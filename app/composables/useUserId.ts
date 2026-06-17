/**
 * Returns the current user's UUID.
 *
 * Depending on the @nuxtjs/supabase version, useSupabaseUser() may expose the
 * id as `id` (User object) or as `sub` (decoded JWT claims). This normalizes both.
 */
export function useUserId() {
  const user = useSupabaseUser()
  return computed<string | null>(
    () => (user.value as any)?.id ?? (user.value as any)?.sub ?? null,
  )
}
