import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, BookOpen, Clock, Brain, Activity, ArrowRight, AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react'
import { searchSharedExperiences } from '@/app/experiences/actions'
import { fetchCampusPulse } from '@/lib/pulse'
import { formatTime } from '@/lib/date-time'

function formatTimeLabel(timeValue: string | null | undefined) {
  return timeValue ? formatTime(timeValue) : 'TBD'
}

function getGreeting() {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', hour12: false }).format(new Date()))
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getTodayLabel() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Dhaka' }).format(new Date())
}

function getDhakaMinutes() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return Number(values.hour) * 60 + Number(values.minute)
}

async function getCampusInsight(courseName: string) {
  const query = courseName ? `${courseName} study tips` : 'campus study tips'
  const matches = await searchSharedExperiences(query)
  if (!matches || matches.length === 0) return null
  const selected = matches.find(match => {
    if (!match.created_at) return false
    const ageDays = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return ageDays <= 120
  }) || matches[0]
  if (!selected?.content) return null
  return selected.content.trim()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .eq('academic_period', profile.current_semester)
    .order('created_at', { ascending: false })

  const { data: todayRoutine } = await supabase
    .from('class_routine_entries')
    .select('*, courses(*)')
    .eq('day_of_week', getTodayLabel())
    .order('start_time', { ascending: true })

  const currentMinutes = getDhakaMinutes()
  
  const routine = todayRoutine || []
  const nextClass = routine.find((entry) => {
    const [hours, minutes] = String(entry.start_time || '00:00').split(':').map(Number)
    const startMinutes = (hours || 0) * 60 + (minutes || 0)
    return startMinutes >= currentMinutes
  }) || null

  const nextCourseName = nextClass ? (nextClass.courses as any)?.name || nextClass.course_name_override || 'Your next class' : null
  const campusInsight = nextCourseName ? await getCampusInsight(nextCourseName) : null

  // Pulse logic
  const pulseData = await fetchCampusPulse()
  const activeSignals = pulseData.signals.filter(s => s.statusType !== 'quiet' || s.evidence.length > 0)
  const previewSignals = activeSignals.length > 0 ? activeSignals.slice(0, 2) : pulseData.signals.slice(0, 2)

  // Copilot Message Logic
  let copilotMessage = "Use this time to review your course notes and prepare for your upcoming academic tasks."
  if (routine.length > 0) {
    if (nextClass) {
      copilotMessage = `You have ${routine.length} class${routine.length > 1 ? 'es' : ''} today. Your next class is ${nextCourseName} at ${formatTimeLabel(nextClass.start_time)}.`
    } else {
      copilotMessage = `You have completed all ${routine.length} of your classes for today. Great job!`
    }
  } else {
    copilotMessage = "You have no classes scheduled today. A great day to catch up on assignments or rest."
  }

  return (
    <div className="page-container animate-in fade-in duration-[var(--transition-duration-page)] ease-out flex flex-col gap-[var(--spacing-32)] max-w-4xl mx-auto">
      
      {/* 1. Context Row */}
      <header className="flex flex-col gap-1">
        <h1 className="text-[var(--text-h2)] font-[var(--font-weight-h2)] leading-[var(--text-h2--line-height)] tracking-tight text-[var(--color-text-primary)]">
          {getGreeting()}, {profile.full_name.split(' ')[0]}
        </h1>
        <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">
          {profile.department} • Semester {profile.current_semester}
        </p>
      </header>

      {/* 2. AI Academic Copilot Hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-brand-100)] p-8 md:p-10 shadow-[var(--shadow-hero)] border border-[var(--color-brand-200)]">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-start gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-brand-600)]" />
            <span className="text-[var(--text-small)] font-[var(--font-weight-small)] uppercase tracking-[0.15em] text-[var(--color-brand-700)]">
              AI Academic Copilot
            </span>
          </div>
          
          <h2 className="text-[var(--text-h3)] md:text-[var(--text-h2)] font-[var(--font-weight-h2)] text-[var(--color-brand-900)] leading-tight max-w-2xl">
            {copilotMessage}
          </h2>
          
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-600)] text-white rounded-[var(--radius-full)] font-medium text-[var(--text-body)] shadow-[var(--shadow-default)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 hover:bg-[var(--color-brand-700)] transition-all duration-[var(--transition-duration-standard)]"
          >
            Ask AI Advisor
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 3. Today's Timeline */}
      <section className="dashboard-panel dashboard-today-panel rounded-[var(--radius-xl)] p-6 md:p-8">
        <h3 className="text-[var(--text-small)] font-[var(--font-weight-small)] uppercase tracking-wider text-[var(--color-text-muted)] mb-6">
          Today
        </h3>
        
        {routine.length > 0 ? (
          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[3.5rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border-subtle)] before:to-transparent">
            {routine.map((entry, idx) => {
              const isNext = entry.id === nextClass?.id
              const [hours, minutes] = String(entry.start_time || '00:00').split(':').map(Number)
              const startMinutes = (hours || 0) * 60 + (minutes || 0)
              const isPast = startMinutes < currentMinutes && !isNext
              
              const courseName = (entry.courses as any)?.name || entry.course_name_override || 'Class'

              return (
                <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Timeline Dot */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-[var(--color-surface-0)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors duration-[var(--transition-duration-standard)] ${
                    isNext ? 'bg-[var(--color-brand-500)]' : isPast ? 'bg-[var(--color-border-strong)]' : 'bg-[var(--color-surface-2)]'
                  }`}>
                    {isNext && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  
                  {/* Content Card */}
                  <div className={`dashboard-timeline-card w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-[var(--radius-lg)] transition-all duration-[var(--transition-duration-standard)] ${
                    isNext 
                      ? 'dashboard-timeline-card-current' 
                      : 'dashboard-timeline-card-next'
                  } ${isPast ? 'opacity-60 hover:opacity-100' : ''}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`min-w-0 leading-snug ${isNext ? 'font-semibold text-[var(--color-brand-700)] text-[var(--text-body-lg)]' : 'font-semibold text-[var(--color-text-primary)] text-[var(--text-body)]'}`}>
                          {courseName}
                        </span>
                        <span className={`shrink-0 pt-0.5 text-[var(--text-small)] whitespace-nowrap ${isNext ? 'text-[var(--color-brand-600)] font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
                          {formatTimeLabel(entry.start_time)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--text-small)] text-[var(--color-text-secondary)]">
                        {entry.room && (
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="icon-metadata" />
                            Room {entry.room}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="icon-metadata" />
                          {formatTimeLabel(entry.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-brain-500)]" />
            <span>No classes scheduled today. Enjoy your day!</span>
          </div>
        )}
      </section>

      {/* 4. Supporting Area (2 Columns) */}
      <section className="grid items-start md:grid-cols-2 gap-6">
        
        {/* Campus Pulse Preview */}
        <div className="dashboard-panel dashboard-pulse-panel flex flex-col rounded-[var(--radius-xl)] overflow-hidden">
          <div className="dashboard-panel-header flex items-center justify-between p-5">
            <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-semibold text-[var(--text-body)]">
              <Activity className="w-4 h-4 text-[var(--color-brand-500)]" />
              Campus Pulse
              {activeSignals.length > 0 && (
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brain-500)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brain-500)]"></span>
                </span>
              )}
            </div>
            <Link href="/pulse" className="text-[var(--text-small)] font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors">
              View Pulse
            </Link>
          </div>
          <div className="dashboard-panel-body p-5 flex flex-col gap-4">
            {previewSignals.map(sig => (
              <div key={sig.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-small)] text-[var(--color-text-primary)]">{sig.title}</span>
                  {sig.hasContradiction ? (
                    <span className="text-[10px] font-bold text-[var(--color-syllabus-600)] bg-[var(--color-syllabus-100)] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Conflict
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      {sig.freshnessTag}
                    </span>
                  )}
                </div>
                <p className="text-[var(--text-small)] text-[var(--color-text-secondary)] line-clamp-2">
                  {sig.calibratedObservation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Brain Preview */}
        {campusInsight ? (
          <div className="flex flex-col bg-[var(--color-brain-50)] rounded-[var(--radius-xl)] border border-[var(--color-brain-100)] overflow-hidden shadow-[var(--shadow-default)]">
             <div className="flex items-center justify-between p-5 border-b border-[var(--color-brain-100)]">
              <div className="flex items-center gap-2 text-[var(--color-brain-600)] font-semibold text-[var(--text-body)]">
                <Brain className="w-4 h-4" />
                Campus Brain
              </div>
              <Link href="/experiences" className="text-[var(--text-small)] font-medium text-[var(--color-brain-600)] hover:text-[var(--color-brain-500)] transition-colors">
                Explore
              </Link>
            </div>
            <div className="p-5 flex-1 flex items-center">
              <p className="text-[var(--text-body)] text-[var(--color-brain-600)] leading-relaxed font-medium">
                "{campusInsight}"
              </p>
            </div>
          </div>
        ) : (
          <div className="dashboard-panel dashboard-empty-state flex flex-col rounded-[var(--radius-xl)] items-center justify-center p-6 text-center gap-2">
             <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)]">
                <Brain className="w-5 h-5" />
             </div>
             <p className="max-w-[260px] text-[var(--text-small)] leading-relaxed text-[var(--color-text-secondary)]">No recent Campus Brain insights for your upcoming classes.</p>
             <Link href="/experiences/new" className="text-[var(--text-small)] font-semibold text-[var(--color-brain-600)] hover:text-[var(--color-brain-500)] transition-colors">
              Share an observation
             </Link>
          </div>
        )}

      </section>

      {/* 5. Active Courses */}
      <section className="dashboard-panel dashboard-courses-panel rounded-[var(--radius-xl)] p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[var(--text-small)] font-[var(--font-weight-small)] uppercase tracking-wider text-[var(--color-text-muted)]">
            Your Courses
          </h3>
          <Link href="/courses" className="text-[var(--text-small)] font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors">
            View All
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-[var(--color-border-subtle)]">
          {(enrollments || []).length > 0 ? (
            (enrollments || []).map((enrollment) => {
              const course = enrollment.courses as any
              // Check if syllabus chunks exist in the joined table if it were fetched, 
              // but here we just look at the course object or assume it might have a syllabus.
              // We'll show a simple indicator for all active courses to keep it clean.
              return (
                <div key={enrollment.id} className="dashboard-course-row flex items-center justify-between py-4 px-3 -mx-3 rounded-[var(--radius-md)] group">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-[var(--text-body)] text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-600)] transition-colors">
                      {course?.name || 'Course name'}
                    </span>
                    <span className="text-[var(--text-small)] text-[var(--color-text-secondary)]">
                      {course?.code || 'Course Code'}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] transition-colors -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                </div>
              )
            })
          ) : (
            <div className="py-4 text-[var(--text-small)] text-[var(--color-text-secondary)]">
              No active courses for this semester.
            </div>
          )}
        </div>
      </section>

    </div>
  )
}

