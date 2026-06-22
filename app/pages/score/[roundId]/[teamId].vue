<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { CRITERIA, BONUS_MAX, CRITERION_MAX, computeFinal } from '~/constants/criteria'

const supabase = useSupabaseClient<Database>()
const userId = useUserId()
const route = useRoute()
const toast = useToast()

const roundId = Number(route.params.roundId)
const teamId = route.params.teamId as string

const round = ref<{ name: string; status: string } | null>(null)
const teamName = ref('')
const pending = ref(true)
const saving = ref(false)
const alreadySubmitted = ref(false)

const form = reactive({
  c1: 0,
  c2: 0,
  c3: 0,
  c4: 0,
  c5: 0,
  bonus: 0,
  comment: '',
})

const final = computed(() => computeFinal(form))
const editable = computed(() => round.value?.status === 'open')

async function load() {
  if (!userId.value) return
  pending.value = true

  const [{ data: r }, { data: t }, { data: s }] = await Promise.all([
    supabase.from('rounds').select('name, status').eq('id', roundId).single(),
    supabase.from('teams').select('name').eq('id', teamId).single(),
    supabase
      .from('scores')
      .select('*')
      .eq('round_id', roundId)
      .eq('team_id', teamId)
      .eq('judge_id', userId.value)
      .maybeSingle(),
  ])

  round.value = r
  teamName.value = t?.name ?? '(không rõ)'
  if (s) {
    form.c1 = Number(s.c1)
    form.c2 = Number(s.c2)
    form.c3 = Number(s.c3)
    form.c4 = Number(s.c4)
    form.c5 = Number(s.c5)
    form.bonus = Number(s.bonus)
    form.comment = s.comment ?? ''
    alreadySubmitted.value = s.submitted
  }
  pending.value = false
}

watch(userId, () => load(), { immediate: true })

function clamp(v: number, max: number) {
  if (Number.isNaN(v)) return 0
  return Math.min(max, Math.max(0, v))
}

async function save(submit: boolean) {
  if (!userId.value) return
  // Normalize ranges before sending
  for (const c of CRITERIA) form[c.key] = clamp(form[c.key], CRITERION_MAX)
  form.bonus = clamp(form.bonus, BONUS_MAX)

  saving.value = true
  const { error } = await supabase.from('scores').upsert(
    {
      round_id: roundId,
      team_id: teamId,
      judge_id: userId.value,
      c1: form.c1,
      c2: form.c2,
      c3: form.c3,
      c4: form.c4,
      c5: form.c5,
      bonus: form.bonus,
      comment: form.comment || null,
      submitted: submit,
    },
    { onConflict: 'round_id,team_id,judge_id' },
  )
  saving.value = false

  if (error) {
    toast.add({ title: 'Lỗi khi lưu', description: error.message, color: 'error' })
    return
  }
  if (submit) alreadySubmitted.value = true
  toast.add({
    title: submit ? 'Đã nộp điểm' : 'Đã lưu nháp',
    color: 'success',
    icon: 'i-lucide-check',
  })
  if (submit) await navigateTo(`/score/${roundId}`)
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <UButton :to="`/score/${roundId}`" variant="link" icon="i-lucide-arrow-left" class="mb-2 -ml-2">
      Danh sách đội
    </UButton>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-2xl animate-spin" />
    </div>

    <template v-else>
      <div class="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 class="text-xl font-semibold">{{ teamName }}</h1>
          <p class="text-sm text-[var(--ui-text-muted)]">{{ round?.name }}</p>
        </div>
        <UBadge v-if="alreadySubmitted" color="success" variant="subtle" icon="i-lucide-check">
          Đã nộp
        </UBadge>
      </div>

      <UAlert
        v-if="!editable"
        class="mb-4"
        color="warning"
        variant="soft"
        icon="i-lucide-lock"
        description="Vòng này không mở để chấm. Bạn chỉ có thể xem điểm."
      />

      <UCard>
        <div class="space-y-6">
          <div v-for="(c, i) in CRITERIA" :key="c.key">
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium">{{ i + 1 }}. {{ c.label }}</label>
              <span class="text-xs text-[var(--ui-text-muted)]">0–{{ CRITERION_MAX }} · 20%</span>
            </div>
            <div class="flex items-center gap-3">
              <USlider
                v-model="form[c.key]"
                :min="0"
                :max="CRITERION_MAX"
                :step="1"
                :disabled="!editable"
                class="flex-1"
              />
              <UInput
                v-model.number="form[c.key]"
                type="number"
                :min="0"
                :max="CRITERION_MAX"
                :disabled="!editable"
                class="w-20"
              />
            </div>
          </div>

          <div class="pt-2 border-t border-[var(--ui-border)]">
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium">Khả năng saving token của AI Agent (tùy chọn)</label>
              <span class="text-xs text-[var(--ui-text-muted)]">0–10</span>
            </div>
            <div class="flex items-center gap-3">
              <USlider
                v-model="form.bonus"
                :min="0"
                :max="10"
                :step="0.5"
                :disabled="!editable"
                class="flex-1"
              />
              <UInput
                v-model.number="form.bonus"
                type="number"
                :min="0"
                :max="10"
                :step="0.5"
                :disabled="!editable"
                class="w-20"
              />
            </div>
          </div>

          <UFormField label="Nhận xét (tùy chọn)">
            <UTextarea
              v-model="form.comment"
              :rows="3"
              :disabled="!editable"
              class="w-full"
              placeholder="Ghi chú cho đội này…"
            />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-xs text-[var(--ui-text-muted)]">Điểm tổng (TB 5 tiêu chí + thưởng)</div>
              <div class="text-2xl font-bold tabular-nums text-[var(--ui-primary)]">
                {{ final.toFixed(2) }}
              </div>
            </div>
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="outline"
                :disabled="!editable"
                :loading="saving"
                icon="i-lucide-save"
                @click="save(false)"
              >
                Lưu nháp
              </UButton>
              <UButton
                color="primary"
                :disabled="!editable"
                :loading="saving"
                icon="i-lucide-send"
                @click="save(true)"
              >
                Nộp điểm
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
