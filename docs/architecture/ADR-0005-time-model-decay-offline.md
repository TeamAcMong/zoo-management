# ADR-0005: Time Model — Wall-Clock Decay & Offline Accrual

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, economy-designer (advisory)

## Summary
Care-stat decay and offline earnings are computed from **wall-clock `DateTime.UtcNow` deltas**,
not frame/session ticks; a single `TickService` drives a 1-second income cadence and a wall-clock
decay cadence through `GameController.Tick`. This fixes the prototype's "decay 100–1000× too fast,
active-only" problem (review D-B1) and makes Fe7 offline accrual real.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Core / Scripting |
| **Knowledge Risk** | LOW — `Time`, `DateTime`, `MonoBehaviour.Update` are stable |
| **References Consulted** | `current-best-practices.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | Device clock-change/backwards-clock handling |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0003, ADR-0004 |
| **Enables** | C1 decay, Fe7 offline, C2 income loop |
| **Blocks** | C1, C2, Fe7 implementation |
| **Ordering Note** | Needs closedAt (ADR-0004) and the Tick pipeline (ADR-0003). |

## Context
### Problem Statement
The prototype decayed stats per 12 s frame-tick only while the app was open, draining a full stat
in 2.5–6.7 min of active play and not at all offline — the inverse of an idle game (review D-B1).
Offline earnings were faked (no elapsed computation).

### Current State
`setInterval` decay (active only); offline modal hardcoded; no time source persisted.

### Constraints
- Mobile/WebGL apps are frequently closed → elapsed time must be reconstructable from `closedAt`.
- Players can change the device clock → guard against negative/huge deltas.

### Requirements
- Decay measured in real elapsed seconds, tuned to a ~daily cadence (per `animal-care.md` OQ-3).
- Offline gold = `floor(min(elapsed, cap) × goldPerSec × 0.60)`, cap 8 h free / 24 h VIP.
- Income accrues 1×/second of real time while active.

## Decision
- **`TickService`** (MonoBehaviour) accumulates `Time.deltaTime` and tracks `DateTime.UtcNow`:
  - every real 1.0 s → `GameController.Tick` grants `C2.GoldPerSec()`;
  - decay applied on a wall-clock cadence using elapsed real seconds (not frame count).
- **On resume** (`AppBootstrap` after load): `elapsed = clamp(UtcNow − closedAt, 0, cap)`;
  `Fe7.ComputeOffline(elapsed)` produces a pending reward at 0.60× the reconstructed C2 rate.
- **Clock guard:** if `elapsed ≤ 0` (clock moved back) → accrue 0; cap upper bound at the offline cap.
- **Decay tuning** is data-driven (ScriptableObject) so the recalibration (QQ-03) is a config change, not code.

### Architecture
```
TickService.Update(dt):
  acc += dt
  while acc >= 1.0: GameController.Tick(income) ; acc -= 1.0
  decay cadence keyed off real elapsed seconds (wall-clock)
Resume: elapsed = clamp(UtcNow - closedAt, 0, cap) → Fe7.ComputeOffline → pending modal
```

### Key Interfaces
```csharp
public sealed class TickService : MonoBehaviour { /* drives GameController.Tick(dt, DateTime.UtcNow) */ }
public interface IIdleService {
    OfflineReward ComputeOffline(TimeSpan elapsed, long goldPerSec); // floor(min(elapsed,cap)*rate*0.60)
    void CollectPending();
}
```

### Implementation Guidelines
- Single decay basis: define stat decay as "points per real hour" in tuning, convert to elapsed seconds.
- Offline reward uses the C2 rate reconstructed from saved state (happiness basis = pre-close meters; resolve resume-frame basis per review S-B3 by recomputing happyMult once on resume, then applying decay forward).
- Do not double count: offline accrues against `[closedAt, now]`; the active 1 s loop starts only after resume.

## Alternatives Considered
### Alternative 1: Frame-tick decay (prototype)
- **Pros:** trivial.
- **Cons:** session-dependent, punishes active play, no offline meaning.
- **Rejection Reason:** the bug we are fixing.
### Alternative 2: Server-authoritative time
- **Pros:** tamper-resistant.
- **Cons:** requires a backend; single-player game.
- **Rejection Reason:** out of scope; local clock guard is sufficient for a non-competitive idle game.

## Consequences
### Positive
- Idle cadence matches the pillars ("daily care as ritual / slow & intentional"); offline real.
### Negative
- Local clock is trust-based → mild exploit surface (acceptable, single-player).
### Neutral
- Decay rate becomes a balance knob (set during `/balance-check`, QQ-03).

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Clock manipulation farms offline gold | Medium | Low | clamp negative; cap; single-player so low stakes |
| Resume-frame happiness ambiguity (S-B3) | Medium | Medium | recompute happyMult once on resume, then decay forward |

## Validation Criteria
- [ ] Stat decays at the configured per-hour rate in an EditMode test using injected elapsed seconds.
- [ ] Offline reward = `floor(min(elapsed,cap)*rate*0.60)`; negative/zero elapsed → 0.
- [ ] No gold double-count across the resume boundary.

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/animal-care.md` | C1 | decay over time (recalibrated, OQ-3) | wall-clock decay, data-driven rate |
| `design/gdd/idle-offline.md` | Fe7 | offline = floor(min(elapsed,cap)*rate*0.60) | computed from closedAt on resume |
| `design/gdd/zoo-economy.md` | C2 | 1/sec income while active | TickService 1 s cadence |

## Related
- ADR-0003 (Tick pipeline), ADR-0004 (closedAt), review D-B1/S-B3, architecture QQ-03.
