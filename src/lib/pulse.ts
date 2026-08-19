import { createClient } from '@/utils/supabase/server'
import { formatDateTime, formatRelativeTime } from './date-time'

export interface PulseEvidence {
  title: string
  excerpt: string
  relativeTime: string
  exactTime: string
  timestamp: string
  freshnessTier: 'fresh' | 'qualified'
}

export interface PulseDomainSignal {
  id: 'facilities_labs' | 'campus_life' | 'library_study' | 'academic_momentum'
  title: string
  subtitle: string
  statusType: 'alert' | 'active' | 'optimal' | 'academic' | 'quiet'
  badgeText: string
  summary: string
  calibratedObservation: string
  hasContradiction: boolean
  contradictionNote?: string
  freshnessTag: string
  evidence: PulseEvidence[]
  suggestedPrompt: string
}

export interface CampusPulseData {
  lastUpdated: string
  totalRecentMemories: number
  signals: PulseDomainSignal[]
}

function getRelativeTimeStr(dateStr: string): { relativeTime: string; daysAgo: number } {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return { relativeTime: formatRelativeTime(dateStr, now), daysAgo: Math.max(0, diffDays) }
}

function classifyDomain(memory: { title: string; content: string; category?: string | null; tags?: string[] | null }): 'facilities_labs' | 'campus_life' | 'library_study' | 'academic_momentum' {
  const text = `${memory.title} ${memory.content} ${memory.category || ''} ${(memory.tags || []).join(' ')}`.toLowerCase()

  // 1. Library & Study Zones
  if (
    text.includes('library') ||
    text.includes('study zone') ||
    text.includes('quiet area') ||
    text.includes('reading room') ||
    text.includes('study spot') ||
    text.includes('study area') ||
    text.includes('silent zone') ||
    text.includes('librarian') ||
    memory.category === 'library'
  ) {
    return 'library_study'
  }

  // 2. Facilities & Labs
  if (
    text.includes('lab') ||
    text.includes('pc') ||
    text.includes('computer') ||
    text.includes('broken') ||
    text.includes('monitor') ||
    text.includes('keyboard') ||
    text.includes('hardware') ||
    text.includes('projector') ||
    text.includes('wifi') ||
    text.includes('ac ') ||
    text.includes('air condition') ||
    text.includes('room ') ||
    text.includes('classroom') ||
    text.includes('printer') ||
    text.includes('equipment') ||
    memory.category === 'facility' ||
    memory.category === 'facilities' ||
    memory.category === 'lab'
  ) {
    return 'facilities_labs'
  }

  // 3. Campus Life & Services
  if (
    text.includes('canteen') ||
    text.includes('cafeteria') ||
    text.includes('food') ||
    text.includes('lunch') ||
    text.includes('cafe') ||
    text.includes('bus') ||
    text.includes('transport') ||
    text.includes('counter') ||
    text.includes('admin office') ||
    text.includes('accounts') ||
    text.includes('club') ||
    text.includes('event') ||
    text.includes('queue') ||
    text.includes('crowd') ||
    text.includes('traffic') ||
    text.includes('parking') ||
    memory.category === 'campus_life' ||
    memory.category === 'services'
  ) {
    return 'campus_life'
  }

  // 4. Academic Momentum (default for courses, study tips, exams)
  return 'academic_momentum'
}

function detectContradictions(memories: { title: string; content: string }[]): { hasContradiction: boolean; note?: string } {
  if (memories.length < 2) return { hasContradiction: false }

  const combined = memories.map(m => `${m.title}: ${m.content}`).join(' | ').toLowerCase()

  // Heuristic contradiction patterns
  const conflictPairs = [
    { positive: ['open', 'available', 'working', 'fixed'], negative: ['closed', 'locked', 'broken', 'down', 'out of order'], subject: 'operational status or availability' },
    { positive: ['quiet', 'peaceful', 'calm', 'empty'], negative: ['noisy', 'crowded', 'loud', 'chaotic'], subject: 'noise levels or crowd density' },
    { positive: ['easy', 'lenient', 'relaxed'], negative: ['difficult', 'strict', 'tough', 'heavy'], subject: 'course difficulty or faculty evaluation' },
    { positive: ['fast', 'speedy', 'quick'], negative: ['slow', 'delayed', 'lagging'], subject: 'service speed or network performance' }
  ]

  for (const pair of conflictPairs) {
    const hasPos = pair.positive.some(kw => combined.includes(kw))
    const hasNeg = pair.negative.some(kw => combined.includes(kw))
    if (hasPos && hasNeg) {
      return {
        hasContradiction: true,
        note: `Recent student reports disagree regarding ${pair.subject}. Different contributions observe contrasting conditions.`
      }
    }
  }

  // Check timing conflicts (e.g. mentions of different times like 6 PM vs 9 PM or 5:00 vs 8:00)
  const timeRegex = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/gi
  const times = combined.match(timeRegex)
  if (times && new Set(times.map(t => t.toLowerCase().replace(/\s+/g, ''))).size > 1) {
    const distinctTimes = Array.from(new Set(times.map(t => t.trim()))).slice(0, 2).join(' vs ')
    return {
      hasContradiction: true,
      note: `Conflicting schedules reported (${distinctTimes}). Please verify before planning.`
    }
  }

  return { hasContradiction: false }
}

export async function fetchCampusPulse(): Promise<CampusPulseData> {
  const supabase = await createClient()

  // Query only shared campus_memories (no private experiences, no user profiles)
  const { data: memories, error } = await supabase
    .from('campus_memories')
    .select('id, title, content, category, tags, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error || !memories) {
    console.error('[Campus Pulse] Error fetching memories:', error)
    return {
      lastUpdated: new Date().toISOString(),
      totalRecentMemories: 0,
      signals: getEmptyDomainSignals()
    }
  }

  // Filter memories into freshness buckets
  // <= 7 days: fresh
  // 8-30 days: qualified
  // > 30 days: excluded from active pulse
  const categorizedBuckets: Record<'facilities_labs' | 'campus_life' | 'library_study' | 'academic_momentum', Array<{
    title: string
    content: string
    category: string | null
    tags: string[] | null
    created_at: string
    daysAgo: number
    relativeTime: string
    exactTime: string
    observed_at: string
    freshnessTier: 'fresh' | 'qualified'
  }>> = {
    facilities_labs: [],
    campus_life: [],
    library_study: [],
    academic_momentum: []
  }

  let totalRecent = 0

  memories.forEach(m => {
    const observedAt = m.updated_at || m.created_at
    const { relativeTime, daysAgo } = getRelativeTimeStr(observedAt)
    
    // Guardrail: Exclude memories older than 30 days from active pulse
    if (daysAgo > 30) return

    totalRecent++
    const domain = classifyDomain(m)
    const freshnessTier: 'fresh' | 'qualified' = daysAgo <= 7 ? 'fresh' : 'qualified'

    categorizedBuckets[domain].push({
      title: m.title,
      content: m.content,
      category: m.category,
      tags: m.tags,
      created_at: m.created_at,
      observed_at: observedAt,
      exactTime: formatDateTime(observedAt),
      daysAgo,
      relativeTime,
      freshnessTier
    })
  })

  // Build 4 Domain Signals with calibrated epistemic wording
  const signals: PulseDomainSignal[] = [
    buildFacilitiesSignal(categorizedBuckets.facilities_labs),
    buildCampusLifeSignal(categorizedBuckets.campus_life),
    buildLibrarySignal(categorizedBuckets.library_study),
    buildAcademicSignal(categorizedBuckets.academic_momentum)
  ]

  return {
    lastUpdated: memories.reduce((latest, memory) => {
      const candidate = memory.updated_at || memory.created_at
      return candidate && new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest
    }, memories[0]?.updated_at || memories[0]?.created_at || new Date().toISOString()),
    totalRecentMemories: totalRecent,
    signals
  }
}

function buildFacilitiesSignal(mems: any[]): PulseDomainSignal {
  if (mems.length === 0) {
    return {
      id: 'facilities_labs',
      title: 'Facilities & Labs',
      subtitle: 'Hardware, software, classrooms & equipment',
      statusType: 'quiet',
      badgeText: 'No Recent Issues',
      summary: 'No recent facility or laboratory disruptions reported in the last 30 days.',
      calibratedObservation: 'No active student observations reported recently.',
      hasContradiction: false,
      freshnessTag: 'Normal Status',
      evidence: [],
      suggestedPrompt: 'Are there any recent lab or classroom updates for my department?'
    }
  }

  const { hasContradiction, note } = detectContradictions(mems)
  const isFresh = mems.some(m => m.freshnessTier === 'fresh')
  const newestDays = Math.min(...mems.map(m => m.daysAgo))
  const freshnessTag = isFresh 
    ? (newestDays === 0 ? 'Active today' : `Updated ${newestDays}d ago`)
    : `Qualified (${mems[0].relativeTime})`

  const calibratedObservation = mems.length === 1
    ? `1 recent student observation mentions ${mems[0].title.toLowerCase()}.`
    : `Several recent shared reports (${mems.length} contributions) highlight facility and lab observations.`

  const evidence: PulseEvidence[] = mems.slice(0, 4).map(m => ({
    title: m.title,
    excerpt: m.content.length > 140 ? `${m.content.slice(0, 140)}...` : m.content,
    relativeTime: m.relativeTime,
    exactTime: m.exactTime,
    timestamp: m.observed_at,
    freshnessTier: m.freshnessTier
  }))

  const summary = mems.length === 1
    ? `${mems[0].title}: ${mems[0].content.slice(0, 120)}${mems[0].content.length > 120 ? '...' : ''}`
    : `Multiple student reports note observations across campus facilities. Primary highlights include ${mems[0].title}.`

  return {
    id: 'facilities_labs',
    title: 'Facilities & Labs',
    subtitle: 'Hardware, software, classrooms & equipment',
    statusType: hasContradiction ? 'alert' : 'active',
    badgeText: hasContradiction ? 'Conflicting Reports' : (isFresh ? 'Recent Reports' : 'Qualified Signals'),
    summary,
    calibratedObservation,
    hasContradiction,
    contradictionNote: note,
    freshnessTag,
    evidence,
    suggestedPrompt: `Tell me about the recent facility and lab reports regarding: ${mems[0].title}`
  }
}

function buildCampusLifeSignal(mems: any[]): PulseDomainSignal {
  if (mems.length === 0) {
    return {
      id: 'campus_life',
      title: 'Campus Life & Services',
      subtitle: 'Canteen, services, queues & student movement',
      statusType: 'quiet',
      badgeText: 'Stable',
      summary: 'No recent reports regarding canteen traffic, dining, or administrative queues.',
      calibratedObservation: 'No active student observations reported recently.',
      hasContradiction: false,
      freshnessTag: 'Normal Status',
      evidence: [],
      suggestedPrompt: 'What are the current campus dining and service hours?'
    }
  }

  const { hasContradiction, note } = detectContradictions(mems)
  const isFresh = mems.some(m => m.freshnessTier === 'fresh')
  const newestDays = Math.min(...mems.map(m => m.daysAgo))
  const freshnessTag = isFresh 
    ? (newestDays === 0 ? 'Active today' : `Updated ${newestDays}d ago`)
    : `Qualified (${mems[0].relativeTime})`

  const calibratedObservation = mems.length === 1
    ? `1 recent student observation mentions ${mems[0].title.toLowerCase()}.`
    : `Several recent shared reports suggest active campus life observations.`

  const evidence: PulseEvidence[] = mems.slice(0, 4).map(m => ({
    title: m.title,
    excerpt: m.content.length > 140 ? `${m.content.slice(0, 140)}...` : m.content,
    relativeTime: m.relativeTime,
    exactTime: m.exactTime,
    timestamp: m.observed_at,
    freshnessTier: m.freshnessTier
  }))

  const summary = mems.length === 1
    ? `${mems[0].title}: ${mems[0].content.slice(0, 120)}${mems[0].content.length > 120 ? '...' : ''}`
    : `Recent student contributions provide insights on campus dining, facilities, and service lines.`

  return {
    id: 'campus_life',
    title: 'Campus Life & Services',
    subtitle: 'Canteen, services, queues & student movement',
    statusType: hasContradiction ? 'alert' : 'active',
    badgeText: hasContradiction ? 'Schedule Discrepancy' : 'Active Signal',
    summary,
    calibratedObservation,
    hasContradiction,
    contradictionNote: note,
    freshnessTag,
    evidence,
    suggestedPrompt: `What are students saying about campus life and ${mems[0].title}?`
  }
}

function buildLibrarySignal(mems: any[]): PulseDomainSignal {
  if (mems.length === 0) {
    return {
      id: 'library_study',
      title: 'Library & Study Zones',
      subtitle: 'Seating availability, noise levels & study floors',
      statusType: 'quiet',
      badgeText: 'Optimal',
      summary: 'Standard quiet study areas and library floors are operational.',
      calibratedObservation: 'No specific noise or crowding alerts reported recently.',
      hasContradiction: false,
      freshnessTag: 'Normal Status',
      evidence: [],
      suggestedPrompt: 'Where are the best quiet study spots in the library right now?'
    }
  }

  const { hasContradiction, note } = detectContradictions(mems)
  const isFresh = mems.some(m => m.freshnessTier === 'fresh')
  const newestDays = Math.min(...mems.map(m => m.daysAgo))
  const freshnessTag = isFresh 
    ? (newestDays === 0 ? 'Active today' : `Updated ${newestDays}d ago`)
    : `Qualified (${mems[0].relativeTime})`

  const calibratedObservation = mems.length === 1
    ? `1 recent student observation notes ${mems[0].title.toLowerCase()}.`
    : `Several shared observations suggest current study space conditions.`

  const evidence: PulseEvidence[] = mems.slice(0, 4).map(m => ({
    title: m.title,
    excerpt: m.content.length > 140 ? `${m.content.slice(0, 140)}...` : m.content,
    relativeTime: m.relativeTime,
    exactTime: m.exactTime,
    timestamp: m.observed_at,
    freshnessTier: m.freshnessTier
  }))

  const summary = mems.length === 1
    ? `${mems[0].title}: ${mems[0].content.slice(0, 120)}${mems[0].content.length > 120 ? '...' : ''}`
    : `Students have shared helpful notes on quiet study areas, seating availability, and floor rules.`

  return {
    id: 'library_study',
    title: 'Library & Study Zones',
    subtitle: 'Seating availability, noise levels & study floors',
    statusType: hasContradiction ? 'alert' : 'optimal',
    badgeText: hasContradiction ? 'Contradictory Reports' : 'Study Zone Live',
    summary,
    calibratedObservation,
    hasContradiction,
    contradictionNote: note,
    freshnessTag,
    evidence,
    suggestedPrompt: `What should I know about the library and study areas based on: ${mems[0].title}?`
  }
}

function buildAcademicSignal(mems: any[]): PulseDomainSignal {
  if (mems.length === 0) {
    return {
      id: 'academic_momentum',
      title: 'Academic Momentum',
      subtitle: 'Exam insights, course tips & peer advice',
      statusType: 'quiet',
      badgeText: 'Curated Tips',
      summary: 'Explore course tips and exam strategies shared by seniors across departments.',
      calibratedObservation: 'Browse Campus Memory to view ongoing course advice.',
      hasContradiction: false,
      freshnessTag: 'Continuous Advice',
      evidence: [],
      suggestedPrompt: 'What study tips do seniors share for my enrolled courses?'
    }
  }

  const { hasContradiction, note } = detectContradictions(mems)
  const isFresh = mems.some(m => m.freshnessTier === 'fresh')
  const newestDays = Math.min(...mems.map(m => m.daysAgo))
  const freshnessTag = isFresh 
    ? (newestDays === 0 ? 'Active this week' : `Shared ${newestDays}d ago`)
    : `Qualified (${mems[0].relativeTime})`

  const calibratedObservation = mems.length === 1
    ? `1 recent student contribution shares study guidance for ${mems[0].title.toLowerCase()}.`
    : `Recent Campus Brain contributions (${mems.length} tips) suggest valuable course and study insights.`

  const evidence: PulseEvidence[] = mems.slice(0, 4).map(m => ({
    title: m.title,
    excerpt: m.content.length > 140 ? `${m.content.slice(0, 140)}...` : m.content,
    relativeTime: m.relativeTime,
    exactTime: m.exactTime,
    timestamp: m.observed_at,
    freshnessTier: m.freshnessTier
  }))

  const summary = mems.length === 1
    ? `${mems[0].title}: ${mems[0].content.slice(0, 120)}${mems[0].content.length > 120 ? '...' : ''}`
    : `Peers have contributed study notes, exam preparation pointers, and textbook locations.`

  return {
    id: 'academic_momentum',
    title: 'Academic Momentum',
    subtitle: 'Exam insights, course tips & peer advice',
    statusType: hasContradiction ? 'alert' : 'academic',
    badgeText: hasContradiction ? 'Varying Feedback' : 'Peer Knowledge',
    summary,
    calibratedObservation,
    hasContradiction,
    contradictionNote: note,
    freshnessTag,
    evidence,
    suggestedPrompt: `What are the key peer recommendations regarding: ${mems[0].title}?`
  }
}

function getEmptyDomainSignals(): PulseDomainSignal[] {
  return [
    buildFacilitiesSignal([]),
    buildCampusLifeSignal([]),
    buildLibrarySignal([]),
    buildAcademicSignal([])
  ]
}
