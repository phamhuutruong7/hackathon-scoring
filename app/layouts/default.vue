<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { profile, isAdmin } = useProfile()
const route = useRoute()
const colorMode = useColorMode()

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}

const bare = computed(() => route.path === '/login')
const isDark = computed(() => colorMode.value === 'dark')
function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-text)]">
    <header
      v-if="!bare && user"
      class="border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]/60 backdrop-blur sticky top-0 z-10"
    >
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-trophy" class="text-[var(--ui-primary)]" />
          <span class="hidden sm:inline">FHN Hackathon Scoring</span>
          <span class="sm:hidden">Scoring</span>
        </NuxtLink>
        <nav class="flex items-center gap-1">
          <UButton to="/" variant="ghost" color="neutral" size="sm" icon="i-lucide-home">
            <span class="hidden sm:inline">Trang chủ</span>
          </UButton>
          <UButton to="/profile" variant="ghost" color="neutral" size="sm" icon="i-lucide-user">
            <span class="hidden sm:inline">{{ profile?.display_name || 'Hồ sơ' }}</span>
          </UButton>
          <UButton
            v-if="isAdmin"
            to="/admin"
            variant="ghost"
            color="primary"
            size="sm"
            icon="i-lucide-shield"
          >
            <span class="hidden sm:inline">Admin</span>
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            :aria-label="isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'"
            @click="toggleColorMode"
          />
          <UButton
            variant="ghost"
            color="error"
            size="sm"
            icon="i-lucide-log-out"
            @click="logout"
          >
            <span class="hidden sm:inline">Đăng xuất</span>
          </UButton>
        </nav>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
