import { useAuth } from '@clerk/clerk-react'

export const API_URL = import.meta.env.VITE_API_URL ?? ''

export function useAuthFetch() {
  const { getToken } = useAuth()

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken()
    // Prefix relative /api/* paths with API_URL
    const fullUrl = url.startsWith('/api/') ? `${API_URL}${url}` : url
    return fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) ?? {}),
      },
    })
  }

  return authFetch
}
