# STEP 67: Implementation Report — Campus Brain Resource UI & Persistence Fix

**Document ID:** `STEP_67_CAMPUS_BRAIN_RESOURCE_FIX_REPORT`  
**Date:** 2026-08-20  
**Project:** AI Academic Advisor ([advisor.smmah.me](https://advisor.smmah.me))  
**Status:** IMPLEMENTATION & VERIFICATION COMPLETE  

---

## A. Root Cause Summary

1. **Resource UI Raw Default Exposure:**  
   In `ChatUI.tsx`, the top retrieved evidence item (`index === 0`) was rendered in full view by default, accompanied by internal count wording (`+X More`) and bulky cards rather than a discreet, collapsed indicator pill.
2. **Resource Loss on Refresh / Reopen:**  
   In `src/app/api/chat/route.ts`, the `onFinish` handler persisted only `{ conversation_id, role: 'assistant', content: text }` to Supabase. The `evidencePayload` was never saved in PostgreSQL and existed purely in transient stream memory. On page refresh, `getMessages()` had no evidence data to return, causing all Campus Brain and Syllabus resources to vanish.

---

## B. Database Changes

Created non-destructive migration `supabase/migrations/20240820000000_add_message_metadata.sql`:
```sql
-- ==============================================================================
-- STEP 67: ADD METADATA COLUMN TO MESSAGES
-- Enables persisting structured assistant evidence (Campus Brain & Syllabus)
-- ==============================================================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
```
* Existing rows remain fully compatible with `metadata = NULL`.
* Zero table drops, zero column removals, zero breaking schema alterations.

---

## C. API Persistence Changes

In `src/app/api/chat/route.ts`:
* Updated `onFinish({ text })` inside `streamText` to persist the already-sanitized `evidencePayload` alongside the assistant message:
```typescript
const adminSupabase = createAdminClient()
const { error: assistantMsgError } = await adminSupabase.from('messages').insert({
  conversation_id: conversationId,
  role: 'assistant',
  content: text,
  metadata: evidencePayload.length > 0 ? { evidence: evidencePayload } : null
})
```
* Maintained live streaming tail marker `__AI_CAMPUS_BRAIN_EVIDENCE__` so realtime responses continue rendering evidence without waiting for a re-fetch.

---

## D. Message Loading & Hydration Changes

1. **Server Action (`src/app/chat/actions.ts`):**  
   Updated `getMessages()` to select the `metadata` column:
   ```typescript
   const { data } = await supabase
     .from('messages')
     .select('id, role, content, metadata, created_at')
     .eq('conversation_id', conversationId)
     .order('created_at', { ascending: true })
   ```
2. **Server Component Hydration (`src/app/chat/[id]/page.tsx`):**  
   Mapped `metadata.evidence` into `initialMessages`:
   ```typescript
   const initialMessages: ChatMessage[] = dbMessages.map(msg => ({
     id: msg.id,
     role: msg.role as 'user' | 'assistant',
     content: msg.content,
     evidence: msg.role === 'assistant'
       ? ((msg.metadata as { evidence?: EvidenceItem[] } | null)?.evidence ?? [])
       : [],
   }))
   ```

---

## E. UI Redesign (`src/app/chat/[id]/ChatUI.tsx`)

1. **Always Collapsed Initially:**  
   Evidence is always collapsed by default when an assistant message arrives or is loaded from the database.
2. **Clean Reference Indicator Pills (~28–32px):**  
   - Campus Brain: `[BrainCircuit icon] Campus Brain · See more`
   - Official Syllabus: `[FileText icon] Official Course Syllabus · See more`
   - Both: Grouped side-by-side with independent toggle controls.
3. **No Internal Terminology:**  
   Removed all instances of `1 at source`, `+X More`, raw similarity scores, and internal UUIDs.
4. **Accessible Smooth Accordion Drawers:**  
   - Clicking `"See more"` flips to `"Hide details"` with `<ChevronUp />` and reveals clean cards showing title, excerpt, and freshness badges.
   - Includes `aria-expanded` and `aria-controls` for accessibility.
   - Responsive design with zero horizontal overflow on mobile screens (~375px).

---

## F. Backward Compatibility

* Historical messages with `metadata = NULL` load safely with `evidence: []`.
* No database re-indexing or backfill errors.
* Existing chat sessions, profile data, routine views, and course catalogs operate without disruption.

---

## G. Security & Policy Preservation

* **Sanitization Preserved:** `sanitizeEvidenceMemories` ensures no database IDs, user IDs, or raw embeddings are persisted in `metadata`.
* **Hierarchy Intact:** Rank 1 Official Syllabus and Rank 2 Campus Brain observations remain intact in system prompt construction.
* **Defense-in-Depth:** RLS, Anti-injection safeguards, and rate limiting remain unchanged.

---

## H. Verification & Test Results

| Test Case | Scenario | Result |
|---|---|---|
| **TEST 1** | New response with Campus Brain evidence | Collapsed reference pill renders. No raw counts. No open card. |
| **TEST 2** | Click "See more" | Smooth drawer expands with clean excerpt and freshness badge. |
| **TEST 3** | Refresh page (F5) | Assistant message and Campus Brain reference reload cleanly in collapsed state. |
| **TEST 4** | Navigate between chats and reopen | Persisted evidence loads reliably from Supabase `metadata`. |
| **TEST 5** | Official Course Syllabus evidence | Renders with syllabus identity and expands cleanly. |
| **TEST 6** | Dual Campus Brain + Syllabus response | Both reference pills render grouped with independent drawers. |
| **TEST 7** | Legacy message with `metadata = NULL` | Loads normally without errors or broken UI. |
| **TEST 8** | Mobile screen responsiveness (~375px) | Pills and drawers wrap cleanly without horizontal overflow. |

---

## I. Build & Typecheck Results

1. **TypeScript Typecheck:**
   ```bash
   npx tsc --noEmit --pretty false
   # Exit Code: 0 (Zero errors)
   ```
2. **Production Next.js Build:**
   ```bash
   npm run build
   # Compiled successfully in 4.8s
   # All 16 routes generated successfully
   # Exit Code: 0
   ```

---

## J. Final Verdict

**C. CAMPUS BRAIN RESOURCE UI & PERSISTENCE FIX COMPLETE**
