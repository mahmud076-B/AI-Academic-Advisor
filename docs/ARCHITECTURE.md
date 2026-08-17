# Architecture

## System Architecture

The approved architecture is a unified full-stack application.

The project will use one Next.js application that contains:

- Frontend UI.
- Server-side backend logic.
- Internal server-side routes/actions.
- Secure database access.
- Server-side AI integration.

The MVP will not use a separate backend service, microservices, Redis, Docker, Kubernetes, a separate vector database, or unnecessary infrastructure.

## Technology Decisions

- Application framework: Next.js.
- Frontend: React and TypeScript.
- Backend: Next.js server-side backend in the same application.
- Database: Supabase PostgreSQL.
- Authentication: Supabase Auth.
- AI provider direction: OpenAI API.
- AI integration location: Server-side only.
- Application deployment: Vercel.
- Database/auth infrastructure: Supabase.
- File storage: Not required for MVP unless a real feature requires it.

## Application Layers

- Frontend layer: Presents the user interface for student authentication, onboarding, academic profile, courses, class routine, AI chat, chat history, Campus Memory, and experience sharing.
- Server/backend layer: Handles authenticated server-side logic, database operations, AI context assembly, Campus Memory retrieval, OpenAI calls, and response handling.
- Database layer: Stores student academic context, courses, class routine, chat history, Campus Memory, and shared experiences.
- Authentication layer: Uses Supabase Auth to authenticate students.
- AI provider layer: Generates AI responses from context provided by the server.

Exact folder structure: Not decided yet.

## Data Flow

Primary AI assistance flow:

1. Student signs in.
2. Student academic context is loaded.
3. Student sends a request through the chat interface.
4. Server retrieves relevant Campus Memory using simple database/text retrieval.
5. Server combines the student request, academic context, and relevant Campus Memory.
6. Server calls OpenAI from the backend.
7. Server validates and returns the response.
8. Chat history is stored.

Exact implementation details: Not decided yet.

## Integrations

- Supabase Auth for authentication.
- Supabase PostgreSQL for data storage.
- OpenAI API for AI responses.
- Vercel for application deployment.

Supabase and OpenAI have not been connected yet.

## Deployment Architecture

The approved deployment direction is:

- Vercel for the Next.js application.
- Supabase for PostgreSQL database and authentication infrastructure.
- Environment variables for secrets and service credentials.

Exact deployment configuration: Not decided yet.

## Architecture Boundaries

- The frontend must not call OpenAI directly.
- OpenAI API keys must remain server-side.
- Private student data must not be exposed to other students.
- Campus Memory is application data stored and retrieved from PostgreSQL.
- Campus Memory is not LLM training or fine-tuning.
- pgvector is not part of the initial MVP and may only be evaluated later if justified.

## Excluded From MVP

- Separate Express backend.
- MongoDB.
- Redis.
- Docker.
- Kubernetes.
- Microservices.
- Separate vector database.
- File storage unless explicitly required.
- Complex DevOps infrastructure.
