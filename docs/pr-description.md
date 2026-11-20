# feat: subscription tracker app (SUBT-3)

## Summary
Built a single-user web app to track recurring subscriptions with monthly spend totals and renewal alerts. Users can add subscriptions (name, cost, billing cycle, renewal date, optional category), view a list with auto-rolling renewal dates, delete subscriptions, and see monthly spend and upcoming renewals in 7 days. All data persists to JSON; no database or authentication required.

## Changes Made
- `src/server.js` : Express app with routes for POST (add), GET (list), DELETE (remove), error handling, and static UI serving
- `src/calc.js` : Pure functions for validation, monthly totals, renewal date roll-forward, and 7-day renewal window; unit-testable without server
- `src/store.js` : JSON file storage with error recovery; creates file if missing, backs up corrupt files, handles concurrent writes
- `src/public/index.html` : Vanilla HTML form for add subscription, list display, monthly total, and renewing-soon alert
- `src/public/app.js` : Vanilla JavaScript frontend; fetches from `/api/subscriptions` and `/api/summary`, renders UI, handles delete
- `src/public/styles.css` : Basic styling for form, list, and alerts
- `tests/calc.test.js` : 37 unit tests covering validation, totals (monthly/yearly), date roll-forward, 7-day window, leap years, past dates
- `tests/api.test.js` : 20 API tests for POST/DELETE/GET, 400/404 error responses, notes rejection, category handling, missing/corrupt store recovery
- `tests/store.test.js` : 13 tests for file I/O, missing/corrupt file handling, backup on write, concurrent writes, invalid record filtering
- `package.json` : Express 4.22.3 as runtime dependency; Node 18+ engines
- `.gitignore` : Excludes `.env` and `data/` directory

## Test Evidence
```
> subscription-tracker@1.0.0 test
> node --test

▶ API
  ▶ POST /api/subscriptions
    ✔ returns 201 with the stored item, id and nextRenewalDate (38.6479ms)
    ✔ drops a notes field and does not store it (4.8069ms)
    ✔ accepts an optional category and trims it (3.3833ms)
    ✔ returns 400 with an error for an empty name (1.7256ms)
    ✔ returns 400 for a numeric name (1.4885ms)
    ✔ returns 400 for a cost of 0 or less (2.5661ms)
    ✔ returns 400 for a cost sent as a string (1.2369ms)
    ✔ returns 400 for a cycle other than monthly or yearly (1.6095ms)
    ✔ returns 400 for an invalid calendar date (1.4782ms)
    ✔ returns 400 for a name longer than 100 characters (1.1256ms)
    ✔ returns 400 for a category longer than 50 characters (1.0182ms)
    ✔ returns 400 with an error for malformed JSON (1.6983ms)
  ✔ POST /api/subscriptions (61.7128ms)
  ▶ DELETE /api/subscriptions/:id
    ✔ returns 200 with ok true and removes the item (8.6088ms)
    ✔ returns 404 with an error for an unknown id (0.9979ms)
  ✔ DELETE /api/subscriptions/:id (9.7623ms)
  ▶ no edit endpoint
    ✔ returns 404 for PUT on an item path (2.445ms)
    ✔ returns 404 for PATCH on an item path (0.9362ms)
  ✔ no edit endpoint (3.534ms)
  ▶ GET endpoints
    ✔ returns the list with nextRenewalDate for each item (1.2695ms)
    ✔ returns the monthly total and renewing-soon list in the summary (3.2614ms)
  ✔ GET endpoints (4.6772ms)
  ▶ unknown API paths
    ✔ returns a JSON 404 for an unknown API path (1.083ms)
  ✔ unknown API paths (1.2043ms)
✔ API (92.7549ms)
▶ API with an invalid stored record
  ✔ still returns the list and summary without a server error (5.9153ms)
✔ API with an invalid stored record (8.5804ms)
▶ findValidationError
  ✔ accepts a valid subscription (2.1336ms)
  ✔ accepts a yearly subscription with a category (0.2778ms)
  ✔ rejects a non-object body (0.2024ms)
  ✔ rejects an empty or whitespace-only name (0.1426ms)
  ✔ rejects a numeric name (0.1243ms)
  ✔ rejects a name longer than 100 characters (0.1184ms)
  ✔ accepts a name of exactly 100 characters (0.1369ms)
  ✔ rejects a cost of zero or less (0.1304ms)
  ✔ rejects a cost sent as a string or a non-finite number (0.2752ms)
  ✔ rejects a cycle other than monthly or yearly (0.2728ms)
  ✔ rejects dates that are not strict YYYY-MM-DD (0.1431ms)
  ✔ rejects impossible calendar dates (1.2144ms)
  ✔ accepts 29 February only in leap years (0.227ms)
  ✔ rejects a category that is not a string (0.1266ms)
  ✔ rejects a category longer than 50 characters (0.1236ms)
✔ findValidationError (7.5416ms)
▶ toRecord
  ✔ keeps only the stored fields and trims name and category (0.771ms)
  ✔ omits category when it is empty after trimming (0.0975ms)
  ✔ omits category when it is not provided (0.0699ms)
✔ toRecord (1.1019ms)
▶ monthlyTotal
  ✔ adds monthly costs and yearly costs divided by 12 (0.1364ms)
  ✔ returns 0 for an empty list (0.0582ms)
  ✔ does not round the yearly contribution (0.0953ms)
✔ monthlyTotal (0.398ms)
▶ nextRenewalDate
  ✔ keeps a renewal date that is today or in the future (0.3314ms)
  ✔ rolls a past monthly date forward to the next monthly occurrence (0.1289ms)
  ✔ rolls a past yearly date to the first anniversary on or after today (0.0985ms)
  ✔ anchors on the stored date, not the previous result (0.1212ms)
  ✔ clamps 31 January to the last day of February (0.0887ms)
  ✔ clamps 31 January to the last day of February in a leap year (0.0825ms)
  ✔ keeps day 30 when the target month has 30 days (0.0826ms)
  ✔ rolls 29 February yearly to 28 February in a non-leap year (0.1313ms)
  ✔ keeps 29 February in a leap target year after the anniversary (0.095ms)
  ✔ handles a stored date many years in the past (0.1638ms)
✔ nextRenewalDate (1.6519ms)
▶ withNextRenewal
  ✔ adds nextRenewalDate to each item without changing renewalDate (0.2051ms)
✔ withNextRenewal (0.3274ms)
▶ renewingWithin
  ✔ includes today and today+7 and excludes today+8 (0.263ms)
  ✔ uses the rolled-forward date when the stored date is in the past (0.102ms)
  ✔ excludes past-due items whose next renewal is outside the window (0.2155ms)
  ✔ returns an empty list when nothing renews soon (0.0926ms)
✔ renewingWithin (0.8419ms)
▶ parseIsoDate
  ✔ returns parts for a valid date and null for an invalid one (0.1015ms)
✔ parseIsoDate (0.1825ms)
▶ store
  ▶ missing file
    ✔ returns an empty list and creates the file and its directory (13.0778ms)
  ✔ missing file (13.8624ms)
  ▶ corrupt or wrong-shape file
    ✔ returns an empty list for unparseable JSON without throwing (2.4256ms)
    ✔ returns an empty list for a document without a subscriptions array (1.8723ms)
    ✔ returns an empty list for a top-level array (1.757ms)
    ✔ copies a corrupt file to a timestamped backup before the next write (9.2923ms)
    ✔ backs up a wrong-shape file before the next write (4.5393ms)
    ✔ skips invalid records, keeps valid ones, and backs up the file before the next write (4.981ms)
  ✔ corrupt or wrong-shape file (25.437ms)
  ▶ add, list and remove
    ✔ adds a record and lists it (3.713ms)
    ✔ removes a record by id and returns true (5.2495ms)
    ✔ returns false and leaves data unchanged when the id is unknown (5.1063ms)
    ✔ does not leave temporary files behind after a write (3.9241ms)
  ✔ add, list and remove (18.4171ms)
  ▶ serialized mutations
    ✔ keeps every concurrent add when they are issued together (22.2857ms)
  ✔ serialized mutations (22.4938ms)
  ▶ default location
    ✔ points at data/subscriptions.json under the project root (0.7442ms)
  ✔ default location (0.8442ms)
✔ store (81.7113ms)
ℹ tests 70
ℹ suites 20
ℹ pass 70
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 296.2461

npm audit results:
found 0 vulnerabilities
```

## Known Limitations
- **Code review low findings (not fixed per user acceptance):** Duplicate span construction in `src/public/app.js` (F-2), redundant `|| null` in `src/calc.js` (F-3), test name mismatch in `tests/calc.test.js` (F-4), no Host header check in `src/server.js` (F-5, local-only risk), no yearly subscription in renewingWithin test (F-6).
- **Request body size limit:** Requests over 10 KB return 413 Payload Too Large (Express default).
- **Node version:** Node 26 tested locally; package.json engines field declares Node 18+ for broader support.
- **Manual verification:** The ₹299 total is confirmed in the browser by the user but item breakdown from run data is not documented. Manual UI checks (AC-3, AC-6, AC-10, AC-11) confirmed by the user on 2026-11-20.
- **Name and category limits:** 100-character name and 50-character category limits confirmed by the user.
- **No editing:** Subscriptions cannot be edited; delete and re-add if needed.

## Reviewer Checklist
- [ ] Requirements in docs/requirements.md are met
- [ ] Tests pass locally (70 pass, 0 fail, npm audit 0 vulnerabilities)
- [ ] No secrets in the diff (.env and data/ are in .gitignore)
- [ ] Error handling reviewed (400/404 responses, corrupt file recovery)
- [ ] Docs and CHANGELOG updated

🤖 Generated with [Claude Code](https://claude.com/claude-code)
