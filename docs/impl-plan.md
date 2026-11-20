# Implementation Plan

| # | Task | Depends on | Priority | Requirements covered | Jira key |
|---|------|-----------|----------|----------------------|----------|
| 1 | Set up package.json and project structure | - | P0 | NFR-5 | [SUBT-4](https://mittalvidhi2004.atlassian.net/browse/SUBT-4) |
| 2 | Implement store.js (JSON file I/O with queue and backup) | 1 | P0 | NFR-1, FR-1, FR-3, FR-4 | [SUBT-5](https://mittalvidhi2004.atlassian.net/browse/SUBT-5) |
| 3 | Implement calc.js (validation, totals, renewal roll-forward, 7-day filter) | 1 | P0 | FR-1, FR-5, FR-7, FR-8, FR-11 | [SUBT-6](https://mittalvidhi2004.atlassian.net/browse/SUBT-6) |
| 4 | Implement server.js (Express routes, input validation, error handling) | 2, 3 | P0 | FR-1 to FR-12, NFR-2 | [SUBT-7](https://mittalvidhi2004.atlassian.net/browse/SUBT-7) |
| 5 | Implement public/index.html and public/app.js (UI, forms, list, totals, renewing-soon) | 4 | P0 | FR-1 to FR-7, FR-9, FR-10, NFR-3 | [SUBT-8](https://mittalvidhi2004.atlassian.net/browse/SUBT-8) |
| 6 | Write tests for calc.js (unit tests: validation, totals, roll-forward, 7-day window, month-end, leap-year) | 3 | P1 | AC-5, AC-7, AC-8, AC-9, NFR-5 | [SUBT-9](https://mittalvidhi2004.atlassian.net/browse/SUBT-9) |
| 7 | Write tests for store.js (missing, corrupt, wrong-shape files; temp directory isolation) | 2 | P1 | AC-14, NFR-1 | [SUBT-10](https://mittalvidhi2004.atlassian.net/browse/SUBT-10) |
| 8 | Write tests for API (POST 201, DELETE 200, 400 cases, 404 for unknown id, notes dropped, no edit endpoint) | 4 | P1 | AC-1, AC-2, AC-4, AC-10, AC-12, AC-13 | [SUBT-11](https://mittalvidhi2004.atlassian.net/browse/SUBT-11) |

## Blocked tasks

None. All tasks have their dependencies available or are non-blocking (tests depend on implementation but can be written in parallel).

## Test plan

**calc.js tests:**
- Validate subscription: empty name, cost <= 0, cycle not monthly/yearly, invalid date format, invalid calendar date (e.g. 2026-02-30), over-long name/category.
- Monthly total: ₹199 monthly + ₹1200 yearly = ₹299 monthly (1200/12).
- Renewing soon (7-day window): today (included), today+7 (included), today+8 (excluded).
- Next renewal (roll-forward): past renewal, monthly cycle, yearly cycle, month-end cases (31 Jan + 1 month = 28/29 Feb), leap-year cases (29 Feb + 1 year = 28 Feb).

**store.js tests:**
- Missing file: create it with empty list.
- Corrupt JSON: read as empty list, copy to corrupt-<timestamp> backup before next write.
- Wrong shape (not `{ "subscriptions": [] }`): treat as corrupt.
- Add and delete in temp directory, no interaction with real `data/`.

**API tests:**
- POST with valid data: 201, returns item with id and nextRenewalDate.
- POST with notes field: 201, notes dropped from stored item.
- POST with invalid types (numeric name, string cost): 400 with error.
- POST with empty name, cost <= 0, cycle not monthly/yearly, invalid date: 400 with error.
- POST with over-long name/category: 400 with error.
- DELETE with valid id: 200 with `{ "ok": true }`.
- DELETE with unknown id: 404 with error.
- PUT/PATCH to item path: 404 (no edit endpoint).
- Malformed JSON in request: 400 with error.

**Manual smoke check (verification stage):**
- Add form renders and accepts valid input (AC-1).
- List shows subscriptions with name, cost (₹), cycle, category, renewal date (AC-3).
- Total shows ₹ prefix (AC-6).
- No login screen (AC-11).
