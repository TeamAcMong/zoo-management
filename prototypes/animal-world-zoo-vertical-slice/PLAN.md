# Vertical Slice Build Plan — Animal World Zoo

> **Status:** PLANNED (code not yet written)
> **Date planned:** 2026-06-06
> **Target completion:** 2 weeks from build start
> **Sunk-cost checkpoint:** End of Day 3 — if care→economy loop is not runnable, stop and reassess scope

---

## Validation Question

> *"Does a player, starting from a zoo with 1 rabbit, feel 'caring for animals and
> building a zoo worth visiting' within 3 minutes — without developer guidance —
> AND can the team build that loop at near-production Unity quality in 2 weeks?"*

Both halves must be answered: **player experience** AND **pipeline feasibility**.

---

## Scope

### IN — Systems to implement

| System | GDD | What the slice exercises |
|---|---|---|
| F1 AnimalDatabase | animal-database.md | ScriptableObject: 3 species (Rabbit appeal=3, Dog appeal=30, Dolphin appeal=3000); TuningConfig (all balance knobs) |
| F2 Currency | currency-system.md | Gold + XP state; `TryPay`, `Grant`; no-negative guard; HUD display |
| F3 Save/Load | save-load.md | JSON @ `persistentDataPath/awz_save.json`; schema v1 with `closedAt`; migration chain; corrupt fallback; memory-only mode |
| C1 Animal Care | animal-care.md | 5 meters/animal; **wall-clock decay** (~1 hour to drain — not the 2.7-min prototype rate); 5 care actions → stat+XP; `happyMult` |
| C2 Zoo Economy | zoo-economy.md | `appealOf → goldPerSec`; TickService 1 s income; HUD gold ticker |
| C3 Zoo Level | zoo-level.md | `levelFromXp` scan; level-up EventBus event → toast; MAX_LEVEL=92 guard |
| Fe7 Idle/Offline | idle-offline.md | `elapsed = UtcNow − closedAt`; `offlineGold = floor(min(elapsed,28800) × rate × 0.60)`; pending modal on resume |
| P1 HUD | interaction-patterns.md | UI Toolkit top bar (Gold/XP/Level); bottom 1-tab minimal nav |
| P3 Care Screen | interaction-patterns.md | UI Toolkit: 5 care buttons (circles, 52pt); 5 stat bars (pill, fill animated); animal name 22pt; amber bloom on tap |

### OUT — Cut to hit 3-5 min gameplay, 2-week timeline

- Enrichment (Fe3), Taming (C4), Attractions (Fe4), Quests (Fe6) — not needed for the core loop
- 26 remaining species; biomes 2–8; Tutorial (P7)
- PlayMode Unity integration tests (production work)
- Full visual art — placeholder is fine (coloured squares + emoji labels)

---

## Day-by-Day Build Plan

### Days 1–2: AWZ.Domain services + ScriptableObjects
- Create Unity project properly: `Assets/Scripts/AWZ.Domain/` + asmdef
- `GameState.cs` — plain C# record/class; all fields (gold, xp, meters[], owned[], closedAt)
- `CareService.cs` — `DoAction()`, `Decay(elapsedSec)`, `AvgHappiness()`
- `EconomyService.cs` — `GoldPerSec()`, `AppealOf(key)`, `Capacity()`
- `LevelService.cs` — `AddXp(n)`, `Level` property, LEVEL_XP generation from 7 anchors
- `CurrencyService.cs` — `TryPay()`, `Grant()`, `Balance()`
- `EventBus.cs` — simple `Publish<T>/Subscribe<T>` (no framework dependency)
- `AnimalDatabaseSO.cs` + `AnimalDefSO.cs` + `TuningConfigSO.cs` in `AWZ.Data/`
- Create 3 AnimalDef assets: Rabbit, Dog, Dolphin

### Day 3: SaveService + GameController + TickService (THE SUNK-COST CHECKPOINT)
- `SaveService.cs` (MonoBehaviour) — Load() on Awake, Save() debounced, Flush() on pause with `closedAt`
- `GameController.cs` (MonoBehaviour) — `Apply(ICommand)` ordered pipeline; `Tick(dt, utcNow)`
- `TickService.cs` (MonoBehaviour) — accumulate `Time.deltaTime`; call `GameController.Tick` every 1s real
- `AppBootstrap.cs` — composition root; DI wiring; Fe7 offline reconciliation on load
- EditMode tests for key formulas (extend existing CI-green tests to cover C1 decay)
- **CHECKPOINT:** Can you tap a care button in Edit Mode / in a minimal scene and watch gold accumulate?

### Days 4–5: UI Toolkit — HUD + Care Screen
- `Assets/UI/HudScreen.uxml` + `HudScreen.uss`
- `Assets/UI/CareScreen.uxml` + `CareScreen.uss`
- `HudScreenController.cs`, `CareScreenController.cs` in `AWZ.UI/` (asmdef ref AWZ.Runtime)
- Subscribe to StateChanged EventBus event → refresh labels/bars
- Care buttons publish `CareActionCmd` via EventBus (do NOT call services directly)
- Stat bar fill animated 280 ms ease-out; amber halo bloom 1.3 s on tap success

### Day 6: Scene + AppBootstrap wiring + Offline modal
- Main.unity scene: AppBootstrap GO + TickService GO + UIDocument GOss
- Camera: 2D orthographic
- Offline modal: simple UXML card shown if `elapsed > 60 s` on resume; "Collect" button credits offline gold
- First end-to-end run: launch → rabbit shows → tap Feed → stat rises → gold ticks → quit → reopen → state restored

### Days 7–10: Feel iteration + 3-species content + decay tuning
- Add Dog + Dolphin ScriptableObject assets; let player "adopt" them via a minimal UI button
- Tune decay rate via TuningConfig (target: stats drain over ~20–24 h real time — NOT 2.7 min)
- Tune `LEVEL_XP` anchors so Lv2 reachable in ~5 care taps for the slice demo
- Add level-up toast (UI Toolkit overlay, 1700 ms)
- Care amber bloom particle (simple Scale tween, no VFX Graph)
- First self-playtest: go through loop as a new player; log confusion moments

### Days 11–14: External/peer playtest + report
- Recruit ≥1 person who hasn't seen the game; watch them silently
- Run Phase 5 debrief questions
- Write REPORT.md (Phase 6)
- Decision: PROCEED / PIVOT / KILL

---

## Success Criteria (measurable)

1. **Loop completion:** Tester completes care→collect\_gold→level\_up cycle without guidance
2. **Time to first meaningful action:** < 60 seconds from launch
3. **Feel:** Tester independently uses a "caring" or "building" word to describe the experience (not prompted)
4. **Offline:** Closing the app > 1 minute then reopening shows a non-zero offline gold modal
5. **Pipeline:** Building 1 UXML screen + 1 domain service takes < 1 dev-day
6. **CI:** EditMode tests still green after slice code added

---

## Technical Rules (from control-manifest.md)

- Code lives in `Assets/VerticalSlice/` — clearly marked `// VERTICAL SLICE - NOT FOR PRODUCTION`
- Domain code follows ADR-0002: no UnityEngine refs in the service classes
- State mutated only via `GameController.Apply()` (ADR-0003)
- Decay wall-clock based on `DateTime.UtcNow` (ADR-0005)
- Constants in `TuningConfigSO`, not hardcoded (ADR-0006, control-manifest)
- UI reads via EventBus snapshot, never calls services directly (ADR-0007)
- Input System for world taps; UI Toolkit for buttons (ADR-0008)
- Caps enforced in domain: encLv≤5, enrLv≤5 (ADR-0009, even in slice)

---

## Files to Create in Unity

```
Assets/
├── VerticalSlice/                           ← SLICE — NOT FOR PRODUCTION
│   ├── Domain/
│   │   ├── AWZ.VS.Domain.asmdef
│   │   ├── GameState.cs
│   │   ├── Commands/
│   │   │   ├── ICommand.cs
│   │   │   └── CareActionCmd.cs
│   │   ├── Services/
│   │   │   ├── EventBus.cs
│   │   │   ├── CareService.cs
│   │   │   ├── EconomyService.cs
│   │   │   ├── LevelService.cs
│   │   │   └── CurrencyService.cs
│   │   └── Idle/
│   │       └── IdleService.cs
│   ├── Data/
│   │   ├── AWZ.VS.Data.asmdef
│   │   ├── AnimalDefSO.cs
│   │   ├── AnimalDatabaseSO.cs
│   │   └── TuningConfigSO.cs
│   ├── Runtime/
│   │   ├── AWZ.VS.Runtime.asmdef
│   │   ├── AppBootstrap.cs
│   │   ├── GameController.cs
│   │   ├── TickService.cs
│   │   └── SaveService.cs
│   ├── UI/
│   │   ├── AWZ.VS.UI.asmdef
│   │   ├── HudScreenController.cs
│   │   └── CareScreenController.cs
│   └── Scenes/
│       └── Main.unity
├── UI/                                       ← UXML + USS (shared between slice and future production)
│   ├── HudScreen.uxml
│   ├── HudScreen.uss
│   ├── CareScreen.uxml
│   └── CareScreen.uss
└── ScriptableObjects/
    ├── Animals/
    │   ├── Rabbit.asset
    │   ├── Dog.asset
    │   └── Dolphin.asset
    └── TuningConfig.asset
```

---

## Velocity Log (fill in as you build)

| Day | Target | Actual | Notes |
|---|---|---|---|
| 1 | GameState + CareService | | |
| 2 | EconomyService + LevelService + SOs | | |
| 3 | SaveService + GameController + TickService + **CHECKPOINT** | | |
| 4 | HudScreen UXML + controller | | |
| 5 | CareScreen UXML + controller | | |
| 6 | Scene + AppBootstrap + first E2E run | | |
| 7–8 | Feel iteration + Dog/Dolphin | | |
| 9–10 | Decay tuning + offline modal | | |
| 11–12 | First self-playtest + fixes | | |
| 13 | External playtest | | |
| 14 | REPORT.md | | |

**This log is the most honest production velocity data you will have.** Fill it in each day — it feeds directly into sprint planning estimates.

---

## When You're Ready to Build

Run `/dev-story` or simply open this file at the start of each session to pick up where you left off. Update the Velocity Log daily. When the loop is demonstrable, run the Phase 5 playtest debrief and then come back to generate the REPORT.md (Phase 6).

Key files to read at session start:
1. This file (`prototypes/animal-world-zoo-vertical-slice/PLAN.md`)
2. `docs/architecture/control-manifest.md` — rules for every line of code
3. `production/session-state/active.md` — current progress
