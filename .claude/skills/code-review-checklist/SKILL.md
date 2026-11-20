---
name: code-review-checklist
description: Checklist for structured code review before a PR. Use when reviewing implementation against requirements.md.
---

# Code review checklist

Produce `docs/code-review.md`. Evaluate every area below and give each a verdict
(PASS / ISSUE) with evidence (file and line).

| Area | Question |
|------|----------|
| Correctness | Does each component behave as specified in requirements.md? |
| Security | Are secrets excluded? Is user input validated and sanitised? |
| Error Handling | Are bad input, missing/corrupt data file, and not-found cases handled gracefully? |
| Test Coverage | Do tests cover the happy path AND edge cases (empty list, invalid date, negative cost)? |
| Code Clarity | Are names self-explanatory? Is the logic easy to follow? |
| DRY Principle | Is any logic duplicated that should be a shared function? |
| Dependency Safety | Does `npm audit` flag any vulnerable package? |

Output format:
```
# Code Review
## Summary table (Area | Verdict | Evidence)
## Findings (ID, severity High/Med/Low, file:line, issue, fix)
## Fixes applied (what changed after review)
## Final verdict
```

Rules:
- Run `npm audit` and quote the result.
- High-severity findings must be fixed before the verdict can be PASS.