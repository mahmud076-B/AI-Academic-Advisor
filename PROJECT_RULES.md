# Project Rules

Project: AI Academic Advisor - An Intelligent Campus Memory

This document contains permanent rules for AI-assisted development on this project.

## Core Rules

1. Do not create application code unless the user explicitly asks for implementation.
2. Do not install packages unless the package choice has been approved or is clearly required for an approved implementation step.
3. Do not initialize a framework until the technology stack is decided.
4. Do not create database files until the database design and technology are decided.
5. Do not invent architecture, database schemas, API endpoints, or implementation details.
6. Clearly mark undecided items as "Not decided yet."
7. Keep work incremental and beginner-friendly.
8. Prefer small, verifiable changes.
9. Inspect the existing codebase and documentation before making changes.
10. Do not rewrite working systems unnecessarily.
11. Ask for clarification when requirements are unclear or risky to assume.
12. Keep documentation synchronized with the actual project.
13. Update `docs/DECISIONS.md` when a significant architectural or product decision is made.
14. Update `docs/CURRENT_STATE.md` when project progress changes.
15. Update `docs/CHANGELOG.md` when features are added or changed.
16. Do not delete existing documentation unless explicitly instructed.
17. Do not modify documentation unnecessarily.

## Product Direction

The product should feel like a modern, premium, clean AI assistant similar to a modern SaaS/chat application.

It should not feel like a traditional university management system.

## Campus Memory Rule

Campus Memory does not mean retraining the large language model.

The intended concept is to store campus knowledge, experiences, problems, solutions, recommendations, and academic experiences, then retrieve relevant information and provide it as context to the AI.

## Source Of Truth

These documentation files are the long-term source of truth for the project.

If documentation and implementation disagree, pause and clarify before making assumptions.
