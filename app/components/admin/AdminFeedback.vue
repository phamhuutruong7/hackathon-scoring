<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { CRITERIA, BONUS_LABEL } from '~/constants/criteria'

const supabase = useSupabaseClient<Database>()

interface JudgeFeedback {
  name: string
  c1: number
  c2: number
  c3: number
  c4: number
  c5: number
  bonus: number
  total: number
  comment: string | null
}

interface TeamFeedback {
  teamId: string
  teamName: string
  judges: JudgeFeedback[]
}

const round = ref<1 | 2 | 3>(1)
const pending = ref(true)
const teams = ref<TeamFeedback[]>([])

const roundItems = [
  { label: 'Vòng 1', value: 1 },
  { label: 'Vòng 2', value: 2 },
  { label: 'Vòng 3', value: 3 },
]

// Embedded to-one resources may arrive as an object or a single-element array.
function one<T>(v: T | T[] | null): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

async function load() {
  pending.value = true
  const { data } = await supabase
    .from('scores')
    .select('team_id, judge_id, c1, c2, c3, c4, c5, bonus, final_score, comment, teams(name), profiles(display_name)')
    .eq('round_id', round.value)
    .eq('submitted', true)

  const byTeam = new Map<string, TeamFeedback>()
  for (const s of data ?? []) {
    const teamId = s.team_id as string
    const teamName = one<{ name: string | null }>(s.teams as never)?.name ?? '(không rõ)'
    const judgeName = one<{ display_name: string | null }>(s.profiles as never)?.display_name ?? '(chưa đặt tên)'

    let entry = byTeam.get(teamId)
    if (!entry) {
      entry = { teamId, teamName, judges: [] }
      byTeam.set(teamId, entry)
    }
    entry.judges.push({
      name: judgeName,
      c1: Number(s.c1),
      c2: Number(s.c2),
      c3: Number(s.c3),
      c4: Number(s.c4),
      c5: Number(s.c5),
      bonus: Number(s.bonus),
      total: Number(s.final_score),
      comment: s.comment,
    })
  }

  const list = [...byTeam.values()]
  list.sort((a, b) => a.teamName.localeCompare(b.teamName, 'vi'))
  for (const t of list) t.judges.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  teams.value = list
  pending.value = false
}
onMounted(load)
watch(round, load)

const criterionKeys = ['c1', 'c2', 'c3', 'c4', 'c5'] as const

function exportCsv() {
  const header = ['Đội', 'Giám khảo', ...CRITERIA.map((c) => c.label), BONUS_LABEL, 'Tổng', 'Nhận xét']
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines: string[] = []
  for (const t of teams.value) {
    for (const j of t.judges) {
      lines.push([
        q(t.teamName),
        q(j.name),
        j.c1, j.c2, j.c3, j.c4, j.c5,
        j.bonus,
        j.total,
        q(j.comment ?? ''),
      ].join(','))
    }
  }
  const csv = '﻿' + [header.map(q).join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `phan-hoi-vong-${round.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const hasData = computed(() => teams.value.length > 0)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <span class="font-medium">Phản hồi của giám khảo theo vòng</span>
        <div class="flex items-center gap-2">
          <USelect v-model="round" :items="roundItems" value-key="value" size="sm" class="w-32" />
          <UButton size="sm" variant="outline" icon="i-lucide-download" :disabled="!hasData" @click="exportCsv">
            CSV
          </UButton>
          <UButton size="sm" variant="ghost" icon="i-lucide-refresh-cw" @click="load" />
        </div>
      </div>
    </template>

    <div v-if="pending" class="py-6 text-center"><UIcon name="i-lucide-loader-circle" class="animate-spin" /></div>
    <div v-else-if="!hasData" class="py-6 text-center text-[var(--ui-text-muted)]">
      Chưa có đánh giá đã nộp cho vòng này.
    </div>
    <div v-else class="space-y-6">
      <p class="text-xs text-[var(--ui-text-muted)]">
        Cột 1–5:
        <span v-for="(c, i) in CRITERIA" :key="c.key">{{ i + 1 }}. {{ c.label }}<span v-if="i < CRITERIA.length - 1"> · </span></span>
        · Token = {{ BONUS_LABEL }}.
      </p>

      <div v-for="t in teams" :key="t.teamId">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-semibold">{{ t.teamName }}</h3>
          <UBadge size="xs" color="neutral" variant="subtle">{{ t.judges.length }} giám khảo</UBadge>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[var(--ui-text-muted)] border-b border-[var(--ui-border)]">
                <th class="py-2 pr-4 font-medium">Giám khảo</th>
                <th v-for="(c, i) in CRITERIA" :key="c.key" class="py-2 px-2 font-medium text-right w-12">{{ i + 1 }}</th>
                <th class="py-2 px-2 font-medium text-right w-14">Token</th>
                <th class="py-2 px-2 font-medium text-right w-16">Tổng</th>
                <th class="py-2 pl-4 font-medium min-w-64">Nhận xét</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(j, idx) in t.judges"
                :key="idx"
                class="border-b border-[var(--ui-border)] last:border-0 align-top"
              >
                <td class="py-2 pr-4 font-medium whitespace-nowrap">{{ j.name }}</td>
                <td
                  v-for="k in criterionKeys"
                  :key="k"
                  class="py-2 px-2 text-right tabular-nums"
                >
                  {{ Number(j[k]).toFixed(0) }}
                </td>
                <td class="py-2 px-2 text-right tabular-nums text-[var(--ui-text-muted)]">{{ Number(j.bonus).toFixed(1) }}</td>
                <td class="py-2 px-2 text-right font-semibold tabular-nums">{{ Number(j.total).toFixed(2) }}</td>
                <td class="py-2 pl-4 whitespace-pre-wrap">
                  <span v-if="j.comment">{{ j.comment }}</span>
                  <span v-else class="text-[var(--ui-text-dimmed)]">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </UCard>
</template>
