# Architecture Review Report

**Date:** 2026-06-08 (re-run)
**Engine:** Unity 6.3 LTS (`6000.3.17f1`), 2D / URP 2D
**Mode:** full
**GDDs in scope:** 13 authoritative system GDDs + 2 proposed-redesign (`economy-redesign.md`, `xp-pacing-redesign-2026-06-08.md`) + concept + systems-index
**ADRs:** 10 (ADR-0001…ADR-0010, all Accepted) — unchanged since the prior 2026-06-08 run
**Produced by:** `/architecture-review`

> Companion: `docs/architecture/traceability-matrix.md` (per-TR detail), `docs/architecture/tr-registry.yaml` (v2, 58 active TRs).
> `docs/consistency-failures.md` absent — no known-conflict history.

---

## Traceability Summary (authoritative set)

| | Count |
|---|---|
| Registered TRs (tr-registry v2, all `active`) | 58 |
| ✅ Covered by an Accepted ADR | 58 |
| ⚠️ Partial | 0 |
| ❌ Gaps | 0 |

The current authoritative MVP design (13 reverse-documented GDDs + flat economy) is fully covered and **unchanged** since the earlier run this session. Zero Foundation-layer gaps. Presentation layer (P1–P7) intentionally carries no TRs (UX specs, not GDD TRs).

> **Doc bug (carried, unfixed):** `traceability-matrix.md` summary states "51" total TRs; the registry and the matrix's own per-system table both sum to **58**. Correct on next registry write.

---

## NEW: Proposed-Redesign Coverage Analysis

The two `proposed-redesign` GDDs are **not yet adopted** (economy model not chosen; `XP_PER_VISITOR` uncalibrated). They are not authoritative and do **not** change the verdict on the current set. They introduce architecturally-significant requirements the Accepted ADRs do not cover — real work **only if/when adopted**:

| # | New requirement | Source | Nearest ADR | Status | Action if adopted |
|---|---|---|---|---|---|
| PR-1 | Day/Night free-running clock (`phase = now mod 300s`; `timeMult` scales demand; net-neutral avg ≈1.0; gated Lv18) — a *second time domain* | economy-redesign | ADR-0005 | ⚠️ PARTIAL — ADR-0005 covers only wall-clock decay + offline | Amend ADR-0005 (or new ADR) to define the within-session visitor clock alongside the wall-clock domain |
| PR-2 | Offline XP accrual (`floor(min(elapsed,cap)×xpPerSec×0.6)`, recompute from state) | xp-pacing-redesign | ADR-0005 | ⚠️ PARTIAL — offline accrual is gold-only | Amend ADR-0005 to cover XP accrual symmetrically |
| PR-3 | Passive Education XP per second tied to `visitors` in the tick pipeline (new faucet) | xp-pacing-redesign | ADR-0003 / ADR-0005 | ⚠️ PARTIAL — tick grants gold only | Amend ADR-0003/0005; add domain `XpPerSec()` mirroring `GoldPerSec()` |
| PR-4 | Weekly + monthly/event XP cadence & event lump faucet | xp-pacing-redesign | ADR-0010 | ⚠️ PARTIAL — ADR-0010 covers daily reset/idempotency only | Amend ADR-0010 to generalise cadence (daily/weekly/monthly) + event-scoped counters |
| PR-5 | Crowd Surge transient buff (`lastShowAt`, time-window) | economy-redesign | ADR-0004 / ADR-0003 | ⚠️ PARTIAL — `lastShowAt` not in save schema | Add `lastShowAt` to schema (migration); window check is domain logic |
| PR-6 | Prestige / Zoo Tour soft-reset (reset state subset + persistent multiplier) | economy-redesign (Move 3) | — | ❌ GAP (post-MVP / roadmap Q4) | New ADR when prestige is scheduled; low priority |
| — | Role-differentiated sinks; Comfort Levels; show-XP scaling | both | ADR-0003/0006/0009 | ✅ COVERED | Formula/tuning changes only — no new architecture; re-run `/balance-check` |

**Cross-cutting sequencing dependency:** PR-3 reads `visitors`, whose magnitude depends on which economy model is chosen (flat `zoo-economy.md` vs `economy-redesign.md`, which strips the enclosure→appeal term). **Lock the economy model before finalising any PR-1…PR-3 ADR amendment or the `XP_PER_VISITOR` constant.** This is a design-decision ordering issue, not an ADR conflict.

---

## Cross-ADR Conflicts

**None.** ADRs are unchanged and internally consistent across all six conflict classes (data ownership, integration contract, performance budget, dependency, pattern, state). `TR-C4-004` (show-reward formula "interim-owned pending Fe5") remains a documented placeholder (QQ-04), not a conflict.

## ADR Dependency Order

Unchanged, acyclic, all dependencies Accepted:

```
Foundation:        0001
                    └─ 0002
Core:               ├─ 0003   ├─ 0006
Cross-cutting:      0004(←0002,0003)  0007(←0001,0003)  0009(←0003,0006)
Leaf:               0005(←0003,0004)  0008(←0001,0007)  0010(←0003,0004)
```
No dependency cycles. No ADR depends on a Proposed/missing ADR.

## GDD Revision Flags

**None** — no HIGH-RISK engine findings; no GDD assumption contradicts verified engine behaviour. The proposed redesigns' Day/Night clock uses `DateTime` (same primitive as ADR-0005), introducing no new engine API.

## Engine Compatibility Issues

**Unchanged from the earlier run this session.** No ADR was modified. Audit result stands: zero deprecated API references, consistent Unity 6.3 targeting, UI Toolkit + Input System verified against the pinned reference, no DOTS/Addressables for MVP. The unity-specialist consultation from the earlier run still applies (the consult surfaced implementation-level refinements for ADR-0004 JsonUtility/Dictionary, ADR-0004 WebGL `beforeunload` flush, ADR-0008 UI-Toolkit pointer gating + "New Input System only", ADR-0007 `ScreenController.Root` caching + `OnDisable` unregistration, ADR-0001 WebGPU default, ADR-0002 EventBus interfaces in Domain). The proposed redesigns add no new engine-touching decisions, so the specialist was **not re-spawned**.

## Architecture Document Coverage

`architecture.md` (v1.0) covers the current/flat model and explicitly defers Fe5/Fe8. It does not yet reflect the two redesigns — expected, since they are proposed. No orphaned architecture. If a redesign is adopted, `architecture.md` and the ADRs in the PR-table must be updated.

---

## Verdict: ✅ PASS (authoritative set) · ⚠️ CONDITIONAL CONCERNS (if redesigns adopted)

- **Current authoritative MVP design:** all 58 TRs covered by Accepted ADRs, no conflicts, no cycles, engine consistent → **PASS** (unchanged).
- **If the economy and/or XP redesigns are adopted:** ~5 ADR amendments + 1 deferred new ADR are needed (PR-table). Not blocking now (redesigns unadopted) — a forward-looking work list.

### Recommended sequence (only if proceeding with redesigns)
1. **Lock the economy model** (flat vs `economy-redesign`) — gates everything else.
2. Amend **ADR-0005** (PR-1 Day/Night clock + PR-2 offline XP), **ADR-0003** (PR-3 per-second XP faucet), **ADR-0010** (PR-4 weekly/monthly/event cadence); add `lastShowAt` to **ADR-0004** schema (PR-5).
3. `/balance-check` for role-differentiated sinks + `S` / `XP_PER_VISITOR` calibration.
4. Defer PR-6 (prestige) to its roadmap quarter.

### Pre-Gate Checklist — all ✅
- ✅ Test infra (`tests/EditMode/` + `tests/PlayMode/`) · ✅ CI (`.github/workflows/tests.yml`) · ✅ `design/ux/accessibility-requirements.md` · ✅ `design/ux/interaction-patterns.md`

`/gate-check pre-production` is available for the current design set.

### Note on implementation conformance (out of review scope, carried)

The architecture passes, but `systems-index.md` / `production/implementation-gaps.md` document that the shipping C# code diverges from the Accepted ADRs (dual bootstrap path that never calls Save/Idle; C2 `happy_mult` missing; per-animal meters not serialized). These are **implementation conformance gaps**, not architecture coverage gaps — highest-priority dev work, belong in stories, not new ADRs.
