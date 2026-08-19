# STEP 57C — COURSE SYLLABUS DATABASE IMPLEMENTATION PLAN

## A. Approved Architecture
Based on STEP 57B, the system will use a normalized architecture enforcing strict separation between official university knowledge and student-generated Campus Brain data.

Architecture Flow:
`courses` → `course_syllabi` (document metadata/versions) → `syllabus_chunks` (vector embeddings and content sections).

## B. Exact Schema Implementation Plan

### `course_syllabi`
Represents an official syllabus version for a course.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `course_id`: UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE
- `academic_year`: TEXT NOT NULL
- `semester_period`: TEXT NOT NULL
- `is_active`: BOOLEAN NOT NULL DEFAULT true
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT now()

**Constraint:** A course can have multiple historical syllabus versions, but only one should ideally be designated as active via business logic during ingestion.

### `syllabus_chunks`
Represents semantic, retrievable sections of a syllabus.
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `syllabus_id`: UUID NOT NULL REFERENCES course_syllabi(id) ON DELETE CASCADE
- `course_id`: UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE (Denormalized for RPC query optimization)
- `section_title`: TEXT NOT NULL
- `content`: TEXT NOT NULL
- `page_number`: INTEGER
- `embedding`: vector(1536)
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT now()

## C. Migration Order
The safest deployment sequence to avoid downtime:
1. Verify `pgvector` extension is active (already handled in migration 000001).
2. Create table `course_syllabi`.
3. Create table `syllabus_chunks`.
4. Add foreign keys and cascading constraints.
5. Create GIN FTS index and HNSW vector index (`idx_syllabus_chunks_embedding`) on `syllabus_chunks`.
6. Create `match_course_syllabus_chunks` RPC function.
7. Enable RLS on both tables.
8. Create RLS policies.
9. Verify schema functionality via tests.
10. Run NodeJS ingestion script to import syllabus data.
11. Generate and store embeddings.
12. Test authorized server-side retrieval.

## D. RPC Design
```sql
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
```
This forces the database to only consider the active syllabus chunks belonging to the authorized courses explicitly provided by the server.

## E. RLS Design
Both `course_syllabi` and `syllabus_chunks` must have Row Level Security enabled.
- **Direct Client Access:** DENY ALL. Students should not perform direct `SELECT` queries on these tables via the Supabase client.
- **Server Access:** Retrieval will be strictly managed server-side via the chat API Route using the `match_course_syllabus_chunks` RPC or the `supabase-admin` service role.
- **Policies:**
  - `course_syllabi`: Authenticated users can `SELECT` (to allow joins in RPC if RPC isn't using SECURITY DEFINER).
  - `syllabus_chunks`: Authenticated users can `SELECT` (but RPC filtering enforces actual row-level access control based on `authorized_course_ids`).
  - *Alternatively, run the RPC as SECURITY DEFINER and bypass RLS for retrieval.*

## F. Authorization
1. Student authenticates (`auth.uid()`).
2. API Route fetches active `enrollments`.
3. Array of active `course_ids` is extracted.
4. `course_ids` array is explicitly passed to `match_course_syllabus_chunks`.
5. The PostgreSQL function strictly filters vector similarity search to only `syllabus_chunks` matching those `course_ids`.
No client parameter can override this array.

## G. Chunking
The PDF contains multiple courses. The parser will split logically:
1. Detect course boundary (e.g., "CSE 3101: Computer Graphics").
2. Detect section headers ("Course Content", "Recommended Books", "Pre-requisite").
3. Each section becomes one row in `syllabus_chunks`.
4. We do not arbitrarily split in the middle of sentences.
5. Page numbers are captured when headers or page breaks match.

## H. PDF Ingestion
A Node.js script (`scripts/ingest_syllabus.mjs`) will:
1. Load `5th_semester_syllabus.pdf` via `pdf-parse`.
2. Extract text and page structures.
3. Identify the 8 courses using a predefined mapping to `courses.id`.
4. Insert 8 new rows into `course_syllabi` (e.g., `academic_year = '2026'`, `is_active = true`).
5. Map sections to chunks, extracting text blocks.
6. Call OpenAI API (`text-embedding-3-small`) to embed each chunk's text.
7. Bulk insert vectors and metadata into `syllabus_chunks`.

## I. Embeddings
We will utilize `text-embedding-3-small` resulting in a `vector(1536)`. Embeddings are generated strictly during ingestion. If a syllabus updates, a new version is created and new embeddings generated. Routine chats only embed the query, keeping inference costs to a minimum.

## J. Evidence
The system will inject citations directly into the AI prompt context:
```text
=== OFFICIAL COURSE SYLLABUS ===
Course: CSE 3101
Section: Recommended Books
Source: Official Syllabus (Page 4)
Content: 1. Donald Hearn and M. Pauline Baker: Computer Graphics...
=== END OFFICIAL COURSE SYLLABUS ===
```
The AI will be instructed to append these concrete source traces (Course Code, Section, Page) when citing the syllabus.

## K. AI Routing
**Strategy:** Run both Official Syllabus AND Campus Brain searches concurrently (if authorized courses exist).
- If the user asks "What is the recommended textbook?", the vector search for syllabus chunks will naturally return high similarity for the `Recommended Books` chunk.
- If they ask "Where is the best place to study?", Campus Brain returns high similarity.
- Both results are injected into the context under their respective strict headers (`=== OFFICIAL COURSE SYLLABUS ===` vs `=== CAMPUS BRAIN ===`).
- The LLM's system prompt dictates: "Prioritize OFFICIAL COURSE SYLLABUS for academic facts. Use CAMPUS BRAIN for subjective student experiences."

## L. Versioning
When "Fall 2027" syllabus arrives:
1. Insert new `course_syllabi` with `is_active = true`.
2. Update the old `course_syllabi` to `is_active = false`.
3. Ingest and embed new chunks associated with the new syllabus ID.
4. The RPC intrinsically filters by `is_active = true`, immediately switching all students to the new syllabus. Old chunks remain safe for future archival/audit use.

## M. Rollback
In the event of failure:
1. Drop the `match_course_syllabus_chunks` RPC.
2. Drop `syllabus_chunks` table (cascades).
3. Drop `course_syllabi` table (cascades).
4. No harm done to `courses`, `enrollments`, or `campus_memories`.

## N. Verification
1. **Schema Check:** Ensure `course_syllabi` and `syllabus_chunks` exist, FKs are constrained, and `is_active` defaults to true.
2. **Authorization Test:** Invoke RPC with CSE 3101 ID array. Verify no CSE 3107 data returns.
3. **Retrieval Test:** Query "textbook". Verify the `similarity` score properly surfaces the Book section.
4. **Privacy Test:** Send an empty array `[]` as authorized courses. Ensure `0` rows return.
5. **AI Integration:** Validate that the UI displays the syllabus evidence cards appropriately in the Chat.

## O. Cost
- **Ingestion Cost:** ~10,000 tokens per PDF = fraction of a cent via OpenAI text-embedding-3-small.
- **Storage:** Negligible. 8 courses * ~10 chunks = 80 vectors. Extremely cheap and performant.
- **Query Cost:** Barely measurable. Concurrent retrieval will take < 100ms.

## P. Risks
- **Data Quality:** PDF parsing might mangle text if the PDF formatting is inconsistent. (Mitigation: Human-in-the-loop review of the parsed JSON before database insertion).
- **Over-Retrieval:** If the similarity threshold is too low, irrelevant syllabus chunks might clutter the AI context. (Mitigation: Set threshold appropriately, e.g., > 0.45).

## Q. Files to Change
1. `supabase/migrations/20240819000000_add_course_syllabus.sql` (New Migration)
2. `src/lib/retrieval.ts` (or direct modifications to `src/app/api/chat/route.ts`)
3. `scripts/ingest_syllabus.mjs` (New Node Script)
4. `src/app/api/chat/route.ts` (To handle concurrent RPC calls)
5. `src/components/chat/EvidenceCard.tsx` (To handle Syllabus evidence UI)

## R. Recommended STEP 57D
**STEP 57D — Course Syllabus Database Migration & Ingestion Pipeline**
Execute the migration SQL, create the ingestion script, parse the 5th-semester PDF, generate the vectors, and populate the database safely.

---
**FINAL VERDICT:**
C. COURSE SYLLABUS IMPLEMENTATION PLAN READY
