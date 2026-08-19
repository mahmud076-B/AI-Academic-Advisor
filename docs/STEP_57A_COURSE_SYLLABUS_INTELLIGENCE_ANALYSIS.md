# STEP 57A — COURSE SYLLABUS INTELLIGENCE ANALYSIS

## STEP 1: SOURCE AUDIT

### 1. Discovered `.pdf` Files
A scan of the repository revealed the following `.pdf` files:
1. `5th_semester_syllabus.pdf` (Primary syllabus file)
2. `Routine_5th_Semester_Section_B.pdf` (Class routine; not a syllabus document but captured in the `.pdf` scan)

### 2. Syllabus to Course ID Mapping
Based on an analysis of `5th_semester_syllabus.pdf` and the `supabase/seed.sql` data, the PDF contains official syllabus information for the following courses in the 5th semester:

| Course Code | Course Name | UUID |
| :--- | :--- | :--- |
| **CSE 3101** | Computer Graphics | `c0000000-0000-0000-0000-000000000101` |
| **CSE 3102** | Computer Graphics Lab | `c0000000-0000-0000-0000-000000000102` |
| **CSE 3103** | Database Management System | `c0000000-0000-0000-0000-000000000103` |
| **CSE 3104** | Database Management System Lab | `c0000000-0000-0000-0000-000000000104` |
| **CSE 3105** | Computer Architecture | `c0000000-0000-0000-0000-000000000105` |
| **CSE 3106** | Computer Architecture Lab | `c0000000-0000-0000-0000-000000000106` |
| **CSE 3107** | Communication Engineering | `c0000000-0000-0000-0000-000000000107` |
| **MAT 3141** | Applied Statistics and Probability | `c0000000-0000-0000-0000-000000003141` |

---

## PROPOSED ARCHITECTURE & IMPLEMENTATION PLAN

### 1. Database Schema Constraints & Blocker Identification
**Constraint:** NO database schema modifications (unless a blocker is found). NO new tables.

**Blocker Analysis:** 
The requirements state:
1. "Students must only access syllabi for courses they are currently enrolled in."
2. "Syllabus knowledge must be distinguishable from Campus Brain."
3. "Do NOT merge official syllabus knowledge into Campus Brain."

Currently, `campus_memories` is queried via the `match_campus_memories` RPC function, which performs a pure HNSW vector cosine distance search and DOES NOT support filtering by `tags`, `category`, or any access control array (like `authorized_course_ids`).

If we insert syllabus chunks into `campus_memories`, the existing Campus Brain retrieval will indiscriminately return syllabus data, violating the strict separation rule. Additionally, we would not be able to restrict syllabus vector searches to *only* the courses the student is enrolled in, violating the access control rule. 

**Resolution (Blocker Found):** 
Because of the constraints, we MUST introduce a schema modification to support filtering. To respect the "NO new tables" constraint as much as possible, we propose adding a **new RPC function** `match_course_syllabi` (and storing syllabus chunks in `campus_memories` with `category = 'official_syllabus'`).
However, combining official university data with student-generated memories in `campus_memories` is architecturally messy and violates the "Do NOT merge" directive fundamentally. 

**Recommendation:** Create a new dedicated table `course_syllabi` with its own `course_id` column and vector embeddings, and a corresponding `match_course_syllabi(query_embedding, match_threshold, match_count, allowed_course_ids)` RPC. 

*We will await the user's decision on whether to reuse `campus_memories` (with a new RPC) or create a new table based on this blocker.*

### 2. PDF Processing & Ingestion
1. **Extraction:** Use a lightweight library (e.g., `pdf-parse`) to extract text from `5th_semester_syllabus.pdf`.
2. **Chunking Strategy:** 
   - Parse the text and split it by course codes (e.g., "CSE 3101:").
   - For each course section, split the content into logical chunks (e.g., "Course Content", "Books Recommended", "Pre-requisite").
3. **Embedding:** Use `generateDocumentEmbedding` to create 1536-dimensional vectors for each chunk.
4. **Seeding:** Write a one-off script (`scripts/seed_syllabus.ts`) to insert these chunks into the database.

### 3. Retrieval & Access Control Pattern
1. **Identify Enrollments:** During a chat request, retrieve the user's active enrollments to get an array of authorized `course_id`s.
2. **Semantic Routing:** 
   - When the user's query pertains to official course materials (detected via LLM routing or keyword matching), execute `match_course_syllabi`.
   - Pass the authorized `course_id`s to the RPC function to ensure the database *only* searches within the student's enrolled courses.
3. **Context Injection:** If syllabus chunks are found, inject them into the system prompt under a distinct header: `=== OFFICIAL COURSE SYLLABUS ===`, strictly separated from `=== CRITICAL CAMPUS KNOWLEDGE ===`.

### 4. Preservation of Existing Systems
- **Campus Pulse & Campus Brain:** Remain completely untouched. `match_campus_memories` will continue to function normally (if we use a new table) or will be filtered to exclude `category = 'official_syllabus'`.
- **Contradiction Handling & Freshness:** Will remain intact for Campus Brain. Syllabus data is static and official, so it acts as the "ground truth" source for academic queries.
- **Study Rescue:** Can optionally leverage syllabus data to ground its study plans.
