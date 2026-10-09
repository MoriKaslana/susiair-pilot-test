<script setup lang="ts">
import type { LegendItem } from '~/types/api'

defineProps<{ legend: LegendItem[] }>()
</script>

<template>
  <section v-if="legend.length > 0" class="legend" aria-labelledby="legend-title">
    <h2 id="legend-title" class="title">Legend</h2>
    <ul class="items">
      <li v-for="item in legend" :key="item.code" class="item">
        <span class="swatch" :style="{ backgroundColor: item.color }" />
        <span class="code">{{ item.code }}</span>
        <span class="label">{{ item.label }}</span>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.legend {
  padding: 14px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}

.title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 800;
}

.items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
}

.swatch {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.code {
  flex: none;
  font-weight: 800;
}

.label {
  min-width: 0;
  overflow: hidden;
  color: $text-secondary;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
