<script setup lang="ts">
import type { LimitCardData } from '~/types/api'

defineProps<{
  cards: LimitCardData[] | null
  error: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <StateBlock v-if="!cards && error" state="error" :message="error" @retry="$emit('retry')" />

  <div v-else-if="!cards" class="grid" aria-busy="true">
    <StateBlock v-for="n in 4" :key="n" state="loading" :lines="3" />
  </div>

  <StateBlock v-else-if="cards.length === 0" state="empty" message="No limits to show." />

  <div v-else class="grid">
    <LimitCard v-for="card in cards" :key="card.key" :card="card" />
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
</style>
