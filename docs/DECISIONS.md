# Decisions

This file records important technical and product decisions, including the reason behind each decision and alternatives considered.

## Decision Log

### Unified Full-Stack Architecture

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The project will use a unified full-stack application architecture.
- Reason: This keeps the project simpler for a beginner developer, reduces coordination between separate frontend and backend projects, supports AI-assisted development, and is suitable for the MVP scope.

### Next.js Application Framework

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The project will use Next.js as the application framework.
- Reason: Next.js supports a unified full-stack application structure with frontend UI and server-side backend logic in one project.

### React And TypeScript

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The project will use React and TypeScript.
- Reason: React fits the modern SaaS/chat-style interface direction, and TypeScript supports maintainability, clearer code structure, and safer AI-assisted development.

### Next.js Server-Side Backend

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: Backend logic for the MVP will be handled by the server-side capabilities of the Next.js application.
- Reason: This avoids a separate backend service while still allowing secure server-side logic for authentication checks, database access, AI integration, and context assembly.

### Supabase PostgreSQL

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The project will use Supabase PostgreSQL as the database.
- Reason: The MVP requires persistent storage for student academic context, courses, class routine, chat history, Campus Memory, and shared experiences.

### Supabase Auth

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The project will use Supabase Auth for student authentication.
- Reason: Student authentication is part of the MVP, and using a managed authentication service avoids building custom authentication from scratch.

### Server-Side OpenAI Integration

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: OpenAI integration will happen on the server side.
- Reason: Server-side integration protects AI API keys and allows the application to assemble student context and relevant Campus Memory before calling the AI provider.

### Campus Memory Stored In PostgreSQL

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: Campus Memory will be stored as application data in PostgreSQL.
- Reason: Campus Memory is stored and retrieved project data, not LLM training or fine-tuning. Keeping it in the main database avoids unnecessary infrastructure for the MVP.

### Initial Memory Retrieval

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: Initial Campus Memory retrieval will use simple database/text search.
- Reason: This is sufficient for the early MVP and keeps the implementation understandable while real retrieval needs are still emerging.

### pgvector Reserved For Later

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: pgvector may be considered later if actual retrieval requirements justify it.
- Reason: Vector retrieval may become useful as Campus Memory grows, but it is not required for the initial MVP.

### Vercel Application Deployment

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The application will be deployed on Vercel.
- Reason: Vercel is well-suited for deploying a Next.js application with low operational complexity.

### Supabase Database And Auth Infrastructure

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: Supabase will provide database and authentication infrastructure.
- Reason: This keeps database and auth management simpler and avoids unnecessary custom infrastructure for the MVP.

### No Microservices For MVP

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The MVP will not use microservices.
- Reason: Microservices would add unnecessary complexity for the current product scope and developer experience.

### No Separate Backend Service For MVP

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The MVP will not use a separate backend service such as a separate Express backend.
- Reason: A separate backend would increase project complexity without a current MVP need.

### No Separate Vector Database For MVP

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The MVP will not use a separate vector database.
- Reason: Campus Memory can begin with PostgreSQL-based storage and simple retrieval. A separate vector database is unnecessary at this stage.

### No File Storage Unless Required

- Date/phase: Step 20 architecture approval.
- Status: Finalized.
- Decision: The MVP will not include file storage unless an explicit product requirement appears.
- Reason: No current MVP requirement requires file uploads or file storage.

### UUID Primary Keys For All Tables

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: All MVP tables use UUID primary keys generated by `gen_random_uuid()`.
- Reason: UUIDs are globally unique, do not expose row count, are safe to generate client-side if needed, and are the standard approach in Supabase PostgreSQL projects.

### profiles Table Links To Supabase Auth By Shared UUID

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: The `profiles` table uses the same UUID as `auth.users.id` as its primary key.
- Reason: This is the standard Supabase pattern for linking application profile data to the auth user record. It eliminates a separate join column and makes the relationship unambiguous.

### Department / Batch / Section / Semester As Text Fields (No Separate Reference Tables)

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: Department, batch, section, and semester are stored as TEXT fields on `profiles` (and `academic_period` on `enrollments`). No separate reference tables are created for these values in the MVP.
- Reason: Separate reference tables for these four concepts would add four extra tables, four foreign keys, and four additional joins for no measurable benefit at the MVP scale. Text fields are simpler, beginner-friendly, and sufficient. Normalization can be added later if management of these values becomes a product requirement.
- Alternatives considered: Separate reference tables for each concept (rejected — unnecessary complexity for MVP).

### Academic Group Implemented As Composite Lookup (No Separate Table)

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: There is no separate `academic_groups` table. The academic group identity is embedded as four fields `(department, batch, section, semester)` on `class_routine_entries`. Student schedule retrieval queries these four fields against the student's profile values.
- Reason: A separate table would add complexity with no additional query benefit at MVP scale. A composite index on the four fields provides fast lookups.
- Alternatives considered: Separate `academic_groups` table with UUID; rejected as unnecessary complexity.

### Class Routine As One-Row-Per-Time-Slot

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: The `class_routine_entries` table stores one row per scheduled class time slot, not one row per full weekly schedule.
- Reason: Individual time-slot rows are queryable, filterable by day, and maintainable individually. A single JSON blob for a full schedule would not be queryable.

### Experience And Campus Memory As Two Separate Tables

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: `experiences` and `campus_memories` are two separate tables. An experience row is the student's private submission. A campus memory row is the curated shared entry. The link between them is a nullable FK `source_experience_id` on `campus_memories`.
- Reason: Privacy is cleaner when the student's private data and the shared pool are separate tables. Campus Memory can survive independently of its source experience. Campus Memory can also be created from sources other than student submissions in the future.

### Campus Memory Not Auto-Created On Experience Share

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: Setting `experiences.visibility = 'shared'` does NOT automatically create a `campus_memories` row. The server must explicitly create the campus memory entry as a separate application-level action.
- Reason: Prevents accidental or unintended exposure of student experience content to other students. The critical privacy rule from STEP 32 and STEP 35 is preserved.

### Messages Ordered By Timestamp, No Separate Ordering Column

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: Messages within a conversation are ordered by `created_at ASC`. No separate integer ordering column is added.
- Reason: Messages are inserted in real time; the timestamp order is reliable. A separate ordering integer adds complexity and potential race conditions.

### No student_id FK On messages Table

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: The `messages` table does not have a direct `student_id` foreign key. Ownership is established through the chain: `profiles → conversations → messages`.
- Reason: Adding `student_id` directly on every message is redundant denormalization. The conversation ownership chain is sufficient for all MVP access patterns and RLS enforcement.

### Campus Memory Full-Text Retrieval Via PostgreSQL tsvector

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: Initial Campus Memory retrieval uses PostgreSQL built-in full-text search via a `tsvector` index on `campus_memories.content`. Tag filtering via a GIN index on `campus_memories.tags` is also available.
- Reason: This is the simplest professional retrieval approach within PostgreSQL. It requires no external services and no additional infrastructure. pgvector remains excluded from MVP.

### Courses Deletion Protected By RESTRICT

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: Deleting a course is RESTRICT (blocked) if any enrollment references it. Class routine entries have their `course_id` SET NULL if a course is deleted.
- Reason: Accidental course deletion would destroy enrollment history. RESTRICT prevents this. Routine entries survive with a null course reference so schedule data is not lost.

### Total MVP Tables: 8

- Date/phase: Step 36 database schema design.
- Status: Finalized.
- Decision: The MVP database consists of exactly 8 tables: `profiles`, `courses`, `enrollments`, `class_routine_entries`, `conversations`, `messages`, `experiences`, `campus_memories`.
- Reason: This is the minimal set of tables required to support all approved MVP features without overengineering.

### class_routine_entries Uniqueness — Partial Index Strategy For Nullable course_id

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: The uniqueness constraint on `class_routine_entries` uses two partial unique indexes instead of one composite unique constraint. One partial index covers rows where `course_id IS NOT NULL`; a second partial index covers rows where `course_id IS NULL` (using `course_name_override` instead).
- Reason: PostgreSQL NULL ≠ NULL in unique constraints. The original single unique constraint on `(department, batch, section, semester, course_id, day_of_week, start_time)` would not prevent duplicate null-course entries at the same time slot. Partial indexes correctly handle this edge case.
- Alternatives considered: Single unique constraint (rejected — does not prevent null-course duplicates).

### class_routine_entries Course Identity CHECK Constraint

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: A CHECK constraint is added to `class_routine_entries` requiring that at least one of `course_id` or `course_name_override` is not null. Both cannot be null simultaneously.
- Reason: A class routine entry with no course identification is meaningless. The CHECK ensures data integrity at the database level.

### enrollments updated_at Column Added

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: An `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` column is added to the `enrollments` table.
- Reason: Enrollment status can change (active → completed, active → dropped). Without `updated_at`, there is no way to audit when the status changed. The cost is minimal and the utility is high.

### Campus Memory FTS Language: 'english'

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: The PostgreSQL full-text search index on `campus_memories.content` uses the `'english'` language configuration (`to_tsvector('english', content)`).
- Reason: University academic content is expected to be primarily in English. The 'english' configuration provides appropriate stemming and stop-word filtering. If content is in another language, this setting must be updated before SQL implementation.

### UI Must Use Controlled Inputs For Academic Group Fields

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: The UI for student profile setup must use dropdown/select inputs (not free-text fields) for department, batch, section, and semester. The available values in the UI must exactly match the values stored in `class_routine_entries`.
- Reason: The composite lookup that matches a student's profile to their class routine entries depends on exact text equality. If a student types "CSE" but routine entries use "Computer Science and Engineering", the lookup returns empty results. Controlled inputs prevent this.
- Note: This is an application/UI implementation rule, not a schema change.

### campus_memories UNIQUE on source_experience_id

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: A UNIQUE constraint is added to `campus_memories.source_experience_id`. Because the column is nullable, PostgreSQL UNIQUE allows multiple NULL values (system-created entries without a source experience) but enforces that each non-null experience UUID appears at most once.
- Reason: STEP 36 stated "one experience → at most one campus memory" but did not enforce this at the database level. Without a UNIQUE constraint, two campus_memories rows could reference the same source experience, violating the intended cardinality.
- Effect: `campus_memories.source_experience_id` is now UNIQUE + nullable. Multiple NULLs allowed; each non-null experience ID can appear at most once.

### messages RLS INSERT Policy — Student Clients Cannot Insert 'assistant' Role

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: The RLS INSERT policy for `messages` must enforce that student-side clients (authenticated JWT, not service role) may only insert rows with `role = 'user'`. The service role (Next.js server-side) inserts rows with `role = 'assistant'` after receiving the OpenAI response.
- Reason: Without this distinction, a student could impersonate AI responses by directly inserting a row with `role = 'assistant'`. The CHECK constraint alone does not prevent this — RLS INSERT must distinguish student vs. service role context.
- Note: The Supabase service role bypasses RLS by default, so server-side assistant message inserts are unaffected. Student-facing inserts use the authenticated client, which is subject to RLS.

### courses updated_at Column Added

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: An `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` column is added to the `courses` table.
- Reason: Course names, credit hours, or descriptions may be updated by the system. Without `updated_at`, there is no audit record of when a course was last modified. Low cost, useful for data governance.

### Enrollment status CHECK Constraint

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: A database-level CHECK constraint `status IN ('active', 'completed', 'dropped')` is added to the `enrollments` table.
- Reason: Application validation alone is insufficient as the last line of defense. If a bug in the application sends an invalid status value, the database should reject it.

### messages role CHECK Constraint

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: A database-level CHECK constraint `role IN ('user', 'assistant')` is added to the `messages` table.
- Reason: Same rationale as enrollment status — database-level enforcement prevents invalid values from being stored.

### experiences visibility CHECK Constraint

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: A database-level CHECK constraint `visibility IN ('private', 'shared')` is added to the `experiences` table.
- Reason: Same rationale — prevents invalid visibility values at the database level.

### class_routine_entries day_of_week CHECK Constraint

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: A database-level CHECK constraint `day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')` is added to `class_routine_entries`.
- Reason: Prevents typos (e.g., "Moday") from being stored as valid day names.

### class_routine_entries end_time > start_time CHECK Constraint

- Date/phase: Step 37 schema validation.
- Status: Finalized.
- Decision: A database-level CHECK constraint `end_time > start_time` is added to `class_routine_entries`.
- Reason: Prevents logically inverted class times (end before start) from being stored.



## Intentionally Undecided Decisions

- Exact SQL CREATE TABLE statements: Not written yet.
- Exact SQL index definitions (partial indexes for class_routine_entries): Not written yet.
- Exact SQL RLS policies: Not written yet.
- Exact API routes or server actions: Not decided yet.
- Exact AI model: Not decided yet.
- Exact prompt structure: Not decided yet.
- Exact Campus Memory retrieval algorithm: Not decided yet.
- Exact UI screens, layout, components, and design system: Not decided yet.
- Exact server-side validation rules: Not decided yet.
- Exact testing tools and coverage plan: Not decided yet.
- Exact logging and monitoring details: Not decided yet.
- Exact deployment configuration: Not decided yet.
- Exact text length limits for all columns: Not decided yet.
- Exact allowed values for department, batch, section, semester: Product decision needed before onboarding UI.
- Whether courses table needs updated_at: Can decide at STEP 38.
- Whether class_routine_entries needs updated_at: Can decide at STEP 38.


## Decision Template

### Decision Title

- Date: Not decided yet.
- Status: Not decided yet.
- Decision: Not decided yet.
- Reason: Not decided yet.
- Alternatives considered: Not decided yet.
