import type { ReactNode } from 'react'

/**
 * Application-wide providers. Theme, query client, auth context and anything
 * else that must wrap the whole tree goes here -- one place, so a new provider
 * does not get threaded through main.tsx and the router separately.
 *
 * Kept deliberately empty until something needs it.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>
}
