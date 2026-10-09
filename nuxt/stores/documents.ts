import { defineStore } from 'pinia'
import type { DocumentsResponse } from '~/types/api'

export const useDocumentsStore = defineStore('documents', () => {
  const api = useApi()

  const data = ref<DocumentsResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDocuments() {
    loading.value = true
    error.value = null
    try {
      data.value = await api.request<DocumentsResponse>('/documents')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchDocuments }
})
