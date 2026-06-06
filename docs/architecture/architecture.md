# Animal World Zoo — Master Architecture (Unity 2D)

## Document Status
- **Version:** 1.0 (draft)
- **Last Updated:** 2026-06-06
- **Engine:** Unity **6.3 LTS** — pinned `6000.3.17f1` (2D / URP 2D)
  - ✅ `ProjectSettings/ProjectVersion.txt` set to `6000.3.17f1 (cf0352b38e81)` via `/setup-engine` (QQ-01 resolved). Ensure this editor patch is installed in Unity Hub before opening.
- **GDDs Covered:** F1 animal-database, F2 currency-system, F3 save-load, C1 animal-care, C2 zoo-economy, C3 zoo-level, C4 taming, Fe1 animal-collection, Fe2 habitat-system, Fe3 enrichment, Fe4 attractions, Fe6 quests-missions, Fe7 idle-offline (+ Fe5 Performance, Fe8 Reputation deferred)
- **ADRs Referenced:** ADR-0001…**0010 all Accepted** (2026-06-06)
- **Engine review mode:** lean (Lead-Programmer feasibility gate skipped)
- **Technical Director Sign-Off:** 2026-06-06 — APPROVED WITH CONDITIONS (see Phase 7b)
- **Lead Programmer Feasibility:** SKIPPED — Lean mode

> **Platform pivot.** The React 18 / Babel / DOM build in `act/*.jsx` is the **playable
> reference prototype**, not the shipping target. The shipping target is a **Unity 2D**
> app. The 13 GDDs are authoritative for *rules, formulas and balance*; their
> "Source files" / JSX implementation notes are read as *prototype reference*, and this
> architecture re-implements the same mechanics natively in C# on Unity 6.3 LTS.

---

## Engine Knowledge Gap Summary

Engine reference pinned at **Unity 6.3 LTS** (`docs/engine-reference/unity/`, verified 2026-02-13).
LLM training covers ~Unity 2022 LTS — the **entire Unity 6 line is post-cutoff**. However,
this game touches almost none of the HIGH-RISK Unity 6 domains:

| Unity 6 domain | Risk (general) | Used by this game? | Decision |
|---|---|---|---|
| DOTS / Entities ECS | HIGH | **No** (~29 species, tiny scale) | MonoBehaviour + plain C# |
| URP/HDRP RenderGraph, GPU drawer | HIGH | Minimal (2D, UI-heavy) | URP **2D** default, no custom passes |
| Netcode for GameObjects | — | **No** (single-player) | none |
| Addressables | MEDIUM | **Not for MVP** | direct refs/Resources; revisit for remote content |
| **UI Toolkit** | MEDIUM | **Yes — core** | UI Toolkit (UXML/USS), the modern default |
| **Input System** | MEDIUM | Yes (tap/click) | Input System package |
| Burst/Jobs, VFX Graph, Cinemachine | — | No | none |

**Net residual risk: LOW–MEDIUM**, concentrated in **UI Toolkit** (verified in
`modules/ui.md` — production-ready, replaces UGUI) and **Input System** (verified in
`modules/input.md`). All API recommendations below were cross-referenced against the
pinned reference, not LLM memory.

---

## Architecture Principles

1. **Engine-agnostic domain core.** All game rules/formulas live in plain C# (POCOs +
   services) under a `Domain` assembly with **no `UnityEngine` dependency**. MonoBehaviours,
   ScriptableObjects, and UI Toolkit are thin adapters. → satisfies the "all public methods
   unit-testable / DI over singletons" coding standard, and lets balance formulas be tested
   headless (CI without a player).
2. **Data-driven content.** Species, tuning knobs, level curve, costs are **ScriptableObjects**,
   never hardcoded → satisfies "gameplay values must be data-driven (external config)".
3. **One authoritative state, one ordered mutation pipeline.** A single `GameState` is mutated
   only through `GameController.Apply(command)`. XP→level-derive→unlock→quest-counter happen in
   one explicit, ordered step — no hidden frame batching (the React prototype's ambiguity, review
   finding S-W1, is removed by construction).
4. **Wall-clock time is the source of truth.** Decay and offline accrual key off
   `DateTime.UtcNow` deltas, not frame ticks (fixes review D-B1 "decay 100–1000× too fast" and
   makes Fe7 real).
5. **Caps & gates enforced at the single mutation site** in the domain layer (fixes the missing
   enclosure-Lv5 / enrichment-cap / attraction-level / trust-gate guards — review D-B4, S-B1, S-W6).

---

## System Layer Map

```
┌──────────────────────────────────────────────────────────────────────┐
│ PRESENTATION   UI Toolkit (UXML + USS) — one screen-controller per view │
│   P1 HUD · P2 Zoo Map · P3 Care · P4 Animals · P5 Attractions          │
│   P6 Quests · P7 Tutorial      (MonoBehaviour + UIDocument adapters)    │
├──────────────────────────────────────────────────────────────────────┤
│ FEATURE        Fe1 Collection · Fe2 Habitat · Fe3 Enrichment           │
│   Fe4 Attractions · Fe6 Quests · Fe7 Idle/Offline   (plain-C# services) │
│   [deferred: Fe5 Performance · Fe8 Reputation]                          │
├──────────────────────────────────────────────────────────────────────┤
│ CORE           C1 Animal Care · C2 Zoo Economy · C3 Zoo Level           │
│   C4 Taming    (plain-C# domain services, no UnityEngine dependency)    │
├──────────────────────────────────────────────────────────────────────┤
│ FOUNDATION     F1 Animal DB (ScriptableObject) · F2 Currency            │
│   F3 Save/Load (JSON @ persistentDataPath) · EventBus · TickService     │
│   AppBootstrap / GameController (composition root, ordered update)       │
├──────────────────────────────────────────────────────────────────────┤
│ PLATFORM       Unity 6.3 LTS runtime · C# 9 · URP 2D · Input System     │
│   System.IO file I/O · DateTime (system clock) · target: Mobile + WebGL │
└──────────────────────────────────────────────────────────────────────┘
```

### Assembly layout (enforces the dependency direction above)
- `AWZ.Domain` (asmdef, **no UnityEngine ref**) — Core + Feature logic, GameState, formulas.
- `AWZ.Data` — ScriptableObject definitions (F1 database, tuning configs).
- `AWZ.Runtime` — MonoBehaviours: AppBootstrap, GameController, TickService, SaveService.
- `AWZ.UI` — UI Toolkit screen controllers (depends on Domain via events, never the reverse).
- `AWZ.Tests.EditMode` / `AWZ.Tests.PlayMode` — unit + integration (reference Domain).

---

## Module Ownership

| Module | Layer | Owns (state) | Exposes | Consumes | Engine API |
|---|---|---|---|---|---|
| **F1 AnimalDatabase** | Foundation | `AnimalDef[]` (29), derived UNLOCKS, appeal ladder | `GetDef(key)`, `AllUnlockedAt(level)` | — | `ScriptableObject` |
| **F2 Currency** | Foundation | gold, gems, tokens, reputation balances | `TryPay(cost)`, `Grant(type,amt)`, `Balance(type)` | EventBus | none (POCO) |
| **F3 SaveService** | Foundation | save blob ↔ disk, schema version, migrations, `closedAt` | `Save()`, `Load()→GameState`, `Wipe()` | GameState, F1 | `Application.persistentDataPath`, `System.IO`, `JsonUtility`/Json.NET, `Application.focusChanged`/`OnApplicationPause` |
| **EventBus** | Foundation | — | `Publish<T>`, `Subscribe<T>` | — | none (POCO) |
| **TickService** | Foundation | accumulators for 1 s income + decay cadence | drives `GameController.Tick(dt, utcNow)` | — | `MonoBehaviour.Update`, `Time`, `DateTime` |
| **GameController** | Foundation | the single `GameState`; ordered mutation pipeline | `Apply(Command)`, `Tick(...)` | all Core/Feature services | composition root |
| **C1 CareService** | Core | per-animal `Meters{hunger,thirst,clean,happy,trust}` | `DoAction(key,action)`, `Decay(elapsed)`, `AvgHappiness()` | F2, C3, C4, EventBus | none |
| **C2 EconomyService** | Core | derived appeal/visitors/goldPerSec | `GoldPerSec()`, `AppealOf(key)`, `Capacity()` | F1, C1, Fe2, Fe3, Fe4 | none |
| **C3 LevelService** | Core | xp, derived level, `LEVEL_XP[92]` | `AddXp(n)`, `Level`, `UnlockGate(lv)` | F1 | none |
| **C4 TamingService** | Core | trust read/write (in C1 meters), gates | `Trust(key)`, `CanPet(key)`, `CanPerform(key)`, `ShowReward(lineup)` | C1, F1 | none |
| **Fe1 CollectionService** | Feature | `owned[]`, `pops[key]` | `Unlock(key)`, `BuyMore(key)` | F1,F2,C3,Fe2 | none |
| **Fe2 HabitatService** | Feature | `encLv[key]` (1–5) | `Upgrade(key)`, `CapacityOf(key)`, `Mult(key)` | F2,C3 | none |
| **Fe3 EnrichmentService** | Feature | `enrLv[key]` (0–5) | `AddEnrichment(key)`, `Factor(key)` | F2,C1 | none |
| **Fe4 AttractionService** | Feature | `built[]` (≤5) | `Build(key)`, `RevenueMult()`, `CapacityMult()` | F2,C3,C4 | none |
| **Fe6 QuestService** | Feature | `chapterIdx`, `serviceIdx`, `counts{}`, claimed set | `Bump(counter)`, `Claim(questId)`, `Progress(q)` | F2,C3,EventBus | none |
| **Fe7 IdleService** | Feature | `closedAt`, pending offline reward | `ComputeOffline(now)`, `CollectPending()` | C2,F2,F3 | `DateTime` |
| **P1–P7 Screens** | Presentation | view state only | screen controllers | Domain via EventBus | `UIDocument`, `UIElements`, Input System |

### Dependency diagram (compile-time; arrows = "depends on")
```
UI (P1..P7) ─┐
             ├─►(events)─► GameController ─► Core (C1 C2 C3 C4) ─► Foundation (F1 F2 F3)
Feature (Fe*)┘                    ▲                                    ▲
                                  └────────── TickService ────────────┘
Domain assembly NEVER references UI or Runtime. UI never references another UI screen.
```

---

## Data Flow

### 1. Frame / tick path
```
TickService.Update(dt):
  accumulate dt
  every 1.0s real  → GameController.Tick → C2.GoldPerSec() → F2.Grant(gold)
  on each Update   → check DateTime delta for decay cadence (wall-clock, not frame count)
                   → C1.Decay(elapsedRealSeconds)
  state change     → EventBus.Publish(StateChanged{fields}) → subscribed screens refresh
```
Sync calls within Tick; UI updates via event (decoupled). No cross-thread access — Unity main thread only.

### 2. Player action path (single ordered mutation — fixes review S-W1)
```
UI Button.clicked → EventBus.Publish(CareActionCmd{key,action})
  → GameController.Apply(cmd)  [ONE ordered block]:
       1. F2.TryPay(cost)            (abort if false)
       2. C1.DoAction → adjust meters
       3. C3.AddXp(+3) → derive level → if increased: publish LevelUp, run unlock gate
       4. Fe6.Bump(counter)
       5. EventBus.Publish(StateChanged)
```
Ordering is explicit and atomic on the main thread — no React-batching ambiguity.

### 3. Save / load path
```
LOAD  (AppBootstrap.Awake): SaveService.Load() → read persistentDataPath/awz_save.json
        → JSON.parse → if v<CURRENT run MIGRATIONS[v] chain → build GameState
        → if missing/corrupt → defaults (gold 50, gems 10, owned[rabbit]) + toast
SAVE  : debounced (300 ms) on StateChanged; FLUSH immediately on
        OnApplicationPause(true) / focus loss / OnApplicationQuit, writing closedAt = UtcNow
RESUME: Fe7.ComputeOffline(UtcNow - closedAt) → clamp to cap (8h/24h) × 0.60 → pending reward modal
```
F3 owns serialization; every persisted field declares its key. closedAt makes Fe7 real.

### 4. Initialisation order (composition root)
```
AppBootstrap.Awake:
  1. load F1 AnimalDatabase (ScriptableObject)         [no deps]
  2. SaveService.Load() → GameState (or defaults)
  3. construct services (DI): F2, C1..C4, Fe1..Fe7, EventBus  (constructor-injected)
  4. Fe7 offline reconciliation (needs C2 rate + closedAt)
  5. wire TickService → GameController
  6. activate UI screens (subscribe to EventBus), show resume modal if pending
```

---

## API Boundaries (contracts programmers implement against)

```csharp
// FOUNDATION ----------------------------------------------------------
public interface ICurrencyService {            // F2 — no negative balance, atomic
    long Balance(CurrencyType t);
    bool TryPay(CurrencyType t, long amount);  // false if insufficient; no partial deduct
    void Grant(CurrencyType t, long amount);   // animals NEVER payable in Gems — enforced here
}

public interface ISaveService {                // F3
    GameState Load();                          // defaults on missing/corrupt; never throws to caller
    void Save(GameState s);                    // debounced by caller; idempotent
    void Flush(GameState s, DateTime closedAtUtc);
    void Wipe();
    int SchemaVersion { get; }                 // migrations keyed off this
}

// CORE ----------------------------------------------------------------
public interface ILevelService {               // C3
    int Level { get; }                         // derived, 1..92, MAX_LEVEL guard
    void AddXp(long n);                         // monotonic; raises LevelUp event on cross
    bool IsUnlocked(int requiredLevel);
}

public interface IEconomyService {             // C2 — pure derivation from current state
    long GoldPerSec();                         // = max(1, round(visitors*0.05*(1+0.12*built)))
    long Capacity();                           // = round((5+Σseats)*(1+0.15*built))
    double AppealOf(string key);               // base*count*encMult*enrFactor
}

// FEATURE -------------------------------------------------------------
public interface IHabitatService {             // Fe2 — cap ENFORCED here
    bool Upgrade(string key);                  // false if encLv>=5 (guard) or insufficient gold
}
public interface IEnrichmentService {          // Fe3 — cap ENFORCED here
    bool AddEnrichment(string key);            // false if enrLv>=5 (guard) or insufficient gold
}
public interface IAttractionService {          // Fe4 — level gate ENFORCED here
    bool Build(string key);                    // false if level<unlock OR already built OR no gold
}
public interface IQuestService {               // Fe6 — claim idempotent via claimed-set + cursor
    void Bump(CounterType c);                  // note: bump on COMPLETION, not start (fixes S-W3)
    bool Claim(string questId);                // false if already claimed (idempotency key)
}
```
Invariants callers must respect: mutate state only via `GameController.Apply`; never read
`GameState` mid-Tick from a background context (there is none); UI reads snapshots from events.

---

## ADR Audit + Traceability

- **Existing ADRs:** none (`docs/architecture/` holds only the empty `tr-registry.yaml`).
- **TR registry:** empty template. **126 TRs** were extracted from the 13 GDDs during this
  session (Foundation 48, Core 28, Feature 50). Populating the persistent TR registry +
  building the full Requirements Traceability Matrix is **deferred to `/architecture-review`**
  (its Phase 8 owns that file). No renumbering risk since nothing is written yet.
- **Coverage:** every extracted TR maps to exactly one owning module in the table above; no
  orphan requirements. Gaps are *decisions not yet ratified as ADRs*, listed next.

---

## Required ADRs

> **Status (2026-06-06): ADR-0001…ADR-0010 are all written and Accepted** in `docs/architecture/`.
> The "can defer" items below remain unwritten by design.

**Must have before any coding (Foundation & cross-cutting):** ✅ all Accepted
1. **ADR-0001 — Engine, render pipeline & target platforms** (Unity 6.3 LTS `6000.3.17f1`, URP 2D, Mobile + WebGL; resolves QQ-01 version pin)
2. **ADR-0002 — Assembly boundaries & engine-agnostic domain core** (asmdef split; Domain has no UnityEngine ref)
3. **ADR-0003 — Game state, ordered mutation pipeline & EventBus** (single GameState, `Apply(command)`, decoupled UI)
4. **ADR-0004 — Save/Load format, location & migration** (JSON @ persistentDataPath, schema v1, `closedAt`, corrupt/quota fallback) → covers F3 TRs + fixes the unimplemented-persistence keystone
5. **ADR-0005 — Time model: wall-clock decay & offline accrual** (DateTime.UtcNow deltas, TickService cadence) → fixes decay + makes Fe7 real

**Should have before the relevant system is built:**
6. **ADR-0006 — Content as ScriptableObjects** (F1 database + tuning configs authoring/validation)
7. **ADR-0007 — UI architecture: UI Toolkit screen-controller pattern** (UXML/USS, one controller per view, event binding) → P1–P7
8. **ADR-0008 — Input System setup** (tap/click actions, mobile + pointer)
9. **ADR-0009 — Economy caps & content gates enforcement** (encLv≤5, enrLv≤5, attraction level gate, trust gates 40/80) → fixes review D-B4/S-B1/S-W6
10. **ADR-0010 — Quest progression integrity** (claim idempotency key, bump-on-completion) → fixes review S-B4/S-W3

**Can defer to implementation:**
11. Addressables vs direct refs for art (revisit when remote content / asset count grows)
12. Audio routing (SFX/music buses) · 13. Localization string pipeline · 14. Analytics/telemetry hooks

---

## Open Questions

| ID | Summary | Priority | Resolution Path |
|----|---------|----------|-----------------|
| QQ-01 | ✅ RESOLVED — `ProjectVersion.txt` set to `6000.3.17f1`; install that editor patch in Unity Hub | — | done via `/setup-engine` 2026-06-06 |
| QQ-02 | ✅ RESOLVED — CLAUDE.md + technical-preferences.md now configured for Unity 6.3 LTS | — | done via `/setup-engine` 2026-06-06 |
| QQ-03 | Balance gaps inherited from prototype (cost mults 2×, decay rate) must be re-tuned for the Unity build | Medium | `/balance-check` after Core services exist (data-driven via ScriptableObjects) |
| QQ-04 | Fe5 Performance + Fe8 Reputation GDDs unwritten; show-reward formula interim-owned by taming.md | Medium | author Fe5/Fe8 GDDs before those features; Reputation currency stays inert until then |
| QQ-05 | WebGL persistence: persistentDataPath uses IndexedDB on WebGL — verify flush-on-close works in-browser | Medium | spike during ADR-0004; fallback memory-only mode already specified |

---

## Phase 7b — Technical Director Sign-Off

Gate **TD-ARCHITECTURE** self-review:
- ✅ Every GDD system mapped to a layer + owning module; no orphan TRs.
- ✅ All engine API choices cross-referenced against the pinned Unity 6.3 reference (UI Toolkit,
  Input System, no DOTS/Netcode); residual risk LOW–MEDIUM and documented.
- ✅ Data flows + init order specified; single ordered mutation pipeline removes the prototype's
  ordering ambiguity.
- ⚠️ **Conditions:** (1) ADR-0001..0005 must be Accepted before coding; (2) resolve QQ-01/QQ-02
  (version pin + engine config in CLAUDE.md) before sprint planning.

**Verdict: APPROVED WITH CONDITIONS.** Lead-Programmer feasibility gate skipped (Lean mode).
