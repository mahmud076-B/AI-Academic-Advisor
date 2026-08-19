import { createClient } from '@supabase/supabase-js'
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const EMBEDDING_MODEL = 'text-embedding-3-small'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function backfill() {
  console.log('Starting backfill for campus_memories embeddings...')
  
  let processed = 0
  let failed = 0
  const failedIds = []

  while (true) {
    // Process in safe batches of 50
    const { data: memories, error } = await supabase
      .from('campus_memories')
      .select('id, title, content')
      .is('embedding', null)
      .limit(50)

    if (error) {
      console.error('Failed to fetch memories:', error)
      break
    }

    if (!memories || memories.length === 0) {
      console.log('No more records without embeddings.')
      break
    }

    console.log(`Processing batch of ${memories.length} records...`)

    for (const memory of memories) {
      try {
        const textToEmbed = `${memory.title}\n${memory.content}`
        
        let success = false
        let retries = 3
        let delay = 1000

        while (retries > 0 && !success) {
          try {
            const { embedding } = await embed({
              model: openai.embedding(EMBEDDING_MODEL),
              value: textToEmbed,
            })

            const { error: updateError } = await supabase
              .from('campus_memories')
              .update({ embedding })
              .eq('id', memory.id)

            if (updateError) {
              console.error(`DB Update failed for ID ${memory.id}`)
              failed++
              failedIds.push(memory.id)
            } else {
              processed++
            }
            success = true
          } catch (embedError) {
            if (embedError.message && embedError.message.includes('429')) {
              console.warn(`Rate limit hit, retrying in ${delay}ms...`)
              await sleep(delay)
              delay *= 2
              retries--
            } else {
              console.error(`Embedding failed for ID ${memory.id}`)
              failed++
              failedIds.push(memory.id)
              break // Don't retry non-rate-limit errors
            }
          }
        }

        if (!success && retries === 0) {
          console.error(`Max retries reached for ID ${memory.id}`)
          failed++
          failedIds.push(memory.id)
        }

      } catch (err) {
        console.error(`Unexpected error for ID ${memory.id}`)
        failed++
        failedIds.push(memory.id)
      }
    }
  }

  console.log('--- Backfill Summary ---')
  console.log(`Total successfully processed: ${processed}`)
  console.log(`Total failed: ${failed}`)

  if (failed > 0) {
    console.log('Failed IDs:', failedIds)
    console.log('WARNING: Backfill is NOT complete due to failures.')
  } else {
    // Final verification
    const { count, error } = await supabase
      .from('campus_memories')
      .select('*', { count: 'exact', head: true })
      .is('embedding', null)

    if (error) {
      console.error('Failed to verify final count:', error)
    } else {
      console.log(`Verification: COUNT(*) WHERE embedding IS NULL: ${count}`)
      if (count === 0) {
        console.log('SUCCESS: Backfill is complete.')
      } else {
        console.log('WARNING: Backfill is NOT complete. Some records still null.')
      }
    }
  }
}

backfill()
