# ADR-0010: Quest Progression Integrity

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, game-designer (advisory)

## Summary
Quest claims are **idempotent via a persisted claimed-set keyed by quest id**, and progress
counters **increment on action completion, not on start**. This fixes the review's double-claim
exploit (S-B4) and the start-cancel-restart farm (S-W3), and makes quest state safe across the
F3 save/migration boundary.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Core (pure logic) |
| **Knowledge Risk** | LOW — pure C# |
| **References Consulted** | — |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0003, ADR-0004 |
| **Enables** | Fe6 Quests/Missions; daily-mission Gem faucet |
| **Blocks** | Quest stories |
| **Ordering Note** | Claimed-set is persisted (ADR-0004); claim runs in the command pipeline (ADR-0003). |

## Context
### Problem Statement
The review found quest claims were guarded only by an advancing cursor and counters bumped on
activity *start*. Once persistence exists, a migration that resets the cursor independently of
counters allows re-claiming chapters (12,900🪙 / 9,800 XP double-dip), and starting then cancelling
an activity farms quest progress.

### Current State
Prototype: `chapterIdx`/`serviceIdx` cursors, `counts{}` bumped in `runActivity()` (on start), no
explicit idempotency key, nothing persisted.

### Constraints
- Must survive F3 save/migration without enabling re-claims.
- Daily missions reset on a 24h UTC cadence but must not wipe lifetime quest claims.

### Requirements
- A claim grants its reward exactly once, ever (idempotent), regardless of cursor manipulation.
- Counters reflect completed actions only.
- Daily missions: 5/day, unlock Lv7, 24h UTC reset, 5–15 gems/mission (the free Gem faucet).

## Decision
- **Persisted `claimed` set** (quest ids) in the save blob (ADR-0004). `Claim(questId)` is a no-op if
  `claimed.Contains(questId)`; otherwise grant reward and add the id. The cursor (`chapterIdx`) is a
  convenience pointer, **not** the integrity mechanism.
- **Counters bump on completion:** `Bump(counter)` is called in `finishActivity`/action-success, never on start.
- **Daily missions:** a `dailyResetAtUtc` timestamp + `dailyCounts`; on load/midnight-UTC cross, reset
  daily mission slots only (not `claimed`). Gem reward 5–15/mission, 5/day → ≤75/day faucet.
- Migrations must preserve `claimed`; any cursor reset is harmless because claims are idempotent.

### Key Interfaces
```csharp
public interface IQuestService {
    void Bump(CounterType c);            // ONLY from action completion
    Result Claim(string questId);        // no-op if already in claimed set
    int Progress(string questId);        // 'owned'/'level'/counts[t]
    void RolloverDailyIfDue(DateTime utcNow);
}
```

### Implementation Guidelines
- Never key claim-prevention on the cursor alone (the prototype's bug); always check `claimed`.
- `Bump` calls live in the success path of the action command (ADR-0003), after the action is applied.
- Daily rollover resets only daily slots; lifetime `counts` and `claimed` persist.

## Alternatives Considered
### Alternative 1: Cursor-only claim prevention (prototype)
- **Pros:** simplest.
- **Cons:** breaks on any cursor reset → re-claim exploit.
- **Rejection Reason:** the exact bug the review flagged (S-B4).
### Alternative 2: Server-validated claims
- **Pros:** tamper-proof.
- **Cons:** requires backend; single-player game.
- **Rejection Reason:** out of scope; idempotent local claimed-set is sufficient.

## Consequences
### Positive
- No double-claim; no start-cancel farm; migration-safe; daily Gem faucet enabled (fixes review D-B3).
### Negative
- Slightly larger save (a claimed-id set) — negligible.
### Neutral
- Cursor becomes a UX pointer, not an integrity gate.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Counter bump placed on start by mistake | Medium | Medium | code review + test: cancel mid-activity grants no progress |

## Validation Criteria
- [ ] Claiming the same quest twice grants reward once (idempotent), even after a cursor reset.
- [ ] Starting then cancelling an activity adds zero quest progress.
- [ ] Daily rollover resets daily slots but preserves `claimed` and lifetime `counts`.

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/quests-missions.md` | Fe6 | claim once; counters; daily missions | claimed-set idempotency + bump-on-completion + daily rollover |
| `design/gdd/currency-system.md` | F2 | daily-mission Gem faucet | ≤75 gems/day via daily missions |

## Related
- ADR-0003 (bump in command success path), ADR-0004 (claimed-set persisted), review S-B4/S-W3/D-B3.
