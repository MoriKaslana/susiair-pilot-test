<script setup lang="ts">
import { House, CalendarDays, BookOpen, Menu } from 'lucide-vue-next'

const route = useRoute()

const items = [
  { label: 'Home', to: '/', icon: House },
  { label: 'Schedule', to: '/schedule', icon: CalendarDays },
  { label: 'Logbook', to: '/logbook', icon: BookOpen },
  { label: 'More', to: '/more', icon: Menu },
]

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <nav class="bottom-nav" aria-label="Main">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
    >
      <component :is="item.icon" :size="22" :stroke-width="isActive(item.to) ? 2.4 : 2" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style lang="scss" scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: $shell-max-width;
  display: flex;
  justify-content: space-around;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
  background: $card;
  border-top: 1px solid $border;
  box-shadow: 0 -4px 12px rgba(14, 33, 56, 0.05);
  z-index: 10;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  font-size: 11px;
  font-weight: 600;
  color: $text-secondary;
  text-decoration: none;

  &.active {
    color: $brand-red;
  }
}
</style>
