'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { createClient } from '@/utils/supabase/client'
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Library,
  User,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Sparkles,
  Activity,
  Plus
} from 'lucide-react'

const navGroups = [
  {
    label: 'AI Advisor',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'AI Advisor', href: '/chat', icon: Sparkles },
    ]
  },
  {
    label: 'Campus Intelligence',
    items: [
      { name: 'Campus Pulse', href: '/pulse', icon: Activity },
      { name: 'Campus Brain', href: '/experiences', icon: Library },
    ]
  },
  {
    label: 'Academic',
    items: [
      { name: 'Courses', href: '/courses', icon: BookOpen },
      { name: 'Routine', href: '/routine', icon: Calendar },
    ]
  }
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const sidebarCompact = sidebarCollapsed && !mobileMenuOpen

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data)
      }
    }
    loadProfile()
  }, [])

  return (
    <div className="flex h-screen bg-slate-50 lg:bg-[var(--color-surface-1)] text-[var(--color-text-primary)] font-sans selection:bg-[var(--color-brand-100)] selection:text-[var(--color-brand-900)]">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[var(--color-text-primary)]/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 shrink-0 bg-[var(--color-surface-0)] border-r border-[var(--color-border-subtle)] transform transition-all duration-[var(--transition-duration-standard)] ease-[var(--transition-timing-function-spring)] lg:static lg:translate-x-0 flex flex-col
        ${sidebarCompact ? 'lg:w-[64px]' : 'lg:w-[256px]'}
        ${mobileMenuOpen ? 'translate-x-0 shadow-[var(--shadow-modal)]' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className={`flex h-16 border-b border-[var(--color-border-subtle)] flex-shrink-0 ${sidebarCompact ? 'flex-col items-center justify-center gap-1 px-2' : 'items-center justify-between px-5'}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-brand-600)] text-white shadow-[var(--shadow-default)] group-hover:bg-[var(--color-brand-700)] transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className={`font-bold text-[15px] tracking-tight text-[var(--color-text-primary)] ${sidebarCompact ? 'sr-only' : ''}`}>
              AI Advisor
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCompact ? 'Open sidebar' : 'Hide sidebar'}
            title={sidebarCompact ? 'Open sidebar' : 'Hide sidebar'}
            className="hidden lg:flex items-center justify-center p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] transition-colors"
          >
            {sidebarCompact ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-sm)] lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-5 overflow-y-auto ${sidebarCompact ? 'px-2' : 'px-3'}`}>
          {/* New Chat Primary Action */}
          <div className="mb-6 px-2">
            <Link 
              href="/chat/new"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 bg-[var(--color-brand-50)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] rounded-[var(--radius-full)] font-medium text-[var(--text-small)] transition-colors shadow-sm ${sidebarCompact ? 'justify-center px-0 rounded-[var(--radius-md)]' : ''}`}
            >
              <Plus className="w-[18px] h-[18px]" />
              <span className={sidebarCompact ? 'sr-only' : ''}>New Chat</span>
            </Link>
          </div>

          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className={`text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 px-3 ${sidebarCompact ? 'sr-only' : ''}`}>
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) && item.href !== '/dashboard'
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-small)] font-medium transition-all duration-[var(--transition-duration-micro)]
                          ${sidebarCompact ? 'justify-center px-0' : ''}
                          ${isActive 
                            ? 'bg-[var(--color-surface-2)] text-[var(--color-brand-600)] shadow-sm border-l-[3px] border-[var(--color-brand-600)] -ml-[3px]' 
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] border-l-[3px] border-transparent -ml-[3px]'
                          }
                        `}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'}`} />
                        <span className={sidebarCompact ? 'sr-only' : ''}>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Profile / Bottom Area */}
        <div className={`p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] ${sidebarCompact ? 'px-2' : ''}`}>
          <div className="flex items-center justify-between">
            <Link 
              href="/profile" 
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 group min-w-0 px-2 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors ${sidebarCompact ? 'justify-center px-0' : 'flex-1'}`}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)] flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase shadow-sm">
                {profile ? profile.full_name.charAt(0) : <User className="w-[18px] h-[18px]" />}
              </div>
              <div className={`flex flex-col min-w-0 ${sidebarCompact ? 'sr-only' : ''}`}>
                <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                  {profile ? profile.full_name : 'Profile'}
                </span>
                {profile && (
                  <span className="text-[11px] text-[var(--color-text-muted)] truncate">
                    {profile.department} • Sem {profile.current_semester}
                  </span>
                )}
              </div>
            </Link>
            <form action={logout} className={sidebarCompact ? 'sr-only' : ''}>
              <button 
                type="submit"
                aria-label="Log out"
                className="p-2 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-[var(--radius-md)] transition-colors ml-1 flex-shrink-0"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-[var(--color-surface-0)] border-b border-[var(--color-border-subtle)] sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-brand-600)] text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-[var(--color-text-primary)]">
              AI Advisor
            </span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-sm)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto flex flex-col relative w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

