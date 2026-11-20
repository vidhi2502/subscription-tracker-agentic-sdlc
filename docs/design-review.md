# Design Review: SUBT-3

**Reviewed:** `docs/architecture.md` (stage 2) against `docs/requirements.md` (FR-1 to FR-12, NFR-1 to NFR-5, AC-1 to AC-14).
**Reviewer:** design-review-agent (stage 3). **Date:** 2026-11-20.

## Summary

The architecture covers every FR and NFR with a named component, and it follows the architecture template. The main risks are data integrity (a corrupt file is overwritten on the next write, and writes are not atomic or serialized), network exposure (the server binds to all interfaces with no auth), and under-specified rules (strict date validation, month-end roll-forward, input types). The architecture also has gaps in test isolation and AC coverage. All 14 findings are accepted and applied to `docs/architecture.md`. None requires a change to requirements.

## Findings

| ID | Severity | Issue | Decision |
|----|----------|-------|----------|
| DR-01 | High | A corrupt `subscriptions.json` is read as an empty list, so the next add or delete overwrites the user's data with no backup. | Accept. Before the first write over an unreadable file, copy it to `data/subscriptions.corrupt-<timestamp>.json`. The timestamp is server-generated, so no user input reaches the path. |
| DR-02 | Medium | Writes are not atomic. A crash mid-write leaves a half-written file, which reads as corrupt and empties the list. | Accept. Write to a temp file in `data/`, then `rename` over the target. |
| DR-03 | Medium | Add and delete are read-modify-write. Two overlapping requests can lose one update. | Accept. Serialize all store mutations through one promise queue in `store.js`. |
| DR-04 | Medium | Express listens on all interfaces by default. With no auth, any device on the LAN can read, add, or delete subscriptions. | Accept. Bind to `127.0.0.1` by default. Keep the host configurable only through an env var, not through request input. |
| DR-05 | Medium | "Valid ISO date" is not defined strictly. `new Date("2026-02-30")` rolls over, and `new Date("YYYY-MM-DD")` parses as UTC, which shifts "today" comparisons. | Accept. Require the regex `^\d{4}-\d{2}-\d{2}$` plus a round-trip check (year, month, day must match). Build local dates from components, never from `Date` string parsing. |
| DR-06 | Medium | Type checks are missing. A numeric `name` or a string cost such as `"199"` may throw in `.trim()` or pass silently. | Accept. Name must be a string, category (if present) must be a string, cost must be `typeof number` and finite. Any other type returns 400. |
| DR-07 | Low | Express's default error for malformed JSON is HTML, not `{ "error" }`. The default body limit is also implicit. | Accept. Add a JSON error middleware that returns 400 `{ "error" }` for parse errors and 500 `{ "error" }` for others, without stack traces. Set `express.json({ limit: "10kb" })`. |
| DR-08 | Medium | Month-end and leap-day roll-forward is unresolved (open question in stage 2). Iterating from the previous result drifts (31 Jan, then 28 Feb, then 28 Mar). Looping from a very old date is also slow. | Accept. Anchor on the stored date. Find the smallest n >= 0 such that anchor + n months (or years) is on or after today, computed arithmetically. Clamp the day to the last day of the target month. Examples: 31 Jan + 1 month = 28/29 Feb; 29 Feb + 1 year = 28 Feb. |
| DR-09 | Low | Yearly/12 produces fractions (e.g. 1000/12). Rounding order is unspecified. | Accept. Keep full precision in stored values and in totals. Round only for display, to 2 decimals, with the ₹ prefix. |
| DR-10 | Medium | Store and API tests would write to the real `data/subscriptions.json`. | Accept. `store.js` takes its file path from a factory argument (default: `data/subscriptions.json`). Tests pass a temp directory. The API is exported from `server.js` without listening, so tests can call it directly. |
| DR-11 | Medium | Several ACs have no test mapping: AC-1 and AC-4 (API success), AC-10 (no edit endpoint), AC-3 and AC-6 (UI rendering), AC-11 (no login). | Accept. Add API tests for POST 201, DELETE 200, and PUT/PATCH to an item path returning 404 (no edit endpoint). Assign AC-3, AC-6, and AC-11 to a manual smoke check in the verification stage. |
| DR-12 | Low | The data model says the file is "a JSON array", but the API section says `{ "subscriptions": [...] }`. The store does not define how a wrong shape is handled. | Accept. The file shape is `{ "subscriptions": [] }`. If the parsed value does not match that shape, treat it as corrupt (DR-01 backup, then empty list). |
| DR-13 | Low | Category may be whitespace-only, and name and category have no length limit, so a large body could bloat the file. | Accept. Trim category; empty after trim means unset. Limits: name 1 to 100 characters, category up to 50 characters, both 400 when exceeded. These limits are a design choice, not a requirement. |
| DR-14 | Low | The POST error table omits 500. If the write fails, the response must not be 201. | Accept. Add 500 `{ "error" }` for a failed write to the POST row. |

## Agreed Design Decisions

- Storage stays a single JSON file in `data/`, with no database (CLAUDE.md, FR-10, NFR-4).
- Ids are server-generated UUIDs. Clients never send ids (`crypto.randomUUID`).
- Renewal dates are stored as entered and never rewritten. Roll-forward is computed at read time (FR-8).
- "Today" is the server's local calendar day, passed into `calc.js` as a parameter.
- No edit endpoint and no auth endpoints (FR-9, FR-10).
- `DELETE` returns 200 `{ "ok": true }`. 204 would also be valid; 200 matches the AC-4 wording.
- `notes` and any unknown fields are dropped by a whitelist on POST (FR-2).
- Pure logic stays in `calc.js`; I/O stays in `store.js`; HTTP stays in `server.js` (NFR-5).
- Output is rendered with `textContent` only (NFR-2).

## Changes made to architecture.md

- Section 2: diagram shows the store queue and the backup file. Server bound to 127.0.0.1 (DR-04, DR-03).
- Section 3: Store responsibilities now cover atomic write, mutation queue, corrupt backup, and shape check (DR-01, DR-02, DR-03, DR-12). Server row covers input type checks, error middleware, and the localhost bind (DR-04, DR-06, DR-07). Calc row covers strict date rules and month-end clamp (DR-05, DR-08). Tests row adds AC mappings and temp-dir store tests (DR-10, DR-11).
- Section 4: added the date parsing rule and the atomic-write choice (DR-02, DR-05).
- Section 5: data model fixed to the `{ "subscriptions": [] }` file shape. Field rules added for name and category length, trimming, and date format (DR-05, DR-12, DR-13).
- Section 6: POST adds 500. Malformed JSON returns JSON 400. Body limit noted (DR-07, DR-14).
- Section 7: data flow steps updated for store queue, backup, and roll-forward arithmetic (DR-01, DR-03, DR-08).
- Section 8: the three open questions (corrupt overwrite, month-end rule, cost precision) are closed and moved to Agreed Decisions. Remaining open items are listed below.

## Open questions (not blocking)

- Should name and category limits (100 and 50 characters) be confirmed by the user? They are a reviewer proposal.
- Is a manual smoke check acceptable for AC-3, AC-6, and AC-11, or is a browser test wanted?
