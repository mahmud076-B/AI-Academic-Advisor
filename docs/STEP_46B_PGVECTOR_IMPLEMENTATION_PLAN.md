# STEP 46B — pgvector Semantic Campus Memory Implementation Plan

## 1. EXACT DATABASE CHANGES
- **Extension**: Enable `pgvector` (`CREATE EXTENSION IF NOT EXISTS vector;`).
- **Column**: Add `embedding` column of type `vector(1536)` to the `campus_memories` table.
- **Index**: Create an HNSW index on the `embedding` column using cosine distance (`vector_cosine_ops`) for scalable performance.
- **Existing FTS**: The existing `idx_campus_memories_fts` index will **remain intact**. It is additive and costs negligible space, ensuring exact-match capabilities remain available.
- **Metadata**: No additional metadata columns are required. The existing `title` and `content` are sufficient for semantic extraction.

## 2. EMBEDDING MODEL STRATEGY
- **Recommended Model**: OpenAI `text-embedding-3-small`.
- **Why it fits**: It represents the current state-of-the-art for cost-effective multilingual embedding. It has massive cross-lingual training data, allowing it to seamlessly map English words ("book") and Bengali words ("বই") to similar mathematical vector spaces, solving the mixed Banglish product requirement.
- **Cost**: Extremely cost-effective at ~$0.02 per 1M tokens.
- **Query vs Document**: The same model will be used for both. We will embed the `title + '\n' + content` as the document vector, and embed the contextualized user question as the query vector.

## 3. EXISTING MEMORY BACKFILL
- **Strategy**: A one-off server-side script (`scripts/backfill_embeddings.ts`) will be written to query all existing `campus_memories` where `embedding IS NULL`.
- **Batching**: Process in batches of 50-100 records to prevent OpenAI rate limits and Supabase timeout issues.
- **Failure/Retry**: Implement exponential backoff for OpenAI API `429` (Rate Limit) errors.
- **Verification**: The script will output total rows processed vs total rows in the table. We will verify by executing a `SELECT COUNT(*) FROM campus_memories WHERE embedding IS NULL` which must return `0`.

## 4. NEW MEMORY EMBEDDING FLOW
The lifecycle for a new shared memory will be:
1. **Student Experience**: User authors an experience privately.
2. **Shared**: User toggles the visibility to 'Shared'.
3. **Campus Memory Create**: Application inserts the row into `campus_memories`.
4. **Generate Embedding**: Server-side utility calls OpenAI `text-embedding-3-small` with the memory's text.
5. **Store Embedding**: Server-side utility updates the newly created `campus_memories` row with the returned vector.
6. **Available**: The memory is now immediately available for semantic vector search.

## 5. PRIVATE → SHARED → PRIVATE FLOW
- **Private to Shared**: A new row is inserted into `campus_memories` mapping back via `source_experience_id`. An embedding is immediately generated and saved to this new row.
- **Shared to Private**: The row in `campus_memories` matching the `source_experience_id` is permanently `DELETED`. The vector embedding is destroyed alongside the row. The original private `experiences` row remains untouched.

## 6. VECTOR SEARCH ARCHITECTURE
1. Server receives the contextualized query.
2. Server calls OpenAI to create a `query_embedding` (1536 dimensions).
3. Server invokes a Supabase RPC function (e.g., `match_campus_memories`), passing the `query_embedding`.
4. The database calculates cosine similarity (`1 - (embedding <=> query_embedding)`).
5. The database applies a `match_threshold` filter and limits results by `match_count`.
6. Safe content (`title`, `content`) is returned to the server; raw vectors and source IDs are omitted to save bandwidth.

## 7. DATABASE RPC / FUNCTION
A new PostgreSQL function will be created via migration.
**Input:**
- `query_embedding vector(1536)`
- `match_threshold float`
- `match_count int`

**Output (Returns TABLE):**
- `id uuid`
- `title text`
- `content text`
- `similarity float`

## 8. RETRIEVAL FLOW
1. **User Question**: User asks "Where is the book?"
2. **Conversation Context Resolution**: LLM extracts context -> "Data structure book location".
3. **Query Embedding**: OpenAI creates vector for "Data structure book location".
4. **pgvector Search**: Calls RPC `match_campus_memories` with the vector.
5. **Similarity Filtering**: DB filters out memories below threshold.
6. **Top Relevant Memories**: Returns top 3 semantic matches.
7. **AI Context**: Matches are injected into the system prompt.
8. **OpenAI Response**: AI formulates answer based on retrieved context.

## 9. CONVERSATION CONTEXT
Conversation context resolves implicit references ("বইটা", "ওই lab", "সেই teacher") into explicit semantic subjects ("Data structure book", "CSE Lab 2", "Prof. Rahman"). 
Campus Memory itself remains entirely independent of conversation history—it mathematically compares the *explicit semantic subject* against its global database of vectors.

## 10. RETRIEVAL QUALITY TESTS
Post-implementation, the system must pass these specific QA scenarios:
- **Exact Match**: "Data Structure book" -> retrieves DS book memory.
- **Paraphrase**: "Locate the data structure text" -> retrieves DS book memory.
- **Semantic Match**: "Best lunch time" -> retrieves Canteen rush memory.
- **Bangla**: "বইটা কোথায়" (with context) -> retrieves DS book memory.
- **Banglish**: "Canteen e rush kokhon kom thake?" -> retrieves Canteen rush memory.
- **English**: "When is the cafeteria empty?" -> retrieves Canteen rush memory.
- **Irrelevant**: "How to bake a cake" -> returns empty, AI answers normally.

## 11. THRESHOLD STRATEGY
- **Configurable**: Threshold must be defined as an environment variable (e.g., `MATCH_THRESHOLD=0.75`).
- **Initial Range**: `0.70` to `0.80`. `text-embedding-3-small` often clusters similar text around ~0.75 cosine similarity.
- **Validation**: Browser QA will deliberately ask irrelevant questions (e.g., "Where is Harvard?"). If campus memories are injected, the threshold is too low. If relevant questions fail to trigger memories, the threshold is too high.

## 12. HYBRID RETRIEVAL DEFERMENT
Hybrid retrieval (combining FTS and pgvector via Reciprocal Rank Fusion) is deferred for MVP simplicity. However, **existing FTS indexes will remain**. Vector embeddings excel at semantic matching but can sometimes fail at strict lexical ID matching (e.g., "Course CSE3101" or "PC-42"). Retaining FTS allows us to easily implement hybrid scoring in the future if strict alphanumeric matching becomes a reported issue.

## 13. SECURITY
- Embeddings are generated **only** on the secure Node.js server.
- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` remain strictly server-side.
- Private experiences physically never enter the vector generation pipeline.
- The RPC function operates under standard RLS, but since `campus_memories` is globally readable, it poses no data leakage risk.
- Students cannot manually inject or manipulate raw vector data.

## 14. COST CONTROL
- Embeddings are only generated when an experience is explicitly shared.
- When an experience is edited, we will check if the `title` or `content` actually changed before spending API calls to regenerate the embedding.
- Query embeddings cost fractions of a cent (usually <20 tokens).
- Returning a strict limit of 3-5 memories controls the cost of the main OpenAI response prompt.

## 15. FAILURE HANDLING
- **Embedding API Fails**: The system degrades gracefully by falling back to the existing lexical FTS query.
- **RPC/Vector Search Fails**: Server catches the exception, logs it, and proceeds with standard conversational AI (no memory injected).
- **No Matches**: The AI responds dynamically based purely on its training and the student's profile context.

## 16. MIGRATION SAFETY
- **Order**: DB Migration -> Application logic updates -> Backfill.
- **Safety**: Adding `pgvector` and an `embedding` column is entirely additive. It will not break existing inserts or selects.
- **Rollback**: If semantic search breaks, the chat API can simply revert to using `.textSearch()` while leaving the vectors in the database.
- Existing FTS chat functionality remains fully operational during the migration.

## 17. FILES LIKELY TO CHANGE
- `supabase/migrations/xxxx_add_pgvector.sql` (New)
- `src/app/api/experiences/[id]/share/route.ts` (or equivalent server action)
- `src/app/api/chat/route.ts`
- `src/lib/embeddings.ts` (New utility for OpenAI integration)
- `scripts/backfill_embeddings.mjs` (New script)

## 18. IMPLEMENTATION ORDER
1. Database Migration (enable `pgvector`, add column, create RPC).
2. Create server-side `lib/embeddings.ts` utility.
3. Update experience sharing API/action to generate and store embeddings.
4. Execute backfill script for existing memories.
5. Update `api/chat/route.ts` to perform contextual query embedding and RPC retrieval.
6. QA Testing.

## 19. VERIFICATION
- Verify `vector` extension exists in Supabase Dashboard.
- Verify `campus_memories` has `embedding` column.
- Verify `SELECT COUNT(*) FROM campus_memories WHERE embedding IS NULL` equals 0 post-backfill.
- Verify creating a new shared experience populates the vector column.
- Verify AI chat correctly answers semantic/paraphrased queries.

## 20. STEP 46C RECOMMENDATION
**Execute STEP 46C**: Implementation of pgvector Semantic Retrieval. Following this exact plan, begin by creating the database migration, followed by the embedding utilities, backfill, and finally, switching the chat retrieval API.

---

# FINAL VERDICT
**B. READY FOR IMPLEMENTATION APPROVAL**
