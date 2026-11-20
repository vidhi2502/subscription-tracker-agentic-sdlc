---
description: Show current pipeline progress (no agents are run)
---

Show the current pipeline status. Do not run any subagent and do not change any file.

1. Read `docs/pipeline-state.md` if it exists.
2. List the files in `reports/` and `docs/`.
3. Run `git log --oneline -10`.
4. Print one table: Stage | Agent | Status | Report file exists (yes/no).
5. End with one line: the next stage to run, or "pipeline complete".