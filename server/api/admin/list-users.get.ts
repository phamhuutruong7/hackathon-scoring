export default defineEventHandler(async (event) => {
  const admin = useSupabaseAdmin()

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const token = authHeader.slice(7)
  const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !caller) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', caller.id).single()
  if (!profile?.is_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, display_name, username, is_admin')
    .order('display_name')

  return profiles ?? []
})
