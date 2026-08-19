# STEP 46A — Campus Memory Architecture Revalidation

## A. Current Campus Memory Architecture
Currently, Campus Memory retrieval relies on PostgreSQL Full-Text Search (FTS) using the `websearch` query type configured with an English dictionary. When a user asks a question, the backend performs a lexical search on the `campus_memories` table to find exact keyword root matches. A recent patch added an LLM step to extract keywords from conversation context, improving reference resolution (e.g., mapping "বইটা" to "book"), but the underlying retrieval remains purely lexical.

## B. Real Product Requirement
Campus Memory is envisioned as a persistent, university-wide, shared knowledge base crowdsourced from students. It must act as a global semantic repository where a student can ask a natural language question (often in mixed Bengali-English or Tanglish) and the AI retrieves highly relevant, context-aware advice, observations, or facts contributed by peers or seniors—even if the question uses entirely different vocabulary from the stored memory.

## C. Current Architecture Gap
The current FTS architecture fundamentally fails the real product requirement due to its reliance on lexical overlap. 
- **Semantic Mismatch**: FTS cannot understand that "ক্যান্টিনে কখন কম ভিড় থাকে?" is semantically identical to a memory stating "দুপুর ১২টা থেকে ২টার মধ্যে ক্যান্টিনে অনেক rush থাকে".
- **Language/Morphology**: Bengali prefixes, suffixes, and mixed-language phrasing (e.g., "ল্যাবে", "PCটা") fail to stem correctly in PostgreSQL's English dictionary, resulting in zero matches unless the user types the exact substring. 
- **Fragility**: While the LLM query generator patch helps resolve pronouns within a continuous conversation, it cannot solve the synonym or cross-language problem for new conversations.

## D. Retrieval Architecture Options

1. **PostgreSQL FTS (Current)**:
   - *Pros*: Zero extra cost, built-in, no schema changes.
   - *Cons*: Fails on synonyms, terrible for Bengali/English mix, fundamentally not semantic.

2. **External Vector Database (Pinecone, Weaviate)**:
   - *Pros*: Excellent semantic search.
   - *Cons*: Violates constraint (adds unnecessary infrastructure, breaks single-database architecture).

3. **Supabase `pgvector` + OpenAI Embeddings**:
   - *Pros*: Native to Supabase, keeps data unified, excellent semantic matching for multilingual/paraphrased queries (using models like `text-embedding-3-small`), scales easily for MVP.
   - *Cons*: Requires a database migration (enabling extension, adding vector column), minor API cost for embedding generation.

4. **Hybrid Retrieval (pgvector + FTS)**:
   - *Pros*: Best of both worlds (semantic + exact keyword). 
   - *Cons*: Slightly higher complexity for an MVP.

## E. Recommended MVP Retrieval Architecture
**Recommendation: Supabase `pgvector` with OpenAI Embeddings.**
Given the heavy reliance on mixed-language phrasing (Bengali/English) and colloquial semantic queries, FTS is a dead end. `pgvector` natively integrates into the existing Supabase architecture without adding external infrastructure. It provides robust, mathematical semantic similarity that will instantly resolve the "canteen rush" vs "কম ভিড়" limitation. 

## F. Experience → Campus Memory Lifecycle
1. **Creation**: Student authors a private `experience`.
2. **Promotion**: Student toggles visibility to `shared`.
3. **Embedding**: A backend process (or Edge Function) takes the experience content, calls OpenAI Embeddings API, and inserts a new row into `campus_memories` with the generated vector.
4. **Updates**: If the student edits the shared experience, the corresponding `campus_memories` row and its vector are updated. Switching back to `private` deletes the `campus_memories` row.

## G. Conversation Memory vs Campus Memory
- **Conversation Memory**: The ephemeral, sequential messages belonging to a specific `conversation_id` and `student_id`. Used exclusively to maintain contextual continuity (e.g., resolving "that book" to "Data Structure book").
- **Campus Memory**: The persistent, global `campus_memories` table. Used exclusively to inject shared knowledge into the AI's system prompt.

## H. Retrieval Flow
1. **User Question**: User asks "ক্যান্টিনে কখন কম ভিড় থাকে?".
2. **Contextualization**: Backend optionally uses LLM to contextualize the query based on conversation history (if resolving pronouns).
3. **Embedding Generation**: Backend calls OpenAI to embed the user's search query.
4. **Vector Search**: Backend performs a cosine similarity search (`pgvector`) against `campus_memories` limiting to top 3 results above a certain similarity threshold (e.g., 0.75).
5. **AI Context**: Retrieved memories are injected into the system prompt.
6. **Response**: OpenAI generates the final answer based on the injected knowledge.

## I. Memory Quality / Reliability Strategy
At the MVP level:
- **Duplicates**: Prevented at the application layer by maintaining a strict 1:1 `source_experience_id` uniqueness constraint.
- **Outdated/Contradictory**: The AI handles contradictions by synthesizing the provided context (e.g., "Student A says X, but Student B says Y").
- **Moderation**: Relies on user reporting or manual database administration for the MVP. No automated moderation pipeline is needed yet.

## J. Security / Privacy Model
- **Isolation**: The retrieval pipeline *only* queries the `campus_memories` table. It *never* queries the `experiences` table directly. 
- **Permissions**: `campus_memories` is readable by all authenticated users via RLS. `experiences` remains strictly locked to `auth.uid() = student_id`. Private data physically cannot leak into the vector search space.

## K. Database Impact
Implementing this architecture requires a future schema migration:
1. `CREATE EXTENSION IF NOT EXISTS vector;`
2. `ALTER TABLE campus_memories ADD COLUMN embedding vector(1536);`
3. Create an HNSW or IVFFlat index on the `embedding` column for performance.

## L. AI Context Assembly
Retrieved memories are appended to the system prompt **after** the student's academic profile and routine, but **before** the final behavioral instructions.
*Thresholding*: Only memories with a similarity score > 0.75 should be injected to prevent unrelated memory dumps. Maximum of 3-5 memories to save context window.

## M. Implementation Dependencies
Before implementation, the project requires:
1. Approval for a new Supabase schema migration (`pgvector`).
2. Installation of `@supabase/supabase-js` compatibility for vector RPC calls, or direct SQL function creation for cosine similarity matching.

## N. Testing Requirements
Future implementation must pass:
1. **Semantic**: "Where to eat?" retrieves "Canteen is at building 2".
2. **Bangla**: "ল্যাবে কোন PCটা নষ্ট?" retrieves "Lab 2 PC 4 broken".
3. **Paraphrase**: "Advice for data structures" retrieves "Linked list is hard, watch this video".
4. **Context-dependent**: "ওই বইটা কোথায়?" (after mentioning DS book) retrieves DS book location.
5. **Irrelevant**: "How is the weather?" retrieves nothing.

## O. Architecture Decisions
- **Confirmed**: Supabase + Next.js + OpenAI backend architecture. Private vs Shared separation.
- **Newly Approved (Pending)**: Migration from FTS to `pgvector` for semantic retrieval.
- **Deferred**: Automated moderation, upvoting, hybrid (FTS + Vector) retrieval.

## P. What Must NOT Be Built Yet
- External vector databases (Pinecone, etc.).
- Complex moderation queues.
- Admin dashboard for memory management.
- User reputation systems.

## Q. STEP 46B Recommendation
**STEP 46B: Implement `pgvector` Schema and Embedding Pipeline.**
Create the database migration to enable `pgvector`, add the embedding column, and update the experience-sharing logic to generate embeddings via OpenAI when an experience is marked as shared. Update the chat API to perform cosine similarity retrieval.

---

# FINAL VERDICT
**B. READY FOR ARCHITECTURE APPROVAL**
