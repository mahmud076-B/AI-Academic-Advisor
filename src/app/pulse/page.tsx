import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { fetchCampusPulse } from '@/lib/pulse'
import PulseCard from './PulseCard'
import { Activity, Plus, ShieldCheck, Sparkles, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/date-time'
import { recordTelemetryEvent } from '@/lib/telemetry'
import { generateRequestId } from '@/lib/server-logger'

export default async function CampusPulsePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  recordTelemetryEvent({
    requestId: generateRequestId(),
    userId: user.id,
    eventType: 'campus_pulse_viewed',
    status: 'info',
  })

  const pulseData = await fetchCampusPulse()

  return (
    <div className="page-container flex min-h-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-[var(--transition-duration-page)] ease-out bg-[var(--color-surface-0)]">
      {/* Header Section */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border-subtle)]">
        <div>
          {/* Live Indicator Beacon */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-brain-50)] border border-[var(--color-brain-200)] text-[var(--color-brain-700)] rounded-full text-[11px] font-semibold tracking-wide uppercase mb-4 shadow-[var(--shadow-sm)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brain-400)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brain-500)]"></span>
            </span>
            Campus Intelligence
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)] shadow-[var(--shadow-sm)]">
              <Activity className="w-[22px] h-[22px]" />
            </div>
            <h1 className="text-[var(--text-h2)] font-[var(--font-weight-h2)] tracking-tight text-[var(--color-text-primary)]">
              Campus Pulse
            </h1>
          </div>

          <p className="text-[var(--color-text-secondary)] text-[var(--text-body-lg)] max-w-2xl leading-relaxed">
            Recent campus signals synthesized from the collective Campus Brain.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/experiences/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-surface-900)] text-[var(--color-surface-0)] font-[var(--font-weight-medium)] text-[var(--text-small)] rounded-full hover:bg-[var(--color-surface-800)] transition-all shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-500)]"
          >
            <Plus className="w-4 h-4" />
            <span>Contribute Observation</span>
          </Link>
        </div>
      </header>

      {/* Empty State */}
      {pulseData.signals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[var(--color-surface-50)] border border-[var(--color-border-subtle)] rounded-[var(--radius-2xl)] mb-12">
          <div className="w-16 h-16 bg-[var(--color-surface-0)] rounded-2xl flex items-center justify-center shadow-[var(--shadow-sm)] text-[var(--color-text-tertiary)] mb-6">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-[var(--text-h4)] font-[var(--font-weight-h4)] text-[var(--color-text-primary)] mb-2">Not enough recent campus signals yet.</h3>
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] max-w-md mx-auto mb-6 leading-relaxed">
            Campus Pulse becomes more useful as students contribute knowledge. Help build the intelligence baseline.
          </p>
          <Link 
            href="/experiences/new" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-600)] text-white font-[var(--font-weight-medium)] text-[var(--text-small)] rounded-full hover:bg-[var(--color-brand-700)] transition-all shadow-[var(--shadow-sm)]"
          >
            <Plus className="w-4 h-4" />
            Share an Observation
          </Link>
        </div>
      )}

      {/* Snapshot Summary Strip */}
      {pulseData.signals.length > 0 && (
        <div className="mb-8 p-4 md:p-5 bg-[var(--color-surface-50)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">Pulse Status</p>
              <p className="text-[var(--text-small)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
                Active pulse derived from {pulseData.totalRecentMemories} recent shared {pulseData.totalRecentMemories === 1 ? 'observation' : 'observations'}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-[var(--color-text-secondary)] self-end sm:self-auto">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
              Last observed <time dateTime={pulseData.lastUpdated} aria-label={formatDateTime(pulseData.lastUpdated)}>{formatDateTime(pulseData.lastUpdated)}</time>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-brain-500)]" />
              Zero PII Stored
            </span>
          </div>
        </div>
      )}

      {/* Domain Cards Grid */}
      {pulseData.signals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {pulseData.signals.map(signal => (
            <PulseCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}

      {/* Epistemic Calibration & Trust Footer */}
      <footer className="p-6 bg-[var(--color-surface-50)] border border-[var(--color-border-subtle)] rounded-[var(--radius-2xl)] text-[var(--text-small)] text-[var(--color-text-secondary)] leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--color-brand-600)]" />
          <span>How Campus Pulse Works</span>
        </div>
        <p>
          Campus Pulse synthesizes real student observations submitted into the Campus Brain. Observations older than 30 days are automatically archived from the active pulse. Conflicting reports are preserved transparently to avoid false certainty.
        </p>
        <p className="text-[var(--color-text-tertiary)] pt-1">
          Want to improve campus intelligence? <Link href="/experiences/new" className="text-[var(--color-brand-600)] font-[var(--font-weight-medium)] hover:underline">Share an observation</Link> about your classes, labs, library, or canteen.
        </p>
      </footer>
    </div>
  )
}
