import type { ApiError } from '~/types/api'

export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

const NETWORK_MESSAGE = "Can't reach the server. Check your connection and try again."

/** Normalises $fetch failures and the backend's error shape into one Error type. */
export function toApiError(err: unknown): ApiRequestError {
  const e = err as
    | { response?: { status?: number }; statusCode?: number; data?: Partial<ApiError> }
    | undefined
  const status = e?.response?.status ?? e?.statusCode ?? 0
  if (!status) return new ApiRequestError(0, NETWORK_MESSAGE)

  const raw = e?.data?.message
  const message = Array.isArray(raw) ? raw.join(', ') : raw
  return new ApiRequestError(status, message || 'Something went wrong. Please try again.')
}
