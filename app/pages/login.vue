<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const info = ref('')

// If already logged in, leave the login page.
watchEffect(() => {
  if (user.value) navigateTo('/')
})

async function submit() {
  info.value = ''
  if (!email.value || !password.value) {
    toast.add({ title: 'Nhập email và mật khẩu', color: 'warning' })
    return
  }
  loading.value = true
  try {
    if (mode.value === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: { display_name: displayName.value || undefined },
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      })
      if (error) throw error

      // If a display name was provided, save it to the profile (once session exists).
      if (data.session && displayName.value) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName.value })
          .eq('id', data.session.user.id)
      }

      if (!data.session) {
        info.value =
          'Tài khoản đã được tạo. Vui lòng kiểm tra email để xác nhận, sau đó đăng nhập.'
        mode.value = 'signin'
      } else {
        await navigateTo('/')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      await navigateTo('/')
    }
  } catch (e: any) {
    toast.add({ title: 'Lỗi', description: e.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center">
          <UIcon name="i-lucide-trophy" class="text-3xl text-[var(--ui-primary)]" />
          <h1 class="text-lg font-semibold mt-1">FHN Hackathon Scoring</h1>
          <p class="text-sm text-[var(--ui-text-muted)]">
            {{ mode === 'signin' ? 'Đăng nhập để chấm điểm' : 'Tạo tài khoản mới' }}
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="Email">
          <UInput v-model="email" type="email" autocomplete="email" placeholder="ban@fhn.vn" class="w-full" />
        </UFormField>

        <UFormField label="Mật khẩu">
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full"
          />
        </UFormField>

        <UFormField v-if="mode === 'signup'" label="Tên hiển thị (có thể đổi sau)">
          <UInput v-model="displayName" placeholder="Nguyễn Văn A" class="w-full" />
        </UFormField>

        <UAlert v-if="info" :description="info" color="info" variant="soft" icon="i-lucide-mail" />

        <UButton type="submit" :loading="loading" block>
          {{ mode === 'signin' ? 'Đăng nhập' : 'Đăng ký' }}
        </UButton>
      </form>

      <template #footer>
        <div class="text-center text-sm text-[var(--ui-text-muted)]">
          <template v-if="mode === 'signin'">
            Chưa có tài khoản?
            <UButton variant="link" size="sm" @click="mode = 'signup'">Đăng ký</UButton>
          </template>
          <template v-else>
            Đã có tài khoản?
            <UButton variant="link" size="sm" @click="mode = 'signin'">Đăng nhập</UButton>
          </template>
        </div>
      </template>
    </UCard>
  </div>
</template>
