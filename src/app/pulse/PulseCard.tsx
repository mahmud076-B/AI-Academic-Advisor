'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PulseDomainSignal } from '@/lib/pulse'
import { 
  Server, 
  Coffee, 
  Library, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Info,
  ArrowRight
} from 'lucide-react'

interface PulseCardProps {
  signal: PulseDomainSignal
}

export default function PulseCard({ signal }: PulseCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)

  // Get domain icon and theme styles
  const getDomainIcon = () => {
    switch (signal.id) {
      case 'facilities_labs':
        return <Server className="w-5 h-5" />
      case 'campus_life':
        return <Coffee className="w-5 h-5" />
      case 'library_study':
        return <Library className="w-5 h-5" />
      case 'academic_momentum':
        return <GraduationCap className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getThemeStyles = () => {
    if (signal.hasContradiction) {
      return {
        cardBorder: 'border-[var(--color-amber-200)] hover:border-[var(--color-amber-300)]',
        iconBg: 'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
        badgeBg: 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border-[var(--color-amber-200)]',
        accentGlow: 'from-amber-500/5 to-orange-500/5'
      }
    }
    switch (signal.id) {
      case 'facilities_labs':
        return {
          cardBorder: 'border-rose-100/80 hover:border-rose-200',
          iconBg: 'bg-rose-50 text-rose-600',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-100',
          accentGlow: 'from-rose-500/5 to-pink-500/5'
        }
      case 'campus_life':
        return {
          cardBorder: 'border-[var(--color-amber-100)] hover:border-[var(--color-amber-200)]',
          iconBg: 'bg-[var(--color-amber-50)] text-[var(--color-amber-600)]',
          badgeBg: 'bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border-[var(--color-amber-100)]',
          accentGlow: 'from-amber-500/5 to-yellow-500/5'
        }
      case 'library_study':
        return {
          cardBorder: 'border-[var(--color-brain-200)] hover:border-[var(--color-brain-300)]',
          iconBg: 'bg-[var(--color-brain-50)] text-[var(--color-brain-600)]',
          badgeBg: 'bg-[var(--color-brain-50)] text-[var(--color-brain-700)] border-[var(--color-brain-200)]',
          accentGlow: 'from-emerald-500/5 to-teal-500/5'
        }
      case 'academic_momentum':
        return {
          cardBorder: 'border-[var(--color-brand-200)] hover:border-[var(--color-brand-300)]',
          iconBg: 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)]',
          badgeBg: 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-200)]',
          accentGlow: 'from-indigo-500/5 to-violet-500/5'
        }
      default:
        return {
          cardBorder: 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]',
          iconBg: 'bg-[var(--color-surface-100)] text-[var(--color-text-secondary)]',
          badgeBg: 'bg-[var(--color-surface-50)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]',
          accentGlow: 'from-slate-500/5 to-slate-400/5'
        }
    }
  }

  const theme = getThemeStyles()

  return (
    <div className={`relative flex flex-col justify-between p-6 md:p-8 bg-[var(--color-surface-0)] border ${theme.cardBorder} rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--transition-duration-standard)] overflow-hidden`}>
      {/* Subtle background glow */}
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${theme.accentGlow} rounded-full blur-2xl pointer-events-none`} />

      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-11 h-11 rounded-2xl ${theme.iconBg} shadow-sm`}>
              {getDomainIcon()}
            </div>
            <div>
              <h2 className="text-[var(--text-h4)] font-[var(--font-weight-h4)] tracking-tight text-[var(--color-text-primary)] leading-snug">
                {signal.title}
              </h2>
              <p className="text-[12px] text-[var(--color-text-tertiary)] font-[var(--font-weight-medium)] uppercase tracking-wider mt-0.5">
                {signal.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[var(--font-weight-medium)] border ${theme.badgeBg}`}>
              {signal.hasContradiction && <AlertTriangle className="w-3 h-3 text-[var(--color-amber-600)]" />}
              {signal.badgeText}
            </span>
            <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {signal.freshnessTag}
            </span>
          </div>
        </div>

        {/* Contradiction Warning Alert */}
        {signal.hasContradiction && signal.contradictionNote && (
          <div className="mb-5 p-3.5 bg-[var(--color-amber-50)] border border-[var(--color-amber-200)] rounded-[var(--radius-xl)] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[var(--color-amber-600)] flex-shrink-0 mt-0.5" />
            <div className="text-[var(--text-small)] text-[var(--color-amber-800)] leading-relaxed font-medium">
              <span className="font-semibold text-[var(--color-amber-900)]">⚠ Conflicting reports: </span>
              {signal.contradictionNote}
            </div>
          </div>
        )}

        {/* Calibrated Observation Callout */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
            Calibrated Signal
          </p>
          <p className="text-[var(--text-body)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)] leading-relaxed">
            {signal.calibratedObservation}
          </p>
        </div>

        {/* Summary Description */}
        <p className="text-[var(--text-small)] text-[var(--color-text-secondary)] leading-relaxed mb-6">
          {signal.summary}
        </p>
      </div>

      {/* Footer Actions & Inspectable Evidence */}
      <div className="pt-5 border-t border-[var(--color-border-subtle)] space-y-4">
        {/* Evidence Toggle */}
        {signal.evidence.length > 0 && (
          <div>
            <button
              onClick={() => setEvidenceOpen(!evidenceOpen)}
              aria-expanded={evidenceOpen}
              aria-controls={`evidence-content-${signal.id}`}
              className="w-full flex items-center justify-between py-2 text-[12px] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-400)] rounded-md px-1"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[var(--color-brain-500)]" />
                Inspect Campus Evidence ({signal.evidence.length} {signal.evidence.length === 1 ? 'source' : 'sources'})
              </span>
              {evidenceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Collapsible Evidence Tray */}
            {evidenceOpen && (
              <div id={`evidence-content-${signal.id}`} className="mt-2.5 space-y-2 p-3 bg-[var(--color-surface-50)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] animate-in fade-in slide-in-from-top-2 duration-[var(--transition-duration-fast)]">
                {signal.evidence.map((ev, idx) => (
                  <div key={idx} className="p-3 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] text-[var(--text-small)] space-y-1.5 shadow-[var(--shadow-sm)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-[var(--font-weight-medium)] text-[var(--color-text-primary)] truncate text-[12px]">{ev.title}</span>
                      <time className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 border ${
                        ev.freshnessTier === 'fresh' 
                          ? 'bg-[var(--color-brain-50)] text-[var(--color-brain-700)] border-[var(--color-brain-200)]' 
                          : 'bg-[var(--color-surface-100)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                      }`}>
                        {ev.relativeTime}
                      </time>
                    </div>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed text-[11.5px]">
                      "{ev.excerpt}"
                    </p>
                    <time className="block text-[10px] text-[var(--color-text-tertiary)]" dateTime={ev.timestamp} aria-label={ev.exactTime}>
                      Observed {ev.exactTime}
                    </time>
                  </div>
                ))}
                <p className="text-[10px] text-[var(--color-text-tertiary)] text-center pt-1.5">
                  Derived safely from verified student contributions. No student identifiers are retained.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CTA: Ask AI About This */}
        <Link
          href={`/chat?prompt=${encodeURIComponent(signal.suggestedPrompt)}`}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[var(--color-surface-900)] text-white font-[var(--font-weight-medium)] text-[var(--text-small)] rounded-[var(--radius-xl)] hover:bg-[var(--color-brand-600)] transition-all duration-[var(--transition-duration-standard)] shadow-[var(--shadow-sm)] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-500)]"
        >
          <Sparkles className="w-4 h-4 text-[var(--color-brand-300)] group-hover:text-white transition-colors" />
          <span>Ask AI About This</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
