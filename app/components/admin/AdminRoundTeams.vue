<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()

interface Team { id: string; name: string; inRound: boolean }

const round = ref<2 | 3>(2)
const teams = ref<Team[]>([])
const pending = ref(true)
const search = ref('')

async function load() {
  pending.value = true
  const [{ data: allTeams }, { data: rt }] = await Promise.all([
    supabase.from('teams').select('id, name').order('name'),
    supabase.from('round_teams').select('team_id').eq('round_id', round.value),
  ])
  const inSet = new Set((rt ?? []).map((r) => r.team_id))
  teams.value = (allTeams ?? []).map((t) => ({ id: t.id, name: t.name, inRound: inSet.has(t.id) }))
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
  } else {
    const { error } = await supabase
      .from('round_teams')
      .delete()
      .eq('round_id', round.value)
      .eq('team_id', t.id)
    if (error) return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  }
}

const inCount = computed(() => teams.value.filter((t) => t.inRound).length)
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? teams.value.filter((t) => t.name.toLowerCase().includes(q)) : teams.value
})
const roundItems = [
  { label: 'Vòng 2 (Bán kết)', value: 2 },
  { label: 'Vòng 3 (Chung kết)', value: 3 },
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <span class="font-medium">Chọn đội vào vòng</span>
        <div class="flex items-center gap-2">
          <USelect v-model="round" :items="roundItems" value-key="value" size="sm" class="w-44" />
          <UInput v-model="search" icon="i-lucide-search" placeholder="Tìm đội…" size="sm" />
        </div>
      </div>
    </template>

    <p class="text-sm text-[var(--ui-text-muted)] mb-3">
      Vòng 1 tự động gồm tất cả các đội. Ở đây chọn các đội đi tiếp vào
      <strong>Vòng {{ round }}</strong>. Đã chọn: <strong>{{ inCount }}</strong> đội.
    </p>

    <div v-if="pending" class="py-6 text-center"><UIcon name="i-lucide-loader-circle" class="animate-spin" /></div>
    <div v-else class="grid sm:grid-cols-2 gap-x-6">
      <label v-for="t in filtered" :key="t.id" class="flex items-center gap-2 py-1.5 cursor-pointer">
        <UCheckbox
          :model-value="t.inRound"
          @update:model-value="(v: boolean) => { t.inRound = v; toggle(t, v) }"
        />
        <span class="text-sm">{{ t.name }}</span>
      </label>
    </div>
  </UCard>
</template>
