# Code Review

Story: SUBT-3. Branch: feature/subscription-tracker. Reviewed against docs/requirements.md, docs/architecture.md, docs/impl-plan.md. Date: 2026-11-20.

## Summary table (Area | Verdict | Evidence)

| Area | Verdict | Evidence |
|------|---------|----------|
| Correctness | PASS | Roll-forward and clamping in `src/calc.js` (`nextRenewalDate`, `addMonths`) match FR-8 and AC-8/AC-9. Monthly total `src/calc.js` `monthlyContribution`/`monthlyTotal` matches FR-5 (AC-5 = 299). 7-day window `src/calc.js` `renewingWithin` includes today and today+7, excludes today+8 (FR-7, AC-7). POST ignores `notes` (`src/calc.js` `toRecord`, FR-2). No edit route; PUT/PATCH fall to the `/api` 404 (`src/server.js` `createApp`, AC-10). |
| Security | PASS | `.gitignore` excludes `.env` and `data/`. Server binds `127.0.0.1` (`src/server.js` line 9). All input validated in `src/calc.js` `findValidationError` (name, cost, cycle, ISO date, category). UI renders server data with `textContent` only (`src/public/app.js` `createTextElement`). User input never forms a path (`src/server.js` DELETE passes id to a filter). No `eval`. See F-5. |
| Error Handling | PASS (after fix) | Missing or corrupt file handled in `src/store.js` (`readDocument`, `parseDocument`, `saveWithBackupIfCorrupt`). A stored record with an invalid cycle or date used to return 500 for the whole list. Fixed in F-1. JSON error middleware returns `{ "error" }` (`src/server.js` `errorHandler`). Unknown ids return 404 (`src/server.js` DELETE). |
| Test Coverage | PASS | 70 tests. Happy path, empty list (`tests/calc.test.js` `monthlyTotal([])`, `renewingWithin([])`), invalid date and impossible date (`tests/calc.test.js` lines 71-89), negative and zero cost (lines 54-57), missing and corrupt store (`tests/store.test.js`), API 201/400/404 (`tests/api.test.js`). Invalid stored record added in F-1 (`tests/store.test.js`, `tests/api.test.js` "API with an invalid stored record"). Gaps in F-6. |
| Code Clarity | PASS | Names are descriptive and functions are small. Low items: F-3 (`src/calc.js` `findValidationError` ends with a redundant `|| null`), F-4 (`tests/calc.test.js` lines 186-191 test name does not match its assertion). |
| DRY Principle | PASS | One Low duplication: F-2 (`src/public/app.js` `renderSubscriptionItem` and `renderRenewingItem` repeat the span construction). Store load-and-save is shared through `loadDocument` and `saveWithBackupIfCorrupt`. |
| Dependency Safety | PASS | `npm audit`: 0 vulnerabilities. Only runtime dependency is `express@^4.22.3`. |

## Findings (ID, severity High/Med/Low, file:line, issue, fix)

| ID | Severity | File:line | Issue | Fix | Status |
|----|----------|-----------|-------|-----|--------|
| F-1 | High | `src/store.js` `parseDocument` (before fix: lines 25-31); surfaced by `src/calc.js` `addMonths`/`renewingWithin` via `src/server.js` GET routes | One stored record with `cycle: "weekly"` or `renewalDate: "2026-02-30"` made `GET /api/subscriptions` and `GET /api/summary` return 500 for the whole list. The UI cannot render, so the user cannot see or delete the bad row. Violates NFR-1 and AC-14 ("does not crash"). Reproduced with a scratch store. | Records that fail `calc.findValidationError` or lack a string `id` are dropped on read. The file is then flagged corrupt, so it is copied to a backup before the next write. Regression tests added in `tests/store.test.js` and `tests/api.test.js`. | Fixed |
| F-2 | Low | `src/public/app.js` `renderSubscriptionItem` and `renderRenewingItem` | Span-building code is repeated. | Extract a `renderField` helper. | Open (below High, not fixed) |
| F-3 | Low | `src/calc.js` `findValidationError` | Redundant `|| null` at the end of the `||` chain. | Remove it. | Open (below High, not fixed) |
| F-4 | Low | `tests/calc.test.js` lines 186-191 | Test "keeps 29 February in a leap target year after the anniversary" asserts a non-leap result (2027-02-28) on its first line. The name does not match the assertion. | Rename the test or fix the assertions. | Open (below High, not fixed) |
| F-5 | Low | `src/server.js` `createApp` | No `Host` header check. DNS rebinding could let a web page reach the local, unauthenticated API. Authentication is out of scope (FR-10); the risk is local-only. | Reject unexpected `Host` values, or accept the risk and record it. | Open (below High, not fixed) |
| F-6 | Low | `tests/calc.test.js`, `tests/api.test.js` | No test for yearly subscriptions in `renewingWithin`. No automated UI test (manual smoke check per architecture section 8). | Add the yearly window case. Decide whether a browser test is wanted. | Open (below High, not fixed) |

No Medium findings were raised.

## Fixes applied (what changed after review)

- `src/store.js`: added `isStoredRecord` (uses `calc.findValidationError` and checks `id` is a string). `parseDocument` now filters out invalid records and marks the document corrupt when any were dropped. The existing backup-before-write path then preserves the original file.
- `tests/store.test.js`: new test "skips invalid records, keeps valid ones, and backs up the file before the next write".
- `tests/api.test.js`: new `describe('API with an invalid stored record')` block. GET list and summary return 200 against a file with an invalid date.
- Verified by re-running the probe against a scratch store: list and summary now return 200 and show the valid record.
- `npm test` after fix: 70 tests, 70 pass, exit 0.

## Final verdict

PASS. The one High finding (F-1) is fixed and covered by regression tests. No Medium findings. Low items F-2 to F-6 are open and do not block the PR. `npm audit` reports 0 vulnerabilities.
