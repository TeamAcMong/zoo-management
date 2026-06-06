# ADR-0009: Economy Caps & Content-Gate Enforcement

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, economy-designer (advisory), game-designer (advisory)

## Summary
All caps and content gates — enclosure level ≤5, enrichment level ≤5, attraction unlock-level,
trust gates (Petting ≥40 / Performer ≥80), gold-only animal purchase, and buy-more capacity —
are **enforced in the domain layer at the single mutation site** (the command), returning a typed
rejection. This fixes the prototype's missing guards (review D-B4, S-B1, S-W6, C4-003).

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Core (pure logic) |
| **Knowledge Risk** | LOW — pure C# guards |
| **References Consulted** | — |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0003, ADR-0006 |
| **Enables** | Fe1, Fe2, Fe3, Fe4 builds/upgrades; C4 gated content |
| **Blocks** | Feature-layer build/upgrade stories |
| **Ordering Note** | Cap values come from TuningConfig (ADR-0006); enforcement lives in commands (ADR-0003). |

## Context
### Problem Statement
The review found that the prototype does NOT enforce key gates/caps: enclosure can exceed Lv5,
enrichment is unbounded (uncapped appeal — economy break), attractions ignore their unlock level,
and trust "gates" are data-only. These produce runaway economy and out-of-order progression.

### Current State
Prototype mutation sites lacked guards (`upgradeEnc`, `addEnrichment`, `buildAttraction`); trust gates
were string/flag checks, never numeric trust.

### Constraints
- Enforcement must be at the single mutation site (ADR-0003) so it cannot be bypassed.
- Cap values are tuning data (ADR-0006), not hardcoded.

### Requirements
- Hard caps: `encLv ≤ MAX_ENCLOSURE_LEVEL(5)`, `enrLv ≤ MAX_ENRICH_LEVEL(5)`.
- Gates: attraction `level ≥ unlockLevel`; species adopt `level ≥ unlockLevel`; buy-more `count < capOf`.
- Trust gates: Petting requires `trust ≥ 40`, Performer requires `trust ≥ 80` (numeric, per-animal).
- Animals never purchasable with Gems.
- Every rejection is typed/observable (UI shows the reason; gated ≠ hidden).

## Decision
Each relevant command validates its guard before mutating and returns a `Result` (ok / reason):
- `UpgradeEnclosureCmd`: reject if `encLv ≥ MaxEnclosureLevel` or gold insufficient.
- `AddEnrichmentCmd`: reject if `enrLv ≥ MaxEnrichLevel` or gold insufficient.
- `BuildAttractionCmd`: reject if `level < unlockLevel`, already built, or gold insufficient.
- `UnlockAnimalCmd`: reject if `level < unlockLevel` or gold insufficient; payment is Gold only.
- `BuyMoreCmd`: reject if `count ≥ capOf(encLv)`.
- Trust gates (`CanPet`, `CanPerform`) check `meters[key].trust ≥ threshold` from TuningConfig.

### Key Interfaces
```csharp
public readonly struct Result { public bool Ok; public string Reason; }   // Reason → UI gated message
// in C4 TamingService
bool CanPet(string key)     => Trust(key) >= _tuning.PettingTrustThreshold;   // 40
bool CanPerform(string key) => Trust(key) >= _tuning.PerformerTrustThreshold; // 80
```

### Implementation Guidelines
- Cap/threshold values come from `TuningConfig` (ADR-0006) — never inline literals.
- Reject early in the command's `Execute`; do not partially mutate then roll back.
- UI surfaces `Result.Reason` as the gated-state label (interaction-patterns §3).

## Alternatives Considered
### Alternative 1: Enforce in UI (disable buttons only)
- **Pros:** simplest UX.
- **Cons:** logic bypassable; not testable headless; the prototype's exact failure.
- **Rejection Reason:** gates must be authoritative in the domain.
### Alternative 2: Soft caps (diminishing returns instead of hard caps)
- **Pros:** smoother curve.
- **Cons:** more tuning; the GDDs specify hard caps (Lv5).
- **Rejection Reason:** matches GDD intent; revisit only via balance pass.

## Consequences
### Positive
- No runaway economy; correct progression order; testable gates; honest gated UI.
### Negative
- Every gated action needs a command + test.
### Neutral
- Caps are tunable data.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| A new mutation path bypasses a guard | Low | High | single-mutation-site rule (ADR-0003) + tests per cap |

## Validation Criteria
- [ ] EditMode tests: upgrade rejected at encLv 5; enrichment rejected at enrLv 5.
- [ ] Build rejected when level < unlock; buy-more rejected at capacity; gem-pay for animal rejected.
- [ ] Pet/perform rejected below trust 40/80; allowed at/above.

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/habitat-system.md` | Fe2 | enclosure cap Lv5 | UpgradeEnclosureCmd guard |
| `design/gdd/enrichment.md` | Fe3 | enrichment cap | AddEnrichmentCmd guard (MAX_ENRICH_LEVEL) |
| `design/gdd/attractions.md` | Fe4 | build gated by unlock level | BuildAttractionCmd guard |
| `design/gdd/animal-collection.md` | Fe1 | level/gold gate, gold-only, capacity | Unlock/BuyMore guards |
| `design/gdd/taming.md` | C4 | trust gates 40/80 | numeric trust checks |
| `design/gdd/currency-system.md` | F2 | animals never bought with Gems | payment-type guard |

## Related
- ADR-0003 (single mutation site), ADR-0006 (cap values), review D-B4/S-B1/S-W6/C4-003.
