# STEP 57B — COURSE SYLLABUS DATA ARCHITECTURE

## A. Problem Statement
The system currently provides an evidence-backed "Campus Brain" consisting of student-generated memories and observations. We now need to incorporate official course knowledge (Course Syllabi) into the AI Academic Advisor. However, this official knowledge must remain architecturally separated from the Campus Brain to prevent mixing student-generated "hearsay" with university "facts". Additionally, strict access controls must be enforced so that a student can only retrieve syllabus chunks for courses in which they are actively enrolled.

## B. Official vs Campus Brain Distinction
- **Official Course Syllabus:** Authoritative, immutable (per version), university-provided facts. Ground truth for academic requirements, grading, and topics.
- **Campus Brain:** Student-contributed, subjective, evolving. Good for "what it's actually like" or "best places to sit".
- **Separation Strategy:** These two sources will live in separate database tables and be queried via separate vector retrieval RPC functions. When injected into the AI context prompt, they will be explicitly separated under `=== OFFICIAL COURSE SYLLABUS ===` and `=== CAMPUS BRAIN ===` headers.

## C. Table Design Options
We evaluated three approaches:
- **Option A:** Single `course_syllabi` table storing full PDF text. *Rejected:* Unsuitable for precise semantic vector retrieval (chunks are too large).
- **Option B:** `course_syllabi` (metadata/versioning) + `syllabus_chunks` (vector/content). *Recommended:* Allows versioning at the document level and precise semantic retrieval at the chunk level.
- **Option C:** Direct `courses` -> `syllabus_chunks` relationship. *Rejected:* Lacks a container for document-level metadata (like "Fall 2026 Version" or source PDF reference).

## D. Recommended Schema
We recommend **Option B**, utilizing two new tables:

### 1. `course_syllabi`
Represents the official syllabus document for a course version.
- `id` (UUID, Primary Key)
- `course_id` (UUID, Foreign Key -> `courses.id`, ON DELETE CASCADE)
- `academic_year` (TEXT, e.g., '2026')
- `semester_period` (TEXT, e.g., 'Fall')
- `is_active` (BOOLEAN, default true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `syllabus_chunks`
Represents the semantic retrieval units of a syllabus.
- `id` (UUID, Primary Key)
- `syllabus_id` (UUID, Foreign Key -> `course_syllabi.id`, ON DELETE CASCADE)
- `course_id` (UUID, Foreign Key -> `courses.id`, denormalized for faster RPC filtering, ON DELETE CASCADE)
- `section_title` (TEXT, e.g., 'Recommended Textbooks', 'Course Content')
- `content` (TEXT, the actual chunk text)
- `page_number` (INTEGER, nullable)
- `embedding` (vector(1536))
- `created_at` (TIMESTAMPTZ)

## E. Course Relationship
- A `course` has zero to many `course_syllabi` (to support historical versions).
- We use the existing `courses.id`.
- The `is_active` flag on `course_syllabi` determines the current active version to prevent querying outdated requirements.

## F. Chunk Model
PDFs will be parsed and split logically, preserving academic structure:
- Instead of blind 500-character text splitting, chunks will be section-based (e.g., extracting the "Prerequisites" section as one chunk, "Learning Outcomes" as another).
- Each chunk carries its `section_title` and `page_number` to ensure AI evidence attribution is highly specific.

## G. Embedding Model
- **Model:** `text-embedding-3-small` (consistent with Campus Memories).
- **Dimension:** `vector(1536)`.
- **Index:** `hnsw (embedding vector_cosine_ops)` on the `syllabus_chunks` table for high-performance cosine similarity searches.

## H. Retrieval / RPC Design
We will create a new RPC function `match_course_syllabus_chunks`:
```sql
CREATE OR REPLACE FUNCTION match_course_syllabus_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  authorized_course_ids uuid[]
)
RETURNS TABLE (
  chunk_id uuid,
  course_code text,
  section_title text,
  content text,
  page_number int,
  similarity float
)
```
This explicitly accepts an array of `authorized_course_ids` and uses it in the `WHERE` clause (`WHERE syllabus_chunks.course_id = ANY(authorized_course_ids)`).

## I. Authorization Model
1. **Chat Route:** When a student sends a message, the server retrieves their active `enrollments`.
2. **Authorized IDs:** The server extracts the `course_id` array from these active enrollments.
3. **RPC Execution:** The server passes the array into `match_course_syllabus_chunks`.
4. **Result:** The database intrinsically filters out any syllabus chunks belonging to courses the student is not currently enrolled in.

## J. RLS Requirements
- **`course_syllabi` and `syllabus_chunks`:** 
  - Since retrieval is handled via the secure server-side API Route (`src/app/api/chat/route.ts`) calling the RPC, direct client `SELECT` is not necessary.
  - **Policy:** RLS will be enabled. We can safely deny all direct client access (or restrict SELECT using an `EXISTS` subquery on `enrollments`).
  - To prevent accidental exposure, the RPC should execute with the caller's privileges (or be strictly parameterized).

## K. Evidence / Source Model
The AI context injection will be formatted as:
```text
=== OFFICIAL COURSE SYLLABUS ===
Course: CSE 3101
Section: Recommended Books
Source: Official Syllabus (Page 4)
Content: 1. Donald Hearn and M. Pauline Baker: Computer Graphics...
=== END OFFICIAL COURSE SYLLABUS ===
```
This provides the AI with perfect traceability to cite "According to the official CSE 3101 syllabus, under Recommended Books (Page 4)..."

## L. Versioning
- When a new syllabus is adopted for 2027, a new `course_syllabi` record is created with `academic_year = '2027'`, and `is_active = true`. 
- The older record is updated to `is_active = false`.
- The RPC function will inherently join against `course_syllabi` to only search chunks where `course_syllabi.is_active = true`.
- No database rebuilding is required; old chunks remain safely archived.

## M. PDF Ingestion Architecture (Future)
1. **Extract:** Admin runs script pointing to PDF.
2. **Parse & Segment:** Script uses `pdf-parse` and RegEx to detect course boundaries and section headers.
3. **Embed:** Send text segments to OpenAI Embeddings API.
4. **Insert:** Insert `course_syllabi` metadata, then bulk insert into `syllabus_chunks` with vectors and `course_id`s.

## N. Existing Schema Compatibility
- Completely non-destructive.
- Relies cleanly on existing `courses.id`.
- Does not alter or break `campus_memories`, `experiences`, `profiles`, or `enrollments`.
- Compatible with the existing `vector` extension.

## O. Security Risks
- **Risk:** Client manipulating `authorized_course_ids`. 
  - **Mitigation:** The `authorized_course_ids` array is generated 100% server-side in `route.ts` based on `auth.uid()` and verified `enrollments`. The client never dictates authorized courses.
- **Risk:** Prompt Injection in Syllabus text.
  - **Mitigation:** Syllabi are university-provided PDFs, vastly reducing the risk of malicious text compared to student input.

## P. Performance / Cost Considerations
- **Storage:** Small. A syllabus might yield 20-40 chunks. Even for 100 courses, 4,000 vectors is trivial for pgvector HNSW.
- **Compute:** Fast filtering. Because `course_id` is passed, the HNSW search space is drastically pre-filtered, making retrieval ultra-fast.
- **Cost:** Embedding generation is a one-time cost during PDF ingestion (pennies).

## Q. Exact Implementation Order
1. **Database Migration:** Create `course_syllabi`, `syllabus_chunks` tables, indexes, and `match_course_syllabus_chunks` RPC.
2. **Ingestion Script:** Build the parser to extract and embed the `5th_semester_syllabus.pdf`.
3. **Chat API Update:** Update `src/app/api/chat/route.ts` to derive authorized courses and query the new RPC if the context requires it.
4. **Prompt Update:** Inject the result into the system prompt under the `=== OFFICIAL COURSE SYLLABUS ===` header.

## R. Open Questions
- Do we want to surface the actual PDF files in the UI for students to download natively, or is AI retrieval sufficient for now? (Assumption: AI retrieval is sufficient for the MVP).
- How do we handle multi-language (e.g., if some syllabus sections contain Bangla)? (Assumption: text-embedding-3-small handles multilingual well, similar to Campus Brain).

## FINAL VERDICT
C. COURSE SYLLABUS ARCHITECTURE READY FOR IMPLEMENTATION
