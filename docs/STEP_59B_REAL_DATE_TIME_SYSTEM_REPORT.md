# STEP 59B - Real Date & Time System Report

Date: 2026-08-20
Project: AI Academic Advisor - An Intelligent Campus Memory

## Final Verdict

**B. MOSTLY COMPLETE**

A shared Asia/Dhaka date/time system is implemented and applied to the frontend surfaces that already have usable timestamp fields. The remaining incomplete areas are intentional: Routine has recurring weekly `TIME` values but no real calendar date, and syllabus retrieval currently does not expose a document or revision timestamp. No dates were invented.

## 1. Timestamp Audit

### Chat

- Conversations already returned `created_at` but did not display it.
- Conversation sidebar now shows relative recency and keeps the exact timestamp in a semantic `time` element and accessible label.
- Chat messages have `created_at` in the query, but message bubbles remain intentionally uncluttered. Message timestamps are not visually added to every bubble.

### Campus Brain

- Experience records expose `created_at` and `updated_at`.
- Previous cards used browser-local date formatting and labeled `created_at` as `Updated`.
- Cards now prefer `updated_at || created_at`, show relative recency, and expose the exact timestamp through `time[aria-label]`.
- Personal contribution cards show posted recency separately.

### Campus Pulse and Evidence

- Pulse previously used a duplicated relative-time formatter and generated `lastUpdated` at response time.
- Pulse now uses the shared formatter and chooses `updated_at || created_at` as the observed source timestamp.
- Evidence objects now carry relative time, exact formatted time, and the original timestamp.
- Expanded evidence displays `Observed 18 Aug 2026, 3:42 PM` with a semantic timestamp.
- Pulse summary exposes `Last observed` with exact date/time.
- Realtime language was corrected: `Live Campus Intelligence` and `right now` were replaced with `Campus Intelligence` and `Recent campus signals` because no realtime subscription exists.

### Dashboard

- Class times now use the shared time formatter.
- Greeting, weekday, and current class comparison use Asia/Dhaka rather than server-local time.
- Existing timeline data uses recurring SQL time values, so no invented calendar date is shown.

### Routine

- Existing raw `HH:mm` presentation now uses the shared `formatTime()` utility and renders AM/PM consistently with Dashboard.
- The page still shows weekday names because the database stores a recurring weekly routine, not a specific date. A real date should only be added after a calendar date source exists.

### Courses and Profile

- No trustworthy user-facing course/profile timestamp was previously rendered.
- Existing action timestamps remain backend metadata and were not exposed as invented activity dates.

### Official Syllabus

- Chat syllabus evidence currently exposes official-document authority and page context, but the retrieval response does not include a source publication/revision date.
- No syllabus date was invented. A future implementation should display document date, ingestion date, and retrieval time only when each source field is available.

## 2. Central Utility

Created `src/lib/date-time.ts` with:

- `formatDateTime()` -> `18 Aug 2026, 3:42 PM`
- `formatDate()` -> `18 Aug 2026`
- `formatTime()` -> `3:42 PM` or existing SQL `15:42` -> `3:42 PM`
- `formatRelativeTime()` -> `Just now`, `20m ago`, `Yesterday`, `18 Aug 2026`
- `getExactDateTimeLabel()` for accessible exact timestamp labels
- `APP_TIME_ZONE = 'Asia/Dhaka'`

Invalid or missing values return an explicit fallback such as `Unknown date` or `Unknown time`; they do not silently render misleading values.

## 3. Timezone Policy

All date and date-time formatters use `Asia/Dhaka`. Dashboard greeting, weekday, and current-time comparison also use Asia/Dhaka. Relative time is calculated from timestamp instants and then displayed through the same shared utility.

## 4. Exact and Relative Presentation

Relative labels are used for scanning. Exact timestamps remain available through semantic `time` elements and `aria-label` values. This keeps cards compact without hiding trust-critical timing information.

## 5. Realtime Honesty

The application does not currently use Supabase realtime subscriptions. Pulse therefore no longer claims live infrastructure. User-facing wording now uses `Recent`, `Last observed`, `Updated`, and `Observed` language.

## 6. Accessibility

- Exact timestamps use semantic `time` elements where rendered.
- Relative chat timestamps include `dateTime` and an exact `aria-label`.
- Pulse evidence keeps the human-readable exact time in an accessible label.
- No internal database IDs are exposed in the visible date/time presentation.

## 7. Backend Safety

No database schema, RLS, authentication, AI retrieval, embeddings, syllabus RPC, or Campus Brain logic was modified. The changes are limited to shared formatting and frontend presentation, with Pulse selecting an already-returned timestamp field for display.

## 8. Validation

Browser verification covered authenticated routes including Dashboard, Chat, Campus Brain, Campus Pulse, and Routine at the existing desktop viewport. Checks confirmed:

- Chat conversation recency renders with exact accessible timestamps.
- Pulse no longer exposes the previous realtime wording.
- Route overflow remains false.
- Routine and Dashboard use consistent AM/PM presentation.
- Exact timestamp formatting uses the requested uppercase AM/PM style.

Commands passed:

- `npx tsc --noEmit --pretty false`
- `npm run build`

Build note: Next.js still reports the existing middleware-to-proxy convention deprecation warning. This is unrelated to STEP 59B.

## 9. Remaining Improvements

1. Add a real calendar-date source if Routine needs date-specific schedule entries.
2. Add document/revision metadata to the syllabus retrieval contract when the source contains it.
3. Pass message `created_at` through to ChatUI if message-level exact timestamps become a user requirement; they are intentionally not added to every bubble in this step.
4. Add a shared date/time visual regression fixture with fixed timestamps so screenshots remain deterministic.
