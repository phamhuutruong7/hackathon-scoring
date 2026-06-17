<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()

interface Judge { id: string; name: string; count: number }
interface Team { id: string; name: string; assigned: boolean }

const judges = ref<Judge[]>([])
const selectedJudge = ref<string | null>(null)
const teams = ref<Team[]>([])
const pending = ref(true)
const search = ref('')

async function loadJudges() {
  pending.value = true
  const [{ data: rj }, { data: assigns }] = await Promise.all([
    supabase.from('round_judges').select('user_id, profiles(display_name)').eq('round_id', 1),
    supabase.from('assignments').select('judge_id').eq('round_id', 1),
  ])
  const counts = new Map<string, number>()
  for (const a of assigns ?? []) counts.set(a.judge_id, (counts.get(a.judge_id) ?? 0) + 1)
  judges.value = (rj ?? []).map((r: any) => ({
    id: r.user_id,
    name: r.profiles?.display_name || '(chưa đặt tên)',
    count: counts.get(r.user_id) ?? 0,
  }))
  if (!selectedJudge.value && judges.value.length) selectedJudge.value = judges.value[0]!.id
  pending.value = false
}

async function loadTeamsFor(judgeId: string) {
  const [{ data: allTeams }, { data: mine }] = await Promise.all([
    supabase.from('teams').select('id, name').order('name'),
    supabase.from('assignments').select('team_id').eq('round_id', 1).eq('judge_id', judgeId),
  ])
  const assignedSet = new Set((mine ?? []).map((a) => a.team_id))
  teams.value = (allTeams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    assigned: assignedSet.has(t.id),
  }))
}

onMounted(loadJudges)
watch(selectedJudge, (id) => {
  if (id) loadTeamsFor(id)
})

async function toggle(t: Team, value: boolean) {
  if (!selectedJudge.value) return
  if (value) {
    const { error } = await supabase
      .from('assignments')
      .insert({ round_id: 1, judge_id: selectedJudge.value, team_id: t.id })
    if (error) return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  } else {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('round_id', 1)
      .eq('judge_id', selectedJudge.value)
      .eq('team_id', t.id)
    if (error) return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  }
  await loadJudges()
}

const assignedCount = computed(() => teams.value.filter((t) => t.assigned).length)
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? teams.value.filter((t) => t.name.toLowerCase().includes(q)) : teams.value
})
</script>

<template>
  <div>
    <p class="text-sm text-[var(--ui-text-muted)] mb-3">
      Phân đội cho từng BUL ở Vòng 1. Điểm của BUL là điểm cuối cùng cho đội được phân.
    </p>

    <div v-if="pending" class="py-6 text-center"><UIcon name="i-lucide-loader-circle" class="animate-spin" /></div>
    <div v-else-if="judges.length === 0" class="py-6 text-center text-[var(--ui-text-muted)]">
      Chưa có BUL nào cho Vòng 1. Hãy thêm giám khảo Vòng 1 ở tab “Giám khảo”.
    </div>
    <div v-else class="grid gap-4 md:grid-cols-[260px_1fr]">
      <UCard>
        <template #header><span class="font-medium">BUL (Vòng 1)</span></template>
        <div class="space-y-1">
          <button
            v-for="j in judges"
            :key="j.id"
            class="w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors"
            :class="selectedJudge === j.id ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]' : 'hover:bg-[var(--ui-bg-elevated)]'"
            @click="selectedJudge = j.id"
          >
            <span class="truncate">{{ j.name }}</span>
            <UBadge size="xs" variant="subtle">{{ j.count }}</UBadge>
          </button>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <span class="font-medium">Đội được phân ({{ assignedCount }})</span>
            <UInput v-model="search" icon="i-lucide-search" placeholder="Tìm đội…" size="sm" />
          </div>
        </template>
        <div class="grid sm:grid-cols-2 gap-x-6">
          <label
            v-for="t in filtered"
            :key="t.id"
            class="flex items-center gap-2 py-1.5 cursor-pointer"
          >
            <UCheckbox
              :model-value="t.assigned"
              @update:model-value="(v: boolean) => { t.assigned = v; toggle(t, v) }"
            />
            <span class="text-sm">{{ t.name }}</span>
          </label>
        </div>
      </UCard>
    </div>
  </div>
</template>
