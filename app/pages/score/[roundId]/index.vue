<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const userId = useUserId()
const route = useRoute()
const roundId = Number(route.params.roundId)

interface TeamRow {
  id: string
  name: string
  final: number | null
  submitted: boolean
}

const round = ref<{ id: number; name: string; status: string } | null>(null)
const teams = ref<TeamRow[]>([])
const pending = ref(true)

async function load() {
  if (!userId.value) return
  pending.value = true
  const uid = userId.value

  const { data: r } = await supabase
    .from('rounds')
    .select('id, name, status')
    .eq('id', roundId)
    .single()
  round.value = r

  // Teams this judge is assigned to score in this round (all rounds use assignments)
  const { data: assigned } = await supabase
    .from('assignments')
    .select('teams(id, name)')
    .eq('round_id', roundId)
    .eq('judge_id', uid)
  const teamList: { id: string; name: string }[] = (assigned ?? [])
    .map((row: any) => row.teams)
    .filter(Boolean)

  // My existing scores for this round
  const { data: myScores } = await supabase
    .from('scores')
    .select('team_id, final_score, submitted')
    .eq('round_id', roundId)
    .eq('judge_id', uid)
  const byTeam = new Map((myScores ?? []).map((s) => [s.team_id, s]))

  teams.value = teamList
    .map((t) => {
      const s = byTeam.get(t.id)
      return {
        id: t.id,
        name: t.name,
        final: s?.submitted ? (s.final_score as number) : null,
        submitted: s?.submitted ?? false,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  pending.value = false
}

watch(userId, () => load(), { immediate: true })

const doneCount = computed(() => teams.value.filter((t) => t.submitted).length)
</script>

<template>
  <div>
    <UButton to="/" variant="link" icon="i-lucide-arrow-left" class="mb-2 -ml-2">Trang chủ</UButton>

    <div v-if="round" class="mb-4 flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold">{{ round.name }}</h1>
        <p class="text-sm text-[var(--ui-text-muted)]">
          Đã chấm {{ doneCount }}/{{ teams.length }} đội
        </p>
      </div>
      <UBadge
        :color="round.status === 'open' ? 'success' : round.status === 'closed' ? 'neutral' : 'warning'"
        variant="subtle"
      >
        {{ round.status === 'open' ? 'Đang mở' : round.status === 'closed' ? 'Đã đóng' : 'Chưa mở' }}
      </UBadge>
    </div>

    <UAlert
      v-if="round && round.status !== 'open'"
      class="mb-4"
      color="warning"
      variant="soft"
      icon="i-lucide-lock"
      description="Vòng này hiện không mở để chấm. Bạn chỉ có thể xem."
    />

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-2xl animate-spin" />
    </div>

    <div v-else-if="teams.length === 0" class="text-center py-16 text-[var(--ui-text-muted)]">
      Không có đội nào để chấm trong vòng này.
    </div>

    <div v-else class="divide-y divide-[var(--ui-border)] rounded-lg border border-[var(--ui-border)] overflow-hidden">
      <NuxtLink
        v-for="t in teams"
        :key="t.id"
        :to="`/score/${roundId}/${t.id}`"
        class="flex items-center justify-between px-4 py-3 hover:bg-[var(--ui-bg-elevated)] transition-colors"
      >
        <div class="flex items-center gap-3">
          <UIcon
            :name="t.submitted ? 'i-lucide-check-circle' : 'i-lucide-circle'"
            :class="t.submitted ? 'text-[var(--ui-success)]' : 'text-[var(--ui-text-dimmed)]'"
          />
          <span class="font-medium">{{ t.name }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="t.submitted" class="text-sm font-semibold tabular-nums">
            {{ t.final?.toFixed(2) }}
          </span>
          <span v-else class="text-xs text-[var(--ui-text-muted)]">Chưa chấm</span>
          <UIcon name="i-lucide-chevron-right" class="text-[var(--ui-text-dimmed)]" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
