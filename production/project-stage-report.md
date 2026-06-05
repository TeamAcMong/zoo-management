# Project Stage Analysis

**Project**: Animal World Zoo — a slow, sustainable idle zoo-builder (mobile-first web)
**Date**: 2026-06-05
**Stage**: Pre-Production / Prototype
**Stage Confidence**: CONCERNS — strong, playable prototype and a detailed data model exist, but the formal studio artifacts (GDDs, architecture, sprints, tests) are entirely missing. Signals are split.

---

## What this project is

A React 18 + Babel-standalone browser game (no engine, no build step). The real
source lives in `act/` (18 `.jsx`, 3 `.css`, ~2,750 lines of JS/JSX, ~850 lines CSS),
shipped as four HTML builds (desktop / mobile, each with a standalone single-file
variant). The `Animal World Zoo.html` title is "Build Spec" — the app doubles as a
clickable prototype **and** an interactive design document.

- `data.jsx` — single source of truth: 5 care stats, 6 care actions, taming tiers,
  level/XP curve, economy. Genuinely a design spec in code form.
- `prototype.jsx` — playable phone shell: gold/gems/XP, owned animals, care loop,
  tabs (live / care / attractions / show / shop), tutorial, quest admin.
- `views-*.jsx` — build-spec screens for systems, ops, quests, training, UX, world, docs.

## Completeness Overview

| Domain | Est. | Notes |
|--------|------|-------|
| **Design** | ~35% | No GDDs in `design/gdd/` (0 files). BUT extensive design content is embedded in `data.jsx` and the `views-*` build-spec screens — it exists, just not in the studio's 8-section GDD format, and not cross-referenced in the entity registry. |
| **Code** | ~60% (prototype-grade) | Playable end-to-end care loop. Prototype architecture (large single `Phone` component, logic + data + UI co-located), lives in `act/` not `src/`. Good enough to validate the concept; not structured for production scale. |
| **Architecture** | ~5% | Only empty template scaffolds (`docs/architecture/tr-registry.yaml`, `design/registry/entities.yaml`). No ADRs, no architecture overview. |
| **Production** | ~0% | No sprint plans, milestones, or roadmap in `production/`. |
| **Tests** | 0% | No `tests/` directory. No automated coverage of the economy/care formulas (the highest-risk logic). |

## Gaps Identified (with clarifying questions)

1. **Design lives in code, not GDDs.** The mechanics are well-specified inside
   `data.jsx` + `views-*.jsx`, but there are no `design/gdd/*.md` documents the
   studio skills can read. → *Should I `/reverse-document` the prototype into formal
   GDDs (care system, economy, taming, attractions/shows, progression), or do you
   prefer to keep design-in-code as the source of truth?*

2. **No architecture decisions recorded.** It's a no-engine React/Babel app by
   choice. → *Should I capture that as the first ADR (`/architecture-decision`), so
   the "no build step / in-browser Babel" decision and its tradeoffs are documented?*

3. **Prototype vs. production code boundary.** Everything is in `act/`, outside the
   studio's `src/`. → *Is `act/` the permanent home (I'll point the rules/agents
   there), or do you intend to graduate it into `src/` with a real component split?*

4. **No tests on high-risk math.** The economy and care-decay formulas are the
   easiest things to break during balancing. → *Want a minimal test setup so the
   formulas in `data.jsx` are protected before we tune balance?*

5. **No production tracking.** → *Are you tracking work anywhere else, or should we
   start with a `/sprint-plan` for the next slice of work?*

## Recommended Next Steps (priority order)

1. **`/reverse-document`** — turn the in-code design into formal GDDs so every other
   studio skill (review, balance, stories) has something to read. Highest leverage.
2. **`/map-systems`** — build the systems index (care, economy, taming, attractions,
   shows, progression, quests) and their dependency order.
3. **`/architecture-decision`** — record the "vanilla React + in-browser Babel, no
   build" decision as ADR-001.
4. **`/balance-check`** — the economy is explicitly "months-long progression"; a
   balance pass on `data.jsx` would catch dead-ends and runaway curves early.
5. **`/sprint-plan new`** — once docs exist, plan the first slice (e.g., production-grade
   refactor of `act/` or the next feature).

> Note: this is a prototype with the design baked into code — so the single most
> valuable move is **reverse-documenting** to unlock the rest of the studio workflow.
