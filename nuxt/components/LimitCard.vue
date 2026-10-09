<script setup lang="ts">
import type { LimitCardData } from '~/types/api'

const props = defineProps<{ card: LimitCardData }>()

const { formatHours, formatLimit } = useDateFormat()

const ratio = computed(() => (props.card.limit > 0 ? (props.card.hours / props.card.limit) * 100 : 0))
// Floored so "100%" is only ever shown once the limit is actually reached.
const percentLabel = computed(() => `${Math.floor(ratio.value)}%`)
const barWidth = computed(() => `${Math.min(100, Math.max(0, ratio.value))}%`)
const tone = computed(() => {
  if (ratio.value >= 100) return 'danger'
  if (ratio.value >= 75) return 'warning'
  return 'success'
})
const windowLabel = computed(() =>
  props.card.windowDays === 1 ? 'Today' : `Last ${props.card.windowDays} days`,
)
</script>

<template>
  <article class="card" :class="`tone-${tone}`">
    <header class="top">
      <h3 class="label">{{ card.label }}</h3>
      <span class="window">{{ windowLabel }}</span>
    </header>

    <p class="value">
      <span class="hours">{{ formatHours(card.hours) }}</span>
      <span class="limit">/ {{ formatLimit(card.limit) }} h</span>
    </p>

    <div
      class="track"
      role="progressbar"
      :aria-label="`${card.label} hours`"
      aria-valuemin="0"
      :aria-valuemax="card.limit"
      :aria-valuenow="card.hours"
    >
      <div class="fill" :style="{ width: barWidth }" />
    </div>

    <p class="percent">{{ percentLabel }}</p>
  </article>
</template>

<style lang="scss" scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.window {
  font-size: 11px;
  color: $text-secondary;
}

.value {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
}

.hours {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
}

.limit {
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
}

.track {
  height: 8px;
  border-radius: $radius-pill;
  background: $bg;
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: $radius-pill;
  transition: width 0.3s ease;
}

.percent {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}

.tone-success {
  .fill {
    background: $success;
  }

  .percent {
    color: $success;
  }
}

.tone-warning {
  .fill {
    background: $warning;
  }

  .percent {
    color: $warning;
  }
}

.tone-danger {
  .fill {
    background: $danger;
  }

  .percent {
    color: $danger;
  }
}
</style>
