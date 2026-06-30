'use client'

import useSWR, { SWRConfiguration } from 'swr'
import useSWRMutation, { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import { API_URL } from '@/lib/constants'
import { useAuth } from '@/lib/context/auth.context'
import { useDebounce } from '@/lib/hooks/useDebounce'

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.accessToken ?? null
  } catch {
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetcher(url: string): Promise<any> {
  const token = getToken()
  const res = await fetch(url, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json',
    },
  })
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
        try { (error as unknown as Record<string, unknown>).info = await res.json() } catch { /* empty */ }
    throw error
  }
  return res.json()
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.append(key, String(value))
    }
  }
  const qs = query.toString()
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`
}

export function useApiList(
  path: string,
  params?: Record<string, string | number | undefined>,
  config?: SWRConfiguration,
) {
  const { accessToken } = useAuth()
  const url = accessToken ? buildUrl(path, params) : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, isLoading, isValidating, mutate } = useSWR<any>(
    url,
    fetcher,
    {
      dedupingInterval: 2000,
      ...config,
    },
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = data?.data ?? {}

  return {
    items: Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []),
    pagination: {
      current_page: raw.current_page ?? 1,
      last_page: raw.last_page ?? 1,
      total: raw.total ?? 0,
      per_page: raw.per_page ?? 10,
      from: raw.from ?? 0,
      to: raw.to ?? 0,
    },
    isLoading,
    isValidating,
    isError: !!error,
    error,
    mutate,
  }
}

export function useApiListWithSearch(
  path: string,
  params: Record<string, string | number | undefined>,
  searchQuery: string,
  delay = 500,
  config?: SWRConfiguration,
) {
  const debouncedSearch = useDebounce(searchQuery, delay)
  return useApiList(path, { ...params, search: debouncedSearch || undefined }, config)
}

export function useApiGet<T>(
  path: string | null,
  config?: SWRConfiguration,
) {
  const { accessToken } = useAuth()
  const url = path && accessToken ? `${API_URL}${path}` : null

  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    ...config,
  })
}

export function useApiMutation<T = unknown, P = unknown>(
  path: string,
  config?: SWRMutationConfiguration<T, Error, string, P>,
): SWRMutationResponse<T, Error, string, P> {
  const { accessToken } = useAuth()

  const mutation = useSWRMutation<T, Error, string, P>(
    path,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (url: string, { arg }: { arg: any }) => {
      const res = await fetch(`${API_URL}${url}`, {
        method: 'POST',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: arg ? JSON.stringify(arg) : undefined,
      })
      if (!res.ok) {
        const error = new Error('Mutation failed')
    try { (error as unknown as Record<string, unknown>).info = await res.json() } catch { /* empty */ }
        throw error
      }
      return res.json()
    },
    config,
  )

  return mutation
}
