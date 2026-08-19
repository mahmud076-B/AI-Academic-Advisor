import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

// The embedding model requested for the architecture
const EMBEDDING_MODEL = 'text-embedding-3-small'

// The output dimension of text-embedding-3-small
export const VECTOR_DIMENSION = 1536

/**
 * Generates an embedding vector for a document (e.g., Campus Memory content).
 * Safe for server-side use only. Catches and logs errors safely without exposing secrets.
 * 
 * @param title The title of the memory
 * @param content The content of the memory
 * @returns An array of numbers (the vector) or null if it fails
 */
export async function generateDocumentEmbedding(title: string, content: string): Promise<number[] | null> {
  try {
    const textToEmbed = `${title}\n${content}`
    
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: textToEmbed,
    })
    
    return embedding
  } catch (error) {
    console.error('[Embedding Utility] Failed to generate document embedding. Please check rate limits and connection.')
    // Note: Do not log the raw error object to avoid exposing API keys or sensitive trace data
    return null
  }
}

/**
 * Generates an embedding vector for a search query.
 * Safe for server-side use only. Catches and logs errors safely without exposing secrets.
 * 
 * @param query The search query string
 * @returns An array of numbers (the vector) or null if it fails
 */
export async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: query,
    })
    
    return embedding
  } catch (error) {
    console.error('[Embedding Utility] Failed to generate query embedding. Please check rate limits and connection.')
    // Note: Do not log the raw error object to avoid exposing API keys or sensitive trace data
    return null
  }
}
