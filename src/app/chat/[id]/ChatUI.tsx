'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, ChevronDown, ChevronUp, BrainCircuit, FileText, Clock, RotateCcw, AlertCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'

const EVIDENCE_STREAM_MARKER = '__AI_CAMPUS_BRAIN_EVIDENCE__'
const CLIENT_TIMEOUT_MS = 50000 // 50s safe threshold to prevent indefinite hang

type EvidenceItem = {
  title: string
  content: string
  created_at?: string | null
  updated_at?: string | null
  relevance?: string
  freshnessLabel?: string
  freshnessText?: string
  caution?: boolean
  conflictStatus?: 'consistent' | 'conflicting' | 'uncertain'
  conflictSummary?: string
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  evidence?: EvidenceItem[]
  isError?: boolean
}

function parseEvidenceMetadata(rawText: string) {
  const markerIndex = rawText.lastIndexOf(EVIDENCE_STREAM_MARKER)
  if (markerIndex === -1) {
    return { content: rawText, evidence: [] as EvidenceItem[] }
  }

  const content = rawText.slice(0, markerIndex).trimEnd()
  const jsonPayload = rawText.slice(markerIndex + EVIDENCE_STREAM_MARKER.length).trim()

  try {
    const parsed = JSON.parse(jsonPayload) as { evidence?: EvidenceItem[] }
    return {
      content,
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    }
  } catch {
    return { content, evidence: [] as EvidenceItem[] }
  }
}

export default function ChatUI({ 
  conversationId, 
  initialMessages 
}: { 
  conversationId: string,
  initialMessages: ChatMessage[]
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastFailedMessage, setLastFailedMessage] = useState<ChatMessage | null>(null)
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get('prompt')
  const initialPromptHandled = useRef(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, errorMessage])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  async function executeChatRequest(currentMessages: ChatMessage[], isFirstMsg: boolean, targetUserMsg: ChatMessage) {
    setIsLoading(true)
    setErrorMessage(null)
    setLastFailedMessage(null)

    const controller = new AbortController()
    abortControllerRef.current = controller
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, CLIENT_TIMEOUT_MS)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          conversationId,
          messages: currentMessages
        })
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errText = 'The AI advisor encountered an issue. Please try again.'
        try {
          const bodyText = await response.text()
          if (bodyText && bodyText.length < 200 && !bodyText.includes('<!DOCTYPE')) {
            errText = bodyText
          }
        } catch {
          // ignore
        }
        throw new Error(errText)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('No reader available')

      // Append blank assistant message placeholder
      setMessages(prev => [...prev, { id: `ai-resp-${Date.now()}`, role: 'assistant', content: '', evidence: [] }])

      let assistantContent = ''
      let evidenceText = ''
      let evidenceStarted = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        
        let parsedChunk = chunk
        if (chunk.startsWith('0:')) {
          try {
             const parts = chunk.split('\n')
             parsedChunk = parts.map(p => p.startsWith('0:') ? JSON.parse(p.substring(2)) : '').join('')
          } catch {
            // Ignore malformed chunks
          }
        }

        const markerIndex = parsedChunk.indexOf(EVIDENCE_STREAM_MARKER)
        if (markerIndex >= 0) {
          const beforeMarker = parsedChunk.slice(0, markerIndex)
          const afterMarker = parsedChunk.slice(markerIndex + EVIDENCE_STREAM_MARKER.length)
          assistantContent += beforeMarker
          evidenceText += afterMarker
          evidenceStarted = true
        } else if (evidenceStarted) {
          evidenceText += parsedChunk
        } else {
          assistantContent += parsedChunk
        }

        setMessages((prev: ChatMessage[]) => {
          const newMsgs = [...prev]
          newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: assistantContent }
          return newMsgs
        })
      }

      // Check if stream was interrupted mid-way
      if (assistantContent.includes('[Response interrupted')) {
        setErrorMessage('The connection was interrupted while generating the response.')
        setLastFailedMessage(targetUserMsg)
      }

      const finalPayload = parseEvidenceMetadata(`${assistantContent}${evidenceStarted ? EVIDENCE_STREAM_MARKER + evidenceText : ''}`)

      setMessages((prev: ChatMessage[]) => {
        const newMsgs = [...prev]
        const lastMessage = newMsgs[newMsgs.length - 1]
        newMsgs[newMsgs.length - 1] = {
          ...lastMessage,
          content: finalPayload.content,
          evidence: finalPayload.evidence,
        }
        return newMsgs
      })

      if (isFirstMsg) {
        router.refresh()
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      const isAbort = error?.name === 'AbortError'
      const cleanMessage = isAbort
        ? 'The request took longer than expected to respond. Please click Retry.'
        : (error?.message && !error.message.includes('fetch')) 
          ? error.message 
          : 'Unable to connect to the advisor service. Please check your connection and click Retry.'

      setErrorMessage(cleanMessage)
      setLastFailedMessage(targetUserMsg)

      // Remove any empty assistant placeholder if it had zero content
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && !prev[prev.length - 1].content.trim()) {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e?: React.FormEvent, overrideInput?: string) {
    if (e) e.preventDefault()
    
    const content = overrideInput || input
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content, evidence: [] }
    const isFirstMessage = messages.length === 0
    const newMessages = [...messages, userMessage]
    
    setMessages(newMessages)
    if (!overrideInput) {
      setInput('')
    }
    
    // Reset textarea height
    const textarea = document.getElementById('chat-composer')
    if (textarea) textarea.style.height = 'auto'
    
    await executeChatRequest(newMessages, isFirstMessage, userMessage)
  }

  async function handleRetry() {
    if (isLoading || !lastFailedMessage) return
    // Ensure we retry with the existing conversation messages up to the failed message
    const msgList = messages.some(m => m.id === lastFailedMessage.id) 
      ? messages 
      : [...messages, lastFailedMessage]

    // Remove any trailing broken assistant response before retrying
    const cleanedMessages = msgList.filter((m, idx) => {
      if (idx === msgList.length - 1 && m.role === 'assistant' && !m.content.trim()) return false
      return true
    })

    setMessages(cleanedMessages)
    await executeChatRequest(cleanedMessages, cleanedMessages.length === 1, lastFailedMessage)
  }

  useEffect(() => {
    if (initialPrompt && messages.length === 0 && !isLoading && !initialPromptHandled.current) {
      initialPromptHandled.current = true
      
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('prompt')
      window.history.replaceState({}, '', newUrl.toString())
      
      handleSubmit(undefined, initialPrompt)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, messages.length, isLoading])

  return (
    <div className="flex flex-col flex-1 bg-[var(--color-surface-0)] overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)] text-[var(--text-small)]">
            <div className="flex flex-col items-center gap-4 opacity-80">
               <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-100)] flex items-center justify-center text-[var(--color-brand-600)]">
                 <Sparkles className="w-6 h-6" />
               </div>
               <p className="font-medium text-[var(--color-text-primary)]">Ready to help you today</p>
               <button
                 type="button"
                 onClick={() => handleSubmit(undefined, 'Build me an exam rescue plan')}
                 className="mt-2 inline-flex items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-2 text-[var(--text-small)] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-50)] hover:text-[var(--color-text-primary)] transition-all shadow-sm"
               >
                 Build me an exam rescue plan
               </button>
            </div>
          </div>
        )}
        
        {messages.map((m, index) => {
          const evidence = Array.isArray(m.evidence) ? m.evidence : []
          const isEvidenceExpanded = !!expandedEvidence[m.id]
          const showEvidenceToggle = evidence.length > 1
          
          const isStudyRescue = m.role === 'assistant' && (m.content.includes('## Exam Rescue Plan') || m.content.includes('=== STUDY RESCUE MODE ==='))
          const displayContent = isStudyRescue ? m.content.replace('## Exam Rescue Plan', '').replace('=== STUDY RESCUE MODE ===', '').trim() : m.content

          return (
            <div 
              key={m.id} 
              className={`flex gap-4 max-w-[760px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-[var(--transition-duration-standard)] fill-mode-both ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              aria-live={m.role === 'assistant' && isLoading && index === messages.length - 1 ? 'polite' : 'off'}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                m.role === 'user' ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]' : 'bg-transparent text-[var(--color-brand-600)]'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-5 h-5" />}
              </div>

              <div className={m.role === 'user' ? 'max-w-[85%]' : 'w-full min-w-0'}>
                {/* Bubble / Content */}
                <div 
                  className={m.role === 'user' 
                    ? 'px-5 py-3.5 text-[var(--text-body)] leading-relaxed shadow-[var(--shadow-sm)] bg-[var(--color-brand-600)] text-white rounded-[var(--radius-xl)] rounded-tr-sm' 
                    : 'py-1 text-[var(--text-body)] leading-relaxed text-[var(--color-text-primary)] w-full'
                  }
                >
                  {m.role === 'user' ? (
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  ) : (
                    <div className="space-y-4 w-full">
                      {isStudyRescue && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-100">
                           <Clock className="w-4 h-4 text-red-600" />
                           <span className="text-[var(--text-small)] font-semibold text-red-700 uppercase tracking-wider">Study Rescue Active</span>
                        </div>
                      )}
                      <MarkdownRenderer content={displayContent} />
                    </div>
                  )}
                </div>

                {/* Evidence Section */}
                {m.role === 'assistant' && evidence.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {evidence.map((item: EvidenceItem, index: number) => {
                      const isSyllabus = item.relevance === 'Official Course Material'
                      const isConflicting = item.conflictStatus === 'conflicting'
                      
                      const themeColor = isSyllabus ? 'var(--color-syllabus-500)' : 'var(--color-brain-500)'
                      const bgColor = isSyllabus ? 'var(--color-syllabus-50)' : 'var(--color-brain-50)'
                      const borderColor = isSyllabus ? 'var(--color-syllabus-200)' : 'var(--color-brain-200)'
                      const textColor = isSyllabus ? 'var(--color-syllabus-800)' : 'var(--color-brain-800)'
                      const Icon = isSyllabus ? FileText : BrainCircuit
                      const label = isSyllabus ? 'Official Course Syllabus' : 'Campus Brain'
                      
                      // Only show top item unless expanded
                      if (!isEvidenceExpanded && index > 0) return null

                      return (
                        <div key={`${m.id}-${index}`} className="rounded-[var(--radius-lg)] border bg-[var(--color-surface-0)] overflow-hidden transition-all duration-[var(--transition-duration-standard)]" style={{ borderColor: isConflicting ? 'var(--color-amber-200)' : borderColor }}>
                          {/* Evidence Header */}
                          <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b transition-colors" style={{ backgroundColor: isConflicting ? 'var(--color-amber-50)' : bgColor, borderColor: isConflicting ? 'var(--color-amber-200)' : borderColor }}>
                            <div className="flex items-center gap-2 text-[var(--text-small)] font-medium" style={{ color: isConflicting ? 'var(--color-amber-800)' : textColor }}>
                              <Icon className="w-3.5 h-3.5" />
                              {label}
                            </div>
                            <div className="flex items-center gap-3">
                              {item.freshnessLabel && (
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.caution ? 'bg-amber-100 text-amber-800' : 'bg-white/60 text-slate-600'}`}>
                                  {item.freshnessLabel}
                                </span>
                              )}
                              {index === 0 && showEvidenceToggle && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedEvidence(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                                  aria-expanded={isEvidenceExpanded}
                                  aria-controls={`evidence-content-${m.id}`}
                                  className="flex items-center gap-1 text-[10px] font-medium hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 rounded-sm" style={{ color: isConflicting ? 'var(--color-amber-800)' : textColor, '--tw-ring-color': themeColor } as React.CSSProperties}
                                >
                                  {isEvidenceExpanded ? 'Hide Sources' : `+${evidence.length - 1} More`}
                                  {isEvidenceExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Evidence Body */}
                          <div id={`evidence-content-${m.id}`} className="px-4 py-3 bg-[var(--color-surface-0)]">
                            <div className="text-[var(--text-small)] font-medium text-[var(--color-text-primary)] mb-1 break-words">
                              {item.title}
                            </div>
                            {isConflicting && index === 0 && item.conflictSummary && (
                              <div className="mb-2 text-[11px] text-amber-700 font-medium">
                                ⚠ {item.conflictSummary}
                              </div>
                            )}
                            <div className="text-[12px] leading-relaxed text-[var(--color-text-secondary)] break-words whitespace-pre-wrap">
                              {item.content}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div 
            className="flex gap-4 max-w-[760px] mx-auto w-full flex-row animate-in fade-in slide-in-from-bottom-2 duration-[var(--transition-duration-standard)]"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 bg-transparent text-[var(--color-brand-600)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="py-3 flex items-center w-full">
               <div className="flex space-x-1.5 items-center opacity-60" aria-label="AI is thinking">
                 <div className="w-1.5 h-1.5 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '0ms' }}></div>
                 <div className="w-1.5 h-1.5 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '150ms' }}></div>
                 <div className="w-1.5 h-1.5 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '300ms' }}></div>
               </div>
            </div>
          </div>
        )}

        {/* Failure & Safe Retry Box */}
        {errorMessage && !isLoading && (
          <div className="max-w-[760px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-[var(--radius-lg)] bg-red-50 border border-red-200 text-red-800">
              <div className="flex items-center gap-2.5 text-[var(--text-small)] font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {lastFailedMessage && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors shadow-xs flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Composer Area */}
      <div className="p-4 md:p-6 bg-[var(--color-surface-0)] border-t border-[var(--color-border-subtle)]">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-[760px] mx-auto relative items-end">
          <textarea
            id="chat-composer"
            aria-label="Message AI Academic Advisor"
            className="chat-composer flex-1 bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] text-[var(--text-body)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-400)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-500)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-hover)] transition-all resize-none overflow-hidden max-h-[200px]"
            value={input}
            placeholder="Ask your AI Academic Advisor..."
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            disabled={isLoading}
            autoFocus
            rows={1}
          />
          <button 
            type="submit" 
            aria-label="Send message"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 w-10 h-10 flex items-center justify-center bg-[var(--color-brand-600)] text-white rounded-full hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-500)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[var(--shadow-sm)] flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="chat-disclaimer text-center">
          AI Advisor uses shared Campus Memory. It can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}
