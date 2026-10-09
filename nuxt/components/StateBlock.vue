<script setup lang="ts">
import { CircleAlert, Inbox, RotateCw } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    state: 'loading' | 'error' | 'empty'
    message?: string
    /** Number of skeleton bars shown while loading. */
    lines?: number
    /** Minimum height of the block, e.g. to match the content it replaces. */
    minHeight?: string
    /** Drop the card chrome when the block already sits inside a card. */
    bare?: boolean
  }>(),
  { message: '', lines: 3, minHeight: undefined, bare: false },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    class="state"
    :class="{ bare }"
    :style="minHeight ? { minHeight } : undefined"
    :role="state === 'error' ? 'alert' : 'status'"
    :aria-busy="state === 'loading'"
  >
    <template v-if="state === 'loading'">
      <span class="sr-only">Loading</span>
      <span
        v-for="n in lines"
        :key="n"
        class="bar"
        :style="{ width: n === lines && lines > 1 ? '60%' : '100%' }"
      />
    </template>

    <template v-else-if="state === 'error'">
      <CircleAlert class="icon icon-error" :size="22" />
      <p class="message">{{ message || 'Something went wrong. Please try again.' }}</p>
      <button type="button" class="retry" @click="$emit('retry')">
        <RotateCw :size="14" />
        Retry
      </button>
    </template>

    <template v-else>
      <Inbox class="icon" :size="22" />
      <p class="message">{{ message || 'Nothing to show yet.' }}</p>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 16px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  text-align: center;

  &.bare {
    padding: 12px 0;
    background: transparent;
    border-radius: 0;
    box-shadow: none;
  }
}

.icon {
  color: $text-secondary;

  &-error {
    color: $danger;
  }
}

.message {
  margin: 0;
  max-width: 280px;
  font-size: 13px;
  line-height: 1.45;
  color: $text-secondary;
}

.retry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 0;
  border-radius: $radius-pill;
  background: $brand-red;
  color: $card;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $navy;
    outline-offset: 2px;
  }
}

.bar {
  display: block;
  align-self: flex-start;
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, $bg 25%, $border 50%, $bg 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    animation: none;
  }
}
</style>
