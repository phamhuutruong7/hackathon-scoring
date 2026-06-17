<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const toast = useToast()

interface Team { id: string; name: string }
const teams = ref<Team[]>([])
const newName = ref('')
const bulkNames = ref('')
const adding = ref(false)
const pending = ref(true)

async function load() {
  pending.value = true
  const { data } = await supabase.from('teams').select('id, name').order('name')
  teams.value = data ?? []
  pending.value = false
}
onMounted(load)

async function addOne() {
  const name = newName.value.trim()
  if (!name) return
  adding.value = true
  const { error } = await supabase.from('teams').insert({ name })
  adding.value = false
  if (error) return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  newName.value = ''
  await load()
}

async function addBulk() {
  const names = bulkNames.value
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean)
  if (names.length === 0) return
  adding.value = true
  const { error } = await supabase.from('teams').insert(names.map((name) => ({ name })))
  adding.value = false
  if (error) return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  bulkNames.value = ''
  toast.add({ title: `Đã thêm ${names.length} đội`, color: 'success' })
  await load()
}

async function rename(t: Team) {
  const name = t.name.trim()
  if (!name) return
  const { error } = await supabase.from('teams').update({ name }).eq('id', t.id)
  if (error) toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  else toast.add({ title: 'Đã đổi tên', color: 'success' })
}

async function remove(t: Team) {
  if (!confirm(`Xóa đội "${t.name}"? Mọi điểm liên quan sẽ bị xóa.`)) return
  const { error } = await supabase.from('teams').delete().eq('id', t.id)
  if (error) return toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  await load()
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-2">
      <UCard>
        <template #header><span class="font-medium">Thêm 1 đội</span></template>
        <div class="flex gap-2">
          <UInput v-model="newName" placeholder="Tên đội" class="flex-1" @keyup.enter="addOne" />
          <UButton :loading="adding" icon="i-lucide-plus" @click="addOne">Thêm</UButton>
        </div>
      </UCard>
      <UCard>
        <template #header><span class="font-medium">Thêm nhiều đội (mỗi dòng 1 tên)</span></template>
        <UTextarea v-model="bulkNames" :rows="3" class="w-full" placeholder="Đội A&#10;Đội B&#10;Đội C" />
        <UButton class="mt-2" :loading="adding" icon="i-lucide-list-plus" @click="addBulk">
          Thêm danh sách
        </UButton>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">Danh sách đội</span>
          <UBadge variant="subtle">{{ teams.length }} đội</UBadge>
        </div>
      </template>
      <div v-if="pending" class="py-6 text-center"><UIcon name="i-lucide-loader-circle" class="animate-spin" /></div>
      <div v-else-if="teams.length === 0" class="py-6 text-center text-[var(--ui-text-muted)]">Chưa có đội nào.</div>
      <div v-else class="divide-y divide-[var(--ui-border)]">
        <div v-for="t in teams" :key="t.id" class="flex items-center gap-2 py-2">
          <UInput v-model="t.name" class="flex-1" @blur="rename(t)" @keyup.enter="rename(t)" />
          <UButton color="error" variant="ghost" icon="i-lucide-trash-2" @click="remove(t)" />
        </div>
      </div>
    </UCard>
  </div>
</template>
