# Consistency Check Report

**Date:** 2026-06-06
**Registry entries checked:** 0 entities, 0 items, 12 formulas, 36 constants
**GDDs scanned:** 13 system GDDs — animal-care, animal-collection, animal-database,
attractions, currency-system, enrichment, habitat-system, idle-offline,
quests-missions, save-load, taming, zoo-economy, zoo-level
(excluded: game-concept.md, systems-index.md)

---

## Verdict: ✅ PASS

No cross-document conflicts found. Every shared value defined in
`design/registry/entities.yaml` is stated identically in all GDDs that reference it.
No stale registry entries. No unregistered cross-system facts requiring addition.

This is unusually clean because the registry was authored in the same reverse-doc pass
as the GDDs (commit `86e10c4`), with `referenced_by` lists and `notes:` already wired.

---

## Verified shared values (registry ↔ all referencing GDDs agree)

| Value | Canonical | Agreeing GDDs |
|---|---|---|
| BUY_COST_MULT | 22 | currency, animal-collection, animal-database |
| UPGRADE_COST_MULT | 160 | currency, habitat, animal-database |
| ENRICH_COST_MULT | 40 | currency, enrichment, animal-database, animal-care |
| Enclosure appeal payoff | +25%/level → ×2.0 at Lv5 | habitat, enrichment, zoo-economy |
| Appeal ladder | 3→3000, 29 values, Σ=17,468 | animal-database, zoo-economy, taming, enrichment, habitat |
| MAX_LEVEL | 92 | animal-database, zoo-economy, habitat, zoo-level |
| Offline rate / caps | 0.60 · 28,800s (8h) / 86,400s (24h) | idle-offline, save-load, zoo-economy |
| Attraction build costs | 500 / 2,500 / 9,000 / 16,000 / 45,000 | attractions, currency |
| Attraction mults | revenue +12% (0.12) · capacity +15% (0.15) · max 5 | attractions, zoo-economy |
| XP grants | +3/care action · +40/adopt | zoo-level, animal-care, animal-collection |
| Starting balances | gold 50 · gems 10 | currency, save-load |
| Daily missions | unlock Lv7 · 5/day · 5–15 gems/mission · 75/day ceiling | quests-missions, currency |
| Play trust gain | +4/tap (Heal +2, Enrichment +8) | taming, animal-care, enrichment |
| Thriving threshold | trust ≥ 68 | animal-care, taming |

---

## Informational notes (no conflict)

- **ℹ️ Dual-valued initial trust** — registry: "30 on adoption (40 on admin-unlock)".
  Both `taming.md` and `animal-care.md` consistently document **both** paths (normal
  adopt = 30; starter/admin-unlock = 40). Not a conflict — two distinct code paths,
  agreed across docs.

## Out of scope here (already tracked elsewhere — these are code-vs-design, not GDD-vs-GDD)

The many ⚠️ markers in the registry and GDDs are **code-vs-design balance/implementation
gaps**, not cross-document inconsistencies. They are correctly and *identically* flagged
in every GDD that touches them, and are triaged in `production/implementation-gaps.md`:

- Cost multipliers (22/160/40) ~2× too high after appeal max rose 1500→3000
- `HAB_UPGRADE` display table shows ×3.0 at Lv5 vs runtime ×2.0 (stale data table)
- `views-train.jsx` copy says Play "+5" vs canonical +4 (code copy bug)
- Attraction cost inversion (Rides 9,000 < Shows 16,000); stale SINKS table (40k–900k)
- Save/Load (F3) and offline accrual (Fe7) designed but unimplemented/faked
- Missing caps/gates (enclosure Lv5, enrichment level, attraction unlock, trust gates)

**These should NOT be re-logged from this run** — they are design-vs-code, owned by
`implementation-gaps.md`, and out of scope for a GDD-vs-GDD consistency check.

---

## Recommendation

Registry baseline is clean → proceed to `/review-all-gdds` for the holistic
design-theory review (dominant strategies, economy balance, pillar drift), then
`/create-architecture` once that passes.
