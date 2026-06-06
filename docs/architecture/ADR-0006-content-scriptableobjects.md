# ADR-0006: Content as ScriptableObjects (Database + Tuning)

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, systems-designer (advisory), economy-designer (advisory)

## Summary
All game content and tuning — the 29-species animal database (F1), the LEVEL_XP curve,
cost multipliers, decay rates, and other balance knobs — live in **ScriptableObject assets**
authored in the Editor, mapped to plain Domain DTOs at load. This satisfies the
"gameplay values must be data-driven, never hardcoded" standard and makes the balance pass
(QQ-03) a config change.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Core / Scripting / Data |
| **Knowledge Risk** | LOW — ScriptableObject is stable across Unity versions |
| **References Consulted** | `docs/engine-reference/unity/current-best-practices.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002 |
| **Enables** | C2 economy, C3 curve, F1 database, Fe2/Fe3/Fe4 costs, the `/balance-check` pass |
| **Blocks** | F1, C2, C3 implementation; balance tuning |
| **Ordering Note** | Needed before any formula-bearing system is coded. |

## Context
### Problem Statement
The prototype hardcoded the species table and balance constants in `data.jsx`. The coding
standard forbids hardcoded gameplay values. The review found ~2× cost-multiplier and decay-rate
gaps that must be re-tunable without code changes.

### Current State
No Unity content yet. Balance values are documented in GDDs + `entities.yaml`.

### Constraints
- Domain assembly (ADR-0002) cannot reference `ScriptableObject` (a UnityEngine type).
- Designers should edit content in the Inspector without recompiling.

### Requirements
- 29-species `AnimalDef` catalogue; derived UNLOCKS/appeal ladder.
- A single `TuningConfig` for cost multipliers, decay rates, caps, offline factors.
- Load-time validation (monotonic appeal ladder, performer/perform sync).

## Decision
- **`AnimalDef` ScriptableObject** (one asset per species, or one catalogue asset holding 29 entries)
  with the 10 GDD fields; an `AnimalDatabase` SO indexes them.
- **`TuningConfig` ScriptableObject** holds all balance knobs (BUY/UPGRADE/ENRICH mult, floors,
  decay-per-hour, caps MAX_ENCLOSURE_LEVEL/MAX_ENRICH_LEVEL, offline rate/caps, XP grants, LEVEL_XP anchors).
- **DTO mapping at load:** `AWZ.Data` reads the SOs and produces plain Domain records (`AnimalRecord`,
  `Tuning`) so `AWZ.Domain` never sees a UnityEngine type. LEVEL_XP/UNLOCKS are computed once from anchors.
- **Validation on load** (Editor + runtime assert): appeal ladder non-decreasing; perform/PERFORMERS in sync.

### Key Interfaces
```csharp
// AWZ.Data (references UnityEngine)
[CreateAssetMenu(menuName="AWZ/Animal Database")]
public sealed class AnimalDatabaseSO : ScriptableObject { public AnimalDefSO[] Species; }
[CreateAssetMenu(menuName="AWZ/Tuning Config")]
public sealed class TuningConfigSO : ScriptableObject { /* all knobs */ }
// AWZ.Domain (pure)
public sealed record AnimalRecord(string Key, int Appeal, int UnlockLevel, /*...*/);
public sealed record Tuning(int BuyCostMult, int UpgradeCostMult, int EnrichCostMult,
    int MaxEnclosureLevel, int MaxEnrichLevel, float OfflineRateFactor, /*...*/);
```

### Implementation Guidelines
- Treat SOs as read-only at runtime (never mutate; they are content, not save state).
- Keep the `entities.yaml` registry as the human source of truth; SO values must match it.
- The balance pass (QQ-03) edits `TuningConfig` only — no code change.

## Alternatives Considered
### Alternative 1: JSON/CSV content files
- **Pros:** editable outside Unity.
- **Cons:** no Inspector authoring/validation, manual parsing.
- **Rejection Reason:** ScriptableObjects are the idiomatic, type-safe, Editor-native choice.
### Alternative 2: Hardcoded C# constants
- **Pros:** simplest.
- **Cons:** violates data-driven standard; recompile to tune.
- **Rejection Reason:** explicitly forbidden by coding standards.

## Consequences
### Positive
- Designer-editable, validated content; balance tuning without code; Domain stays pure.
### Negative
- A DTO-mapping layer to maintain between SO and Domain.
### Neutral
- Content lives as `.asset` files under version control.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| SO values drift from entities.yaml | Medium | Medium | load-time validation + `/consistency-check` |

## Validation Criteria
- [ ] 29 `AnimalDef` assets load into a Domain `AnimalRecord[]`; appeal ladder validated non-decreasing.
- [ ] Changing a multiplier in `TuningConfig` changes cost with no code edit (EditMode test reads Tuning).

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/animal-database.md` | F1 | immutable 29-species data, derived UNLOCKS/ladder | AnimalDatabase SO + load-time derivation |
| `design/gdd/currency-system.md` | F2 | cost multiplier knobs data-driven | TuningConfig SO |
| `design/gdd/zoo-level.md` | C3 | LEVEL_XP from 7 anchors | anchors in TuningConfig, computed at load |
| `design/gdd/zoo-economy.md` | C2 | appeal/seat/capacity constants | TuningConfig SO |

## Related
- ADR-0002 (DTO mapping keeps Domain pure), ADR-0009 (caps live in TuningConfig), architecture QQ-03.
