import { getConversations } from './actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChatShell from '@/components/ChatShell'

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const conversations = await getConversations()

  return (
    <ChatShell conversations={conversations}>
      {children}
    </ChatShell>
  )
}
