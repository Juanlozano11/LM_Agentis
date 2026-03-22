import { useAuth } from '@clerk/clerk-react'

export function useAuthFetch() {
  const { getToken } = useAuth()

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken()
    return fetch(url, {
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
