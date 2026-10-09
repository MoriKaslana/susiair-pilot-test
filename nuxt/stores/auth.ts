import { defineStore } from 'pinia'
import type { LoginResponse } from '~/types/api'

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()

  // Cookie (not localStorage) so the token is also available during SSR.
  const token = useCookie<string | null>('susiair_token', {
    maxAge: 60 * 60 * 12,
    sameSite: 'lax',
    secure: !import.meta.dev,
    default: () => null,
  })

  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<LoginResponse>('/auth/login', {
        baseURL: config.public.apiBase as string,
        method: 'POST',
        body: { username, password },
      })
      token.value = res.accessToken
      return true
    } catch (err) {
      error.value = toApiError(err).message
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
  }

  return { token, loading, error, isAuthenticated, login, logout }
})
