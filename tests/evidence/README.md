# Test Evidence — Animal World Zoo

This directory stores manual test evidence for Visual/Feel and UI story types.
Evidence files are required before a story can be marked Done.

## File Naming

```
[date]-[story-id]-[screen-or-system]-[verdict].md
Example: 2026-07-01-EPIC02-S03-care-screen-APPROVED.md
```

## Evidence Document Template

```markdown
# Test Evidence: [Story ID] — [Story Title]
**Date:** YYYY-MM-DD
**Tester:** [name or role]
**Story type:** Visual/Feel | UI | Config/Data
**Verdict:** APPROVED | APPROVED WITH CONDITIONS | REJECTED

## What was tested
[Description of the feature and the test performed]

## Screenshots
[Paste screenshot paths or describe what was captured]

## Acceptance criteria checked
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
[Any observations, known issues, or follow-up items]
```

## Verdict rules

- **APPROVED** — all acceptance criteria pass; story can be marked Done.
- **APPROVED WITH CONDITIONS** — minor visual issues noted; story can close
  with a follow-up task filed. Lead sign-off required.
- **REJECTED** — one or more acceptance criteria fail; story returns to In Progress.
