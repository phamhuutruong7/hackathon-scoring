<script setup lang="ts">
// Supabase auth callback target. Once a session is established the
// @nuxtjs/supabase plugin sets the user; we then forward to the app.
const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/')
})
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
    <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin text-[var(--ui-primary)]" />
    <p class="text-[var(--ui-text-muted)]">Đang xác nhận đăng nhập…</p>
    <UButton to="/login" variant="link">Quay lại đăng nhập</UButton>
  </div>
</template>
