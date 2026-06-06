# Control Manifest

> **Engine**: Unity 6.3 LTS (`6000.3.17f1`), URP 2D
> **Last Updated**: 2026-06-06
> **Manifest Version**: 2026-06-06
> **ADRs Covered**: ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007, ADR-0008, ADR-0009, ADR-0010
> **Status**: Active — regenerate with `/create-control-manifest` when ADRs change

A programmer's quick-reference extracted from all Accepted ADRs, technical preferences,
and the Unity 6.3 engine reference. Where ADRs explain *why*, this tells you *what*.
For reasoning, see the referenced ADR. Stories embed `Manifest Version`; `/story-readiness`
flags stories written against a stale version.

---

## Foundation Layer Rules

*Applies to: assemblies, game state, EventBus, TickService, save/load, app bootstrap*

### Required Patterns
- **Split code into asmdefs**: `AWZ.Domain`, `AWZ.Data`, `AWZ.Runtime`, `AWZ.UI`, `AWZ.Tests.*` — source: ADR-0002
- **`AWZ.Domain` is pure C#** — POCO services + GameState + formulas, no engine types — source: ADR-0002
- **Mutate state only through `GameController.Apply(ICommand)`** — ordered, synchronous, one `StateChanged` event after — source: ADR-0003
- **Systems communicate via EventBus** (`Publish<T>`/`Subscribe<T>`); UI reads published snapshots — source: ADR-0003
- **Construct services with constructor injection from `AppBootstrap`** — source: ADR-0002, ADR-0003
- **Save = JSON at `Application.persistentDataPath/awz_save.json`** with top-level `version` field — source: ADR-0004
- **Load once at boot before first frame** (no flash of defaults) — source: ADR-0004
- **Debounce save 300 ms on change; flush immediately on `OnApplicationPause(true)`/focus-loss/quit, stamping `closedAt = DateTime.UtcNow`** — source: ADR-0004
- **Forward-only migration chain keyed on `version`** (pure transforms) — source: ADR-0004
- **Corrupt/quota/private-mode → fall back to defaults or memory-only mode; never throw to caller** — source: ADR-0004
- **Decay & offline accrual key off `DateTime.UtcNow` deltas (wall-clock), not frame ticks**; TickService grants income on a 1 s real cadence — source: ADR-0005
- **URP 2D renderer; target Mobile (iOS/Android) + WebGL** — source: ADR-0001

### Forbidden Approaches
- **Never reference `UnityEngine` inside `AWZ.Domain`** — breaks headless testability — source: ADR-0002
- **Never mutate `GameState` outside `GameController.Apply`** — reintroduces ordering bugs — source: ADR-0003
- **Never use static singletons for services** — use DI — source: ADR-0002
- **Never use `PlayerPrefs` for the save blob** — wrong tool for structured state — source: ADR-0004
- **Never use frame-tick or session-only decay** — must be wall-clock — source: ADR-0005
- **Never use the Built-in render pipeline, DOTS/ECS, or Netcode** — out of scope for this game — source: ADR-0001

### Performance Guardrails
- **Save blob** ≈ 6 KB expected; warn at 512 KB — source: ADR-0004
- **Frame**: 60 fps / 16.6 ms budget — source: technical-preferences.md

---

## Core Layer Rules

*Applies to: C1 Animal Care, C2 Zoo Economy, C3 Zoo Level, C4 Taming*

### Required Patterns
- **Core systems are plain-C# POCO services in `AWZ.Domain`** — source: ADR-0002
- **Care action runs as one ordered command**: `TryPay(cost)` → adjust meters → `+3 XP` → bump quest counter — source: ADR-0003
- **Derive level after every XP grant; raise a single `LevelUp{from,to}` even on multi-level jumps; run unlock gate after the final level** — source: ADR-0003
- **`happyMult = clamp(0.4 + avgHappiness/100, 0.5, 1.4)`** — source: ADR-0006 (constant), TR-C1-006
- **`goldPerSec = max(1, round(visitors × 0.05 × (1 + 0.12 × built)))`** — source: ADR-0006, TR-C2-005
- **Trust never decays; read/write only via care/enrichment deltas** — source: ADR-0009, TR-C4-001

### Forbidden Approaches
- **Never bypass the command pipeline for core mutations** — source: ADR-0003
- **Never hardcode formula constants** — read from the `TuningConfig` ScriptableObject — source: ADR-0006, technical-preferences.md

### Performance Guardrails
- **Domain formulas are pure and unit-tested headless** (EditMode, no scene) — source: ADR-0002

---

## Feature Layer Rules

*Applies to: Fe1 Collection, Fe2 Habitat, Fe3 Enrichment, Fe4 Attractions, Fe6 Quests, Fe7 Idle/Offline*

### Required Patterns
- **Enforce caps at the single mutation site**: `encLv ≤ 5` (Fe2), `enrLv ≤ 5` (Fe3) — source: ADR-0009
- **Attraction build gate**: reject if `level < unlockLevel`, already built, or insufficient gold — source: ADR-0009, TR-Fe4-001
- **Animal purchase is Gold-only (never Gems); buy-more rejects at `count ≥ capOf(encLv)`** — source: ADR-0009, TR-Fe1-001/002
- **Trust gates are numeric**: Petting requires `trust ≥ 40`, Performer requires `trust ≥ 80` — source: ADR-0009, TR-C4-003
- **Quest claims are idempotent via a persisted `claimed` set; counters bump on action COMPLETION, not start** — source: ADR-0010, TR-Fe6-002/003
- **Offline gold = `floor(min(elapsed, cap) × goldPerSec × 0.60)`**, cap 28800 s free / 86400 s VIP, from `closedAt` — source: ADR-0005, TR-Fe7-002

### Forbidden Approaches
- **Never gate content in the UI only** — gates must be authoritative in the domain — source: ADR-0009
- **Never key quest-claim prevention on the cursor (`chapterIdx`) alone** — use the `claimed` set — source: ADR-0010
- **Never bump quest counters on activity start** (enables start-cancel farming) — source: ADR-0010

### Performance Guardrails
- **Enrichment/enclosure/attraction multipliers all feed one appeal→economy chain — the hard caps are what prevent runaway economy values** — source: ADR-0009

---

## Presentation Layer Rules

*Applies to: P1 HUD, P2 Zoo Map, P3 Care, P4 Animals, P5 Attractions, P6 Quests, P7 Tutorial*

### Required Patterns
- **All runtime UI uses UI Toolkit (UXML + USS); one `UIDocument` + one screen controller per view** — source: ADR-0007
- **UI reads domain state from EventBus snapshots and emits commands; it never calls services directly** — source: ADR-0007, ADR-0003
- **Express UI state via USS classes** (`.is-disabled`, `.is-gated`, `.is-pressed`) with a shared theme token stylesheet — source: ADR-0007
- **Externalize all strings; never bake text into sprites** (localization + accessibility) — source: ADR-0007
- **Long lists (species, quests) use `ListView` virtualization** — source: ADR-0007
- **Input System for world-space taps; UI Toolkit handles UI element events; gate world taps on "pointer not over UI"** — source: ADR-0008
- **Touch targets ≥ 44×44 pt; no hover-only affordances; gated controls show their reason** — source: design/ux/interaction-patterns.md, accessibility-requirements.md

### Forbidden Approaches
- **Never use UGUI/Canvas for new UI** — UI Toolkit is the standard — source: ADR-0007, deprecated-apis.md
- **Never use the legacy `UnityEngine.Input` class** — use the Input System — source: ADR-0008, deprecated-apis.md
- **Never inline per-element styling for state** — use USS classes — source: ADR-0007
- **Never mutate `GameState` from a UI callback** — publish a command instead — source: ADR-0007, ADR-0003

---

## Global Rules (All Layers)

### Naming Conventions
| Element | Convention | Example |
|---|---|---|
| Classes | PascalCase | `CareService`, `GameController` |
| Public properties/fields | PascalCase | `GoldPerSec` |
| Private fields | `_camelCase` | `_gameState` |
| Methods | PascalCase | `DoAction()`, `TryPay()` |
| Interfaces | `I` prefix | `ICurrencyService` |
| Files | PascalCase matching type | `CareService.cs` |
| ScriptableObjects | PascalCase + `[CreateAssetMenu]` | `AnimalDatabaseSO` |
| UI Toolkit files | PascalCase; USS classes kebab-case | `HudScreen.uxml` / `.is-gated` |
| Constants / tuning | PascalCase or UPPER_SNAKE_CASE | `MaxEnclosureLevel` |
| Assemblies | `AWZ.*` | `AWZ.Domain` |

### Performance Budgets
| Target | Value |
|---|---|
| Framerate | 60 fps |
| Frame budget | 16.6 ms |
| Draw calls | Keep low — 2D + UI Toolkit; batch sprites, one UIDocument/screen |
| Memory ceiling | [TO BE CONFIGURED — set when target device chosen] |

### Approved Libraries / Addons
- **Input System** (`com.unity.inputsystem`) — input handling
- **UI Toolkit** (built-in) — runtime UI
- **Unity Test Framework** (`com.unity.test-framework`) — EditMode/PlayMode tests
- *(Addressables / Json.NET — only when actively integrated, not speculatively)*

### Forbidden APIs (Unity 6.3 LTS)
Deprecated or replaced — source: `docs/engine-reference/unity/deprecated-apis.md`
- `Input.GetKey()` / `GetKeyDown()` / `GetAxis()` / `GetMouseButton()` / `Input.mousePosition` → Input System
- `Canvas` (UGUI) → `UIDocument`; `Text` → `Label`/TMP; `Image` → `VisualElement` background
- `ComponentSystem` / `JobComponentSystem` / `ComponentDataFromEntity<T>` → ISystem/ComponentLookup (N/A — no DOTS)
- `Resources.Load()` → direct refs / Addressables (when needed)
- `CommandBuffer.DrawMesh()` / `OnPreRender`/`OnPostRender` → RenderGraph / RenderPipelineManager
- `Physics.RaycastAll()` → `RaycastNonAlloc` (N/A — no physics); legacy Animation → Animator
- Legacy Particle System → VFX Graph; `WWW` → `UnityWebRequest`; `Application.LoadLevel()` → `SceneManager.LoadScene()`

### Forbidden Patterns
Source: `.claude/docs/technical-preferences.md`
- `UnityEngine` references inside `AWZ.Domain`
- Hardcoded gameplay values in code (use ScriptableObjects / TuningConfig)
- Mutating `GameState` outside `GameController.Apply`
- UGUI (Canvas) for new UI

### Cross-Cutting Constraints
- Every ADR-governed system traces to a TR in `docs/architecture/tr-registry.yaml`; stories must embed the TR-ID + governing ADR.
- Unity 6 is **post-LLM-cutoff** — verify any Unity API against `docs/engine-reference/unity/` before use.
