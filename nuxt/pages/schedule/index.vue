<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

useHead({ title: 'Schedule - Susi Air Pilot' })

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const pilot = usePilotStore()
const schedule = useScheduleStore()

// "Today" and the initial month both come from the API, never the system clock.
async function load() {
  if (!pilot.profile) await pilot.fetchProfile()
  if (pilot.profile) await schedule.init(pilot.profile.today)
}

onMounted(load)

const today = computed(() => pilot.profile?.today ?? '')

const monthTitle = computed(() =>
  schedule.year !== null && schedule.month !== null ? `${MONTH_NAMES[schedule.month - 1]} ${schedule.year}` : '',
)

const isEmptyMonth = computed(() => !!schedule.data && schedule.data.schedules.length === 0 && !schedule.loading)
</script>

<template>
  <div class="schedule">
    <h1 class="title">Schedule</h1>

    <StateBlock v-if="!pilot.profile && pilot.error" state="error" :message="pilot.error" @retry="load()" />

    <StateBlock v-else-if="!pilot.profile" state="loading" :lines="8" min-height="380px" />

    <template v-else>
      <section class="card" aria-label="Monthly schedule">
        <header class="nav">
          <button
            type="button"
            class="nav-button"
            aria-label="Previous month"
            :disabled="!schedule.canGoPrev"
            @click="schedule.shiftMonth(-1)"
          >
            <ChevronLeft :size="20" />
          </button>
          <h2 class="month" aria-live="polite">{{ monthTitle }}</h2>
          <button
            type="button"
            class="nav-button"
            aria-label="Next month"
            :disabled="!schedule.canGoNext"
            @click="schedule.shiftMonth(1)"
          >
            <ChevronRight :size="20" />
          </button>
        </header>

        <StateBlock
          v-if="schedule.error"
          state="error"
          bare
          :message="schedule.error"
          min-height="320px"
          @retry="schedule.fetchMonth()"
        />

        <StateBlock v-else-if="!schedule.data" state="loading" bare :lines="8" min-height="320px" />

        <div v-else class="calendar-wrap" :class="{ loading: schedule.loading }" :aria-busy="schedule.loading">
          <ScheduleCalendar
            :year="schedule.data.year"
            :month="schedule.data.month"
            :schedules="schedule.data.schedules"
            :today="today"
          />
        </div>

        <p v-if="isEmptyMonth" class="empty" role="status">No duties scheduled this month.</p>
      </section>

      <ScheduleLegend v-if="schedule.data" :legend="schedule.data.legend" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.schedule {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.card {
  padding: 12px 10px 14px;
  background: $card;
  border-radius: $radius-card;
  box-shadow: $shadow-card;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.month {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  text-align: center;
}

.nav-button {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: $bg;
  color: $navy;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid $navy;
    outline-offset: 2px;
  }
}

.calendar-wrap {
  transition: opacity 0.2s;

  &.loading {
    opacity: 0.5;
    pointer-events: none;
  }
}

.empty {
  margin: 14px 0 0;
  font-size: 13px;
  text-align: center;
  color: $text-secondary;
}
</style>
