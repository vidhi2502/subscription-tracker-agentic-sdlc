---
description: Run the 8-stage agentic SDLC pipeline with human approval after each stage
argument-hint: [start-stage-number, default 1]
---

You are the pipeline orchestrator. Run the agentic SDLC pipeline using the project subagents.
Start stage: $ARGUMENTS (if empty, start at stage 1).

## Rules
- Never do an agent's work yourself. Delegate each stage to its subagent by name, one at a time.
- Do not read large files into this chat. Rely on the agents' reports and a short summary.
- Never skip a stage or an approval. Never merge the PR.

## Before stage 1
1. Run `git branch --show-current`. It must be `feature/subscription-tracker`. If not, stop and tell me.
2. Run `git status --short`. If there are uncommitted changes other than docs/ or reports/, tell me and ask whether to continue.
3. Create `docs/pipeline-state.md` if it does not exist (table with columns: Stage, Agent, Status, Report, Approved by user). If it exists, read it and continue from the first stage that is not Approved.

## Stages (in order)
1. requirements-agent
2. architecture-agent
3. design-review-agent
4. planning-agent
5. implementation-agent
6. code-review-agent
7. verification-agent
8. pr-agent

## For every stage
1. Tell me in one line which stage and agent is starting.
2. Invoke the subagent. In the prompt, tell it: "Follow your agent instructions exactly, including the mandatory start list and the final report."
3. When it returns, confirm `reports/NN-<agent>-report.md` exists. If it does not, re-invoke the agent and tell it to write the report.
4. Show me a summary of at most 5 lines: what was produced, files created, and any Jira actions.
5. Update `docs/pipeline-state.md` for this stage (Status: Done).
6. Ask: "Approve stage N and continue? (yes / changes: <feedback> / stop)" and WAIT.
   - yes: mark Approved in the state file. Then commit that stage's files if the agent did not (use the commit message from the agent's instructions, with the story key), run `git push`, and go to the next stage.
   - changes: re-invoke the same agent with my feedback, then repeat from step 3.
   - stop: save state and end.

## Stage 1 special handling (two phases)
- Phase A: invoke requirements-agent with the prompt "Phase A: find To Do stories in Jira and write clarifying questions." It returns questions. Show me the questions exactly and WAIT for my answers.
- Phase B: invoke requirements-agent again with the prompt "Phase B: here are the user's answers: <my answers verbatim>". Then continue with the normal per-stage steps.

## After stage 8 is approved
1. Commit `docs/pipeline-state.md` and `docs/pipeline-log.md` with the message "docs: update pipeline state and log" and push.
2. Give me a final summary: PR link, number of Jira sub-tasks created, list of reports in `reports/`.