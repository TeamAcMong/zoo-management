# ADR-0002: Assembly Boundaries & Engine-Agnostic Domain Core

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, lead-programmer (advisory)

## Summary
All game rules/formulas live in an **`AWZ.Domain` assembly with no `UnityEngine`
dependency**; MonoBehaviours, ScriptableObjects, and UI Toolkit are thin adapters in
separate assemblies. This makes balance/economy logic headless-unit-testable and keeps
the core portable.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Scripting / Core |
| **Knowledge Risk** | LOW — asmdef + C# project structure is stable across Unity versions |
| **References Consulted** | `docs/engine-reference/unity/current-best-practices.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 |
| **Enables** | ADR-0003, ADR-0004, ADR-0005, ADR-0009, ADR-0010; all test work |
| **Blocks** | First code epic |
| **Ordering Note** | Defines the project skeleton; create before writing any service. |

## Context
### Problem Statement
The coding standard requires "all public methods unit-testable, DI over singletons" and
"gameplay values data-driven." Unity's default MonoBehaviour-everywhere style fights both.
We must decide the assembly structure before code starts.

### Current State
No Unity code yet. The React prototype mixed logic and view in components — the review found
this hid ordering bugs (S-W1). We want the opposite: logic isolated and testable.

### Constraints
- Unity Test Framework EditMode tests run fastest against plain C# (no scene/play mode).
- UI Toolkit and ScriptableObjects are UnityEngine types — must stay out of the pure core.

### Requirements
- Domain logic runs in CI headless (no Editor/player).
- Clear, enforceable dependency direction (UI → Domain, never reverse).

## Decision
Split the project into assemblies via `.asmdef`:
- **`AWZ.Domain`** — POCO services (C1–C4, Fe1–Fe7 logic), `GameState`, formulas. **No `UnityEngine` reference.**
- **`AWZ.Data`** — ScriptableObject definitions (F1 database, tuning). References UnityEngine.
- **`AWZ.Runtime`** — MonoBehaviours: `AppBootstrap`, `GameController`, `TickService`, `SaveService`. References Domain + Data.
- **`AWZ.UI`** — UI Toolkit screen controllers. References Domain (read) + Runtime (events). Never referenced by Domain.
- **`AWZ.Tests.EditMode`** (Domain unit tests) / **`AWZ.Tests.PlayMode`** (integration).

### Architecture
```
AWZ.UI ─┐
        ├─► AWZ.Runtime ─► AWZ.Domain ◄─ AWZ.Data
        │        │              ▲
        └────────┴── events ────┘     (Domain references nothing Unity)
AWZ.Tests.EditMode ─► AWZ.Domain      AWZ.Tests.PlayMode ─► AWZ.Runtime
```

### Key Interfaces
```csharp
// AWZ.Domain — pure, no UnityEngine
public sealed class GameState { /* gold, gems, owned[], meters{}, encLv{}, enrLv{}, built[], xp, closedAt ... */ }
public interface IGameService { }   // marker; all C*/Fe* services are POCOs constructed with DI
```

### Implementation Guidelines
- `AWZ.Domain.asmdef`: leave "Auto Referenced" on but do NOT add UnityEngine references; a
  compile error if anyone `using UnityEngine` in Domain is the guardrail (forbidden pattern).
- Construct services with constructor injection from `AppBootstrap` (no static singletons).
- ScriptableObjects are mapped to plain Domain DTOs at load (Domain never sees `ScriptableObject`).

## Alternatives Considered
### Alternative 1: MonoBehaviour-everywhere (Unity default)
- **Pros:** least ceremony; familiar.
- **Cons:** logic needs PlayMode to test; ordering/lifecycle bugs (the prototype's class of bug).
- **Rejection Reason:** violates testability standard.

### Alternative 2: Single assembly, discipline-only separation
- **Pros:** simpler project.
- **Cons:** nothing prevents UI→logic coupling or UnityEngine creep into core.
- **Rejection Reason:** asmdef makes the boundary compiler-enforced, not just convention.

## Consequences
### Positive
- Formulas/economy unit-tested headless in CI; portable core; enforced layering.
### Negative
- More project setup; a DTO-mapping layer between ScriptableObjects and Domain.
### Neutral
- Slightly more assemblies → marginally longer compile, negligible at this size.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Team bypasses boundary | Medium | Medium | asmdef compile error + code review checklist |

## Validation Criteria
- [ ] `AWZ.Domain` compiles with zero UnityEngine references.
- [ ] An EditMode test exercises a Domain economy formula with no scene loaded.

## GDD Requirements Addressed
Foundational — no single GDD requirement. Enables testable implementation of every formula-bearing
GDD (C2 economy, C3 level curve, C1 decay, F2 currency, Fe2/Fe3/Fe4 cost formulas).

## Related
- ADR-0001 (engine), ADR-0003 (state pipeline lives in Domain), CLAUDE.md coding standards.
