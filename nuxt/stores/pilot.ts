import { defineStore } from 'pinia'
import type { PilotProfile } from '~/types/api'

export const usePilotStore = defineStore('pilot', () => {
  const api = useApi()

  const profile = ref<PilotProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProfile() {
    loading.value = true
    error.value = null
    try {
      profile.value = await api.request<PilotProfile>('/pilot/me')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    } finally {
      loading.value = false
    }
  }

  return { profile, loading, error, fetchProfile }
})
