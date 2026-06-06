# ADR-0008: Input System Setup

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, unity-specialist (advisory)

## Summary
Use the **Input System package** (Unity 6 default) for any world-space input; **UI Toolkit
handles its own UI element events**. The game is tap/click-only (no gamepad, no gestures),
so the input surface is intentionally minimal.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Input |
| **Knowledge Risk** | MEDIUM — new Input System is the post-cutoff default (legacy Input deprecated) |
| **References Consulted** | `docs/engine-reference/unity/modules/input.md`, `current-best-practices.md` |
| **Post-Cutoff APIs Used** | `UnityEngine.InputSystem` (default in Unity 6) |
| **Verification Required** | Touch + pointer on mobile and WebGL; no reliance on legacy `Input` class |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001, ADR-0007 |
| **Enables** | P2 Zoo Map world taps; any future drag/zoom |
| **Blocks** | Map/world-interaction stories |
| **Ordering Note** | Minimal surface; can be set up alongside the first world screen. |

## Context
### Problem Statement
Unity 6 makes the new Input System the default and deprecates the legacy `Input` class. We must
choose the input approach, but the game's needs are tiny (tap/click), so the decision is mostly
"use the modern default and keep it minimal."

### Current State
No Unity input yet. Prototype used DOM click/touch handlers.

### Constraints
- Touch-first mobile + pointer on WebGL; no gamepad, no precision gestures.
- UI Toolkit already routes UI element clicks/pointer events itself.

### Requirements
- Tap/click on world sprites (e.g. tapping an animal on the Zoo Map).
- Cross-platform pointer/touch with no legacy `Input` usage.

## Decision
- Install **`com.unity.inputsystem`**; set the project to the new Input System (or Both during migration).
- **UI events** (buttons, lists) are handled by **UI Toolkit** natively — do not route these through Input Actions.
- **World taps** use a single Input Action ("Tap"/"Point") → raycast/pick the 2D sprite under the pointer.
- No gamepad bindings; no gesture recognizers for MVP.

### Key Interfaces
```csharp
public sealed class WorldTapInput : MonoBehaviour {
    // reads a "Tap" InputAction; on performed → pick 2D collider under pointer → publish WorldTapCmd(key)
}
```

### Implementation Guidelines
- Never use the legacy `UnityEngine.Input` class (forbidden — deprecated in Unity 6).
- Keep one small `.inputactions` asset; generate the C# wrapper.
- Let UI Toolkit consume UI pointer events first; world tap only fires when not over UI.

## Alternatives Considered
### Alternative 1: Legacy Input Manager
- **Pros:** familiar.
- **Cons:** deprecated default-off in Unity 6.
- **Rejection Reason:** against the engine's current direction.
### Alternative 2: UI Toolkit only (no Input System at all)
- **Pros:** less setup.
- **Cons:** no clean path for world-space (non-UI) taps on the Zoo Map.
- **Rejection Reason:** P2 needs world taps; Input System is the right tool and is already the default.

## Consequences
### Positive
- Modern, cross-platform input; minimal surface; clean UI/world separation.
### Negative
- Slight setup overhead for a tiny input need.
### Neutral
- One `.inputactions` asset to maintain.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| UI/world tap double-handling | Low | Low | gate world tap on "pointer not over UI" |

## Validation Criteria
- [ ] Tapping a world sprite publishes a command; tapping a UI button does NOT also trigger a world tap.
- [ ] No reference to legacy `UnityEngine.Input` anywhere (grep clean).

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/animal-care.md` | C1/P2/P3 | tap an animal to care | world Tap action → pick → care command |
| (UX) | P2 Zoo Map | tap animals/enclosures | Input System world tap |

## Related
- ADR-0007 (UI Toolkit handles UI events), `modules/input.md`, `design/ux/interaction-patterns.md`.
