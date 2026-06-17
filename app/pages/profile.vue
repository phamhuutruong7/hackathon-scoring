<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const userId = useUserId()
const { profile, refresh } = useProfile()
const toast = useToast()

const name = ref('')
const saving = ref(false)

watch(
  profile,
  (p) => {
    if (p) name.value = p.display_name ?? ''
  },
  { immediate: true },
)

async function save() {
  if (!userId.value) return
  if (!name.value.trim()) {
    toast.add({ title: 'Tên không được để trống', color: 'warning' })
    return
  }
  saving.value = true
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: name.value.trim() })
    .eq('id', userId.value)
  saving.value = false
  if (error) {
    toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
  } else {
    await refresh()
    toast.add({ title: 'Đã lưu tên hiển thị', color: 'success' })
  }
}
</script>

<template>
  <div class="max-w-md mx-auto">
    <h1 class="text-xl font-semibold mb-4">Hồ sơ của bạn</h1>
    <UCard>
      <div class="space-y-4">
        <UFormField label="Email">
          <UInput :model-value="user?.email ?? ''" disabled class="w-full" />
        </UFormField>
        <UFormField label="Tên hiển thị" help="Tên này sẽ hiển thị cho ban tổ chức.">
          <UInput v-model="name" placeholder="Nguyễn Văn A" class="w-full" />
        </UFormField>
        <UButton :loading="saving" icon="i-lucide-save" @click="save">Lưu</UButton>
      </div>
    </UCard>
  </div>
</template>
