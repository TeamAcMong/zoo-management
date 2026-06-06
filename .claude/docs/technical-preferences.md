# Technical Preferences

<!-- Populated by /setup-engine (Unity 6.3 LTS, 2026-06-06). Updated as decisions are made. -->
<!-- All agents reference this file for project-specific standards and conventions. -->

## Engine & Language

- **Engine**: Unity **6.3 LTS** (`6000.3.17f1`), 2D
- **Language**: C# (.NET, C# 9)
- **Rendering**: Universal Render Pipeline (URP) **2D**
- **UI**: UI Toolkit (UXML + USS) — Unity 6 runtime UI default (replaces UGUI)
- **Input**: Input System package
- **Physics**: None (UI/management/idle game — no physics engine)
- **Data**: ScriptableObjects for content (animal database, tuning configs)
- **Persistence**: JSON file at `Application.persistentDataPath` (NOT PlayerPrefs for the save blob)

> The React 18 / Babel / DOM build in `act/*.jsx` is the **reference prototype** only,
> not the shipping target. See `docs/architecture/architecture.md`.

## Input & Platform

<!-- Read by /ux-design, /ux-review, /test-setup, /team-ui, /dev-story. -->

- **Target Platforms**: Mobile (iOS / Android) primary + WebGL
- **Input Methods**: Touch + Pointer/Mouse (via Input System; UI Toolkit handles UI events)
- **Primary Input**: Touch
- **Gamepad Support**: None
- **Touch Support**: Full (tap-driven management UI; no hover-only interactions)
- **Platform Notes**: Mobile-first portrait UI. WebGL persistence uses IndexedDB-backed
  `persistentDataPath` — verify flush-on-close in-browser (architecture QQ-05). No hover-only
  affordances (touch has no hover).

## Naming Conventions

<!-- Unity / C# conventions. -->

- **Classes**: PascalCase (e.g., `CareService`, `GameController`); MonoBehaviours match file name
- **Public properties/fields**: PascalCase (e.g., `MoveSpeed`, `GoldPerSec`)
- **Private fields**: `_camelCase` (e.g., `_gameState`, `_tickAccumulator`)
- **Methods**: PascalCase (e.g., `DoAction()`, `TryPay()`)
- **Interfaces**: `I` prefix (e.g., `ICurrencyService`, `ISaveService`)
- **Files**: PascalCase matching the type (e.g., `CareService.cs`, `AnimalDef.cs`)
- **ScriptableObjects**: PascalCase asset + `[CreateAssetMenu]` (e.g., `AnimalDef`, `TuningConfig`)
- **UI Toolkit**: UXML/USS files PascalCase per screen (e.g., `HudScreen.uxml`, `HudScreen.uss`); USS class names kebab-case
- **Constants**: PascalCase or UPPER_SNAKE_CASE for tuning constants
- **Assemblies**: `AWZ.Domain`, `AWZ.Data`, `AWZ.Runtime`, `AWZ.UI`, `AWZ.Tests.*`

## Performance Budgets

- **Target Framerate**: 60 fps
- **Frame Budget**: 16.6 ms
- **Draw Calls**: keep low — 2D + UI Toolkit; batch sprites, single Canvas/UIDocument per screen
- **Memory Ceiling**: [TO BE CONFIGURED — set when a target mobile device is chosen]

## Testing

- **Framework**: Unity Test Framework (NUnit) — EditMode (Domain unit tests) + PlayMode (integration)
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance/economy formulas (C2, C3 curves), care/decay logic (C1), save/migration (F3), caps & gates (Fe2/Fe3/Fe4). Domain assembly is engine-agnostic → unit-testable headless in CI.

## Forbidden Patterns

<!-- Add patterns that should never appear in this project's codebase -->
- `UnityEngine` references inside the `AWZ.Domain` assembly (domain must stay engine-agnostic)
- Hardcoded gameplay values in code (use ScriptableObjects / tuning configs)
- Mutating `GameState` outside `GameController.Apply` (single ordered mutation pipeline)
- UGUI (Canvas) for new UI — use UI Toolkit (UGUI is deprecated for new projects in Unity 6)

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->
- Unity packages: Input System, UI Toolkit (built-in), Unity Test Framework
- [Add others as approved — Addressables/Json.NET only when actively integrated]

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- See `docs/architecture/architecture.md` (Required ADRs ADR-0001…ADR-0010 — none Accepted yet)

## Engine Specialists

<!-- Read by /code-review, /architecture-decision, /architecture-review, and team skills. -->

- **Primary**: unity-specialist
- **Language/Code Specialist**: unity-specialist (C# review)
- **Shader Specialist**: unity-shader-specialist (Shader Graph, HLSL, URP 2D materials)
- **UI Specialist**: unity-ui-specialist (UI Toolkit UXML/USS, runtime UI)
- **Additional Specialists**: unity-addressables-specialist (only if/when remote content is added); economy-designer / systems-designer (zoo balance)
- **Routing Notes**: Invoke primary for architecture and general C# review. Invoke UI specialist for all UI Toolkit work. Invoke shader specialist for URP 2D materials/effects. DOTS/Netcode specialists do NOT apply (no ECS, single-player). Keep the `AWZ.Domain` assembly engine-agnostic.

### File Extension Routing

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (`.cs`) | unity-specialist |
| Domain logic (`AWZ.Domain/**.cs`) | unity-specialist (verify no UnityEngine ref) |
| UI files (`.uxml`, `.uss`) | unity-ui-specialist |
| Shader / material (`.shader`, `.shadergraph`, `.mat`) | unity-shader-specialist |
| Scene / prefab (`.unity`, `.prefab`) | unity-specialist |
| Data / config (ScriptableObject `.asset`, `.cs` defs) | systems-designer / economy-designer |
| General architecture review | unity-specialist / technical-director |
