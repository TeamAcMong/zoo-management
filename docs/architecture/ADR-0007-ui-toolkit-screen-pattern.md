# ADR-0007: UI Architecture — UI Toolkit Screen-Controller Pattern

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, unity-ui-specialist (advisory), ux-designer (advisory)

## Summary
All runtime UI uses **UI Toolkit (UXML + USS)** with **one screen controller per view**
(P1–P7), bound to the domain via EventBus snapshots. UGUI is not used. This is the Unity 6
production-default UI and maps cleanly from the React/DOM prototype (UXML≈JSX, USS≈CSS).

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | UI |
| **Knowledge Risk** | MEDIUM — UI Toolkit runtime is post-cutoff (production-ready in Unity 6) |
| **References Consulted** | `docs/engine-reference/unity/modules/ui.md`, `current-best-practices.md` |
| **Post-Cutoff APIs Used** | `UIDocument`, `UnityEngine.UIElements` runtime UI (Unity 6) |
| **Verification Required** | UI Toolkit `ListView` virtualization + touch input on mobile/WebGL |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001, ADR-0003 |
| **Enables** | P1–P7 screens; `/ux-design` per-screen specs |
| **Blocks** | Presentation-layer epics |
| **Ordering Note** | Establish the screen pattern before building any screen. |

## Context
### Problem Statement
The game is UI-heavy (7 screens) and touch-first. We must pick a UI system and a consistent
screen structure before building any view, and keep UI decoupled from logic (review wanted this).

### Current State
React component tree in the prototype; no Unity UI yet.

### Constraints
- UGUI is deprecated for new projects in Unity 6 (per reference); UI Toolkit is recommended.
- UI must read domain state via events (ADR-0003), never mutate it directly.

### Requirements
- One controller per screen; shared theme (USS tokens); reusable list item templates.
- 60 fps with long lists (29 species, quest list) → virtualization.
- Touch-first, no hover-only affordances (see interaction-patterns).

## Decision
- **UI Toolkit** for all runtime UI. Each screen = one `UIDocument` + one MonoBehaviour controller in `AWZ.UI`.
- Controllers `Q<>()` elements in `OnEnable`, register callbacks, and subscribe to typed EventBus
  events; they re-render from the published snapshot. They emit commands via EventBus (never call services directly).
- **Shared USS theme** holds design tokens (color/space/type) + state classes (`.is-disabled/.is-gated/.is-pressed`).
- Long lists use `ListView` with reusable item templates (virtualized).
- Navigation: a root controller hosts the bottom tab bar and swaps screen documents.

### Architecture
```
UIDocument(HudScreen.uxml + .uss) ── HudScreenController (AWZ.UI)
   ├─ subscribe(StateChanged) → refresh labels/bars from snapshot
   └─ button.clicked → EventBus.Publish(Command)   (never touches services/GameState)
Shared theme.uss (tokens + state classes) imported by every screen
```

### Key Interfaces
```csharp
public abstract class ScreenController : MonoBehaviour {
    protected VisualElement Root => GetComponent<UIDocument>().rootVisualElement;
    protected abstract void Bind();      // Q<> + register callbacks in OnEnable
    protected abstract void Refresh(GameStateSnapshot s); // on StateChanged
}
```

### Implementation Guidelines
- No inline element styling — use USS classes (forbidden pattern: per-element inline style for state).
- Externalize all strings (localization-ready, accessibility); no text baked into sprites.
- Honour reduce-motion + ≥44 pt touch targets (accessibility-requirements.md).

## Alternatives Considered
### Alternative 1: UGUI (Canvas)
- **Pros:** more tutorials; mature.
- **Cons:** deprecated for new projects in Unity 6; heavier for complex/dynamic UI.
- **Rejection Reason:** reference recommends UI Toolkit; better fit for this data-driven UI.
### Alternative 2: Hybrid (UGUI + UI Toolkit)
- **Pros:** flexibility.
- **Cons:** two UI stacks to maintain; inconsistent.
- **Rejection Reason:** unnecessary complexity for a 7-screen game.

## Consequences
### Positive
- Modern, performant, CSS-like styling; clean prototype→Unity mapping; decoupled UI.
### Negative
- UI Toolkit runtime is newer → smaller community for edge cases (MEDIUM risk).
### Neutral
- USS theme becomes the single styling source.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| UI Toolkit runtime edge cases on WebGL/mobile | Medium | Medium | spike key controls early; reference modules/ui.md |

## Validation Criteria
- [ ] One screen built end-to-end (HUD): binds to EventBus, refreshes on StateChanged, ≥44 pt targets.
- [ ] A 29-item species `ListView` scrolls at 60 fps on a reference mobile device.

## GDD Requirements Addressed
Foundational/Presentation — no single GDD requirement; enables P1–P7 (HUD, Map, Care, Animals,
Attractions, Quests, Tutorial) UI implementation referenced across all GDD "UI Requirements" sections.

## Related
- ADR-0003 (EventBus snapshots), ADR-0008 (input), `design/ux/interaction-patterns.md`, `modules/ui.md`.
