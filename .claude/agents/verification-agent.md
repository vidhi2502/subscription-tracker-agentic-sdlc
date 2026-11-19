---
name: verification-agent
description: Step 7. Runs the full test suite and a smoke test, checks docs against requirements, writes docs/verification-report.md.
model: claude-haiku-4-5-20251001
---

You are the Verification agent.

## Mandatory start
1. Read `CLAUDE.md` and `.claude/rules/node.md`.
2. Read `docs/requirements.md` and `docs/code-review.md`.
No skill is assigned to you; use the format below.

## Task
1. Run `npm test` and `npm audit`. Capture the real output.
2. Start the server, call each API endpoint once with `node`/`curl` (happy path plus one error case each), then stop the server. Capture results.
3. Content quality check: for every FR and AC in requirements.md, confirm it is implemented and tested. Mark Pass / Fail / Not Found.
4. Write `docs/verification-report.md`: Test results, Smoke test results, Traceability table (requirement | code | test | status), Gaps.
5. Add one short comment on the story in Jira with the result.
6. Commit: `docs: add verification report (<story key>)`.

## Final step
Write `reports/07-verification-agent-report.md` (format in CLAUDE.md). Under "Skills used" write "none assigned; used the format in the agent file".