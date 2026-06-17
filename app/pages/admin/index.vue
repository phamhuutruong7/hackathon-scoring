<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const tabs = [
  { key: 'users', label: 'Người dùng', icon: 'i-lucide-user-cog' },
  { key: 'teams', label: 'Đội', icon: 'i-lucide-users' },
  { key: 'judges', label: 'Giám khảo', icon: 'i-lucide-gavel' },
  { key: 'assign', label: 'Vòng 1: Phân đội', icon: 'i-lucide-link' },
  { key: 'rounds-teams', label: 'Vòng 2–3: Chọn đội', icon: 'i-lucide-filter' },
  { key: 'status', label: 'Trạng thái vòng', icon: 'i-lucide-toggle-right' },
  { key: 'results', label: 'Kết quả', icon: 'i-lucide-trophy' },
] as const

const active = ref<(typeof tabs)[number]['key']>('users')
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Quản trị</h1>

    <div class="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-[var(--ui-border)]">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="px-3 py-2 rounded-md text-sm whitespace-nowrap flex items-center gap-2 transition-colors"
        :class="active === t.key
          ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-medium'
          : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)]'"
        @click="active = t.key"
      >
        <UIcon :name="t.icon" />
        {{ t.label }}
      </button>
    </div>

    <AdminUsers v-if="active === 'users'" />
    <AdminTeams v-else-if="active === 'teams'" />
    <AdminJudges v-else-if="active === 'judges'" />
    <AdminAssignments v-else-if="active === 'assign'" />
    <AdminRoundTeams v-else-if="active === 'rounds-teams'" />
    <AdminRounds v-else-if="active === 'status'" />
    <AdminResults v-else-if="active === 'results'" />
  </div>
</template>
