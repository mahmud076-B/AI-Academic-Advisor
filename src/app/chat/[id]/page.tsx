import { getConversations, getMessages, createConversation } from '../actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChatUI from './ChatUI'

export default async function ChatPage(props: { 
  params: Promise<{ id: string }>,
  searchParams?: Promise<{ prompt?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const params = await props.params
  const conversationId = params.id

  const searchParams = props.searchParams ? await props.searchParams : {}
  const initialPrompt = searchParams?.prompt || ''

  // Verify conversation ownership
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('id', conversationId)
    .eq('student_id', user.id)
    .single()

  if (!conversation) {
    redirect('/dashboard')
  }

  const dbMessages = await getMessages(conversationId)

  // Map DB messages to the format expected by useChat
  const initialMessages = dbMessages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))

  return (
    <div className="flex-1 flex flex-col relative bg-white min-h-0">
      <div className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center lg:px-6">
        <div className="flex items-center gap-3 pl-12 lg:pl-0">
           <h1 className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md md:max-w-xl">
             {conversation.title || 'AI Academic Advisor'}
           </h1>
        </div>
      </div>
      
      {/* Chat UI Client Component with prefilled prompt support */}
      <ChatUI 
        conversationId={conversationId} 
        initialMessages={initialMessages} 
      />
    </div>
  )
}
