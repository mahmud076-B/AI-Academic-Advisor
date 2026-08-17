# AI Onboarding

Project: AI Academic Advisor - An Intelligent Campus Memory

This file explains how any new AI coding assistant should begin working on this project.

## Required Reading Order

Before modifying code or documentation, read these files in order:

1. `PROJECT_RULES.md`
2. `docs/PROJECT_OVERVIEW.md`
3. `docs/CURRENT_STATE.md`
4. `docs/DEVELOPMENT_ROADMAP.md`
5. `docs/PRODUCT_REQUIREMENTS.md`
6. Relevant technical documentation for the task, such as:
   - `docs/ARCHITECTURE.md`
   - `docs/DATABASE_DESIGN.md`
   - `docs/API_SPECIFICATION.md`
   - `docs/AI_SYSTEM.md`
   - `docs/UI_UX_SPECIFICATION.md`
   - `docs/SECURITY.md`
   - `docs/DECISIONS.md`

## Working Rules For AI Assistants

1. Inspect the existing codebase before making changes.
2. Never assume that undocumented architecture decisions are correct.
3. Never rewrite working systems unnecessarily.
4. Ask for clarification when requirements are unclear.
5. Work in small, verifiable steps.
6. Update relevant documentation after significant changes.
7. Do not invent missing technical details.
8. Clearly mark undecided items as "Not decided yet."

## Current Project Status

The documentation foundation is complete, and the architecture direction has been approved.

Application code has not been created yet.

## Approved Architecture Direction

- Architecture: Unified full-stack application.
- Frontend: Next.js, React, and TypeScript.
- Backend: Next.js server-side backend in the same application.
- Database: Supabase PostgreSQL.
- Authentication: Supabase Auth.
- API approach: Internal server-side routes/actions in the Next.js application.
- AI integration: Server-side OpenAI integration.
- Campus Memory: Stored as application data in PostgreSQL.
- Retrieval: Simple database/text retrieval first.
- Future retrieval option: pgvector may be evaluated later if justified.
- Deployment: Vercel for the application, Supabase for database/auth infrastructure.
- File storage: Not required for MVP unless a real feature requires it.

## Still Undecided

- Exact database tables, fields, relationships, constraints, indexes, and access rules: Not decided yet.
- Exact API endpoints and contracts: Not decided yet.
- Exact OpenAI model: Not decided yet.
- Exact AI prompts: Not decided yet.
- Exact Campus Memory retrieval implementation: Not decided yet.
- Exact UI screens, layout, components, and design system: Not decided yet.
- Exact validation rules: Not decided yet.
- Exact testing tools and coverage plan: Not decided yet.
- Exact logging and monitoring details: Not decided yet.
- Exact deployment configuration: Not decided yet.
