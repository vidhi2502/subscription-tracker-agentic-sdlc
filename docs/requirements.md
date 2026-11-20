# Requirements

## Story SUBT-3: As a user, I want to track my recurring subscriptions so that I know how much I spend and what renews soon.
**Source:** Jira SUBT-3 (read via Atlassian MCP)
**Original description:** I pay for several subscriptions (streaming, gym, cloud tools). I want a simple web app where I can add my subscriptions, see my total spend, and know which ones are renewing soon.

### Clarifying Questions & Answers
| # | Question | Answer (from user) |
|---|----------|--------------------|
| 1 | Which fields should each subscription have? | Name, cost, billing cycle (monthly or yearly), next renewal date, and an optional category. No notes field. |
| 2 | How should the monthly total be calculated for yearly subscriptions? | Yearly cost divided by 12. All amounts in INR (₹), single currency. |
| 3 | What does "renewing soon" mean? | Fixed at 7 days, not configurable. |
| 4 | When a renewal date passes, should the app roll it forward automatically or does the user update it manually? | Roll forward automatically: if the stored renewal date has passed, the app calculates the next upcoming date from the billing cycle. The user does not update it manually. |
| 5 | Should the user be able to edit and delete subscriptions, or is add and view enough? | Add, view and delete only. Editing is out of scope for this story. |
| 6 | Is there a single user with no login, or is authentication needed? | Single local user, no login or authentication. |

### Functional Requirements
- FR-1: The user can add a subscription with a name, cost, billing cycle (`monthly` or `yearly`), next renewal date (ISO date), and an optional category.
- FR-2: The system does not store a notes field on subscriptions.
- FR-3: The user can view a list of all subscriptions with their name, cost, billing cycle, category (if set), and next renewal date.
- FR-4: The user can delete a subscription by id.
- FR-5: The system shows the total monthly spend in INR. Each monthly subscription contributes its cost; each yearly subscription contributes its cost divided by 12.
- FR-6: All amounts are stored and displayed in INR (₹) only. No currency selection.
- FR-7: The system shows the subscriptions renewing within the next 7 days (fixed window, not configurable). A renewal date equal to today is included; a date more than 7 days away is excluded.
- FR-8: When a stored renewal date is in the past, the system computes the next upcoming renewal date by adding the billing cycle (1 month for monthly, 1 year for yearly) until the date is today or later. The stored date is not required to be updated by the user.
- FR-9: The system does not provide editing of existing subscriptions.
- FR-10: The application has no login, user accounts, or authentication. It serves one local user.
- FR-11: The server rejects invalid input with HTTP 400 and `{ "error": "<message>" }`: name empty, cost not greater than 0, cycle not `monthly` or `yearly`, date not a valid ISO date.
- FR-12: Deleting or requesting an unknown subscription id returns HTTP 404.

### Non-Functional Requirements
- NFR-1 (reliability): Subscriptions persist in a JSON file under `data/`. If `data/subscriptions.json` is missing or corrupt, the app creates it or falls back to an empty list without crashing.
- NFR-2 (security): No `eval`. User input never forms a file path. Output is rendered with `textContent` to prevent injection.
- NFR-3 (usability): The add, list, total, and renewing-soon views are visible on one page in the vanilla HTML/JS UI, with no build step.
- NFR-4 (performance): Totals and renewal calculations for a single user's list (expected tens of items) complete without a perceptible delay.
- NFR-5 (maintainability): Pure calculation logic (totals, next renewal date, 7-day window) lives in `src/calc.js` and is unit-tested with `node:test` via `npm test`.

### Acceptance Criteria
- AC-1: Given the add form is filled with a valid name, cost > 0, cycle `monthly`, and a valid ISO date, When the user submits, Then the subscription is saved and appears in the list. (FR-1)
- AC-2: Given a subscription has a notes value sent in the request, When it is saved, Then no notes field is stored or shown. (FR-2)
- AC-3: Given one or more subscriptions exist, When the user opens the list, Then each shows name, cost, cycle, category if set, and next renewal date. (FR-3)
- AC-4: Given a subscription exists, When the user deletes it by id, Then it no longer appears in the list and the API returns success. (FR-4)
- AC-5: Given a monthly subscription of ₹199 and a yearly subscription of ₹1200, When the total is shown, Then the monthly total is ₹299 (199 + 1200/12 = 299). (FR-5)
- AC-6: Given amounts are shown anywhere in the UI, When the user views them, Then they are prefixed with ₹ and no other currency is offered. (FR-6)
- AC-7: Given subscriptions with renewal dates today, in 7 days, and in 8 days, When the renewing-soon view is shown, Then the first two appear and the third does not. (FR-7)
- AC-8: Given a yearly subscription whose stored renewal date was 2 months and 3 days ago, When the next renewal is calculated, Then the reported renewal date is the first yearly anniversary of that date on or after today. (FR-8)
- AC-9: Given a monthly subscription whose stored renewal date is in the past, When the app lists it, Then the displayed renewal date is the next upcoming monthly occurrence, not the stored past date. (FR-8)
- AC-10: Given the edit feature is absent, When the user views a subscription, Then no edit control is shown and no edit endpoint is exposed. (FR-9)
- AC-11: Given the app is started, When the user opens it, Then no login or sign-in prompt is shown. (FR-10)
- AC-12: Given a request with an empty name, cost of 0 or less, cycle `weekly`, or date `2026-13-45`, When submitted, Then the server returns 400 with an `error` message. (FR-11)
- AC-13: Given no subscription with id `999` exists, When a delete is requested for `999`, Then the server returns 404. (FR-12)
- AC-14: Given `data/subscriptions.json` is missing or contains invalid JSON, When the server starts or reads data, Then it does not crash and returns an empty list (creating the file if missing). (NFR-1)

### Out of Scope
- Editing an existing subscription (FR-9).
- Notes or any other extra field beyond name, cost, cycle, renewal date, and category.
- Currencies other than INR, and exchange rates.
- Configurable renewal-soon window.
- User accounts, login, and authentication.
- Manual roll-forward of renewal dates, reminders, notifications, and calendar export.
- Multi-user support and a database.

### Assumptions
- Yearly cost divided by 12 is the monthly equivalent used for the monthly total (user answer 2).
- Monthly and yearly renewal roll-forward uses calendar-month and calendar-year addition from the stored date; end-of-month edge cases follow the standard date library rule and are covered by unit tests.
- The optional category is free text; no predefined category list is required.
- Dates are handled in the server's local calendar day for "today" comparisons.
- The app runs locally for one user; no hosting or network security beyond local use is in scope.
