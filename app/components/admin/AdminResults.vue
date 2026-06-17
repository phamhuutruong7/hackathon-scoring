<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()

interface RankRow {
  rank: number | null
  team_name: string | null
  avg_score: number | null
  judge_count: number | null
  team_id: string | null
}

const round = ref<1 | 2 | 3>(1)
const rows = ref<RankRow[]>([])
const pending = ref(true)

const roundItems = [
  { label: 'Vòng 1', value: 1 },
  { label: 'Vòng 2', value: 2 },
  { label: 'Vòng 3', value: 3 },
]

async function load() {
  pending.value = true
  const { data } = await supabase
    .from('v_round_rankings')
    .select('rank, team_name, avg_score, judge_count, team_id')
    .eq('round_id', round.value)
    .order('rank', { ascending: true })
  rows.value = data ?? []
  pending.value = false
}
onMounted(load)
watch(round, load)

function exportCsv() {
  const header = ['Hạng', 'Đội', 'Điểm trung bình', 'Số giám khảo']
  const lines = rows.value.map((r) => [
    r.rank ?? '',
    `"${(r.team_name ?? '').replace(/"/g, '""')}"`,
    r.avg_score ?? '',
    r.judge_count ?? 0,
  ].join(','))
  const csv = '﻿' + [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ket-qua-vong-${round.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <span class="font-medium">Kết quả & xếp hạng</span>
        <div class="flex items-center gap-2">
          <USelect v-model="round" :items="roundItems" value-key="value" size="sm" class="w-32" />
          <UButton size="sm" variant="outline" icon="i-lucide-download" :disabled="rows.length === 0" @click="exportCsv">
            CSV
          </UButton>
          <UButton size="sm" variant="ghost" icon="i-lucide-refresh-cw" @click="load" />
        </div>
      </div>
    </template>

    <div v-if="pending" class="py-6 text-center"><UIcon name="i-lucide-loader-circle" class="animate-spin" /></div>
    <div v-else-if="rows.length === 0" class="py-6 text-center text-[var(--ui-text-muted)]">
      Chưa có dữ liệu cho vòng này.
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-[var(--ui-text-muted)] border-b border-[var(--ui-border)]">
            <th class="py-2 pr-4 font-medium w-16">Hạng</th>
            <th class="py-2 pr-4 font-medium">Đội</th>
            <th class="py-2 px-2 font-medium text-right">Điểm TB</th>
            <th class="py-2 px-2 font-medium text-right">Số GK</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.team_id ?? ''"
            class="border-b border-[var(--ui-border)] last:border-0"
            :class="{ 'bg-[var(--ui-warning)]/5': (r.rank ?? 99) <= 3 && r.avg_score != null }"
          >
            <td class="py-2 pr-4 font-semibold tabular-nums">
              <span v-if="r.avg_score != null">{{ r.rank }}</span>
              <span v-else class="text-[var(--ui-text-dimmed)]">–</span>
            </td>
            <td class="py-2 pr-4">{{ r.team_name }}</td>
            <td class="py-2 px-2 text-right font-semibold tabular-nums">
              {{ r.avg_score != null ? Number(r.avg_score).toFixed(2) : '—' }}
            </td>
            <td class="py-2 px-2 text-right tabular-nums text-[var(--ui-text-muted)]">
              {{ r.judge_count ?? 0 }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
