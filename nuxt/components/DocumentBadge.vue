<script setup lang="ts">
import { CircleAlert, CircleCheck, Clock } from 'lucide-vue-next'
import type { DocumentStatus } from '~/types/api'

const props = defineProps<{
  status: DocumentStatus
  daysRemaining: number
}>()

const icon = computed(() => ({ safe: CircleCheck, soon: Clock, expired: CircleAlert })[props.status])

function plural(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

// The status itself comes from the API; this only words the day count.
const text = computed(() => {
  const days = props.daysRemaining
  if (props.status === 'expired') {
    return days < 0 ? `Expired ${plural(-days)} ago` : 'Expired today'
  }
  return `${plural(days)} left`
})
</script>

<template>
  <span class="badge" :class="`status-${status}`">
    <component :is="icon" :size="13" />
    {{ text }}
  </span>
</template>

<style lang="scss" scoped>
@use 'sass:color';

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: $radius-pill;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.status-safe {
  background: rgba($success, 0.14);
  color: color.adjust($success, $lightness: -12%);
}

.status-soon {
  background: rgba($warning, 0.16);
  color: color.adjust($warning, $lightness: -14%);
}

.status-expired {
  background: rgba($danger, 0.12);
  color: $danger;
}
</style>
