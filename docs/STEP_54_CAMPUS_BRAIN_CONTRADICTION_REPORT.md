# STEP 54 — Campus Brain Contradiction Detection Report

## A. Problem

Campus Brain is built from shared student experience reports. Because the knowledge is crowdsourced, different reports may conflict.

A naive retrieval flow could return multiple memories relevant to the same question and let the model treat the set as a single authoritative answer. That creates a subtle but important risk: student reports with different times, rooms, schedules, or locations can be merged into a false certainty.

The requirement is to detect this situation with the smallest possible runtime cost and no new database systems.

---

## B. Detection strategy

The solution follows the existing architecture exactly:

1. keep pgvector retrieval as the primary retrieval mechanism
2. keep the existing Campus Brain evidence flow
3. operate only on the already-retrieved memories for a single question
4. perform a lightweight, deterministic contradiction check only when multiple strong memories are present
5. avoid a second search engine or new database table

This is intentionally conservative and does not create a contradiction table, conflict system, moderation system, or new infrastructure.

---

## C. Conflict classification

The contradiction layer classifies the retrieved set into the following categories:

### Consistent

If only one memory is retrieved, or multiple memories are related but do not materially disagree, the system treats them as consistent.

### Conflicting

When two or more strong memories overlap on the same subject and contain materially different values, the system marks the memory set as conflicting.

Examples include:
- time mismatch: 6 PM vs 7 PM
- room mismatch: Room 301 vs Room 402
- day mismatch: Monday vs Tuesday
- building mismatch: Building 1 vs Building 2

### Uncertain

The system does not force a conflict status in every ambiguous case. If the retrieved memories are related but not sufficient to establish a clear answer, the answer remains cautious and non-definitive.

---

## D. Freshness interaction

STEP 53 already adds freshness metadata. Step 54 uses that signal as part of the conflict handling.

This means the system prefers newer information when appropriate while still avoiding over-claiming. The freshness signal is evidence, not proof.

Example:

- older report: library closes at 6 PM
- newer report: library closes at 8 PM

The AI can say:

"Recent student reports suggest around 8 PM, though an older report said 6 PM. The closing time may have changed."

This keeps the answer honest without inventing certainty.

---

## E. AI prompt behavior

The route prompt has been updated only as needed.

When a contradictory set is detected, the system prompt includes a small contradiction note:

- do not silently pick one memory as absolute truth
- mention the conflict when relevant
- prefer newer information when appropriate
- use freshness information
- communicate uncertainty clearly
- avoid internal system terminology

This keeps the user-facing answer natural and product-safe.

---

## F. Evidence UI

The existing evidence panel remains the same product surface; it is not replaced by a separate contradiction page.

When a conflict is detected, the evidence section now shows a subtle banner:

- ⚠ Conflicting campus information
- brief summary text explaining that different reports exist

This is displayed in the same evidence card stack as the rest of the Campus Brain evidence and remains compact, premium, and non-diagnostic.

---

## G. Cost impact

The implementation intentionally avoids a second LLM call for every chat message.

The contradiction check only runs when:
- multiple memories are retrieved
- the memories are strong enough to be meaningful
- the texts are sufficiently related to the same subject

This keeps the contradiction analysis near-zero cost relative to the main retrieval and answer-generation steps, while still catching the highest-value conflicts.

---

## H. Security

The protection model is unchanged.

- only shared `campus_memories` participate
- private experiences never enter the contradiction pipeline
- no student ID or internal UUID values are exposed
- no service-role detail is surfaced to the UI
- RLS remains unchanged

The contradiction layer consumes the same retrieval result set already produced by the existing secure campus memory flow.

---

## I. Test results

The project does not currently have a configured automated test suite for this feature. Validation was performed through the real code path and production build.

### Test cases reviewed against the logic

#### 1. Clear agreement

Two memories saying around the same closing time are treated as consistent and no contradiction warning is shown.

#### 2. Clear conflict

Two memories with materially different time/value claims are marked conflicting.

#### 3. Fresh vs old conflict

A newer memory plus an older conflicting memory is treated as conflicting, with the newer memory more likely to be favored in wording without claiming certainty.

#### 4. Different subject

Unrelated memories do not trigger contradiction analysis.

#### 5. Single memory

A single memory produces no contradiction warning.

#### 6. Bangla/Banglish

The logic uses normalized text matching and is compatible with the same cross-language retrieval flow already in use.

#### 7. Private experience

Private experiences do not enter the pipeline because only shared `campus_memories` are retrieved for the semantic search.

---

## J. Chat regression

The change preserves the existing chat architecture:

- streaming remains intact
- evidence metadata remains attached to the answer stream
- campus memory evidence display remains in the assistant panel
- prior flow and UI patterns remain the same

No separate contradiction page was introduced.

---

## K. Limitations

This is intentionally a lightweight contradiction detector, not a full truth engine.

There are constraints:
- it works best for obvious numeric/date/room/building mismatches
- broader semantic contradiction detection would require more validation and more expensive analysis
- it does not attempt to solve every possible contradictory statement or deduplicate every style of phrasing

The design is intentionally practical and safe for a campus memory feature with a tight architecture boundary.

---

## L. Future improvements

Future enhancements could include:
- more robust phrase clustering for similar claims
- a better rule set for “same subject” detection
- a small, targeted model call only when obvious deterministic checks fail
- optional explanation phrasing tuned by question type

Those are useful, but they should be added only if the product requirement expands beyond this phase.

---

## Final verdict

### C. CONTRADICTION DETECTION COMPLETE

The system now performs a lightweight contradiction check on the already-retrieved shared Campus Brain memories and communicates conflict clearly without adding new schema or infrastructure. The answer flow, evidence UI, and freshness model remain aligned with the existing product architecture.
