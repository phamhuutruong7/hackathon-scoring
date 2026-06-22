<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()

interface Judge { id: string; name: string; count: number }
interface Team { id: string; name: string; assigned: boolean }

const round = ref<1 | 2 | 3>(1)
const judges = ref<Judge[]>([])
const selectedJudge = ref<string | null>(null)
const teams = ref<Team[]>([])
const pending = ref(true)
const search = ref('')

const roundItems = [
  { label: 'Vòng 1 (Sơ loại)', value: 1 },
  { label: 'Vòng 2 (Bán kết)', value: 2 },
  { label: 'Vòng 3 (Chung kết)', value: 3 },
]

const roundHint: Record<number, string> = {
  1: 'Phân đội cho từng giám khảo (BUL) ở Vòng 1. Điểm của BUL là điểm cuối cùng cho đội được phân.',
  2: 'Phân đội Vòng 2 (Bán kết) cho từng giám khảo. Chỉ các đội đã chọn vào Vòng 2 ở tab “Chọn đội vào vòng” mới xuất hiện.',
  3: 'Phân đội Vòng 3 (Chung kết) cho từng giám khảo. Chỉ các đội đã chọn vào Vòng 3 ở tab “Chọn đội vào vòng” mới xuất hiện.',
}

async function loadJudges() {
  pending.value = true
  const [{ data: rj }, { data: assigns }] = await Promise.all([
    supabase.from('round_judges').select('user_id, profiles(display_name)').eq('round_id', round.value),
    supabase.from('assignments').select('judge_id').eq('round_id', round.value),
  ])
  const counts = new Map<string, number>()
  for (const a of assigns ?? []) counts.set(a.judge_id, (counts.get(a.judge_id) ?? 0) + 1)
  judges.value = (rj ?? []).map((r: any) => ({
    id: r.user_id,
    name: r.profiles?.display_name || '(chưa đặt tên)',
    count: counts.get(r.user_id) ?? 0,
  }))
  // Keep the current judge selected if still valid for this round, else pick the first.
  if (!judges.value.some((j) => j.id === selectedJudge.value)) {
    selectedJudge.value = judges.value[0]?.id ?? null
  }
  if (selectedJudge.value) await loadTeamsFor(selectedJudge.value)
  else teams.value = []
  pending.value = false
}

async function loadTeamsFor(judgeId: string) {
  // Pool of assignable teams: all teams for R1, the round's selected teams for R2/R3.
  const poolPromise =
    round.value === 1
      ? supabase.from('teams').select('id, name').order('name')
      : supabase
          .from('round_teams')
          .select('teams!inner(id, name)')
          .eq('round_id', round.value)
          .order('teams(name)')

  const [{ data: pool }, { data: mine }] = await Promise.all([
    poolPromise,
    supabase.from('assignments').select('team_id').eq('round_id', round.value).eq('judge_id', judgeId),
  ])
  const assignedSet = new Set((mine ?? []).map((a) => a.team_id))
  const list =
    round.value === 1
      ? ((pool ?? []) as any[]).map((t) => ({ id: t.id, name: t.name }))
      : ((pool ?? []) as any[]).map((row) => ({ id: row.teams.id, name: row.teams.name }))
  teams.value = list.map((t) => ({ id: t.id, name: t.name, assigned: assignedSet.has(t.id) }))
}

onMounted(loadJudges)
watch(round, () => loadJudges())

function selectJudge(id: string) {
  selectedJudge.value = id
  loadTeamsFor(id)
}

async function toggle(t: Team, value: boolean) {
  const jid = selectedJudge.value
  if (!jid) return
  if (value) {
    const { error } = await supabase
      .from('assignments')
      .insert({ round_id: round.value, judge_id: jid, team_id: t.id })
    if (error) {
      t.assigned = false
      return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
    }
  } else {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('round_id', round.value)
      .eq('judge_id', jid)
      .eq('team_id', t.id)
    if (error) {
      t.assigned = true
      return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
    }
  }
  const j = judges.value.find((x) => x.id === jid)
  if (j) j.count += value ? 1 : -1
}

const assignedCount = computed(() => teams.value.filter((t) => t.assigned).length)
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? teams.value.filter((t) => t.name.toLowerCase().includes(q)) : teams.value
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
      <p class="text-sm text-[var(--ui-text-muted)] max-w-2xl">{{ roundHint[round] }}</p>
      <USelect v-model="round" :items="roundItems" value-key="value" size="sm" class="w-52 shrink-0" />
    </div>

    <div v-if="pending" class="py-6 text-center"><UIcon name="i-lucide-loader-circle" class="animate-spin" /></div>
    <div v-else-if="judges.length === 0" class="py-6 text-center text-[var(--ui-text-muted)]">
      Chưa có giám khảo nào cho Vòng {{ round }}. Hãy thêm giám khảo ở tab “Giám khảo”.
    </div>
    <div v-else class="grid gap-4 md:grid-cols-[260px_1fr]">
      <UCard>
        <template #header><span class="font-medium">Giám khảo (Vòng {{ round }})</span></template>
        <div class="space-y-1">
          <button
            v-for="j in judges"
            :key="j.id"
            class="w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors"
            :class="selectedJudge === j.id ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]' : 'hover:bg-[var(--ui-bg-elevated)]'"
            @click="selectJudge(j.id)"
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
        <div v-if="teams.length === 0" class="py-6 text-center text-[var(--ui-text-muted)]">
          {{ round === 1
            ? 'Chưa có đội nào.'
            : `Chưa có đội nào trong Vòng ${round}. Hãy chọn đội ở tab “Chọn đội vào vòng”.` }}
        </div>
        <div v-else class="grid sm:grid-cols-2 gap-x-6">
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
