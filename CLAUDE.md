# Subscription Tracker – Agentic SDLC

Small web app to track recurring subscriptions: monthly total, renewal dates,
upcoming renewals. Built end-to-end via an agentic SDLC pipeline in Claude Code.

## Stack
- Node.js 18+, Express, vanilla HTML/JS frontend
- Storage: JSON file in `data/` (no database)
- Tests: built-in `node:test` (no extra test framework)

## Project layout
- `src/` app code, `tests/` tests, `docs/` stage outputs, `reports/` agent proof reports
- `.claude/agents` subagents, `.claude/skills` templates, `.claude/rules` coding rules

## Jira
- Project key: `SUBT`. Access only through the Atlassian MCP. Never read `.env`.
- Requirements agent finds user stories itself: Stories in SUBT with status To Do.
- Only the Planning agent creates sub-tasks (one per task in impl-plan.md) under the story.
- Implementation agent moves sub-tasks To Do → In Progress → Done as it works.
- All other agents add one short comment on the story. Never modify the epic.

## Pipeline rules (all agents)
1. Read this file and `.claude/rules/node.md` before starting.
2. Read the previous stage's doc in `docs/` as your input.
3. Use your assigned skill's template exactly. Do not invent your own format.
4. Before finishing, write `reports/NN-<agent-name>-report.md` (see report format below).
5. Never commit `.env` or secrets. Never merge the PR; a human approves.
6. Keep outputs concise.

## Report format (required)
Sections: Agent, Date/Time, What I did, Files consulted, Skills used,
Files created/modified, Jira actions, Open questions/risks.

## Commits
Conventional commits, one per stage, with the story key,
e.g. `docs: add requirements (SUBT-3)`.