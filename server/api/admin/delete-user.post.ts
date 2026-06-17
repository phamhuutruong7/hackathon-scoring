import { useSupabaseAdmin } from '~/server/utils/supabaseAdmin'

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

  const { userId } = await readBody(event) as { userId: string }
  if (!userId) throw createError({ statusCode: 400, message: 'userId là bắt buộc' })

  // Prevent admin from deleting themselves
  if (userId === caller.id) throw createError({ statusCode: 400, message: 'Không thể xoá tài khoản của chính mình' })

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
