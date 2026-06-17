<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()

interface Team { id: string; name: string; inRound: boolean }

const round = ref<1 | 2 | 3>(1)
const teams = ref<Team[]>([])
const pending = ref(true)
const search = ref('')

async function load() {
  pending.value = true

  // Source pool: all teams for R1, previous round's teams for R2/R3
  const sourcePromise =
    round.value === 1
      ? supabase.from('teams').select('id, name').order('name')
      : supabase
          .from('round_teams')
          .select('team_id, teams!inner(id, name)')
          .eq('round_id', round.value - 1)
          .order('teams(name)')

  const [{ data: source }, { data: rt }] = await Promise.all([
    sourcePromise,
    supabase.from('round_teams').select('team_id').eq('round_id', round.value),
  ])

  const inSet = new Set((rt ?? []).map((r) => r.team_id))

  if (round.value === 1) {
    teams.value = ((source ?? []) as any[]).map((t) => ({
      id: t.id,
      name: t.name,
      inRound: inSet.has(t.id),
    }))
  } else {
    teams.value = ((source ?? []) as any[]).map((t) => ({
      id: t.teams.id,
      name: t.teams.name,
      inRound: inSet.has(t.teams.id),
    }))
  }

  pending.value = false
}
onMounted(load)
watch(round, load)

async function toggle(t: Team, value: boolean) {
  if (value) {
    const { error } = await supabase
      .from('round_teams')
      .insert({ round_id: round.value, team_id: t.id })
    if (error) return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
    t.inRound = true
  } else {
    // Cascade: removing from round N also removes from all later rounds
    const laterRounds = ([1, 2, 3] as const).filter((r) => r >= round.value)
    const { error } = await supabase
      .from('round_teams')
      .delete()
      .eq('team_id', t.id)
      .in('round_id', laterRounds)
    if (error) return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
    t.inRound = false
  }
}

const inCount = computed(() => teams.value.filter((t) => t.inRound).length)
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? teams.value.filter((t) => t.name.toLowerCase().includes(q)) : teams.value
})

const roundItems = [
  { label: 'Vòng 1 (Sơ loại)', value: 1 },
  { label: 'Vòng 2 (Bán kết)', value: 2 },
  { label: 'Vòng 3 (Chung kết)', value: 3 },
]

const roundHint: Record<number, string> = {
  1: 'Chọn các đội tham gia Vòng 1. Bỏ chọn sẽ tự động xoá khỏi Vòng 2 và 3.',
  2: 'Chọn đội từ Vòng 1 đi tiếp vào Vòng 2 (Bán kết). Bỏ chọn sẽ tự động xoá khỏi Vòng 3.',
  3: 'Chọn đội từ Vòng 2 đi vào Vòng 3 (Chung kết).',
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <span class="font-medium">Chọn đội vào vòng</span>
        <div class="flex items-center gap-2">
          <USelect v-model="round" :items="roundItems" value-key="value" size="sm" class="w-52" />
          <UInput v-model="search" icon="i-lucide-search" placeholder="Tìm đội…" size="sm" />
        </div>
      </div>
    </template>

    <p class="text-sm text-[var(--ui-text-muted)] mb-3">
      {{ roundHint[round] }} Đã chọn: <strong>{{ inCount }}</strong> đội.
    </p>

    <div v-if="pending" class="py-6 text-center">
      <UIcon name="i-lucide-loader-circle" class="animate-spin" />
    </div>
    <div v-else-if="teams.length === 0" class="py-6 text-center text-[var(--ui-text-muted)]">
      {{ round === 1 ? 'Chưa có đội nào.' : `Chưa có đội nào trong Vòng ${round - 1}.` }}
    </div>
    <div v-else class="grid sm:grid-cols-2 gap-x-6">
      <label v-for="t in filtered" :key="t.id" class="flex items-center gap-2 py-1.5 cursor-pointer">
        <UCheckbox
          :model-value="t.inRound"
          @update:model-value="(v: boolean) => toggle(t, v)"
        />
        <span class="text-sm">{{ t.name }}</span>
      </label>
    </div>
  </UCard>
</template>
