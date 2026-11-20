# Architecture Agent Report

## Agent
architecture-agent (Step 2)

## Date/Time
2026-11-20, approx. 15:29 IST (Jira comment timestamp)

## What I did
- Read CLAUDE.md, .claude/rules/node.md, docs/requirements.md (SUBT-3).
- Wrote docs/architecture.md using the architecture-template structure (sections 1 to 8).
- Mapped every FR-1 to FR-12 and NFR-1 to NFR-5 to a component, endpoint, or data rule.
- Added one comment on SUBT-3: "architecture.md created".
- Did not commit (per the course correction from the launching agent).

## Files consulted
- CLAUDE.md
- .claude/rules/node.md
- docs/requirements.md
- .claude/skills/architecture-template/SKILL.md (via preloaded skill)
- reports/01-requirements-agent-report.md (listing only)

## Skills used
- architecture-template. Sections filled: 1 Overview, 2 Component Diagram, 3 Components & Responsibilities, 4 Technology Choices, 5 Data Model, 6 API Design, 7 Data Flow, 8 Risks & Open Questions.

## Files created/modified
- Created: docs/architecture.md
- Created: reports/02-architecture-agent-report.md

## Jira actions
- SUBT-3: added comment "architecture.md created" (comment id 10005).
- Epic not modified. No sub-tasks created (planning agent's job).

## Open questions/risks
- Corrupt JSON file: is it backed up before the next write overwrites it? Proposed: yes, copy to a timestamped file.
- Month-end and leap-year roll-forward: proposed clamp-from-anchor rule (31 Jan + 1 month = 28/29 Feb; 29 Feb + 1 year = 28 Feb). Needs confirmation.
- Cost rounding: yearly/12 fractions displayed to 2 decimals, not rounded before summing. Needs confirmation.
- Atomic file write (temp + rename) recommended but not required by the story.
- DELETE returns 200 `{ "ok": true }`; 204 is an alternative.
- Validation placed in `src/calc.js` (pure) rather than in `server.js`; this is a choice within the node.md layout.
