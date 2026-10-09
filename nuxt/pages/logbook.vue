<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

useHead({ title: 'Logbook - Susi Air Pilot' })

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
const logbook = useLogbookStore()
const { formatLongDate, formatHours } = useDateFormat()

// "Today" and the initial month both come from the API, never the system clock.
async function load() {
  if (!pilot.profile) await pilot.fetchProfile()
  if (pilot.profile) await logbook.init(pilot.profile.today)
}

onMounted(load)

const monthTitle = computed(() =>
  logbook.year !== null && logbook.month !== null ? `${MONTH_NAMES[logbook.month - 1]} ${logbook.year}` : '',
)

// ISO dates compare correctly as strings.
function isPlanned(date: string): boolean {
  return !!pilot.profile && date > pilot.profile.today
}
</script>

<template>
  <div class="logbook">
    <h1 class="title">Logbook</h1>

    <StateBlock v-if="!pilot.profile && pilot.error" state="error" :message="pilot.error" @retry="load()" />

    <StateBlock v-else-if="!pilot.profile" state="loading" :lines="6" min-height="260px" />

    <section v-else class="card" aria-label="Monthly flight hours">
      <header class="nav">
        <button
          type="button"
          class="nav-button"
          aria-label="Previous month"
          :disabled="!logbook.canGoPrev"
          @click="logbook.shiftMonth(-1)"
        >
          <ChevronLeft :size="20" />
        </button>
        <h2 class="month" aria-live="polite">{{ monthTitle }}</h2>
        <button
          type="button"
          class="nav-button"
          aria-label="Next month"
          :disabled="!logbook.canGoNext"
          @click="logbook.shiftMonth(1)"
        >
          <ChevronRight :size="20" />
        </button>
      </header>

      <StateBlock
        v-if="logbook.error"
        state="error"
        bare
        :message="logbook.error"
        min-height="200px"
        @retry="logbook.fetchMonth()"
      />

      <StateBlock v-else-if="!logbook.data" state="loading" bare :lines="6" min-height="200px" />

      <div v-else class="content" :class="{ loading: logbook.loading }" :aria-busy="logbook.loading">
        <div class="total">
          <span class="total-label">Month total</span>
          <span class="total-value">{{ formatHours(logbook.monthTotal) }}<small>h</small></span>
        </div>

        <StateBlock
          v-if="logbook.entries.length === 0"
          state="empty"
          bare
          message="No flights logged this month."
        />

        <ul v-else class="list">
          <li v-for="day in logbook.entries" :key="day.date" class="row">
            <div class="info">
              <span class="date">{{ formatLongDate(day.date) }}</span>
              <span v-if="isPlanned(day.date)" class="planned">Planned</span>
            </div>
            <span class="hours">{{ formatHours(day.hours) }}<small>h</small></span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.logbook {
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
  padding: 12px 14px 8px;
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

.content {
  transition: opacity 0.2s;

  &.loading {
    opacity: 0.5;
  }
}

.total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: $radius-card-sm;
  background: $bg;
}

.total-label {
  font-size: 13px;
  color: $text-secondary;
}

.total-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;

  small {
    margin-left: 3px;
    font-size: 14px;
    font-weight: 700;
    color: $text-secondary;
  }
}

.list {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;

  & + & {
    border-top: 1px solid $border;
  }
}

.info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.date {
  font-size: 14px;
  font-weight: 600;
}

.planned {
  padding: 2px 8px;
  border-radius: $radius-pill;
  background: rgba($chart-accent, 0.16);
  color: $navy;
  font-size: 11px;
  font-weight: 700;
}

.hours {
  flex: none;
  font-size: 18px;
  font-weight: 800;

  small {
    margin-left: 2px;
    font-size: 12px;
    font-weight: 700;
    color: $text-secondary;
  }
}
</style>
