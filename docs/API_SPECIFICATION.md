# API Specification

## API Style

The approved API direction is internal server-side routes/actions inside the Next.js application.

The MVP will not use a separate backend service.

## Authentication Requirements

Supabase Auth is the approved authentication direction.

Server-side API logic must verify the authenticated student before accessing private student data.

Exact authentication flow: Not decided yet.

## Endpoints

Not decided yet.

## Request And Response Concepts

Not decided yet.

## Error Handling

Not decided yet.

## API Boundaries

- API/server logic should run inside the unified Next.js application.
- OpenAI calls must happen server-side.
- Supabase service credentials and OpenAI API keys must not be exposed to the frontend.
- Student-owned data must be protected from unauthorized access.

Exact API contract: Not decided yet.
