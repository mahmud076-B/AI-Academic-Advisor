'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Sparkles,
  MessageSquare,
  Plus,
  Activity
} from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/date-time'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pulse', href: '/pulse', icon: Activity },
  { name: 'Campus Brain', href: '/experiences', icon: Library },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'Routine', href: '/routine', icon: Calendar },
  { name: 'Profile', href: '/profile', icon: User },
]

export default function ChatShell({ 
  children,
  conversations
}: { 
  children: React.ReactNode,
  conversations: any[]
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const sidebarCompact = isCollapsed && !mobileMenuOpen

  // Determine current conversation id from URL
  const currentChatId = pathname.startsWith('/chat/') && pathname !== '/chat/new' 
    ? pathname.split('/chat/')[1] 
    : null

  return (
    <div className="flex h-[100dvh] bg-[var(--color-surface-0)] text-[var(--color-text-primary)] font-sans selection:bg-[var(--color-brand-100)] selection:text-[var(--color-brand-900)] overflow-hidden">
      
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[var(--color-text-primary)]/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-[var(--color-surface-0)] border-r border-[var(--color-border-subtle)] transform transition-all duration-[var(--transition-duration-standard)] ease-[var(--transition-timing-function-spring)] lg:static flex flex-col flex-shrink-0
        ${mobileMenuOpen ? 'translate-x-0 shadow-[var(--shadow-modal)] w-[256px]' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCompact ? 'lg:w-[64px]' : 'lg:w-[256px]'}
      `}>
        {/* Top Header */}
        <div className={`flex h-16 border-b border-[var(--color-border-subtle)] flex-shrink-0 ${sidebarCompact ? 'flex-col items-center justify-center gap-1 px-2' : 'items-center justify-between px-4'}`}>
          {(!isCollapsed || mobileMenuOpen) && (
            <Link href="/dashboard" className="flex items-center gap-2.5 group truncate">
              <div className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-brand-600)] text-white shadow-[var(--shadow-default)] group-hover:bg-[var(--color-brand-700)] transition-colors flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-[15px] tracking-tight text-[var(--color-text-primary)] truncate">
                AI Advisor
              </span>
            </Link>
          )}
          {sidebarCompact && (
             <Link href="/dashboard" className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-brand-600)] text-white shadow-[var(--shadow-default)] hover:bg-[var(--color-brand-700)] transition-colors mx-auto">
                <Sparkles className="w-5 h-5" />
             </Link>
          )}
          
          <div className="flex items-center">
            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] transition-colors"
              title={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            {/* Mobile Close Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 -mr-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-sm)] lg:hidden transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Navigation (Compact Row or Icons) */}
        <div className={`p-3 border-b border-[var(--color-border-subtle)] ${sidebarCompact ? 'flex flex-col items-center gap-2' : 'grid grid-cols-6 gap-1'}`}>
          {navigation.map(item => (
            <Link 
              key={item.name} 
              href={item.href}
              title={item.name}
              className={`flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors ${sidebarCompact ? 'w-10 h-10' : ''}`}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Link 
            href="/chat/new" 
            className={`flex items-center justify-center gap-2 w-full p-2.5 bg-[var(--color-brand-50)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] rounded-[var(--radius-full)] font-medium text-[var(--text-small)] transition-colors shadow-sm ${sidebarCompact ? 'px-0 rounded-[var(--radius-md)]' : ''}`}
          >
             <Plus className="w-[18px] h-[18px] flex-shrink-0" />
             {(!isCollapsed || mobileMenuOpen) && <span>New Chat</span>}
          </Link>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {(!isCollapsed || mobileMenuOpen) && conversations.length > 0 && (
             <div className="px-2 pt-2 pb-2 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
               Recent
             </div>
          )}
          
          {conversations.map(conv => {
            const isActive = conv.id === currentChatId
            return (
              <Link 
                key={conv.id} 
                href={`/chat/${conv.id}`}
                onClick={() => setMobileMenuOpen(false)}
                title={conv.title || 'New Conversation'}
                className={`flex items-center gap-3 p-2.5 text-[var(--text-small)] rounded-[var(--radius-md)] transition-all duration-[var(--transition-duration-micro)] group ${
                  isActive 
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-brand-600)] shadow-sm' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                } ${isCollapsed && !mobileMenuOpen ? 'justify-center' : ''}`}
              >
                <MessageSquare className={`flex-shrink-0 w-[18px] h-[18px] ${isActive ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'}`} />
                {(!isCollapsed || mobileMenuOpen) && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conv.title || 'New Conversation'}</p>
                    {conv.created_at && (
                      <time
                        className="mt-0.5 block text-[var(--text-micro)] text-[var(--color-text-muted)]"
                        dateTime={conv.created_at}
                        aria-label={formatDateTime(conv.created_at)}
                      >
                        {formatRelativeTime(conv.created_at)}
                      </time>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
        {/* Mobile menu trigger overlaid on chat header */}
        <div className="absolute top-3 left-4 z-40 lg:hidden">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="p-2 bg-[var(--color-surface-0)]/80 backdrop-blur-md border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)] shadow-sm transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <main className="flex-1 flex flex-col h-full relative">
          {children}
        </main>
      </div>

    </div>
  )
}

