'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { generateDocumentEmbedding } from '@/lib/embeddings'
import { recordTelemetryEvent } from '@/lib/telemetry'
import { generateRequestId } from '@/lib/server-logger'

const SHARE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_SHARES_PER_WINDOW = 5

const shareRateLimitMap = new Map<string, number[]>()

function checkShareRateLimit(userId: string): boolean {
  const now = Date.now()
  let userRequests = shareRateLimitMap.get(userId) || []
  userRequests = userRequests.filter(timestamp => now - timestamp < SHARE_RATE_LIMIT_WINDOW_MS)
  
  if (userRequests.length >= MAX_SHARES_PER_WINDOW) {
    shareRateLimitMap.set(userId, userRequests)
    return false
  }
  
  userRequests.push(now)
  shareRateLimitMap.set(userId, userRequests)
  return true
}

/**
 * Sanitizes shared experience content to prevent accidental leakage of raw secrets or credentials into public vector index.
 */
function sanitizeSharedExperienceContent(text: string): string {
  if (!text) return text
  return text
    .replace(/\b(?:sk-[a-zA-Z0-9_\-]{20,}|Bearer\s+[a-zA-Z0-9_\-\.]{20,})\b/gi, '[REDACTED_SECRET]')
    .replace(/\b(?:password|passwd|api[_-]?key|secret[_-]?key)\s*[:=]\s*\S+/gi, '[REDACTED_CREDENTIAL]')
}

export async function createExperience(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!checkShareRateLimit(user.id)) {
    redirect('/experiences/new?error=Rate_Limit_Exceeded')
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const visibility = formData.get('visibility') as 'private' | 'shared'

  if (!title || !content || !visibility) {
    redirect('/experiences/new?error=Missing_Fields')
  }

  const trimmedTitle = title.trim()
  const trimmedContent = content.trim()

  if (trimmedTitle.length < 5 || trimmedTitle.length > 150) {
    redirect('/experiences/new?error=Invalid_Title_Length')
  }

  if (trimmedContent.length < 15 || trimmedContent.length > 3000) {
    redirect('/experiences/new?error=Invalid_Content_Length')
  }

  // 1. Insert Experience
  const { data: exp, error: expError } = await supabase
    .from('experiences')
    .insert({
      student_id: user.id,
      title: trimmedTitle,
      content: trimmedContent,
      visibility
    })
    .select()
    .single()

  if (expError || !exp) {
    console.error('Failed to create experience:', expError)
    redirect('/experiences/new?error=Creation_Failed')
  }

  // 2. Promote to Campus Memories if shared
  if (visibility === 'shared') {
    const adminClient = createAdminClient()
    const safeTitle = sanitizeSharedExperienceContent(exp.title)
    const safeContent = sanitizeSharedExperienceContent(exp.content)
    
    // Generate embedding
    const embedding = await generateDocumentEmbedding(safeTitle, safeContent)
    if (!embedding) {
      console.error('[Embedding Fallback] Memory shared but embedding failed. Will require background retry.')
    }
    
    const { error: cmError } = await adminClient
      .from('campus_memories')
      .upsert({
        title: safeTitle,
        content: safeContent,
        source_experience_id: exp.id,
        embedding: embedding || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'source_experience_id' })

    if (cmError) {
      console.error('Failed to promote to campus memory:', cmError)
    } else {
      recordTelemetryEvent({
        requestId: generateRequestId(),
        userId: user.id,
        eventType: 'experience_shared',
        status: 'success',
      })
    }
  }

  revalidatePath('/experiences')
  redirect('/experiences')
}

export async function updateExperienceVisibility(experienceId: string, newVisibility: 'private' | 'shared') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (newVisibility === 'shared' && !checkShareRateLimit(user.id)) {
    return { error: 'Rate limit exceeded. Please wait before sharing again.' }
  }

  // 1. Update experience
  const { data: exp, error: expError } = await supabase
    .from('experiences')
    .update({ visibility: newVisibility, updated_at: new Date().toISOString() })
    .eq('id', experienceId)
    .eq('student_id', user.id) // Enforce ownership
    .select()
    .single()

  if (expError || !exp) {
    console.error('Failed to update experience:', expError)
    return { error: 'Update failed' }
  }

  // 2. Sync to Campus Memories
  const adminClient = createAdminClient()
  if (newVisibility === 'shared') {
    const safeTitle = sanitizeSharedExperienceContent(exp.title)
    const safeContent = sanitizeSharedExperienceContent(exp.content)

    const embedding = await generateDocumentEmbedding(safeTitle, safeContent)
    if (!embedding) {
      console.error('[Embedding Fallback] Visibility updated but embedding failed. Will require background retry.')
    }

    // Upsert to ensure no duplicates
    await adminClient
      .from('campus_memories')
      .upsert({
        title: safeTitle,
        content: safeContent,
        source_experience_id: exp.id,
        embedding: embedding || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'source_experience_id' })

    recordTelemetryEvent({
      requestId: generateRequestId(),
      userId: user.id,
      eventType: 'experience_shared',
      status: 'success',
    })
  } else {
    // If changed to private, remove from campus_memories
    await adminClient
      .from('campus_memories')
      .delete()
      .eq('source_experience_id', exp.id)

    recordTelemetryEvent({
      requestId: generateRequestId(),
      userId: user.id,
      eventType: 'experience_unshared',
      status: 'info',
    })
  }

  revalidatePath('/experiences')
  return { success: true }
}

export async function getExperiences() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('experiences')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getSharedExperiences(limit: number = 100) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('experiences')
    .select('*')
    .eq('visibility', 'shared')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

export async function searchSharedExperiences(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  if (!query || query.trim().length < 2) {
    return []
  }

  const { data } = await supabase
    .from('campus_memories')
    .select('id, title, content, created_at, updated_at')
    .textSearch('content', query.trim(), { type: 'websearch' })
    .limit(20)

  return data || []
}
