/**
 * Privacy-Safe Structured Server Logger for Production Observability
 * 
 * Complies with strict privacy guidelines:
 * - NEVER logs raw user prompts
 * - NEVER logs complete AI text responses
 * - NEVER logs private experience content
 * - NEVER logs syllabus chunks or raw student data
 * - NEVER logs API keys or database connection strings
 */

export type LogCategory = 
  | 'chat_request' 
  | 'chat_auth' 
  | 'chat_rate_limit' 
  | 'chat_validation' 
  | 'chat_retrieval' 
  | 'chat_generation' 
  | 'chat_stream' 
  | 'health_check'

export type ErrorCategory = 
  | 'auth' 
  | 'rate_limit' 
  | 'validation' 
  | 'openai' 
  | 'retrieval' 
  | 'stream_interrupted' 
  | 'database' 
  | 'unknown'

export interface PerformanceMetrics {
  totalLatencyMs?: number
  contextualizationLatencyMs?: number
  embeddingLatencyMs?: number
  vectorRetrievalLatencyMs?: number
  campusMemoryRetrievalLatencyMs?: number
  syllabusRetrievalLatencyMs?: number
  generationLatencyMs?: number
}

export interface ChatLogEntry {
  requestId: string
  userId?: string
  conversationId?: string
  timestamp: string
  category: LogCategory
  status: 'success' | 'error' | 'warning' | 'info'
  metrics?: PerformanceMetrics
  retrievalCount?: number
  campusMemoryCount?: number
  syllabusCount?: number
  errorCategory?: ErrorCategory
  message?: string
}

export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function logServerEvent(entry: ChatLogEntry): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  const sanitizedLog = {
    request_id: entry.requestId,
    user_id: entry.userId ? `${entry.userId.substring(0, 8)}...` : undefined,
    conversation_id: entry.conversationId ? `${entry.conversationId.substring(0, 8)}...` : undefined,
    timestamp: entry.timestamp || new Date().toISOString(),
    category: entry.category,
    status: entry.status,
    metrics: entry.metrics,
    counts: {
      retrieval_total: entry.retrievalCount ?? 0,
      campus_memories: entry.campusMemoryCount ?? 0,
      syllabus_chunks: entry.syllabusCount ?? 0,
    },
    error_category: entry.errorCategory,
    message: entry.message,
  }

  const output = JSON.stringify(sanitizedLog)

  if (entry.status === 'error') {
    console.error(`[AI-SERVER-LOG] ${output}`)
  } else if (entry.status === 'warning') {
    console.warn(`[AI-SERVER-LOG] ${output}`)
  } else {
    console.log(`[AI-SERVER-LOG] ${output}`)
  }
}
