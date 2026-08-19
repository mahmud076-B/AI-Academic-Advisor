import { getConversations, createConversation } from './actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, FileText, Brain, Clock } from 'lucide-react'

export default async function ChatRootPage(props: { searchParams?: Promise<{ prompt?: string }> }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const searchParams = props.searchParams ? await props.searchParams : {}
  const promptParam = searchParams?.prompt ? `?prompt=${encodeURIComponent(searchParams.prompt)}` : ''

  const conversations = await getConversations()
  if (conversations && conversations.length > 0) {
    // Redirect to the most recent conversation, preserving any query prompt
    redirect(`/chat/${conversations[0].id}${promptParam}`)
  }

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Student'

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-[var(--transition-duration-page)] bg-[var(--color-surface-0)]">
      <div className="w-full max-w-2xl text-center space-y-12">
        
        {/* Header Section */}
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)] shadow-[var(--shadow-sm)] mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-[var(--text-h2)] font-[var(--font-weight-h2)] tracking-tight text-[var(--color-text-primary)]">
              {greeting}, {firstName}.
            </h1>
            <p className="text-[var(--text-body-lg)] text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
              Ask me anything about your courses, campus, or study plans.
            </p>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
           <form action={createConversation} className="group w-full">
              <input type="hidden" name="prompt" value="What is in my Data Structures syllabus?" />
              <button type="submit" className="w-full flex items-start gap-4 p-5 rounded-[var(--radius-xl)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)] hover:border-[var(--color-brand-200)] hover:shadow-[var(--shadow-hover)] transition-all duration-[var(--transition-duration-standard)] group-hover:-translate-y-0.5">
                <div className="flex-shrink-0 mt-0.5 p-2 bg-[var(--color-syllabus-50)] text-[var(--color-syllabus-600)] rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-small)] text-[var(--color-text-primary)] mb-1">Course Syllabus</h3>
                  <p className="text-[var(--text-small)] text-[var(--color-text-secondary)]">"What is in my Data Structures syllabus?"</p>
                </div>
              </button>
           </form>

           <form action={createConversation} className="group w-full">
              <input type="hidden" name="prompt" value="Where is the quietest library area?" />
              <button type="submit" className="w-full flex items-start gap-4 p-5 rounded-[var(--radius-xl)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)] hover:border-[var(--color-brand-200)] hover:shadow-[var(--shadow-hover)] transition-all duration-[var(--transition-duration-standard)] group-hover:-translate-y-0.5">
                <div className="flex-shrink-0 mt-0.5 p-2 bg-[var(--color-brain-50)] text-[var(--color-brain-600)] rounded-lg">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-small)] text-[var(--color-text-primary)] mb-1">Campus Brain</h3>
                  <p className="text-[var(--text-small)] text-[var(--color-text-secondary)]">"Where is the quietest library area?"</p>
                </div>
              </button>
           </form>

           <form action={createConversation} className="group w-full sm:col-span-2">
              <input type="hidden" name="prompt" value="Build me a 2-hour exam plan" />
              <button type="submit" className="w-full flex items-start gap-4 p-5 rounded-[var(--radius-xl)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)] hover:border-[var(--color-brand-200)] hover:shadow-[var(--shadow-hover)] transition-all duration-[var(--transition-duration-standard)] group-hover:-translate-y-0.5">
                <div className="flex-shrink-0 mt-0.5 p-2 bg-red-50 text-red-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-small)] text-[var(--color-text-primary)] mb-1">Study Rescue</h3>
                  <p className="text-[var(--text-small)] text-[var(--color-text-secondary)]">"Build me a 2-hour exam plan"</p>
                </div>
              </button>
           </form>
        </div>

      </div>
    </div>
  )
}
