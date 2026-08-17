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

## Intentionally Undecided Decisions

- Exact database tables, fields, relationships, constraints, indexes, and access rules: Not decided yet.
- Exact API routes or server actions: Not decided yet.
- Exact AI model: Not decided yet.
- Exact prompt structure: Not decided yet.
- Exact Campus Memory ranking logic: Not decided yet.
- Exact UI screens, layout, components, and design system: Not decided yet.
- Exact validation rules: Not decided yet.
- Exact security policies and row-level security rules: Not decided yet.
- Exact testing tools and coverage plan: Not decided yet.
- Exact logging and monitoring details: Not decided yet.
- Exact deployment configuration: Not decided yet.

## Decision Template

### Decision Title

- Date: Not decided yet.
- Status: Not decided yet.
- Decision: Not decided yet.
- Reason: Not decided yet.
- Alternatives considered: Not decided yet.
