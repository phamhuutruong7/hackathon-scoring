<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()

interface UserRow {
  id: string
  display_name: string | null
  username: string | null
  is_admin: boolean
}

interface Team { id: string; name: string }

const users = ref<UserRow[]>([])
const teams = ref<Team[]>([])
const pending = ref(true)
const deleting = ref<string | null>(null)

// Form state
const form = reactive({
  username: '',
  password: '',
  showPassword: false,
  rounds: [] as number[],
  teamIds: [] as string[],
  loading: false,
})

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

async function load() {
  pending.value = true
  const [usersRes, teamsRes] = await Promise.all([
    $fetch<UserRow[]>('/api/admin/list-users', {
      headers: { authorization: `Bearer ${await getToken()}` },
    }),
    supabase.from('teams').select('id, name').order('name'),
  ])
  users.value = usersRes
  teams.value = teamsRes.data ?? []
  pending.value = false
}
onMounted(load)

async function createUser() {
  if (!form.username.trim() || !form.password.trim()) {
    toast.add({ title: 'Thiếu thông tin', description: 'Nhập username và mật khẩu', color: 'warning' })
    return
  }
  form.loading = true
  try {
    await $fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { authorization: `Bearer ${await getToken()}` },
      body: {
        username: form.username.trim(),
        password: form.password,
        rounds: form.rounds,
        teamIds: form.rounds.includes(1) ? form.teamIds : [],
      },
    })
    toast.add({ title: 'Đã tạo tài khoản', description: form.username, color: 'success' })
    form.username = ''
    form.password = ''
    form.rounds = []
    form.teamIds = []
    await load()
  } catch (e: any) {
    toast.add({ title: 'Lỗi', description: e.data?.message ?? e.message, color: 'error' })
  } finally {
    form.loading = false
  }
}

async function deleteUser(u: UserRow) {
  if (!confirm(`Xoá tài khoản "${u.display_name || u.username}"?`)) return
  deleting.value = u.id
  try {
    await $fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { authorization: `Bearer ${await getToken()}` },
      body: { userId: u.id },
    })
    toast.add({ title: 'Đã xoá tài khoản', color: 'success' })
    await load()
  } catch (e: any) {
    toast.add({ title: 'Lỗi', description: e.data?.message ?? e.message, color: 'error' })
  } finally {
    deleting.value = null
  }
}

function toggleRound(r: number) {
  const i = form.rounds.indexOf(r)
  if (i === -1) form.rounds.push(r)
  else form.rounds.splice(i, 1)
  if (!form.rounds.includes(1)) form.teamIds = []
}

function toggleTeam(id: string) {
  const i = form.teamIds.indexOf(id)
  if (i === -1) form.teamIds.push(id)
  else form.teamIds.splice(i, 1)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Create user form -->
    <UCard>
      <template #header>
        <span class="font-medium">Tạo tài khoản mới</span>
      </template>

      <form class="space-y-4" @submit.prevent="createUser">
        <div class="grid sm:grid-cols-2 gap-4">
          <UFormField label="Username" required>
            <UInput
              v-model="form.username"
              placeholder="TruongPH2"
              autocomplete="off"
              class="w-full font-mono"
              :ui="{ base: 'font-mono' }"
            />
            <p class="text-xs text-[var(--ui-text-muted)] mt-1">Chỉ chữ cái, số, dấu _ . -</p>
          </UFormField>

          <UFormField label="Mật khẩu" required>
            <div class="flex gap-2 w-full">
              <UInput
                v-model="form.password"
                :type="form.showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="new-password"
                class="flex-1"
              />
              <UButton
                type="button"
                variant="ghost"
                :icon="form.showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="form.showPassword = !form.showPassword"
              />
            </div>
          </UFormField>
        </div>

        <!-- Round assignment -->
        <UFormField label="Phân công vòng chấm">
          <div class="flex flex-wrap gap-3">
            <label v-for="r in [1, 2, 3]" :key="r" class="flex items-center gap-2 cursor-pointer">
              <UCheckbox
                :model-value="form.rounds.includes(r)"
                @update:model-value="toggleRound(r)"
              />
              <span class="text-sm">Vòng {{ r }}{{ r === 1 ? ' (BUL)' : '' }}</span>
            </label>
          </div>
        </UFormField>

        <!-- Team assignment for Round 1 -->
        <div v-if="form.rounds.includes(1)" class="border border-[var(--ui-border)] rounded-lg p-3">
          <p class="text-sm font-medium mb-2">Đội được phân (Vòng 1)</p>
          <div v-if="teams.length === 0" class="text-sm text-[var(--ui-text-muted)]">Chưa có đội nào.</div>
          <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 max-h-48 overflow-y-auto">
            <label
              v-for="t in teams"
              :key="t.id"
              class="flex items-center gap-2 py-1 cursor-pointer"
            >
              <UCheckbox
                :model-value="form.teamIds.includes(t.id)"
                @update:model-value="toggleTeam(t.id)"
              />
              <span class="text-sm">{{ t.name }}</span>
            </label>
          </div>
          <p v-if="form.teamIds.length" class="text-xs text-[var(--ui-text-muted)] mt-2">
            Đã chọn {{ form.teamIds.length }} đội
          </p>
        </div>

        <UButton type="submit" :loading="form.loading" icon="i-lucide-user-plus">
          Tạo tài khoản
        </UButton>
      </form>
    </UCard>

    <!-- User list -->
    <UCard>
      <template #header>
        <span class="font-medium">Danh sách người dùng ({{ users.length }})</span>
      </template>

      <div v-if="pending" class="py-6 text-center">
        <UIcon name="i-lucide-loader-circle" class="animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-[var(--ui-text-muted)] border-b border-[var(--ui-border)]">
              <th class="py-2 pr-4 font-medium">Tên</th>
              <th class="py-2 pr-4 font-medium">Username</th>
              <th class="py-2 pr-4 font-medium">Loại</th>
              <th class="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in users"
              :key="u.id"
              class="border-b border-[var(--ui-border)] last:border-0"
            >
              <td class="py-2 pr-4">{{ u.display_name || '(chưa đặt tên)' }}</td>
              <td class="py-2 pr-4 font-mono text-xs text-[var(--ui-text-muted)]">
                {{ u.username || '—' }}
              </td>
              <td class="py-2 pr-4">
                <UBadge v-if="u.is_admin" size="xs" color="primary" variant="subtle">admin</UBadge>
                <UBadge v-else-if="u.username" size="xs" color="neutral" variant="subtle">username</UBadge>
                <UBadge v-else size="xs" color="neutral" variant="outline">email</UBadge>
              </td>
              <td class="py-2">
                <UButton
                  v-if="!u.is_admin"
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  :loading="deleting === u.id"
                  @click="deleteUser(u)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
