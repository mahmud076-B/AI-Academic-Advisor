'use client'

import { usePathname } from 'next/navigation'
import AppShell from './AppShell'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''

  // Routes that shouldn't have the AppShell
  const unauthenticatedRoutes = ['/login', '/onboarding']
  
  if (unauthenticatedRoutes.includes(pathname) || pathname.startsWith('/chat')) {
    return <>{children}</>
  }

  return <AppShell>{children}</AppShell>
}
