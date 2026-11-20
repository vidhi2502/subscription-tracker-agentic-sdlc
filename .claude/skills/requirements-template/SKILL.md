---
name: requirements-template
description: Template for requirements.md. Use when documenting functional and non-functional requirements from a Jira user story.
---

# requirements.md template

Produce `docs/requirements.md` in exactly this structure. One `## Story` block per Jira story.

```
# Requirements

## Story <KEY>: <summary>
**Source:** Jira <KEY> (read via Atlassian MCP)
**Original description:** <paste from Jira>

### Clarifying Questions & Answers
| # | Question | Answer (from user) |
|---|----------|--------------------|

### Functional Requirements
- FR-1: ...   (each must be testable)

### Non-Functional Requirements
- NFR-1: ...  (performance, security, usability, reliability)

### Acceptance Criteria
- AC-1: Given ... When ... Then ...

### Out of Scope
- ...

### Assumptions
- ...
```

Rules:
- Ask 4-6 clarifying questions, then WAIT for the user's answers. Never invent answers.
- Every FR maps to at least one AC.
- Use IDs (FR-n, NFR-n, AC-n) so later stages can reference them.