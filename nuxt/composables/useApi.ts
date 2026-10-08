export const useApi = () => {
  const config = useRuntimeConfig()
  // TODO: implement $fetch wrapper (Bearer token, 401 handling, error normalising)
  return { baseURL: config.public.apiBase as string }
}
