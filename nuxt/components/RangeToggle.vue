<script setup lang="ts">
import type { RangeKey } from '~/types/api'

defineProps<{ modelValue: RangeKey }>()
const emit = defineEmits<{ 'update:modelValue': [value: RangeKey] }>()

const options: { value: RangeKey; label: string }[] = [
  { value: '1w', label: '1w' },
  { value: '1m', label: '1m' },
  { value: '3m', label: '3m' },
  { value: '6m', label: '6m' },
  { value: '1y', label: '1y' },
]
</script>

<template>
  <div class="toggle" role="radiogroup" aria-label="Chart range">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      class="option"
      :class="{ active: option.value === modelValue }"
      :aria-checked="option.value === modelValue"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.toggle {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: $radius-pill;
  background: $bg;
}

.option {
  flex: 1;
  padding: 7px 0;
  border: 0;
  border-radius: $radius-pill;
  background: transparent;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &.active {
    background: $navy;
    color: $card;
    font-weight: 700;
  }

  &:focus-visible {
    outline: 2px solid $chart-accent;
    outline-offset: 1px;
  }
}
</style>
