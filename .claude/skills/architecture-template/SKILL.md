---
name: architecture-template
description: Template for architecture.md. Use when designing the high-level architecture from requirements.md.
---

# architecture.md template

Produce `docs/architecture.md` in exactly this structure:

```
# Architecture

## 1. Overview
2-3 sentences. Link to requirements.md IDs covered.

## 2. Component Diagram
Mermaid diagram (flowchart) of components.

## 3. Components & Responsibilities
| Component | Responsibility | Files |
|-----------|----------------|-------|

## 4. Technology Choices
| Concern | Choice | Reason |
|---------|--------|--------|

## 5. Data Model
Fields, types, validation rules.

## 6. API Design
| Method | Path | Request | Response | Errors |
|--------|------|---------|----------|--------|

## 7. Data Flow
Numbered steps for the main flows (add, list/total, upcoming renewals).

## 8. Risks & Open Questions
- ...
```

Rules:
- Stack is fixed by CLAUDE.md (Node.js, Express, vanilla frontend, JSON file storage).
- Keep it minimal: no extra services, no database.
- Every FR in requirements.md must be traceable to a component or endpoint.