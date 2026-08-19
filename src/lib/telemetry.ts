/**
 * Privacy-Safe Product Telemetry Layer for Live User Validation
 * 
 * STRICT PRIVACY PRINCIPLE:
 * - ZERO raw user prompts stored or logged
 * - ZERO full AI text responses stored or logged
 * - ZERO private student experience content
 * - ZERO syllabus document text
 * - ZERO API keys or secrets
 * - Minimum aggregate metadata only
 */

import { logServerEvent, LogCategory, ErrorCategory, PerformanceMetrics } from './server-logger'

export type TelemetryEventType =
  | 'chat_request'
  | 'chat_success'
  | 'chat_failure'
  | 'chat_timeout'
  | 'chat_retry'
  | 'chat_rate_limit'
  | 'campus_memory_retrieved'
  | 'syllabus_retrieved'
  | 'no_knowledge_retrieved'
  | 'experience_shared'
  | 'experience_unshared'
  | 'study_rescue_used'
  | 'campus_pulse_viewed'
  | 'health_check'

export interface TelemetryPayload {
  requestId: string
  eventType: TelemetryEventType
  timestamp?: string
  userId?: string
  conversationId?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  metrics?: PerformanceMetrics
  counts?: {
    retrievalTotal?: number
    campusMemories?: number
    syllabusChunks?: number
  }
  errorCategory?: ErrorCategory
  metadata?: {
    studyRescueActive?: boolean
    isRetry?: boolean
    courseCode?: string
    messageLength?: number
  }
}

export interface TelemetrySummary {
  totalChatRequests: number
  totalChatSuccesses: number
  totalChatFailures: number
  totalChatRetries: number
  totalRateLimits: number
  totalCampusBrainRetrievals: number
  totalSyllabusRetrievals: number
  totalNoKnowledgeRetrievals: number
  totalStudyRescueUsed: number
  totalExperiencesShared: number
  totalExperiencesUnshared: number
  totalCampusPulseViews: number
  totalHealthChecks: number
  avgLatencyMs: number
}

// In-memory aggregate accumulator for lightweight server-side telemetry aggregation
const inMemorySummary: TelemetrySummary = {
  totalChatRequests: 0,
  totalChatSuccesses: 0,
  totalChatFailures: 0,
  totalChatRetries: 0,
  totalRateLimits: 0,
  totalCampusBrainRetrievals: 0,
  totalSyllabusRetrievals: 0,
  totalNoKnowledgeRetrievals: 0,
  totalStudyRescueUsed: 0,
  totalExperiencesShared: 0,
  totalExperiencesUnshared: 0,
  totalCampusPulseViews: 0,
  totalHealthChecks: 0,
  avgLatencyMs: 0,
}

let totalLatencyAccumulator = 0
let latencyMeasurementCount = 0

/**
 * Records a privacy-safe telemetry event.
 */
export function recordTelemetryEvent(payload: TelemetryPayload): void {
  const timestamp = payload.timestamp || new Date().toISOString()

  // Update in-memory aggregate counters
  switch (payload.eventType) {
    case 'chat_request':
      inMemorySummary.totalChatRequests++
      if (payload.metadata?.isRetry) {
        inMemorySummary.totalChatRetries++
      }
      break
    case 'chat_success':
      inMemorySummary.totalChatSuccesses++
      break
    case 'chat_failure':
    case 'chat_timeout':
      inMemorySummary.totalChatFailures++
      break
    case 'chat_rate_limit':
      inMemorySummary.totalRateLimits++
      break
    case 'campus_memory_retrieved':
      inMemorySummary.totalCampusBrainRetrievals++
      break
    case 'syllabus_retrieved':
      inMemorySummary.totalSyllabusRetrievals++
      break
    case 'no_knowledge_retrieved':
      inMemorySummary.totalNoKnowledgeRetrievals++
      break
    case 'study_rescue_used':
      inMemorySummary.totalStudyRescueUsed++
      break
    case 'experience_shared':
      inMemorySummary.totalExperiencesShared++
      break
    case 'experience_unshared':
      inMemorySummary.totalExperiencesUnshared++
      break
    case 'campus_pulse_viewed':
      inMemorySummary.totalCampusPulseViews++
      break
    case 'health_check':
      inMemorySummary.totalHealthChecks++
      break
  }

  // Update latency statistics safely
  if (payload.metrics?.totalLatencyMs && payload.metrics.totalLatencyMs > 0) {
    totalLatencyAccumulator += payload.metrics.totalLatencyMs
    latencyMeasurementCount++
    inMemorySummary.avgLatencyMs = Math.round(totalLatencyAccumulator / latencyMeasurementCount)
  }

  // Map to structured server log category
  const categoryMap: Record<TelemetryEventType, LogCategory> = {
    chat_request: 'chat_request',
    chat_success: 'chat_generation',
    chat_failure: 'chat_request',
    chat_timeout: 'chat_request',
    chat_retry: 'chat_request',
    chat_rate_limit: 'chat_rate_limit',
    campus_memory_retrieved: 'chat_retrieval',
    syllabus_retrieved: 'chat_retrieval',
    no_knowledge_retrieved: 'chat_retrieval',
    experience_shared: 'chat_request',
    experience_unshared: 'chat_request',
    study_rescue_used: 'chat_generation',
    campus_pulse_viewed: 'chat_request',
    health_check: 'health_check',
  }

  // Forward to structured server logging
  logServerEvent({
    requestId: payload.requestId,
    userId: payload.userId,
    conversationId: payload.conversationId,
    timestamp,
    category: categoryMap[payload.eventType] || 'chat_request',
    status: payload.status || 'info',
    metrics: payload.metrics,
    retrievalCount: payload.counts?.retrievalTotal,
    campusMemoryCount: payload.counts?.campusMemories,
    syllabusCount: payload.counts?.syllabusChunks,
    errorCategory: payload.errorCategory,
    message: `[Telemetry] ${payload.eventType}`,
  })
}

/**
 * Returns the current privacy-safe aggregate telemetry summary.
 */
export function getTelemetrySummary(): TelemetrySummary {
  return { ...inMemorySummary }
}
