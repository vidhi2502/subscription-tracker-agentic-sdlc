---
name: pr-template
description: Template for the pull request description. Use when creating the final PR, including changelog and reviewer checklist.
---

# PR description template

Produce `docs/pr-description.md` with ALL of these sections:

```
# <type>: <title> (<story key>)

## Summary
2-3 sentences: what was built and why.

## Changes Made
- `path/file` : reason (list every file added or modified)

## Test Evidence
Paste the actual test run output (and npm audit result).

## Known Limitations
Anything out of scope or not implemented.

## Reviewer Checklist
- [ ] Requirements in docs/requirements.md are met
- [ ] Tests pass locally
- [ ] No secrets in the diff
- [ ] Error handling reviewed
- [ ] Docs and CHANGELOG updated
```

Also add a `CHANGELOG.md` entry:
```
## [Unreleased]
### Added
- ...
```

Rules:
- Test Evidence must be real output, never invented.
- Link the Jira story key in the title.