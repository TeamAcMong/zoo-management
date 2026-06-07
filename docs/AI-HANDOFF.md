# AI Handoff — How to pick up this project

> **Read this first in any new session before doing work.** It tells an AI assistant
> what is true *right now*, where the source-of-truth lives, what to check, and how to
> choose the next task — without the user having to re-explain.
>
> **Last updated:** 2026-06-07 · Keep this date current when state changes materially.

---

## 30-second state (2026-06-07)

- **Shipping codebase = Unity C# in `Assets/Scripts/**`.** The `act/*.jsx` React build is a
  **reference prototype only** (rules/feel), NOT the game. Do not treat JSX as the truth.
- **The design docs HAD diverged from the code** and were synced on 2026-06-07. Some docs
  still describe the old prototype — when in doubt, **trust the C# code**, then this audit.
- **Two critical, known gaps** (the game runs but):
  1. **W1 — the running UI (`GameApp.cs`) does not save or do offline.** Save/Idle services
     exist and are wired into a *different* bootstrap path that renders nothing.
  2. **W2 — care does not affect income.** `EconomyService` applies no `happy_mult` welfare
     multiplier, so the idle care loop is broken.
- **Stage:** Pre-Production. Most MVP domain logic exists in C#; content (29-species SO),
  taming/trust, daily missions, biomes, tutorial are design-only or absent.

## Source-of-truth map — where to look for what

| Question | Authoritative file |
|----------|--------------------|
| What does the game actually DO? | `Assets/Scripts/**` (C# code) — the truth |
| What's broken / not built (code-vs-design)? | `production/implementation-gaps.md` (C-1…C-13 = the audit) |
| What needs doing, prioritized? | `docs/project-workflow-backlog-2026-06-07.csv` (W1…W16) |
| What documents exist + their status? | `docs/project-document-register-2026-06-07.csv` |
| Design intent (rules/formulas/balance)? | `design/gdd/*.md` (13 GDDs) + `design/gdd/systems-index.md` |
| Cross-doc shared values + C# audit notes? | `design/registry/entities.yaml` (has a 2026-06-07 audit banner) |
| Technical decisions? | `docs/architecture/` (ADR-0001…0010, all Accepted; control-manifest) |
| Engine API (Unity 6.3 is post-cutoff!) | `docs/engine-reference/unity/` — check BEFORE any Unity API |
| Where did the last session leave off? | `production/session-state/active.md` (session-start hook previews it) |

## Session-start checklist (do this, in order)

1. Read this file (you're here).
2. Read `production/session-state/active.md` for the last checkpoint.
3. Open `docs/project-workflow-backlog-2026-06-07.csv` → filter `Trạng thái = Open`, sort by
   `Ưu tiên`. The top items are **W1** and **W2** (Critical).
4. For the chosen item, read its `Tài liệu liên quan` + jump to the `Code / Bằng chứng`
   `file:line` to ground yourself before changing anything.
5. If touching a Unity API, cross-check `docs/engine-reference/unity/` first (Unity 6.3 LTS
   is newer than the model's training cutoff).

## How to choose the next task

- Default order = `workflow-backlog.csv` priority: 🔴 Critical → 🟠 High → 🟡 Medium → 🟢 Low,
  respecting the `Phụ thuộc` (dependency) column.
- **W1 (save/offline path) and W2 (happy_mult) are the highest-leverage** — almost everything
  else is moot if progress isn't saved and care doesn't matter.
- Items marked **Decision** (e.g. W8) are the user's call — surface options, don't guess.

## How to actually work here (rules that override defaults)

- **Collaboration protocol:** ask "May I write this to [path]?" before Write/Edit; show a draft
  or summary before multi-file changes; no commits without the user saying so.
  (See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md`.)
- **Engine-agnostic Domain:** never reference `UnityEngine` inside the `AWZ.Domain` assembly.
- **Data-driven:** no hardcoded gameplay values — use ScriptableObjects / `TuningConfig`
  (note W4: TuningConfig is currently NOT wired; services use `const` copies).
- **Mutation pipeline:** mutate `GameState` only through the intended pipeline (ADR-0003).
- Full rules: root `CLAUDE.md` + `.claude/docs/*` + `docs/architecture/control-manifest.md`.

## How to "check" status (commands)

- `git log --oneline -10` — recent work.
- Tests: Unity Test Framework, `game-ci/unity-test-runner` (CI). Currently only 1 formula is
  covered (W11 = backfill tests for the other 9 services).
- Build/run: see `RUN-GAME.md`.

## Update discipline — keep this handoff useful

When you finish or change a workflow item, in the SAME change:
1. Update its row `Trạng thái` in `docs/project-workflow-backlog-2026-06-07.csv` (Open → Doing → Done).
2. Update the relevant GDD / `systems-index.md` / `entities.yaml` if a tracked value changed.
3. If a code-vs-design gap closed, update `production/implementation-gaps.md`.
4. Bump the **Last updated** date at the top of this file and the 30-second state if it shifted.

> If this file and the code disagree, the **code wins** — then fix this file.
