# Project Status & Handoff — Animal World Zoo

> **Committed handoff doc** — unlike `production/session-state/active.md` (gitignored),
> this file travels with the repo so you can resume on another machine.
> **Last updated:** 2026-06-06 · **Stage:** Pre-Production

---

## TL;DR — where the project is

- **Game:** Animal World Zoo — casual idle zoo-builder, mobile-first.
- **Engine pivot:** was a React/web prototype (`act/*.jsx`, now *reference only*) → **shipping target is Unity 6.3 LTS (`6000.3.17f1`), URP 2D, C#.**
- **Current stage:** **Pre-Production** (passed the Technical Setup → Pre-Production gate on 2026-06-06).
- **Next action:** build the **vertical slice** per `prototypes/animal-world-zoo-vertical-slice/PLAN.md`.

---

## What's done ✅

| Area | Artifact | Location |
|---|---|---|
| Game design | 13 MVP GDDs + systems index + cross-review | `design/gdd/` |
| Doc consistency | consistency report + cross-GDD review | `docs/consistency-report-2026-06-06.md`, `design/gdd/gdd-cross-review-2026-06-06.md` |
| Engine config | Unity 6.3 LTS pinned; tech-prefs rewritten | `CLAUDE.md`, `.claude/docs/technical-preferences.md`, `docs/engine-reference/unity/VERSION.md` |
| Architecture | master doc + **10 ADRs (all Accepted)** | `docs/architecture/architecture.md`, `docs/architecture/ADR-0001..0010-*.md` |
| Traceability | TR registry (51 TRs) + matrix (COVERED) | `docs/architecture/tr-registry.yaml`, `docs/architecture/traceability-matrix.md` |
| Control manifest | programmer rules sheet | `docs/architecture/control-manifest.md` |
| Art | Art Bible (9 sections) | `design/art/art-bible.md` |
| UX | interaction patterns + accessibility | `design/ux/interaction-patterns.md`, `design/ux/accessibility-requirements.md` |
| Tests/CI | Unity Test Framework + CI (green 5/5) | `Assets/Tests/EditMode/`, `.github/workflows/tests.yml` |
| Gate | PASS report | `production/gate-checks/gate-technical-setup-to-pre-production-2026-06-06.md` |
| Vertical slice | build PLAN (not yet coded) | `prototypes/animal-world-zoo-vertical-slice/PLAN.md` |

---

## What's next (Pre-Production sequence)

1. **Build the vertical slice** — follow `prototypes/animal-world-zoo-vertical-slice/PLAN.md` day by day. Start: `GameState.cs` + `CareService.cs` in `Assets/VerticalSlice/`. Update the PLAN's Velocity Log daily.
2. **Playtest** the slice (≥1 documented session) → REPORT.md with PROCEED/PIVOT/KILL.
3. `/ux-design [screen]` — per-screen UX specs (HUD, Care, etc.).
4. `/create-epics layer:foundation` → `layer:core` → `/create-stories [epic]` per epic.
5. `/sprint-plan new` — using the slice's velocity data.
6. `/gate-check pre-production` again → advance to **Production**.

---

## Non-blocking follow-ups (carry forward)

- Rename `docs/architecture/traceability-matrix.md` → `requirements-traceability.md` (some skills grep the canonical name).
- Place accessibility doc at `design/accessibility-requirements.md` (currently `design/ux/`).
- Resolve architecture **QQ-05 (WebGL persistence)** before the slice locks its save format.
- `/balance-check` for cost multipliers (~2×) + care decay rate (QQ-03).
- Author Fe5 Performance + Fe8 Reputation GDDs before those features (QQ-04).

---

## ⚠️ Setup notes when working on another machine

1. **Install Unity `6000.3.17f1`** in Unity Hub, then open this project (`ProjectVersion.txt` is pinned to it).
2. **Activate a Unity license locally** on the new machine (Unity Hub sign-in) — the local `.ulf` does not travel with the repo.
3. **GitHub Actions secrets are already set on the repo** (`UNITY_LICENSE`, `UNITY_EMAIL`, `UNITY_PASSWORD`) — these live in GitHub repo settings, not in the repo, so CI works from any machine that pushes.
4. **CI editor image is pinned to `6000.3.16f1`** in `tests.yml` (game-ci has no `.17f1` image yet). Bump both `unityVersion:` lines to `6000.3.17f1` once game-ci publishes that image.
5. **`production/session-state/active.md` is gitignored** — it will NOT be on the new machine. This file (`docs/PROJECT-STATUS.md`) is the committed replacement. The Claude `session-start` hook regenerates `active.md` locally.

---

## Key files to read first (on any machine / new session)

1. `docs/PROJECT-STATUS.md` (this file)
2. `docs/architecture/control-manifest.md` — the rules for every line of code
3. `docs/architecture/architecture.md` — the Unity blueprint + open questions
4. `prototypes/animal-world-zoo-vertical-slice/PLAN.md` — the immediate next build
5. `CLAUDE.md` — project conventions + engine pin
