'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createConversation() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Insert a new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      student_id: user.id,
      title: 'New Conversation'
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Failed to create conversation', error)
    redirect('/dashboard?error=Chat_Creation_Failed')
  }

  // Redirect to the new conversation page
  redirect(`/chat/${data.id}`)
}

export async function getConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('conversations')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })

  return data || []
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return data || []
}
