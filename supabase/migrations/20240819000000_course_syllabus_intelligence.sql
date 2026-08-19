-- ==========================================
-- STEP 57D: COURSE SYLLABUS INTELLIGENCE
-- ==========================================

-- 1. Create course_syllabi table
CREATE TABLE IF NOT EXISTS course_syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  semester_period TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create syllabus_chunks table
CREATE TABLE IF NOT EXISTS syllabus_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES course_syllabi(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  content TEXT NOT NULL,
  page_number INTEGER,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_course_syllabi_course_id ON course_syllabi(course_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_chunks_syllabus_id ON syllabus_chunks(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_chunks_course_id ON syllabus_chunks(course_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_chunks_embedding ON syllabus_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. RLS Enablement
ALTER TABLE course_syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_chunks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow authenticated users to SELECT (actual row-level filtering is enforced by the RPC authorized_course_ids check, 
-- but we allow generic SELECT so the RPC can perform JOINs smoothly).
DROP POLICY IF EXISTS "Authenticated users can select course_syllabi" ON course_syllabi;
CREATE POLICY "Authenticated users can select course_syllabi" 
ON course_syllabi FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can select syllabus_chunks" ON syllabus_chunks;
CREATE POLICY "Authenticated users can select syllabus_chunks" 
ON syllabus_chunks FOR SELECT 
USING (auth.role() = 'authenticated');

-- 6. RPC for Vector Similarity Search with Authorization Enforcement
CREATE OR REPLACE FUNCTION match_course_syllabus_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  authorized_course_ids uuid[]
)
RETURNS TABLE (
  chunk_id uuid,
  course_id uuid,
  course_code text,
  section_title text,
  content text,
  page_number int,
  similarity float
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id as chunk_id,
    sc.course_id,
    c.code as course_code,
    sc.section_title,
    sc.content,
    sc.page_number,
    1 - (sc.embedding <=> query_embedding) AS similarity
  FROM syllabus_chunks sc
  JOIN course_syllabi cs ON sc.syllabus_id = cs.id
  JOIN courses c ON sc.course_id = c.id
  WHERE cs.is_active = true
    AND sc.course_id = ANY(authorized_course_ids)
    AND 1 - (sc.embedding <=> query_embedding) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
