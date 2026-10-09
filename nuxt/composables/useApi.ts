interface ApiOptions {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number>
  body?: Record<string, unknown>
}

/** Thin $fetch wrapper: base URL, Bearer token, 401 handling, normalised errors. */
export const useApi = () => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase as string,
        method: options.method ?? 'GET',
        query: options.query,
        body: options.body,
        headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
      })
    } catch (err) {
      const apiError = toApiError(err)
      if (apiError.statusCode === 401) {
        auth.logout()
        await navigateTo('/login')
      }
      throw apiError
    }
  }

  return { request }
}
