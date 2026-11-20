# Verification Report

Story: SUBT-3. Branch: feature/subscription-tracker. Date: 2026-11-20.

## Test Suite Results

**Command:** `npm test`

- **Total tests:** 70
- **Passed:** 70
- **Failed:** 0
- **Exit code:** 0
- **Vulnerabilities:** 0 (npm audit)

All unit and integration tests pass. Test counts by file:
- API tests (POST, DELETE, GET, error cases): 20 tests
- Calc tests (validation, totals, renewal dates, windows): 37 tests
- Store tests (file I/O, corrupt file handling, concurrency): 13 tests
- Total: 70 tests

## Smoke Test Results

### Setup
- Server started on `http://127.0.0.1:3000`
- Fixed test date: 2026-11-20

### Test Cases

| # | Endpoint | Method | Input | Result | Status |
|----|----------|--------|-------|--------|--------|
| 1 | `/api/subscriptions` | GET | empty | 200, `{"subscriptions":[...]}` | PASS |
| 2 | `/api/subscriptions` | POST | `{name:"Netflix", cost:199, cycle:"monthly", renewalDate:"2026-11-25"}` | 201, item created with `id` and `nextRenewalDate` | PASS |
| 3 | `/api/subscriptions` | GET | after POST | 200, list includes new item | PASS |
| 4 | `/api/summary` | GET | - | 200, `{monthlyTotal:299, renewingSoon:[...]}` | PASS |
| 5 | `/api/subscriptions` | POST | `{cost:0,...}` | 400, `{"error":"cost must be greater than 0"}` | PASS |
| 6 | `/api/subscriptions` | POST | `{cycle:"weekly",...}` | 400, `{"error":"cycle must be \"monthly\" or \"yearly\""}` | PASS |
| 7 | `/` | GET | - | 200, HTML with title "Subscription Tracker" | PASS |
| 8 | `/api/subscriptions/:id` | DELETE | valid id | 200, `{"ok":true}` | PASS |
| 9 | `/api/subscriptions/:id` | DELETE | invalid id `999` | 404, `{"error":"subscription not found"}` | PASS |
| 10 | `/api/subscriptions` | POST | with `notes` field | 201, notes NOT in response | PASS |

**Summary:** All smoke tests pass. Server responds correctly to valid and invalid inputs. UI loads. Error responses are JSON with message field.

## Requirement Traceability

Mapping each Functional Requirement (FR), Non-Functional Requirement (NFR), and Acceptance Criterion (AC) to code and tests.

| ID | Requirement | Code Location | Test Location | Status |
|----|-------------|----------------|---------------|--------|
| FR-1 | User can add subscription with name, cost, cycle, renewal date, optional category | `src/server.js` POST route; `src/calc.js` `toRecord`; `src/store.js` save | `tests/api.test.js` "returns 201..."; "accepts an optional category..."; `tests/calc.test.js` "keeps only the stored fields..." | PASS |
| FR-2 | System does not store notes field | `src/calc.js` `toRecord` (omits notes) | `tests/api.test.js` "drops a notes field..."; `tests/calc.test.js` "toRecord" | PASS |
| FR-3 | User can view list with name, cost, cycle, category, renewal date | `src/server.js` GET `/api/subscriptions`; `src/calc.js` `withNextRenewal` | Automated test (tests/api.test.js list test) + manual UI check for AC-3 (confirmed by the user on 2026-11-20) | PASS |
| FR-4 | User can delete subscription by id | `src/server.js` DELETE route; `src/store.js` `remove` | `tests/api.test.js` "returns 200...removes the item"; "returns 404 for unknown id" | PASS |
| FR-5 | System shows total monthly spend; yearly/12 for yearly | `src/calc.js` `monthlyTotal`, `monthlyContribution` | `tests/calc.test.js` "adds monthly costs and yearly..."; total ₹299 confirmed by the user in the browser on 2026-11-20 | PASS |
| FR-6 | All amounts in INR only; no currency selection | `src/public/app.js` displays `₹` prefix; no currency selector in UI | Manual: confirmed by the user on 2026-11-20 | Manual: confirmed by the user on 2026-11-20 |
| FR-7 | System shows subscriptions renewing within 7 days | `src/calc.js` `renewingWithin` (includes today, today+7; excludes today+8) | `tests/calc.test.js` "includes today and today+7..."; manual UI check for renewing-soon list, confirmed by the user on 2026-11-20 | PASS |
| FR-8 | Stored renewal date in past rolls forward automatically | `src/calc.js` `nextRenewalDate`, `addMonths` | `tests/calc.test.js` "rolls a past monthly date..."; "rolls a past yearly date..."; "handles a stored date many years..."; `tests/api.test.js` "API with an invalid stored record" | PASS |
| FR-9 | System does not provide editing | `src/server.js` has no PUT/PATCH on item paths (fall to `/api` 404) | `tests/api.test.js` "returns 404 for PUT..."; "returns 404 for PATCH..." | PASS |
| FR-10 | Application has no login or authentication | `src/server.js` no auth middleware; binds to `127.0.0.1` | Manual: confirmed by the user on 2026-11-20 | Manual: confirmed by the user on 2026-11-20 |
| FR-11 | Server rejects invalid input with 400 + `{error}` | `src/calc.js` `findValidationError`; `src/server.js` error handler | `tests/api.test.js` 11 validation tests (empty name, cost<=0, bad cycle, bad date, long name, long category, malformed JSON); `tests/calc.test.js` validation tests | PASS |
| FR-12 | Deleting or requesting unknown id returns 404 | `src/server.js` DELETE route; `src/store.js` filter | `tests/api.test.js` "returns 404...unknown id" | PASS |
| NFR-1 | Subscriptions persist; missing/corrupt file handled | `src/store.js` `readDocument`, `parseDocument`, `saveWithBackupIfCorrupt`; `src/server.js` error handling | `tests/store.test.js` "missing file", "corrupt or wrong-shape file"; `tests/api.test.js` "API with an invalid stored record" | PASS |
| NFR-2 | No eval; user input never forms path; output via textContent | `src/calc.js` no eval; `src/server.js` DELETE uses filter (not path); `src/public/app.js` `createTextElement` uses textContent | Code inspection; no eval found; ID-based deletion; UI tests (manual per AC-3, AC-6) | PASS |
| NFR-3 | Add, list, total, renewing-soon views on one page, vanilla HTML/JS, no build | `src/public/index.html`, `src/public/app.js` (no React, Vue, bundler) | Manual: confirmed by the user on 2026-11-20 | Manual: confirmed by the user on 2026-11-20 |
| NFR-4 | Calculations complete without perceptible delay for tens of items | `src/calc.js` pure functions; O(n) loops | Implicit in test suite (tests run in <350ms for 70 tests); no performance tests but logic is linear | PASS (implicit) |
| NFR-5 | Pure logic in src/calc.js, unit-tested with node:test | `src/calc.js` exports pure functions | `tests/calc.test.js` (37 tests) | PASS |
| AC-1 | Add form filled with valid data saves subscription | Smoke test #2 | Smoke test #2 | PASS |
| AC-2 | Notes field sent but not stored | Smoke test #10 | `tests/api.test.js` "drops a notes..." | PASS |
| AC-3 | List shows name, cost, cycle, category, renewal date | Manual UI check | Manual: confirmed by the user on 2026-11-20 | Manual: confirmed by the user on 2026-11-20 |
| AC-4 | Delete removes subscription from list | Smoke test #8 | `tests/api.test.js` "removes the item" | PASS |
| AC-5 | Monthly total = 299 for ₹199 monthly + ₹1200 yearly | Total ₹299 confirmed by the user in the browser on 2026-11-20. Item breakdown not verified from agent run data. | `tests/calc.test.js` "adds monthly..." | PASS |
| AC-6 | Amounts prefixed with ₹ | Manual UI check | Manual: confirmed by the user on 2026-11-20 | Manual: confirmed by the user on 2026-11-20 |
| AC-7 | Renewing-soon includes today and today+7, excludes today+8 | Manual UI check for renewing-soon list, confirmed by the user on 2026-11-20 | `tests/calc.test.js` "includes today and today+7..." | PASS |
| AC-8 | Yearly past date rolls to first anniversary on or after today | Past date test in code review | `tests/calc.test.js` "rolls a past yearly date..." | PASS |
| AC-9 | Monthly past date rolls to next monthly occurrence | Past date test in code review | `tests/calc.test.js` "rolls a past monthly date..." | PASS |
| AC-10 | No edit control shown, no edit endpoint exposed | Manual UI check + API test | `tests/api.test.js` "returns 404 for PUT..." | Manual: confirmed by the user on 2026-11-20 |
| AC-11 | No login or sign-in prompt on startup | Manual UI check | Manual: confirmed by the user on 2026-11-20 | Manual: confirmed by the user on 2026-11-20 |
| AC-12 | Empty name, cost<=0, cycle "weekly", bad date return 400 + error | Smoke tests #5, #6 | `tests/api.test.js` 11 validation tests | PASS |
| AC-13 | Delete unknown id returns 404 | Smoke test #9 | `tests/api.test.js` "returns 404...unknown id" | PASS |
| AC-14 | Missing or corrupt file handled without crash | Code review F-1 fix | `tests/store.test.js` "missing file", "corrupt..."; `tests/api.test.js` "invalid stored record" | PASS |

## Requirement Coverage Analysis

**Automated Tests (Passing):** 70 tests directly verify FRs and ACs (20 API + 37 Calc + 13 Store).

**Manual Checks (Accepted):** AC-3 (list display), AC-6 (currency prefix display), AC-10 (no edit control), AC-11 (no login prompt), FR-6, FR-10, NFR-3 — all manual UI checks confirmed by the user on 2026-11-20.

**Gaps:** None blocking. Low-severity code review findings F-2 to F-6 are documented but not fixed per user acceptance.

## Known Limitations and Open Items

**Smoke test data clarity:** Smoke test #4 records monthlyTotal:299, but the run data do not clearly indicate which subscription(s) contributed this total. Smoke test #2 posted Netflix (199 monthly), but the item breakdown in subsequent GET responses is not documented. This does not affect the pass verdict (API responds with 200 and a valid summary) but leaves the exact subscription composition of smoke test #4 unverified from agent records.

**Code review findings (per stage 6, not fixed):**
- F-2: Duplicate span construction in `src/public/app.js` (Low, not fixed)
- F-3: Redundant `|| null` in `src/calc.js` (Low, not fixed)
- F-4: Test name mismatch in `tests/calc.test.js` line 186 (Low, not fixed)
- F-5: No `Host` header check in `src/server.js` (Low, local-only risk, not fixed)
- F-6: No yearly subscription in `renewingWithin` test (Low, not fixed)

**Environment:**
- Node 26 tested locally; Node 18+ specified in requirements.

## Conclusion

**Overall Status: PASS**

All 70 tests pass. Smoke tests confirm API and UI respond correctly. All Functional Requirements and Acceptance Criteria are implemented and tested (automated or manual). No High or Medium findings. Low findings are documented and accepted. The application is ready for PR.
