# STEP 67: Full Root-Cause Audit — Campus Brain Resource UI & Persistence Lifecycle

**Document ID:** `STEP_67_CAMPUS_BRAIN_RESOURCE_PERSISTENCE_AUDIT`  
**Date:** 2026-08-20  
**Project:** AI Academic Advisor ([advisor.smmah.me](https://advisor.smmah.me))  
**Status:** AUDIT COMPLETE — NO PRODUCTION CODE MODIFIED  

---

## A. Executive Summary

A complete, end-to-end audit of the Campus Brain evidence lifecycle was conducted across the database schema, API streaming route, server actions, server components, and client-side chat UI.

### Summary of Findings

1. **Problem 1 (Resource UI / Cluttered Exposure):**  
   In [ChatUI.tsx](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/%5Bid%5D/ChatUI.tsx#L335-L398), evidence is displayed with the first item (`index === 0`) **unconditionally expanded in full view** (displaying the full card, title, and body content by default) instead of collapsed behind a discreet, premium indicator pill. Multi-item counts (`+X More` or raw counts) and full text excerpts take up significant vertical space and expose raw reference data before the student asks to see it.

2. **Problem 2 (Campus Brain Disappears on Refresh / Navigation):**  
   In [route.ts](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/api/chat/route.ts#L870-L885), the `onFinish({ text })` callback writes **only** `{ conversation_id, role: 'assistant', content: text }` into Supabase. The retrieved `evidencePayload` is never written to PostgreSQL. Instead, it is sent strictly as a transient stream delimiter (`__AI_CAMPUS_BRAIN_EVIDENCE__`) over HTTP and stored in transient React component state (`useState`).  
   When the user refreshes or reopens the chat, [page.tsx](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/%5Bid%5D/page.tsx#L35-L43) queries [getMessages()](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/actions.ts#L46-L58) from PostgreSQL. Because the database contains only `content` (and has no column or join table for message evidence), `initialMessages` contains `evidence: undefined`. Consequently, the evidence card evaluates to `evidence.length === 0` and is completely invisible.

---

## B. Problem 1 Root Cause — Campus Brain Resource UI

### 1. Code Inspection: [src/app/chat/[id]/ChatUI.tsx](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/%5Bid%5D/ChatUI.tsx#L335-L398)

```tsx
{/* Evidence Section */}
{m.role === 'assistant' && evidence.length > 0 && (
  <div className="mt-6 space-y-3">
    {evidence.map((item: EvidenceItem, index: number) => {
      // Only show top item unless expanded
      if (!isEvidenceExpanded && index > 0) return null

      return (
        <div key={`${m.id}-${index}`} className="...">
          {/* Header */}
          <div className="...">
            ...
            {index === 0 && showEvidenceToggle && (
              <button onClick={() => setExpandedEvidence(...)}>
                {isEvidenceExpanded ? 'Hide Sources' : `+${evidence.length - 1} More`}
              </button>
            )}
          </div>
          {/* Evidence Body (EXPANDED BY DEFAULT FOR ITEM 0) */}
          <div className="px-4 py-3 bg-[var(--color-surface-0)]">
            <div className="text-[var(--text-small)] font-medium ...">{item.title}</div>
            <div className="text-[12px] ...">{item.content}</div>
          </div>
        </div>
      )
    })}
  </div>
)}
```

### 2. Flaws in Current UX / UI
- **Always-Open Card**: The first retrieved evidence item (`index === 0`) has its full excerpt, title, and body rendered openly inside the chat message immediately upon response arrival.
- **Visual Clutter**: The card takes up large visual real estate (100–250px) below the assistant's answer.
- **Unclear Status**: When only 1 source is retrieved, `showEvidenceToggle` is `false`, meaning there is no toggle button at all—the full source card is permanently stuck open.
- **Terminology / Counter Artifacts**: The `+${evidence.length - 1} More` button and raw title headers give the feel of an internal debugging widget rather than a polished, trustworthy AI reference indicator.

### 3. Desired UX Specification
- **Collapsed State (Default)**:
  - Clean, compact reference pill or footer bar beneath the message:
    `[BrainCircuit Icon] Campus Brain · See more` (or `[FileText Icon] Official Course Syllabus · See more`).
  - No prominent internal retrieval counts, no "1 at source", no raw database vocabulary.
  - Minimal vertical footprint (~28-32px height).
- **Expanded State (On Click)**:
  - When the student clicks "See more", it smoothly expands an accordion drawer showing all referenced items.
  - Items display clean titles, excerpts, and freshness tags ("Recent", "Authoritative", etc.).
  - Completely hides internal IDs, embeddings, database timestamps, similarity scores, or technical metadata.

---

## C. Problem 2 Root Cause — Evidence Disappears on Refresh

### 1. Code Inspection: [src/app/api/chat/route.ts](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/api/chat/route.ts#L866-L885)

```typescript
// Persist assistant message to database if non-empty
const result = streamText({
  model: openai('gpt-4o-mini'),
  messages,
  system: systemPrompt,
  async onFinish({ text }) {
    metrics.generationLatencyMs = Date.now() - genStart
    metrics.totalLatencyMs = Date.now() - startTotal

    // Persist assistant message to database if non-empty
    if (text && text.trim().length > 0) {
      const adminSupabase = createAdminClient()
      const { error: assistantMsgError } = await adminSupabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: text
      })
      if (assistantMsgError) {
        console.error('Failed to save assistant message:', assistantMsgError)
      }
    }
    ...
  }
})
```

### 2. Database Schema: [supabase/migrations/20240818000000_init_schema.sql](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/supabase/migrations/20240818000000_init_schema.sql#L81-L87)

```sql
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3. Server Actions: [src/app/chat/actions.ts](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/actions.ts#L46-L58)

```typescript
export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return data || []
}
```

### 4. Page Hydration: [src/app/chat/[id]/page.tsx](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/%5Bid%5D/page.tsx#L35-L43)

```typescript
const dbMessages = await getMessages(conversationId)

// Map DB messages to the format expected by useChat
const initialMessages = dbMessages.map(msg => ({
  id: msg.id,
  role: msg.role as 'user' | 'assistant',
  content: msg.content,
  // NO EVIDENCE ATTACHED!
}))
```

---

## D. Exact Data Flow Diagram

```
========================================================================================
1. LIVE STREAMING FLOW (EVIDENCE VISIBLE TEMPORARILY)
========================================================================================

Student Message
      │
      ▼
POST /api/chat
      │
      ├─► Semantic Search (pgvector: match_campus_memories + match_course_syllabus_chunks)
      │     └── retrievedMemories + retrievedSyllabus ──► Sanitized evidencePayload
      │
      ├─► streamText() (OpenAI gpt-4o-mini)
      │     │
      │     ├── onFinish({ text })
      │     │     └── INSERT INTO messages (conversation_id, role, content)
      │     │         VALUES (convId, 'assistant', text)
      │     │         [*** CRITICAL BUG: evidencePayload IS DROPPED HERE ***]
      │     │
      │     └── ResponseStream (ReadableStream)
      │           ├── Chunks 1..N (AI text response)
      │           └── Tail Chunk: "\n\n__AI_CAMPUS_BRAIN_EVIDENCE__" + JSON(evidencePayload)
      │
      ▼
ChatUI.tsx (Browser Client)
      │
      ├─► Streams text into React State: messages[last].content
      ├─► Intercepts __AI_CAMPUS_BRAIN_EVIDENCE__ marker
      └─► Parses JSON payload ──► React State: messages[last].evidence = [...]
            │
            ▼
      Evidence renders in UI (ONLY IN BROWSER MEMORY)


========================================================================================
2. REFRESH / REOPEN FLOW (EVIDENCE DISAPPEARS)
========================================================================================

User Presses Refresh (F5) or Navigates to /chat/[id]
      │
      ▼
src/app/chat/[id]/page.tsx (Next.js Server Component)
      │
      ▼
getMessages(conversationId) [src/app/chat/actions.ts]
      │
      ▼
Supabase PostgreSQL Query:
      SELECT id, role, content, created_at FROM messages WHERE conversation_id = ...
      │
      ▼
Returns:
      [ { id: "...", role: "assistant", content: "..." } ]
      (No evidence in DB record)
      │
      ▼
page.tsx maps to initialMessages:
      [ { id: "...", role: "assistant", content: "..." } ]
      │
      ▼
ChatUI.tsx mounts with initialMessages
      │
      ▼
const [messages, setMessages] = useState(initialMessages)
      │
      ▼
ChatMessage.evidence is undefined
      │
      ▼
ChatUI checks: m.role === 'assistant' && evidence.length > 0  --->  FALSE!
      │
      ▼
RESULT: Campus Brain Resources are completely gone.
```

---

## E. Files Involved & Role in Failure

| File Path | Role | Failure Mechanism |
|---|---|---|
| [supabase/migrations/20240818000000_init_schema.sql](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/supabase/migrations/20240818000000_init_schema.sql) | Database Schema | `messages` table lacks a `metadata` or `evidence` JSONB column. |
| [src/app/api/chat/route.ts](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/api/chat/route.ts) | Backend Chat Handler | In `onFinish`, inserts only `conversation_id`, `role`, and `content`. Ignores `evidencePayload`. |
| [src/app/chat/actions.ts](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/actions.ts) | Server Action (`getMessages`) | Selects only `id, role, content, created_at` from `messages`. |
| [src/app/chat/[id]/page.tsx](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/%5Bid%5D/page.tsx) | Server Component Loader | Transforms `dbMessages` into `initialMessages` without evidence or metadata. |
| [src/app/chat/[id]/ChatUI.tsx](file:///c:/Users/smmah/OneDrive/Desktop/AI%20Academic%20Advisor/src/app/chat/%5Bid%5D/ChatUI.tsx) | Client UI & Stream Reader | (1) Relies purely on transient state for evidence; (2) Renders uncollapsed raw evidence cards on stream arrival. |

---

## F. Database Findings

1. **Existing Schema:**
   - Table `messages`:
     - `id`: `UUID` (PK)
     - `conversation_id`: `UUID` (FK -> `conversations.id`)
     - `role`: `TEXT` (`'user'` | `'assistant'`)
     - `content`: `TEXT`
     - `created_at`: `TIMESTAMPTZ`
2. **Missing Storage:**
   - There is no column for `metadata`, `evidence`, `citations`, or `resources`.
   - There is no join table between `messages` and `campus_memories` or `syllabus_chunks`.
3. **RLS Policies on `messages`:**
   - `SELECT`: Permitted for students owning the parent conversation.
   - `INSERT`: Restricted by RLS to `role = 'user'`. Assistant messages are inserted using `createAdminClient()` (service-role), which bypasses RLS safely.
   - Adding a nullable `metadata JSONB` or `evidence JSONB` column will not violate or require complex RLS changes.

---

## G. Client State Findings

1. `ChatUI.tsx` defines:
   ```ts
   type ChatMessage = {
     id: string
     role: 'user' | 'assistant'
     content: string
     evidence?: EvidenceItem[]
     isError?: boolean
   }
   ```
2. During streaming, `ChatUI` parses `__AI_CAMPUS_BRAIN_EVIDENCE__` and stores it into `useState<ChatMessage[]>`.
3. When the component unmounts (page reload, route change), the entire React state is destroyed.
4. On re-mount, `initialMessages` has `evidence: undefined`.

---

## H. Server / API Findings

1. `POST /api/chat`:
   - Correctly runs `match_campus_memories` and `match_course_syllabus_chunks`.
   - Correctly constructs `evidencePayload`.
   - Correctly formats the system prompt.
   - **Bug**: Drops `evidencePayload` at the persistence step inside `streamText({ onFinish })`.

---

## I. Refresh / Reopen Findings

1. When navigating to `/chat/[id]`, Next.js executes `ChatPage` in `page.tsx` on the server.
2. `getMessages(conversationId)` queries Supabase `messages` table.
3. Supabase returns records without evidence.
4. `initialMessages` passes zero evidence to `ChatUI`.
5. `ChatUI` has no evidence to render.

---

## J. Cache & Next.js Findings

- `ChatPage` is dynamically rendered per request (uses Supabase server cookies and route params).
- The missing data is **NOT** a Next.js cache or stale Vercel cache issue.
- The data simply does not exist in the database.

---

## K. Exact Root Cause Summary

| Problem | Root Cause Location | Exact Cause |
|---|---|---|
| **Problem 1 (UI)** | `src/app/chat/[id]/ChatUI.tsx` (lines 335-398) | Top evidence item (`index === 0`) is expanded by default with raw excerpts; toggle button shows raw counts (`+X More`); no sleek collapsed pill. |
| **Problem 2 (Persistence)** | `supabase/migrations` & `src/app/api/chat/route.ts` (lines 870-885) | `messages` table has no metadata/evidence column, and `route.ts` `onFinish` only inserts `{ conversation_id, role, content }`. |

---

## L. Recommended Fix Architecture

### 1. Database Layer (Migration)
Create a clean, non-destructive migration:
```sql
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
```
*Why `metadata JSONB`?*  
It provides flexibility for storing `{ evidence: [...] }`, token metrics, model flags, or study rescue tags without future breaking schema changes.

### 2. Backend API Handler (`src/app/api/chat/route.ts`)
In `onFinish({ text })`, pass the structured evidence:
```typescript
if (text && text.trim().length > 0) {
  const adminSupabase = createAdminClient()
  await adminSupabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: text,
    metadata: evidencePayload.length > 0 ? { evidence: evidencePayload } : null
  })
}
```

### 3. Server Actions & Page Loader
- **`src/app/chat/actions.ts`**: Update `getMessages()` to select `id, role, content, metadata, created_at`.
- **`src/app/chat/[id]/page.tsx`**: Map `metadata.evidence` to `initialMessages`:
  ```typescript
  const initialMessages = dbMessages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    evidence: (msg.metadata as any)?.evidence || [],
  }))
  ```

### 4. Chat UI Component (`src/app/chat/[id]/ChatUI.tsx`)
Refactor the Resources / Evidence section:
- **Collapsed State**: Render a refined reference trigger pill:
  - Icon + `"Campus Brain"` (or `"Official Course Syllabus"`) + `"See more"`
  - Discrete, compact, polished styling with subtle hover animation.
- **Expanded State**:
  - Clicking "See more" expands the drawer to display evidence cards.
  - "Hide details" collapses it back.
  - Displays sanitized title, excerpt, and freshness tag.
  - Zero internal IDs, zero raw scores, zero `+1 at source` terminology.

---

## M. Minimal Fix vs Proper Long-Term Fix

| Comparison | Minimal Fix | Proper Long-Term Fix (Recommended) |
|---|---|---|
| **Database** | Store evidence encoded inside message `content` as text | Add `metadata JSONB` column to `messages` table |
| **Cleanliness** | Dirty (pollutes markdown text, fragile regex parsing) | Clean, robust, typed JSONB schema |
| **Performance** | Extra client-side regex parsing overhead | Direct database query & structured hydration |
| **Maintainability**| High technical debt | Standard production architecture (same as ChatGPT/Claude) |

---

## N. Risks & Safety Controls

1. **Backward Compatibility**:  
   Existing messages in the database with `metadata = NULL` will safely fall back to `evidence = []` without any error.
2. **Zero Downtime**:  
   `ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;` is a non-blocking, instant operation in PostgreSQL.
3. **Data Security**:  
   Evidence stored in `metadata` undergoes the exact same sanitization already in `route.ts` (`sanitizeEvidenceMemories`), ensuring no internal system prompts, user IDs, or raw embeddings are stored or exposed.

---

## O. Regression Checklist (To Be Maintained)

- [x] AI Chat streaming remains realtime and responsive.
- [x] RLS policies and ownership checks remain unbroken.
- [x] Official Course Syllabus retrieval priority (Rank 1) remains authoritative.
- [x] Campus Brain contradiction handling and freshness policy remain intact.
- [x] Study Rescue prompt detection and formatting remain intact.
- [x] Anti-injection and untrusted data barriers remain active.
- [x] Multi-lingual response policy (Bengali / English) remains untouched.

---

## P. Recommended Next Implementation Steps

Upon user approval:
1. **Step 1**: Create migration `supabase/migrations/20240820000000_add_message_metadata.sql` (or apply via Supabase client).
2. **Step 2**: Update `getMessages()` in `src/app/chat/actions.ts` to select `metadata`.
3. **Step 3**: Update `page.tsx` to map `metadata.evidence` into `initialMessages`.
4. **Step 4**: Update `route.ts` `onFinish` to insert `metadata: { evidence: evidencePayload }`.
5. **Step 5**: Redesign `ChatUI.tsx` evidence rendering for the clean collapsed pill / expanded drawer UX.
6. **Step 6**: Verify live streaming, page reload (F5), chat-to-chat navigation, and multi-source rendering.

---
*End of Audit Report.*
