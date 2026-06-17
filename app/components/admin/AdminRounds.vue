<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()

interface Round { id: number; name: string; status: string }
const rounds = ref<Round[]>([])
const pending = ref(true)

const statusItems = [
  { label: 'Chưa mở (draft)', value: 'draft' },
  { label: 'Đang mở (open)', value: 'open' },
  { label: 'Đã đóng (closed)', value: 'closed' },
]

async function load() {
  pending.value = true
  const { data } = await supabase.from('rounds').select('id, name, status').order('id')
  rounds.value = data ?? []
  pending.value = false
}
onMounted(load)

async function setStatus(r: Round, status: string) {
  const { error } = await supabase.from('rounds').update({ status }).eq('id', r.id)
  if (error) toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  else toast.add({ title: `${r.name}: ${status}`, color: 'success' })
}
</script>

<template>
  <UCard>
    <template #header><span class="font-medium">Trạng thái các vòng</span></template>
    <p class="text-sm text-[var(--ui-text-muted)] mb-3">
      Giám khảo chỉ có thể chấm khi vòng ở trạng thái <strong>Đang mở</strong>.
    </p>
    <div v-if="pending" class="py-6 text-center"><UIcon name="i-lucide-loader-circle" class="animate-spin" /></div>
    <div v-else class="space-y-3">
      <div
        v-for="r in rounds"
        :key="r.id"
        class="flex items-center justify-between gap-3 py-2 border-b border-[var(--ui-border)] last:border-0"
      >
        <span class="font-medium">{{ r.name }}</span>
        <USelect
          :model-value="r.status"
          :items="statusItems"
          value-key="value"
          class="w-52"
          @update:model-value="(v: string) => setStatus(r, v)"
        />
      </div>
    </div>
  </UCard>
</template>
