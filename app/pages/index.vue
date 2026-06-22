<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const userId = useUserId()
const { profile } = useProfile()

interface RoundCard {
  id: number
  name: string
  status: string
  total: number
  done: number
}

const rounds = ref<RoundCard[]>([])
const pending = ref(true)

async function load() {
  if (!userId.value) return
  pending.value = true
  const uid = userId.value

  // Rounds this user is a judge for
  const { data: rj } = await supabase
    .from('round_judges')
    .select('round_id, rounds(id, name, status)')
    .eq('user_id', uid)

  const cards: RoundCard[] = []
  for (const row of rj ?? []) {
    const r = (row as any).rounds
    if (!r) continue

    // Teams assigned to this judge in the round (all rounds use assignments)
    const { count } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', r.id)
      .eq('judge_id', uid)
    const total = count ?? 0

    const { count: done } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', r.id)
      .eq('judge_id', uid)
      .eq('submitted', true)

    cards.push({ id: r.id, name: r.name, status: r.status, total, done: done ?? 0 })
  }
  cards.sort((a, b) => a.id - b.id)
  rounds.value = cards
  pending.value = false
}

watch(userId, () => load(), { immediate: true })

function statusBadge(s: string) {
  return s === 'open'
    ? { label: 'Đang mở', color: 'success' as const }
    : s === 'closed'
      ? { label: 'Đã đóng', color: 'neutral' as const }
      : { label: 'Chưa mở', color: 'warning' as const }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">Xin chào, {{ profile?.display_name || 'bạn' }} 👋</h1>
      <p class="text-[var(--ui-text-muted)]">Chọn vòng chấm điểm bên dưới.</p>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-2xl animate-spin" />
    </div>

    <div v-else-if="rounds.length === 0" class="text-center py-16">
      <UIcon name="i-lucide-inbox" class="text-4xl text-[var(--ui-text-muted)]" />
      <p class="mt-2 text-[var(--ui-text-muted)]">
        Bạn chưa được phân công chấm vòng nào. Vui lòng liên hệ ban tổ chức.
      </p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <UCard v-for="r in rounds" :key="r.id">
        <div class="flex items-start justify-between">
          <div>
            <div class="font-medium">{{ r.name }}</div>
            <UBadge
              :color="statusBadge(r.status).color"
              variant="subtle"
              size="sm"
              class="mt-1"
            >
              {{ statusBadge(r.status).label }}
            </UBadge>
          </div>
          <div class="text-right">
            <div class="text-2xl font-semibold">{{ r.done }}/{{ r.total }}</div>
            <div class="text-xs text-[var(--ui-text-muted)]">đội đã chấm</div>
          </div>
        </div>
        <template #footer>
          <UButton
            :to="`/score/${r.id}`"
            block
            :color="r.status === 'open' ? 'primary' : 'neutral'"
            :variant="r.status === 'open' ? 'solid' : 'outline'"
            trailing-icon="i-lucide-arrow-right"
          >
            {{ r.status === 'open' ? 'Chấm điểm' : 'Xem' }}
          </UButton>
        </template>
      </UCard>
    </div>
  </div>
</template>
