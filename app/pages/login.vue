<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const identifier = ref('')
const password = ref('')
const loading = ref(false)

watchEffect(() => {
  if (user.value) navigateTo('/')
})

async function submit() {
  if (!identifier.value || !password.value) {
    toast.add({ title: 'Nhập tên đăng nhập và mật khẩu', color: 'warning' })
    return
  }
  loading.value = true
  try {
    // Support both email login and username login (username → synthetic email)
    const loginEmail = identifier.value.includes('@')
      ? identifier.value
      : `${identifier.value}@hackathon.internal`

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password.value,
    })
    if (error) throw error
    await navigateTo('/')
  } catch (e: any) {
    toast.add({ title: 'Đăng nhập thất bại', description: e.message, color: 'error' })
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
          <p class="text-sm text-[var(--ui-text-muted)]">Đăng nhập để chấm điểm</p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="Email hoặc tên đăng nhập">
          <UInput
            v-model="identifier"
            autocomplete="username"
            placeholder="Your account"
            class="w-full"
          />
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

        <UButton type="submit" :loading="loading" block>
          Đăng nhập
        </UButton>
      </form>
    </UCard>
  </div>
</template>
