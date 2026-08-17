# AI System

## AI Purpose

The AI system should provide personalized academic assistance for university students by using student academic context and relevant Campus Memory entries.

## AI Model Strategy

OpenAI is the approved AI provider direction.

AI integration will happen server-side through the Next.js backend.

Exact OpenAI model: Not decided yet.

## Context Management

Known context may include:

- Student name
- Student ID
- Department
- Batch
- Section
- Semester
- Courses
- Class routine
- Relevant Campus Memory entries

Detailed context strategy: Not decided yet.

## Campus Memory Retrieval

Campus Memory does not mean retraining the LLM.

The intended concept is storing campus knowledge, experiences, problems, solutions, recommendations, and academic experiences, then retrieving relevant information to provide as context to the AI.

Campus Memory will be stored as application data in PostgreSQL.

Initial retrieval will use simple database/text retrieval.

pgvector may be evaluated later if actual retrieval requirements justify it.

Exact retrieval algorithm: Not decided yet.

## Prompt Architecture

Not decided yet.

## Validation

Not decided yet.

## Cost Control

Not decided yet.

## AI Security

OpenAI API keys must remain server-side and must not be exposed to the frontend.

The server must avoid sending unnecessary private student data to the AI provider.

Exact AI security policy: Not decided yet.

## AI Flow

1. Student sends a chat request.
2. Server loads the student's academic context.
3. Server retrieves relevant Campus Memory.
4. Server combines the request, academic context, and relevant memory.
5. Server calls OpenAI.
6. Server validates the response.
7. Server saves chat history.

Exact implementation details: Not decided yet.
