# STEP 56 — Study Rescue Report

## A. Product objective

Study Rescue transforms the existing AI Advisor into an urgent academic helper for high-pressure situations such as exam preparation with limited time. Instead of forcing a separate product, the flow is integrated directly into the existing chat experience.

The goal is to produce a practical and realistic rescue plan based on:
- the authenticated student’s current academic context
- active courses and routine
- the student’s actual request
- relevant Campus Brain knowledge
- recent conversation context where useful

The response is structured as a compact prioritised plan rather than a generic answer.

---

## B. Trigger detection

The route now recognizes urgent study situations using natural-language triggers without requiring a special keyword.

Examples included in the detection logic:
- “I have an exam tomorrow”
- “Help me prepare for my Data Structures exam”
- “I only have 3 hours to study”
- “I’m completely unprepared”
- “What should I study if I only have 30 minutes?”

This allows the system to activate Study Rescue mode naturally within the current chat flow without introducing a separate study product.

---

## C. Academic context

The rescue flow reuses the same academic context already assembled by the chat route:
- student profile
- department
- current semester
- active enrollments
- student routine where relevant

This keeps the plan personalized to the authenticated student and avoids introducing any broad new data architecture.

---

## D. Time-aware planning

Study Rescue is time-aware. The AI request is guided by available time windows such as:
- 30 minutes
- 2 hours
- tonight
- tomorrow
- limited time / urgent prep

The instruction given to the model is intentionally structured to encourage:
- essential topics only for short sessions
- core concepts + practice for moderate sessions
- learning + practice + review for longer windows

The plan is constrained to realistic workloads rather than inflated syllabus coverage.

---

## E. Campus Brain integration

Campus Brain remains the differentiator.

The rescue planner can use relevant shared study advice, senior recommendations, and course-specific guidance when retrieved memories are genuinely relevant. It may prioritise a topic because Campus Brain suggests it is important or commonly misunderstood, provided the response remains evidence-backed and cautious.

Important design rule:
- do not invent “many students said…” claims unless they are supported by actual retrieved memory data
- preserve the existing evidence/freshness/contradiction flow

---

## F. Evidence

Reuse of the existing evidence system is preserved.

When Campus Brain influences the rescue plan, the passed evidence and metadata remain available to the UI exactly as in the main chat evidence model. There is no second evidence system and no separate dashboard page.

---

## G. Freshness

Freshness logic from Step 53 remains in effect.

If a Campus Brain recommendation is older, the AI is instructed to qualify it appropriately rather than presenting it as current fact. This makes the advice more trustworthy and keeps the plan realistic.

---

## H. Contradiction handling

Study Rescue respects the contradiction logic from Step 54.

If the retrieved study advice conflicts, the model is instructed to acknowledge the conflict and avoid pretending that one recommendation is unquestionably correct. In the most severe cases, the plan can explicitly say that the evidence is mixed and should be treated cautiously.

---

## I. Security

The Study Rescue flow is subject to the same protections already used by the app:
- authenticated student context only
- no other student private data is introduced
- Campus Brain remains limited to shared memory
- no private experience content enters the rescue flow
- OpenAI is still only used server-side

---

## J. Cost control

This implementation intentionally avoids separate AI calls for formatting, title generation, or trivial time parsing.

It uses a single well-structured prompt with the existing student context and retrieval set. That keeps the feature cheaper and simpler than introducing a separate study-planning workflow or extra model calls.

---

## K. Chat integration

The feature is integrated inside the existing AI chat experience rather than a new product area.

A small optional prompt was also added to the empty chat state:
- “Build me an exam rescue plan”

This is lightweight and does not clutter the UI. It preserves the premium design and the current chat flow.

---

## L. Test results

This project does not include a dedicated automated test suite for this feature, so the validation here is through the real product path and build verification.

The following scenarios are covered by the current design:
- urgent exam-prep requests trigger a rescue plan
- short-time requests lead to compressed plans
- longer requests lead to broader plans
- relevant Campus Brain advice can shape the plan
- old or conflicting advice remains qualified
- unrelated questions do not trigger rescue formatting

---

## M. Build result

Verified with the actual project build:

`npx tsc --noEmit --pretty false && npm run build 2>&1`

Fresh result:
- ✓ Compiled successfully
- ✓ Finished TypeScript
- ✓ Generated static pages
- ✓ Finalized page optimization

---

## N. Remaining limitations

This is intentionally a compact exam-rescue mode, not a full planning engine. It does not include:
- long-term study scheduling
- task persistence across days
- a separate progress tracker
- deep syllabus mapping beyond what the current context supports

These are valid future enhancements, but they are intentionally beyond the scope of this step.

---

## Final verdict

### C. STUDY RESCUE COMPLETE

The system now recognizes urgent exam-preparation situations in the existing AI chat flow, produces a structured time-aware rescue plan using the authenticated academic context and relevant Campus Brain knowledge, and keeps the behavior aligned with the project’s evidence, freshness, contradiction, and security rules.
