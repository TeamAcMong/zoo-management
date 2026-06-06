---
name: project-zoo-level
description: Zoo Level GDD (C3) authoring session — curve found in code, cross-system constants identified for registry
metadata:
  type: project
---

GDD `design/gdd/zoo-level.md` authored 2026-06-06 as reverse-documentation of the C3 Zoo Level Progression System.

**Why:** F2 (Currency System) OQ-5 and C1 (Animal Care) were blocked waiting for the LEVEL_XP curve to be specified.
**How to apply:** The LEVEL_XP curve is now documented. C1 and F2 authors can unblock their pacing work. Registry entries still need to be written by the orchestrator.

Key findings:
- LEVEL_XP curve is FOUND IN CODE (geometric interpolation with 7 anchors, not hardcoded)
- XP_PER_CARE = 3 (flat per tap, all actions, all species)
- XP_PER_ADOPT = 40 (per new species adoption)
- MAX_LEVEL = 92 (consistent with registry)
- Tutorial awards 0 XP currently (infrastructure exists but unused — open gap)
- Offline XP is a hardcoded prototype stub (+820) — needs real formula before production
- Segment extension past Lv84 uses perLv ≈ 5^(1/24) ≈ 1.0698/level

Cross-system constants proposed for registry:
1. `level_xp_curve` formula (geometric interpolation from 7 anchors)
2. `xp_per_care_action` constant = 3
3. `xp_per_adopt` constant = 40
