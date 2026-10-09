<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { ScheduleEntry } from '~/types/api'

const props = defineProps<{
  /** ISO `YYYY-MM-DD` */
  date: string
  day: number
  entry: ScheduleEntry | null
  isToday: boolean
}>()

const { textTone } = useContrastColor()
const { formatLongDate } = useDateFormat()

// Duties still waiting for a logbook entry.
const remaining = computed(() => (props.entry ? props.entry.count_schedules - props.entry.count_logbooks : 0))
const tone = computed(() => (props.entry ? textTone(props.entry.base_color) : null))

const ariaLabel = computed(() => {
  const parts = [formatLongDate(props.date)]
  if (props.isToday) parts.push('today')
  if (props.entry) {
    parts.push(props.entry.base_name)
    parts.push(remaining.value === 0 ? 'all logbooks done' : `${remaining.value} remaining`)
  }
  return parts.join(', ')
})
</script>

<template>
  <NuxtLink
    :to="`/schedule/${date}`"
    class="cell"
    :class="[{ filled: !!entry, today: isToday }, tone ? `text-${tone}` : null]"
    :style="entry ? { backgroundColor: entry.base_color } : undefined"
    :aria-label="ariaLabel"
  >
    <span class="day">{{ day }}</span>

    <template v-if="entry">
      <span class="base">{{ entry.base_name }}</span>

      <span class="status" :class="{ done: remaining === 0 }">
        <Check v-if="remaining === 0" :size="11" :stroke-width="3" aria-hidden="true" />
        <template v-else>{{ remaining }}</template>
      </span>
    </template>
  </NuxtLink>
</template>

<style lang="scss" scoped>
.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 56px;
  padding: 6px 5px 5px;
  border: 1px solid $border;
  border-radius: $radius-card-sm;
  background: $card;
  color: $text-primary;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s;

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid $navy;
    outline-offset: 2px;
  }

  &.filled {
    border-color: transparent;
  }

  &.text-light {
    color: $card;
  }

  &.text-dark {
    color: $navy;
  }

  &.today {
    z-index: 1;
    border-color: transparent;
    box-shadow: 0 0 0 2px $brand-red;
  }
}

.day {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.1;
}

.base {
  max-width: 100%;
  overflow: hidden;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  position: absolute;
  top: 3px;
  right: 3px;
  display: grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: $radius-pill;
  background: $card;
  color: $navy;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 0 0 1px rgba($navy, 0.08);

  &.done {
    padding: 0;
    color: $success;
  }
}
</style>
