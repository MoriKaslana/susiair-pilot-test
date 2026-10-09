<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const { formatLongDate } = useDateFormat()

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const date = computed(() => String(route.params.date ?? ''))
const isValid = computed(() => ISO_DATE.test(date.value))
const heading = computed(() => (isValid.value ? formatLongDate(date.value) : 'Invalid date'))

useHead({ title: () => `${heading.value} - Susi Air Pilot` })
</script>

<template>
  <div class="detail">
    <NuxtLink to="/schedule" class="back">
      <ArrowLeft :size="16" />
      Back
    </NuxtLink>

    <section class="card">
      <h1 class="date">{{ heading }}</h1>
      <p class="text">
        {{ isValid ? 'Detail page coming soon' : 'This date is not valid. Go back to the schedule.' }}
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  padding: 10px 18px;
  border-radius: $radius-pill;
  background: $brand-red;
  color: $card;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid $navy;
    outline-offset: 2px;
  }
}

.card {
  padding: 24px 18px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
  text-align: center;
}

.date {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 800;
}

.text {
  margin: 0;
  font-size: 14px;
  color: $text-secondary;
}
</style>
