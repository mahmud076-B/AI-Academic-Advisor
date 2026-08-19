import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getExperiences, getSharedExperiences } from './actions'
import VisibilityToggle from './VisibilityToggle'
import { Plus, Lightbulb, Brain, Share2, Lock, Clock } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/date-time'

export default async function CampusBrainPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const yourContributions = await getExperiences()
  const sharedKnowledge = await getSharedExperiences()

  return (
    <div className="page-container flex min-h-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-[var(--transition-duration-page)] bg-[var(--color-surface-0)]">
      
      {/* Campus Brain Header */}
      <section className="mb-12 border-b border-[var(--color-border-subtle)] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-brain-50)] text-[var(--color-brain-600)] shadow-[var(--shadow-sm)]">
                 <Brain className="w-[22px] h-[22px]" />
               </div>
               <h1 className="text-[var(--text-h2)] font-[var(--font-weight-h2)] tracking-tight text-[var(--color-text-primary)]">
                 Campus Brain
               </h1>
            </div>
            <p className="text-[var(--text-body-lg)] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Shared knowledge from students across campus. Contribute your observations to build a smarter, more helpful collective memory.
            </p>
          </div>
          
          <Link 
            href="/experiences/new" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-brand-600)] text-white font-[var(--font-weight-medium)] text-[var(--text-small)] rounded-full hover:bg-[var(--color-brand-700)] transition-all shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-500)]"
          >
            <Plus className="w-4 h-4" />
            Share Knowledge
          </Link>
        </div>
      </section>

      {/* Two-Column Layout */}
      <div className="w-full flex flex-col xl:flex-row gap-10">
        
        {/* Main Column: Shared Campus Knowledge */}
        <div className="xl:flex-[2] order-1 xl:order-1">
          <h2 className="text-[var(--text-h3)] font-[var(--font-weight-h3)] text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[var(--color-brain-500)]" />
            Shared Campus Knowledge
          </h2>

          {sharedKnowledge.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[var(--color-surface-50)] border border-[var(--color-border-subtle)] rounded-[var(--radius-2xl)]">
              <div className="w-16 h-16 bg-[var(--color-surface-0)] rounded-2xl flex items-center justify-center shadow-[var(--shadow-sm)] text-[var(--color-brain-300)] mb-6">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-[var(--text-h4)] font-[var(--font-weight-h4)] text-[var(--color-text-primary)] mb-2">No shared knowledge yet.</h3>
              <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] max-w-md mx-auto mb-6 leading-relaxed">
                Be the first student to contribute something useful. Help establish the baseline for Campus Pulse and the AI Advisor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sharedKnowledge.map(exp => (
                <div key={exp.id} className="flex flex-col p-6 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-brain-200)] transition-all duration-[var(--transition-duration-standard)]">
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-brain-50)] text-[var(--color-brain-700)] rounded-full text-[11px] font-[var(--font-weight-medium)] uppercase tracking-wider mb-3 border border-[var(--color-brain-100)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brain-500)]"></span>
                      Shared with Campus Brain
                    </div>
                    <h3 className="text-[var(--text-body-lg)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)] leading-snug">
                      {exp.title}
                    </h3>
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-[var(--text-small)] leading-relaxed flex-1 mb-5">
                    {exp.content.length > 150 
                      ? exp.content.substring(0, 150) + '…' 
                      : exp.content
                    }
                  </p>
                  <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <time dateTime={exp.updated_at || exp.created_at} aria-label={formatDateTime(exp.updated_at || exp.created_at)}>
                      Updated {formatRelativeTime(exp.updated_at || exp.created_at)}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Column: Your Contributions */}
        <div className="xl:flex-[1] order-2 xl:order-2">
          <div className="sticky top-6">
            <h2 className="text-[var(--text-h4)] font-[var(--font-weight-h4)] text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[var(--color-text-tertiary)]" />
              Your Contributions
            </h2>

            {yourContributions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[var(--color-surface-50)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] border-dashed">
                <div className="w-10 h-10 bg-[var(--color-surface-0)] rounded-xl flex items-center justify-center shadow-sm text-[var(--color-text-tertiary)] mb-3">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-[var(--text-small)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)] mb-1">Nothing shared yet</h3>
                <p className="text-[12px] text-[var(--color-text-secondary)] mb-4 leading-relaxed max-w-[200px] mx-auto">
                  Add an observation to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {yourContributions.map(exp => (
                  <div key={exp.id} className="p-5 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-hover)] transition-all duration-[var(--transition-duration-standard)]">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="font-[var(--font-weight-medium)] text-[var(--text-small)] text-[var(--color-text-primary)] leading-tight pr-2 break-words">
                        {exp.title}
                      </h3>
                      <div className="flex-shrink-0">
                        <VisibilityToggle experienceId={exp.id} initialVisibility={exp.visibility} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] font-medium pt-3 border-t border-[var(--color-border-subtle)]">
                      <time className="text-[var(--color-text-tertiary)]" dateTime={exp.created_at} aria-label={formatDateTime(exp.created_at)}>
                        Posted {formatRelativeTime(exp.created_at)}
                      </time>
                      {exp.visibility === 'shared' ? (
                        <span className="flex items-center gap-1.5 text-[var(--color-brain-600)] bg-[var(--color-brain-50)] px-2 py-0.5 rounded-md border border-[var(--color-brain-100)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brain-500)]"></span> Shared
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)] bg-[var(--color-surface-100)] px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)]">
                          <Lock className="w-3 h-3" /> Private · Only visible to you
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
