-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to campus_memories
ALTER TABLE campus_memories 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create HNSW index for cosine distance
CREATE INDEX IF NOT EXISTS idx_campus_memories_embedding
ON campus_memories USING hnsw (embedding vector_cosine_ops);

-- 4. Create similarity search RPC function
CREATE OR REPLACE FUNCTION match_campus_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    campus_memories.id,
    campus_memories.title,
    campus_memories.content,
    1 - (campus_memories.embedding <=> query_embedding) AS similarity
  FROM campus_memories
  WHERE 1 - (campus_memories.embedding <=> query_embedding) > match_threshold
  ORDER BY campus_memories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
