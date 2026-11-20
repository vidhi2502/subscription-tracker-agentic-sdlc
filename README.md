# Subscription Tracker: Agentic SDLC with Claude Code

A small web app for tracking recurring subscriptions (monthly total in INR, renewal dates, subscriptions renewing in the next 7 days). The app is deliberately simple. The purpose of this repository is to demonstrate an **agentic SDLC pipeline** built with Claude Code (run through `codemie-claude`): eight subagents take a Jira user story through requirements, architecture, design review, planning, implementation, code review, verification and a pull request, with a human approving every stage.

- Jira project: `SUBT` (epic SUBT-2, story SUBT-3, sub-tasks SUBT-4 to SUBT-11)
- Pull request: PR #1 (`feature/subscription-tracker` into `main`)

## The app

- Add a subscription: name, cost (INR), billing cycle (monthly or yearly), next renewal date, optional category
- List and delete subscriptions (editing is out of scope for this story)
- Monthly total (yearly cost divided by 12)
- "Renewing soon": renewals within the next 7 days, today included
- Past renewal dates roll forward automatically to the next cycle
- Stack: Node.js 18+, Express, vanilla HTML/JS, JSON file storage, `node:test`

### Run the app

```
npm install
npm start
```

Then open http://127.0.0.1:3000. The server binds to localhost only and has no login (single local user).

### Run the tests

```
npm test
```

## The pipeline

Run from the project folder with `codemie-claude`:

```
/run-pipeline
```

The main session acts as the orchestrator. It invokes one subagent per stage, shows a short summary, and waits for human approval before moving on. Progress is saved in `docs/pipeline-state.md`, so the pipeline can be stopped and resumed. `/pipeline-status` shows progress without running anything.

| Stage | Agent | Output | Report |
|---|---|---|---|
| 1 | requirements-agent | `docs/requirements.md` (reads To Do stories from Jira, asks clarifying questions) | `reports/01-...` |
| 2 | architecture-agent | `docs/architecture.md` | `reports/02-...` |
| 3 | design-review-agent | `docs/design-review.md`, updated architecture | `reports/03-...` |
| 4 | planning-agent | `docs/impl-plan.md` and Jira sub-tasks | `reports/04-...` |
| 5 | implementation-agent | code in `src/`, tests in `tests/` | `reports/05-...` |
| 6 | code-review-agent | `docs/code-review.md`, fixes for High findings | `reports/06-...` |
| 7 | verification-agent | `docs/verification-report.md` | `reports/07-...` |
| 8 | pr-agent | `docs/pr-description.md`, `CHANGELOG.md`, pull request | `reports/08-...` |

### How skills, rules and reports are enforced

- **Skills are preloaded** into the agents that use them through the `skills:` field in each agent's frontmatter, and each agent also has a mandatory read list.
- **Reports are enforced by a hook.** A `SubagentStop` hook (`.claude/hooks/require-report.js`) blocks an agent from finishing until its `reports/NN-<agent>-report.md` exists with the sections "Files consulted", "Skills used" and "Jira actions", and names its skill where one is assigned.
- **Agent activity is logged** by a second hook (`.claude/hooks/log.js`) to `docs/pipeline-log.md`.
- **`.env` is protected** from agent file reads by a permission deny rule in `.claude/settings.json`. The Jira MCP server reads it directly.

## Jira behaviour

- The requirements agent finds user stories itself (project `SUBT`, status To Do).
- Only the planning agent creates sub-tasks under the story.
- The implementation agent moves each sub-task To Do, In Progress, Done and comments the commit.
- All other agents add one short comment on the story. The epic is never modified.

## Repository layout and GitHub Copilot equivalents

| This repo (Claude Code) | GitHub Copilot equivalent |
|---|---|
| `CLAUDE.md` | `.github/copilot-instructions.md` |
| `.claude/rules/node.md` | `.github/instructions/*.instructions.md` |
| `.claude/agents/*.md` | `.github/agents/*.agent.md` |
| `.claude/skills/*/SKILL.md` | `.github/skills/*/SKILL.md` |
| `.claude/commands/*.md` | `.github/prompts/*.prompt.md` |
| `.claude/settings.json` and `.claude/hooks/` | `.github/hooks/hooks.json` and scripts |
| `.mcp.json` | `.vscode/mcp.json` |
| Main session running `/run-pipeline` | orchestrator agent |
| `reports/` | (new in this capstone) |

```
CLAUDE.md
.mcp.json
.claude/
  settings.json        hooks wiring and .env deny rule
  agents/              8 subagents
  skills/              requirements, architecture, code-review, pr templates
  commands/            run-pipeline, pipeline-status
  rules/               node.md coding rules
  hooks/               require-report.js, log.js
docs/                  stage documents, pipeline state and log
reports/               one proof report per agent
src/  tests/           application code and tests
```

## Known limitations

See the pull request description for the full list. In short: five Low code review findings are left open (F-2 to F-6), the project was tested on Node 26 only (`engines` declares 18+), the UI checks (AC-3, AC-6, AC-11 and related) were confirmed manually, and the Jira project has no "In Review" status.