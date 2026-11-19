# Node.js coding rules

- Node 18+, CommonJS (`require`), Express for the API, vanilla HTML/JS in `src/public/`.
- Layout: `src/server.js` (routes), `src/store.js` (JSON file read/write),
  `src/calc.js` (pure functions for totals and renewal dates), `src/public/` (UI).
- Pure logic goes in `calc.js` so it is unit-testable without the server.
- Validate all input on the server: name non-empty, cost > 0, cycle is "monthly" or "yearly",
  date is a valid ISO date. Return 400 with `{ "error": "<message>" }` on invalid input.
- Return 404 for unknown ids. Never crash on a missing or corrupt `data/subscriptions.json`;
  create it or fall back to an empty list.
- Never use `eval`, never put user input in file paths, escape output in the UI (use `textContent`).
- Tests use `node:test` and `node:assert`, in `tests/`, run with `npm test`.
- Small functions, descriptive names, no commented-out code.