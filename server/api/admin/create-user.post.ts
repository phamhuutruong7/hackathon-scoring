export default defineEventHandler(async (event) => {
  const admin = useSupabaseAdmin()

  // Verify the caller is an authenticated admin
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const token = authHeader.slice(7)
  const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !caller) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', caller.id).single()
  if (!profile?.is_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  // Parse body
  const body = await readBody(event)
  const { username, password, rounds, teamIds } = body as {
    username: string
    password: string
    rounds: number[]      // e.g. [1, 2]
    teamIds: string[]     // for round 1 assignments
  }

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'username và password là bắt buộc' })
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
    throw createError({ statusCode: 400, message: 'Username chỉ được chứa chữ cái, số, dấu gạch dưới, chấm, gạch ngang' })
  }

  const email = `${username}@hackathon.internal`

  // Create auth user (email_confirm: true skips email confirmation)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: username },
  })
  if (createErr) {
    if (createErr.message.includes('already been registered')) {
      throw createError({ statusCode: 409, message: 'Username đã tồn tại' })
    }
    throw createError({ statusCode: 500, message: createErr.message })
  }

  const userId = created.user.id

  // Upsert profile with username
  await admin.from('profiles').upsert({ id: userId, display_name: username, username })

  // Assign to rounds
  if (rounds?.length) {
    await admin.from('round_judges').insert(rounds.map((r) => ({ round_id: r, user_id: userId })))
  }

  // Assign Round 1 teams
  if (teamIds?.length && rounds?.includes(1)) {
    await admin.from('assignments').insert(teamIds.map((t) => ({ round_id: 1, judge_id: userId, team_id: t })))
  }

  return { id: userId, username }
})
