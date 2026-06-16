import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        console.error('[Mutation error]', error)
      },
    },
  },
})

export function QueryProvider({ children }: { children: ReactNode }): JSX.Element {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
