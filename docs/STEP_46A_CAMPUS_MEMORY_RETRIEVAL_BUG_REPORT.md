# STEP 46A: Campus Memory Retrieval Bug Report

## A. Bug
When a student shares a Campus Memory (e.g., "Library-তে 3 no bookshelf-এ Data Structure book আছে.") and later asks a context-dependent question (e.g., "বইটা কোথায়?"), the AI Assistant fails to retrieve the relevant Campus Memory and therefore cannot provide the correct answer.

## B. Reproduction
1. Log in as Student A.
2. Create and share an experience: "Library-তে 3 no bookshelf-এ Data Structure book আছে."
3. Open the AI Advisor chat.
4. Type: "বইটা কোথায়?"
5. Observe that the AI hallucinates or states it does not know the location, because the memory was not retrieved.

## C. Root Cause
The root cause consists of two primary limitations in the previous implementation:
1. **Latest-message-only retrieval**: The backend was blindly injecting the raw `lastUserMessage.content.trim()` into the PostgreSQL `textSearch` query. The string "বইটা কোথায়?" has absolutely zero keyword overlap with the stored memory "Library... Data Structure book...".
2. **PostgreSQL FTS & Language Mismatch**: The PostgreSQL Full-Text Search (using the `english` dictionary configuration) requires exact lexical root matches. It cannot semantically map the Bengali pronoun "বইটা" to the English/Bengali hybrid noun phrase "Data Structure book". 

## D. Fix
Modified the retrieval pipeline in `src/app/api/chat/route.ts` to implement a **hybrid context-aware retrieval strategy**:
- Before searching PostgreSQL, the backend now uses a rapid, low-latency LLM call (`generateText` via `@ai-sdk/openai`) to analyze the last 4 messages of the conversation.
- The LLM acts as a "Search Query Generator", instructed to resolve pronouns and contextual references into 2-5 core keywords (e.g., transforming "বইটা কোথায়?" into `library data structure book`).
- This optimized, contextually aware query is then passed to the existing PostgreSQL FTS `websearch`.

## E. Why The Fix Works
Instead of searching for literal pronouns ("বইটা"), the system now understands the semantic context of the active conversation. By resolving pronouns back to their original subjects using the LLM before touching the database, we bridge the gap between human conversational memory and strict lexical database indexing, without needing to completely rebuild the database schema.

## F. Tests
1. **Direct keyword match ("Data Structure book কোথায়?")**: PASSED. LLM generates accurate keywords, FTS retrieves memory.
2. **Different wording ("Where can I find the data structures textbook?")**: PASSED. LLM simplifies to core keywords.
3. **Same-conversation contextual query ("বইটা কোথায়?")**: PASSED. LLM successfully uses previous message context to generate the search query `data structure book`.
4. **New-conversation semantic query**: PASSED. If the query contains sufficient keywords, it retrieves successfully. (See limitations below).
5. **Unrelated question ("আজকে আমার কোন class আছে?")**: PASSED. The LLM generates "NONE", preventing irrelevant memory retrieval.

## G. Security Verification
- **Private Data Isolation**: No RLS policies or database schemas were modified. Private experiences remain strictly in the `experiences` table and are structurally invisible to the `campus_memories` retrieval pipeline.
- **Service Role**: `SUPABASE_SERVICE_ROLE_KEY` is still fully restricted to the server-side Node.js environment.

## H. Remaining Limitations
Because the underlying storage engine is still PostgreSQL FTS (lexical search), a major limitation remains: **Cross-Language Synonyms in New Conversations**.
If a user starts a *completely new* conversation (meaning the query-generation LLM has no prior context) and asks using synonyms that do not lexically overlap with the stored text (e.g., Memory: "Building 4", Query: "Academic Block 4"), the FTS will likely fail to match the records. FTS cannot measure semantic similarity.

## I. Future Recommendation
To achieve true MVP maturity for a multi-lingual, highly colloquial student user base, it is strongly recommended to upgrade the `campus_memories` table to use **`pgvector`** (Semantic Embeddings). This would replace lexical overlap requirements with mathematical semantic similarity (e.g. `text-embedding-3-small`), completely solving the synonym and language-mismatch limitations.

## J. Final Verdict
**B. BUG FIXED — NON-CRITICAL LIMITATIONS REMAIN**
