<script setup lang="ts">
import type { Database } from '~/types/database.types'

// Hidden bootstrap page (not linked anywhere). A signed-in user enters the
// secret key to grant themselves admin. The secret is verified inside the
// database (private.app_secrets) by the claim_admin() function.
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { refresh, isAdmin } = useProfile()
const toast = useToast()

const secret = ref('')
const loading = ref(false)

async function claim() {
  if (!user.value) {
    await navigateTo('/login')
    return
  }
  if (!secret.value.trim()) return
  loading.value = true
  const { data, error } = await supabase.rpc('claim_admin', { p_secret: secret.value.trim() })
  loading.value = false

  if (error) {
    toast.add({ title: 'Lỗi', description: error.message, color: 'error' })
    return
  }
  if (data === true) {
    await refresh()
    toast.add({ title: 'Bạn đã trở thành Admin', color: 'success', icon: 'i-lucide-shield-check' })
    await navigateTo('/admin')
  } else {
    toast.add({ title: 'Mã bí mật không đúng', color: 'error' })
  }
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center">
          <UIcon name="i-lucide-shield" class="text-3xl text-[var(--ui-primary)]" />
          <h1 class="text-lg font-semibold mt-1">Kích hoạt quyền Admin</h1>
        </div>
      </template>

      <div v-if="!user" class="text-center text-sm text-[var(--ui-text-muted)]">
        Vui lòng <UButton variant="link" to="/login">đăng nhập</UButton> trước.
      </div>

      <div v-else-if="isAdmin" class="text-center space-y-3">
        <UIcon name="i-lucide-shield-check" class="text-3xl text-[var(--ui-success)]" />
        <p class="text-sm">Tài khoản này đã là Admin.</p>
        <UButton to="/admin" block>Vào trang quản trị</UButton>
      </div>

      <form v-else class="space-y-4" @submit.prevent="claim">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Nhập mã bí mật để cấp quyền admin cho tài khoản
          <strong>{{ user.email }}</strong>.
        </p>
        <UFormField label="Mã bí mật">
          <UInput v-model="secret" type="password" placeholder="••••••••" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="loading" block icon="i-lucide-key">Kích hoạt</UButton>
      </form>
    </UCard>
  </div>
</template>
