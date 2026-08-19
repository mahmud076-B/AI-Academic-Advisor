# STEP 58: Hackathon Demo Script

## A. 30-Second Pitch
"Universities hold massive amounts of official data, but the real knowledge—where to study, what textbooks actually help, when labs are free—lives in the minds of students. The **AI Academic Advisor** is a living, collective intelligence system. It doesn’t just query a database; it combines your personal academic context, the official university syllabus, and crowdsourced **Campus Brain** knowledge to proactively guide you through university life."

## B. Problem Statement
Generic chatbots don't know who you are, what courses you are taking, or the nuances of your specific campus. Traditional university ERP portals are static and only provide rigid data, not intelligent guidance. When a student needs urgent study help or campus logistics, they are forced to piece together scattered PDFs, outdated portals, and disjointed rumors from senior students.

## C. Product Positioning
**AI That Knows What the Campus Knows.**
This is not a ChatGPT wrapper. It is an intelligent Campus Memory system that uses Semantic Vector Search (pgvector) to ground AI responses in official university knowledge and student-verified insights, delivering context-aware, evidence-backed assistance.

## D. 3-Minute Demo Sequence

### Scene 1: Student Context (Dashboard)
**Action:** Open the main Dashboard.
**Script:** "Instead of starting with a blank chatbot, the advisor already knows my academic context. It knows my department, my current semester, and today's class routine."

### Scene 2: Official Syllabus
**Action:** Open Chat and ask: *"What textbook does my Data Structures course recommend?"*
**Expected AI Response:** It identifies the enrolled course and pulls exact textbook recommendations from the official syllabus.
**Script:** "This answer isn't coming from generic AI training data. It is grounded in the official university syllabus for the exact course I am enrolled in, complete with evidence tracking."

### Scene 3: Campus Brain
**Action:** Ask: *"Where is the Data Structure book in the library?"*
**Expected AI Response:** Retrieves a shared Campus Brain memory submitted by a student.
**Script:** "But the syllabus won't tell me where to actually find the book. This information came from another student’s shared campus knowledge via the Campus Brain."

### Scene 4 & 5: Trust, Freshness, and Contradiction
**Action:** Ask: *"When does the canteen close?"*
**Expected AI Response:** Retrieves conflicting memories (e.g., 6 PM vs 7 PM), warns the user, checks freshness, and provides a cautious answer.
**Script:** "Even crowdsourced campus knowledge can conflict. The AI recognizes contradictions and freshness, warning me instead of pretending one answer is absolute fact."

### Scene 6: Campus Brain Language (Banglish)
**Action:** Ask: *"canteen e kokhon kom vir thake?"*
**Expected AI Response:** Explains rush hours in native Bengali script.
**Script:** "Students can talk naturally—even in Banglish—and the advisor responds in proper Bengali script, creating a highly accessible experience."

### Scene 7: Study Rescue
**Action:** Ask: *"Tomorrow is my Data Structures exam and I only have 2 hours. I know almost nothing. What should I study?"*
**Expected AI Response:** Generates a structured Study Rescue priority plan combining the syllabus and available time.
**Script:** "Now the system stops being a simple chatbot and becomes an academic advisor, generating a prioritized rescue plan based on my exact curriculum."

### Scene 8: Campus Pulse
**Action:** Navigate to the Campus Pulse page.
**Script:** "Because students continuously contribute knowledge, the system aggregates these signals into a live Campus Pulse, showing exactly what is happening across the university right now."

### Final WOW Moment
**Action:** Return to the chat or dashboard.
**Script:** "The university doesn't just have information. Its students collectively have knowledge. Campus Brain turns that knowledge into an intelligence layer."

## E. Technical Architecture

```text
       Student
          ↓
      Next.js UI
          ↓
    Supabase Auth
          ↓
  PostgreSQL / RLS
  ├── Academic Data
  ├── Official Syllabus
  ├── Campus Brain
  └── Conversations
          ↓
      pgvector
          ↓
   OpenAI (gpt-4o-mini)
          ↓
  AI Academic Advisor
```

## F. Judge Q&A Preparation

**Q: Why is this different from ChatGPT?**
**A:** ChatGPT has static, generic knowledge. Our system has context. It knows your exact course enrollments, your class schedule, the official syllabus chunks, and crowdsourced campus memories, combining them through strict RAG (Retrieval-Augmented Generation).

**Q: What is Campus Brain?**
**A:** Campus Brain is a shared semantic vector database where students log their campus experiences. The AI searches this brain to answer questions about campus life that aren't in official documents.

**Q: Is the AI actually learning?**
**A:** We are not fine-tuning the base model. The system "learns" by continuously growing its PostgreSQL vector database through student contributions, allowing the AI to retrieve and reason over an expanding, shared knowledge base.

**Q: How do you prevent wrong information?**
**A:** We clearly separate the Official Syllabus from crowdsourced Campus Brain. We expose the exact evidence chunks used. We also use algorithms to check data freshness and detect semantic contradictions between student reports, prompting the AI to be cautious.

**Q: How do you protect privacy?**
**A:** We use Supabase Authentication and Row Level Security (RLS). Students can only query the syllabus for courses they are enrolled in. Campus Brain memories are anonymized and separated from private student chats.

## G. Failsafe Demo Plan
If the OpenAI API times out or fails:
1. Showcase the Dashboard UI and Student Context.
2. Demonstrate Campus Pulse and the shared timeline.
3. Open the "Submit Experience" form to show how data enters the vector database.
4. Point out the evidence panels in a past, cached conversation to prove the RAG pipeline.
