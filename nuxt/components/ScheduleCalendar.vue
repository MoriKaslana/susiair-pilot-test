<script setup lang="ts">
import type { ScheduleEntry } from '~/types/api'

const props = defineProps<{
  year: number
  /** 1-12 */
  month: number
  schedules: ScheduleEntry[]
  /** ISO date of "today" as given by the API. */
  today: string
}>()

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CUMULATIVE_OFFSET = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** Day of week for a Gregorian date, 0 = Sunday (Sakamoto). Pure arithmetic, no system clock. */
function weekday(year: number, month: number, day: number): number {
  const y = month < 3 ? year - 1 : year
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + CUMULATIVE_OFFSET[month - 1]! + day) % 7
}

const entriesByDate = computed(() => {
  const map = new Map<string, ScheduleEntry>()
  for (const entry of props.schedules) {
    if (!map.has(entry.duty_date)) map.set(entry.duty_date, entry)
  }
  return map
})

// Monday-first: Sunday (0) becomes the 7th column.
const leadingBlanks = computed(() => (weekday(props.year, props.month, 1) + 6) % 7)

const days = computed(() =>
  Array.from({ length: daysInMonth(props.year, props.month) }, (_, i) => {
    const day = i + 1
    const date = `${props.year}-${pad(props.month)}-${pad(day)}`
    return { day, date, entry: entriesByDate.value.get(date) ?? null, isToday: date === props.today }
  }),
)
</script>

<template>
  <div class="calendar">
    <div class="weekdays" aria-hidden="true">
      <span v-for="name in WEEKDAYS" :key="name" class="weekday">{{ name }}</span>
    </div>

    <div class="grid">
      <span v-for="n in leadingBlanks" :key="`blank-${n}`" class="blank" aria-hidden="true" />
      <CalendarDayCell
        v-for="d in days"
        :key="d.date"
        :date="d.date"
        :day="d.day"
        :entry="d.entry"
        :is-today="d.isToday"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.weekdays,
.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.weekdays {
  margin-bottom: 6px;
}

.weekday {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: $text-secondary;
}
</style>
