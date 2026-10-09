import { defineStore } from 'pinia'
import type { LimitsResponse, RangeKey, SummaryResponse } from '~/types/api'

const FALLBACK_ERROR = 'Something went wrong. Please try again.'

export const useFlightHoursStore = defineStore('flightHours', () => {
  const api = useApi()

  const limits = ref<LimitsResponse | null>(null)
  const limitsLoading = ref(false)
  const limitsError = ref<string | null>(null)

  const range = ref<RangeKey>('1w')
  const summary = ref<SummaryResponse | null>(null)
  const summaryLoading = ref(false)
  const summaryError = ref<string | null>(null)

  // Only the latest summary request may write state, so a slow response for an
  // earlier range can never overwrite the one the pilot is looking at.
  let summaryRequestId = 0

  async function fetchLimits() {
    limitsLoading.value = true
    limitsError.value = null
    try {
      limits.value = await api.request<LimitsResponse>('/flight-hours/limits')
    } catch (err) {
      limitsError.value = err instanceof Error ? err.message : FALLBACK_ERROR
    } finally {
      limitsLoading.value = false
    }
  }

  async function fetchSummary() {
    const requestId = ++summaryRequestId
    summaryLoading.value = true
    summaryError.value = null
    try {
      const res = await api.request<SummaryResponse>('/flight-hours/summary', {
        query: { range: range.value },
      })
      if (requestId !== summaryRequestId) return
      summary.value = res
    } catch (err) {
      if (requestId !== summaryRequestId) return
      // Drop the stale chart: it would belong to a different range than the toggle shows.
      summary.value = null
      summaryError.value = err instanceof Error ? err.message : FALLBACK_ERROR
    } finally {
      if (requestId === summaryRequestId) summaryLoading.value = false
    }
  }

  async function setRange(next: RangeKey) {
    if (next === range.value && summary.value) return
    range.value = next
    await fetchSummary()
  }

  return {
    limits,
    limitsLoading,
    limitsError,
    range,
    summary,
    summaryLoading,
    summaryError,
    fetchLimits,
    fetchSummary,
    setRange,
  }
})
