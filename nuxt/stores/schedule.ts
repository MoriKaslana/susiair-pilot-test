import { defineStore } from 'pinia'
import type { SchedulesResponse } from '~/types/api'

// Mirrors the API's accepted year range (2000-2100).
const MIN_YEAR = 2000
const MAX_YEAR = 2100
const ISO_YEAR_MONTH = /^(\d{4})-(\d{2})/

export const useScheduleStore = defineStore('schedule', () => {
  const api = useApi()

  // Null until initialised from the API's "today"; never read from the system clock.
  const year = ref<number | null>(null)
  const month = ref<number | null>(null)
  const data = ref<SchedulesResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Only the latest request may write state, so a slow response for an earlier
  // month can never overwrite the month the pilot is looking at.
  let requestId = 0

  const canGoPrev = computed(() => year.value !== null && month.value !== null && !(year.value <= MIN_YEAR && month.value <= 1))
  const canGoNext = computed(() => year.value !== null && month.value !== null && !(year.value >= MAX_YEAR && month.value >= 12))

  async function fetchMonth() {
    if (year.value === null || month.value === null) return
    const id = ++requestId
    loading.value = true
    error.value = null
    try {
      const res = await api.request<SchedulesResponse>('/schedules', {
        query: { year: year.value, month: month.value },
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

  return { year, month, data, loading, error, canGoPrev, canGoNext, fetchMonth, init, shiftMonth }
})
