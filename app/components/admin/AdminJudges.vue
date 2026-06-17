<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()

interface UserRow {
  id: string
  display_name: string | null
  is_admin: boolean
  r1: boolean
  r2: boolean
  r3: boolean
}

const users = ref<UserRow[]>([])
const pending = ref(true)
const search = ref('')

async function load() {
  pending.value = true
  const [{ data: profiles }, { data: rj }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, is_admin').order('display_name'),
    supabase.from('round_judges').select('round_id, user_id'),
  ])
  const judgeSet = new Set((rj ?? []).map((r) => `${r.round_id}:${r.user_id}`))
  users.value = (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    is_admin: p.is_admin,
    r1: judgeSet.has(`1:${p.id}`),
    r2: judgeSet.has(`2:${p.id}`),
    r3: judgeSet.has(`3:${p.id}`),
  }))
  pending.value = false
}
onMounted(load)

async function toggle(u: UserRow, round: number, value: boolean) {
  if (value) {
    const { error } = await supabase
      .from('round_judges')
      .insert({ round_id: round, user_id: u.id })
    if (error) toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  } else {
    const { error } = await supabase
      .from('round_judges')
      .delete()
      .eq('round_id', round)
      .eq('user_id', u.id)
    if (error) toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) => (u.display_name ?? '').toLowerCase().includes(q))
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <span class="font-medium">Phân công giám khảo theo vòng</span>
        <UInput v-model="search" icon="i-lucide-search" placeholder="Tìm theo tên…" size="sm" />
      </div>
    </template>

    <div v-if="pending" class="py-6 text-center"><UIcon name="i-lucide-loader-circle" class="animate-spin" /></div>
    <div v-else>
      <p class="text-sm text-[var(--ui-text-muted)] mb-3">
        Vòng 1 = Business Unit Leaders (cần phân đội ở tab kế tiếp). Vòng 2 & 3 = giám khảo chấm tất cả các đội trong vòng.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-[var(--ui-text-muted)] border-b border-[var(--ui-border)]">
              <th class="py-2 pr-4 font-medium">Người dùng</th>
              <th class="py-2 px-2 font-medium text-center">Vòng 1 (BUL)</th>
              <th class="py-2 px-2 font-medium text-center">Vòng 2</th>
              <th class="py-2 px-2 font-medium text-center">Vòng 3</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id" class="border-b border-[var(--ui-border)] last:border-0">
              <td class="py-2 pr-4">
                {{ u.display_name || '(chưa đặt tên)' }}
                <UBadge v-if="u.is_admin" size="xs" color="primary" variant="subtle" class="ml-1">admin</UBadge>
              </td>
              <td class="py-2 px-2 text-center">
                <USwitch v-model="u.r1" @update:model-value="(v: boolean) => toggle(u, 1, v)" />
              </td>
              <td class="py-2 px-2 text-center">
                <USwitch v-model="u.r2" @update:model-value="(v: boolean) => toggle(u, 2, v)" />
              </td>
              <td class="py-2 px-2 text-center">
                <USwitch v-model="u.r3" @update:model-value="(v: boolean) => toggle(u, 3, v)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </UCard>
</template>
