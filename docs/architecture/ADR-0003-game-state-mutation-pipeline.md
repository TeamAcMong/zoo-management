# ADR-0003: Game State, Ordered Mutation Pipeline & EventBus

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director

## Summary
A single authoritative `GameState` is mutated **only** through `GameController.Apply(command)`
in one explicit ordered step; systems communicate via an in-process **EventBus**, and UI reads
state from published snapshots. This removes the React prototype's hidden-batching ordering
ambiguity (review S-W1).

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Core / Scripting |
| **Knowledge Risk** | LOW — plain C# patterns |
| **References Consulted** | `current-best-practices.md` (C# 9 patterns) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002 |
| **Enables** | ADR-0009, ADR-0010; all gameplay services |
| **Blocks** | C1–C4, Fe1–Fe7 implementation |
| **Ordering Note** | Defines how every system mutates state; precede gameplay coding. |

## Context
### Problem Statement
The review found that a single care tap fans out to currency + XP + level-up + quest-counter,
and the prototype only *happened* to be correct via React batching — the ordering was never an
invariant (S-W1). Multi-level-ups, unlock gates, and quest counters need deterministic ordering.

### Current State
Prototype mutated many `useState` hooks per action; order was implicit and untestable.

### Constraints
- Unity is single-threaded for gameplay (main thread) — no real concurrency, but call order matters.
- UI must not be tightly coupled to services (review wanted decoupling).

### Requirements
- One place owns "apply XP → derive level → fire unlock → bump quest counter," in that order.
- Systems publish/subscribe without direct references; UI refreshes from events.

## Decision
- **Single `GameState`** owned by `GameController` (in `AWZ.Runtime`, state type in `AWZ.Domain`).
- **All mutations go through `GameController.Apply(ICommand)`**, which runs the command's ordered steps synchronously, then publishes one `StateChanged` event.
- **EventBus** (POCO): `Publish<T>` / `Subscribe<T>`; used for commands (UI→controller) and notifications (controller→UI).
- UI screen controllers subscribe to typed events and re-render from the snapshot; they never mutate `GameState` directly.

### Architecture
```
UI Button.clicked ─► EventBus.Publish(CareActionCmd)
   └─► GameController.Apply(cmd)  [ordered, synchronous]:
         1 F2.TryPay      2 C1.DoAction      3 C3.AddXp→deriveLevel→unlockGate
         4 Fe6.Bump       5 EventBus.Publish(StateChanged)
UI subscribes(StateChanged) ─► refresh from snapshot
```

### Key Interfaces
```csharp
public interface ICommand { void Execute(GameState s, ServiceRegistry svc); }
public sealed class GameController {
    public void Apply(ICommand cmd);          // ordered; one StateChanged after
    public void Tick(float dt, DateTime utcNow);
}
public interface IEventBus {
    void Publish<T>(T evt);
    IDisposable Subscribe<T>(Action<T> handler);
}
```

### Implementation Guidelines
- Commands are small structs/classes in Domain; `Apply` is the only mutation entry point (forbidden-pattern guard).
- Level-up emits `LevelUp{from,to}` once even across multi-level jumps; unlock gate runs after level is final (fixes review I1/S-W1).
- Keep `Apply` synchronous — no async inside a command (determinism).

## Alternatives Considered
### Alternative 1: Services mutate their own state directly + C# events
- **Pros:** less boilerplate.
- **Cons:** reintroduces implicit ordering; hard to test the cross-system sequence.
- **Rejection Reason:** the exact problem the review flagged.

### Alternative 2: Full Redux-style reducer per field
- **Pros:** very explicit.
- **Cons:** heavy ceremony for a small game.
- **Rejection Reason:** over-engineered; command pipeline gives the ordering guarantee with less code.

## Consequences
### Positive
- Deterministic, testable mutation order; decoupled UI; one audit point for all state changes.
### Negative
- Every action is a command type — modest boilerplate.
### Neutral
- EventBus is a light pub/sub, not a framework.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Devs mutate GameState outside Apply | Medium | High | forbidden pattern + review + internal setters |

## Validation Criteria
- [ ] EditMode test: a care command produces gold-, xp-, level-, quest-counter changes in the specified order.
- [ ] A two-level XP grant raises exactly one `LevelUp{from,to}` and applies both unlocks.

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/animal-care.md` | C1 | care action: pay→adjust→+3 XP→bump counter | ordered steps in one command |
| `design/gdd/zoo-level.md` | C3 | XP→derive level→unlock gate; single level-up announce | level derive + unlock inside Apply, one event |
| `design/gdd/quests-missions.md` | Fe6 | counters bumped by actions | step 4 of the command pipeline |

## Related
- ADR-0002 (assemblies), ADR-0005 (Tick uses same pipeline), ADR-0009/0010 (gates & quest integrity).
