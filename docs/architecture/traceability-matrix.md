# Requirements Traceability Matrix

**Date:** 2026-06-06
**Source:** `docs/architecture/tr-registry.yaml` (v2) ↔ `docs/architecture/ADR-*.md`
**Produced by:** `/architecture-review` (seed run)

> Maps every registered Technical Requirement to the ADR(s) that govern it, and flags
> coverage gaps. A TR is **covered** when its governing ADR is **Accepted**; **pending**
> when the ADR is identified but not yet written/Accepted.

## ADR status

| ADR | Title | Status |
|-----|-------|--------|
| ADR-0001 | Engine, render pipeline & target platforms | ✅ Accepted |
| ADR-0002 | Assembly boundaries & engine-agnostic domain core | ✅ Accepted |
| ADR-0003 | Game state, ordered mutation pipeline & EventBus | ✅ Accepted |
| ADR-0004 | Save/Load format, location & migration | ✅ Accepted |
| ADR-0005 | Time model: wall-clock decay & offline accrual | ✅ Accepted |
| ADR-0006 | Content as ScriptableObjects (F1 + tuning) | ✅ Accepted |
| ADR-0007 | UI architecture: UI Toolkit screen-controller pattern | ✅ Accepted |
| ADR-0008 | Input System setup | ✅ Accepted |
| ADR-0009 | Economy caps & content-gate enforcement | ✅ Accepted |
| ADR-0010 | Quest progression integrity | ✅ Accepted |

## Coverage by system

| System | TRs | Governing ADRs | Covered (ADR Accepted) | Pending (ADR not written) |
|--------|-----|----------------|------------------------|---------------------------|
| F1 Animal Database | 5 | 0006, 0009 | — | TR-F1-001..005 (need 0006) |
| F2 Currency | 7 | 0003, 0004, 0005, 0006, 0009 | TR-F2-002,003*,004,005*,006 | TR-F2-001*,007 (need 0006/0009) |
| F3 Save/Load | 7 | 0004, 0005 | **all 7 ✅** | — |
| C1 Animal Care | 7 | 0003, 0005, 0006 | TR-C1-001,002,003,004,006,007 | TR-C1-005 (need 0006) |
| C2 Zoo Economy | 6 | 0003, 0005, 0006 | TR-C2-002,006 | TR-C2-001,003,004,005 (need 0006) |
| C3 Zoo Level | 5 | 0003, 0006, 0009 | TR-C3-001,003,004 | TR-C3-002(0006), 005(0009) |
| C4 Taming | 4 | 0003, 0004, 0009 | TR-C4-001,002,004 | TR-C4-003 (need 0009) |
| Fe1 Collection | 3 | 0003, 0009 | TR-Fe1-003 | TR-Fe1-001,002 (need 0009) |
| Fe2 Habitat | 3 | 0006, 0009 | — | all 3 (need 0006/0009) |
| Fe3 Enrichment | 2 | 0003, 0006, 0009 | TR-Fe3-002(partial) | TR-Fe3-001 (need 0009) |
| Fe4 Attractions | 2 | 0006, 0009 | — | both (need 0006/0009) |
| Fe6 Quests | 4 | 0004, 0010 | TR-Fe6-001(partial) | TR-Fe6-002,003,004 (need 0010) |
| Fe7 Idle/Offline | 3 | 0004, 0005 | **all 3 ✅** | — |

\* TRs governed by multiple ADRs are covered for the Accepted portion but not fully closed until all their ADRs are Accepted.

## Summary

- **Total registered TRs:** 51 (architecturally-significant subset of the 126 extracted; remainder are intra-system detail captured in the GDDs).
- **Fully covered now:** **all 51 TRs** — every governing ADR (ADR-0001…ADR-0010) is Accepted as of 2026-06-06.
- **No orphan TRs:** every TR maps to at least one Accepted ADR.
- **No Foundation-layer gaps:** F1/F2/F3 TRs are all covered (F1 closed by ADR-0006).
- **Presentation layer (P1–P7):** no TRs yet — those are UX specs, produced by `/ux-design`, not GDD TRs.

## Remaining (not blocking traceability)

- Per-screen UX specs (P1–P7) via `/ux-design [screen]` — Presentation layer, separate from TR coverage.
- `/balance-check` to retune the cost multipliers & decay rate via `TuningConfig` (architecture QQ-03).
- `/create-control-manifest` to extract the flat programmer rules sheet from the 10 Accepted ADRs.

## Verdict: ✅ COVERED

All 10 ADRs Accepted; all 51 registered TRs map to an Accepted ADR; **zero Foundation-layer gaps**.
Architecture traceability is complete for the MVP system set.
