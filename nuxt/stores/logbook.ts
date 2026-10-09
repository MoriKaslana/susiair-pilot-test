import { defineStore } from 'pinia'
import type { DailyHours, FlightHoursResponse } from '~/types/api'

const MIN_YEAR = 2000
const MAX_YEAR = 2100
const ISO_YEAR_MONTH = /^(\d{4})-(\d{2})/

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export const useLogbookStore = defineStore('logbook', () => {
  const api = useApi()

  // Null until initialised from the API's "today"; never read from the system clock.
  const year = ref<number | null>(null)
  const month = ref<number | null>(null)
  const data = ref<FlightHoursResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Only the latest request may write state, so a slow response for an earlier
  // month can never overwrite the month the pilot is looking at.
  let requestId = 0

  const canGoPrev = computed(
    () => year.value !== null && month.value !== null && !(year.value <= MIN_YEAR && month.value <= 1),
  )
  const canGoNext = computed(
    () => year.value !== null && month.value !== null && !(year.value >= MAX_YEAR && month.value >= 12),
  )

  /** Only the days with logged (or planned) hours, in date order. */
  const entries = computed<DailyHours[]>(() => (data.value?.days ?? []).filter((day) => day.hours > 0))

  const monthTotal = computed(() => {
    const sum = entries.value.reduce((total, day) => total + day.hours, 0)
    return Math.round(sum * 10) / 10
  })

  async function fetchMonth() {
    if (year.value === null || month.value === null) return
    const id = ++requestId
    const prefix = `${year.value}-${pad(month.value)}`
    loading.value = true
    error.value = null
    try {
      const res = await api.request<FlightHoursResponse>('/flight-hours', {
        query: { from: `${prefix}-01`, to: `${prefix}-${pad(daysInMonth(year.value, month.value))}` },
      })
      if (id !== requestId) return
      data.value = res
    } catch (err) {
      if (id !== requestId) return
      // Drop the stale month: it would not match the month shown in the header.
      data.value = null
      error.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  /** Opens the month of the API's `today` the first time; later visits keep the open month. */
  async function init(today: string) {
    if (year.value === null || month.value === null) {
      const match = ISO_YEAR_MONTH.exec(today)
      if (!match) {
        error.value = 'The server returned an invalid date.'
        return
      }
      year.value = Number(match[1])
      month.value = Number(match[2])
    }
    await fetchMonth()
  }

  /** Moves by whole months using plain arithmetic, so December/January roll the year. */
  async function shiftMonth(delta: number) {
    if (year.value === null || month.value === null) return
    const monthIndex = year.value * 12 + (month.value - 1) + delta
    const nextYear = Math.floor(monthIndex / 12)
    if (nextYear < MIN_YEAR || nextYear > MAX_YEAR) return
    year.value = nextYear
    month.value = (monthIndex % 12) + 1
    await fetchMonth()
  }

  return { year, month, data, loading, error, canGoPrev, canGoNext, entries, monthTotal, fetchMonth, init, shiftMonth }
})
