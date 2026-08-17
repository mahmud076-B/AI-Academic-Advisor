# Security

## Authentication

Student authentication is part of the MVP concept.

Supabase Auth is the approved authentication direction.

Exact authentication flow: Not decided yet.

## Authorization

Authorization must protect user-owned data.

Students must not be able to access another student's private academic profile or chat history.

Exact authorization rules: Not decided yet.

## Secrets

Secrets must be stored in environment variables and must not be committed to Git.

OpenAI API keys must remain server-side.

Exact secrets management setup: Not decided yet.

## API Security

API/server logic must verify authentication before reading or writing private student data.

Exact API security implementation: Not decided yet.

## Database Security

The database direction is Supabase PostgreSQL.

Database access must protect student-owned data and Campus Memory according to the final access rules.

Exact database security rules and row-level security policies: Not decided yet.

## Validation

Not decided yet.

## Rate Limiting

Not decided yet.

## Privacy

Not decided yet.

## AI Security

AI integration must happen server-side.

The frontend must not receive or expose OpenAI API keys.

The server must avoid sending unnecessary private student data to the AI provider.

Exact AI security implementation: Not decided yet.
