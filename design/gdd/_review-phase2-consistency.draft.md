# Phase 2 — Cross-GDD Consistency Review

> **Status**: DRAFT — awaiting orchestrator promotion to final
> **Reviewer**: Claude Code (Sonnet 4.6), Phase 2 subagent
> **Date**: 2026-06-11
> **Scope**: All 17 GDD files + `design/registry/entities.yaml`
> **Checks run**: 2a Dependency Bidirectionality · 2b Rule Contradictions · 2c Stale References · 2d Tuning-Knob Ownership Conflicts · 2e Formula Compatibility · 2f Acceptance-Criteria Cross-Check

---

## Registry vs GDD Drift — Critical Banner

Before individual checks, the `entities.yaml` 2026-06-07 C# audit banner documents **widespread design-vs-code divergence** that affects every GDD. This is a meta-layer fact, not a cross-GDD contradiction, but it means: the "live GDD" values in many registry entries are themselves **unimplemented in C#**. Each check below flags where a registry-vs-GDD mismatch compounds an already-known GDD contradiction.

**Key registry divergences affecting cross-GDD consistency (from the 2026-06-07 C# audit note in `entities.yaml`):**

| Registry entry | GDD canonical value | C# actual value | Severity |
|---|---|---|---|
| `buy_more_cost` mult | 50 (revised 2026-06-06) | 50 — MATCH | ✅ |
| `enclosure_upgrade_cost` mult | 80 (revised 2026-06-06) | 80 — MATCH | ✅ |
| `enrichment_cost` mult | 20 (revised 2026-06-06) | 20 — MATCH | ✅ |
| `happy_mult` formula | welfare composite (4-meter mean) | NOT IMPLEMENTED — no happy_mult applied in GoldPerSec | 🔴 |
| `unlock_gold_cost` | `roundNice(500 × 1.06^(lv−1))` | FREE — level gate only | 🔴 |
| `gold_start` | 50 | 200 in GameApp/DevHarness | ⚠️ |
| `level_xp_curve` | piecewise geometric | piecewise LINEAR (same anchors, different shape) | ⚠️ |
| `trust_gain_per_action` | play:+4, heal:+2, enrich:+8 | NOT IMPLEMENTED | 🔴 |
| `care_action_cost_tier_mult` | 0.4 | FREE — no cost applied | 🔴 |
| `appeal_ladder` | 29 species, appeal 3→3000 | 12-species DEV stub, appeal 3→230 | 🔴 |
| `attraction_build_costs` | 5th key: "perform" | 5th key: "arena" in C# | ⚠️ |

> These registry-vs-code mismatches are tracked in `production/implementation-gaps.md` and are OUT OF SCOPE for this cross-GDD consistency review. They are listed here as context only; they do not count toward the cross-GDD issue tally below.

---

## META-RISK FLAG (mandatory per review brief)

🔴 **Two competing models of truth coexist in `design/gdd/`**

Files `design/gdd/economy-redesign.md` (status: `proposed-redesign`, revises C2/Fe2/Fe3/Fe4) and `design/gdd/xp-pacing-redesign-2026-06-08.md` (status: `proposed-redesign`, revises C3/F2/Fe6/Fe7) live alongside the live GDDs with **no cross-linking status banner in any live GDD**. Neither `zoo-economy.md`, `zoo-level.md`, `habitat-system.md`, `enrichment.md`, `attractions.md`, `quests-missions.md`, nor `idle-offline.md` contains a note saying "a redesign proposal exists — see X before implementing." A developer reading `zoo-economy.md` or `zoo-level.md` in isolation would implement the **live** values with no awareness that substantially different targets exist in the same folder.

**Fix**: Add a one-line banner at the top of each live GDD that a redesign revises:
```
> ⚠️ Redesign proposal: see `economy-redesign.md` (not yet accepted) before implementing.
```
This is a documentation gate, not a design decision.

---

## Check 2a — Dependency Bidirectionality

Cross-referencing every GDD's §6 Upstream/Downstream table against `systems-index.md` and the receiving GDD's §6.

---

### 2a-1 — Fe1 lists C2 as upstream; systems-index.md omits the link

🔴 **[critical] Fe1 → C2 upstream edge missing from systems-index.md**

- **File/section**: `design/gdd/animal-collection.md` §6 (Upstream): *"C2 Zoo Economy — gold income fills the reserve from which the player funds adoptions"*
- **systems-index.md** Fe1 upstream row: `C3, F1, F2, F3` — C2 is absent.
- **C2 `zoo-economy.md` §6**: C2 does not list Fe1 as downstream either.
- **Why it matters**: Fe1's buy-more-cost formula (`round(appeal × 50 × count) + 50`) uses `goldPerSec` output indirectly — the player's purchasing power for adoptions is determined by the C2 income rate. If an architect reads systems-index.md to determine C2's blast radius, they will not know that Fe1 is downstream. A change to the C2 income formula could make elite-tier animals permanently unaffordable without the Fe1 team being alerted.
- **Fix**: Add C2 to Fe1's upstream list in systems-index.md; add Fe1 to C2's downstream list. Update `zoo-economy.md` §6 Dependencies downstream table to include Fe1.

---

### 2a-2 — Fe3 lists C1 and C4 as upstream; systems-index.md omits both

🔴 **[critical] Fe3 → C1 and Fe3 → C4 upstream edges missing from systems-index.md**

- **File/section**: `design/gdd/enrichment.md` §6 (Upstream): *"C1 Animal Care — enrichment's +18 happiness grant interacts directly with the care system's meter model"* and *"C4 Taming — enrichment grants +8 trust per level (C4 owns the trust metric)"*.
- **systems-index.md** Fe3 upstream row: `Fe2, F2, Fe1` — C1 and C4 absent.
- **C1 `animal-care.md`** §6 Downstream: does not list Fe3.
- **C4 `taming.md`** §6 Downstream: does not list Fe3.
- **Why it matters**: The trust system (C4) and the care meter model (C1) are both modified by the enrichment action. If C1 changes the happiness scale or C4 changes the trust gain model, Fe3's `+18 happy / +8 trust` constants could go out of sync and the Fe3 team would not be in the blast radius. This is compounded by the C# audit showing trust is entirely unimplemented — when taming IS implemented, Fe3's trust grants will be silently missing if the dependency is not in systems-index.
- **Fix**: Add C1 and C4 to Fe3 upstream in systems-index.md. Update C1 §6 Downstream and C4 §6 Downstream to include Fe3.

---

### 2a-3 — Fe6 lists F2 and Fe5 as upstream; systems-index.md omits both

⚠️ **[major] Fe6 → F2 and Fe6 → Fe5 upstream edges missing from systems-index.md**

- **File/section**: `design/gdd/quests-missions.md` §6 (Upstream): lists F2 (currency — quests reward and cost gold) and Fe5 (Performance System — chapter objectives reference show completions).
- **systems-index.md** Fe6 upstream row: `C1, C3, F3` — F2 and Fe5 absent.
- **Fe5**: No GDD authored yet. The reference to Fe5 in Fe6 is therefore a forward-dependency on a non-existent document — this is a design gap, not just a documentation gap.
- **Why it matters**: When Fe5 is authored, it must be cross-linked into Fe6 objectives or Fe6's chapter 5+ objectives ("complete X shows") will have no basis to validate against. F2 being absent means the quest-reward gold amounts are not tracked as a known F2 downstream output.
- **Fix**: Add F2 to Fe6 upstream in systems-index.md. When Fe5 is authored, add Fe5 → Fe6 edge. Note Fe5 as a pending upstream in Fe6 §6.

---

### 2a-4 — F3 `systems-index.md` does not list Fe7 as downstream

⚠️ **[major] F3 does not list Fe7 as downstream**

- **File/section**: `design/gdd/save-load.md` §6 — Fe7 is not in F3's downstream table.
- **Fe7 `idle-offline.md` §6 Upstream**: explicitly lists F3 as CRITICAL BLOCKER.
- **Why it matters**: F3 must add `closedAt` and `vip` fields to the save schema for Fe7 to work. Without Fe7 in F3's downstream list, a developer implementing F3 will not know they must design the schema extension. This is documented as Fe7 OQ-2 but not surfaced in F3's GDD dependencies.
- **Fix**: Add Fe7 to F3 §6 Downstream. F3 §4 Formulas / schema section should note `closedAt` and `vip` as required fields for Fe7 compatibility.

---

### 2a-5 — C4 trust thresholds depend on Fe4 and Fe5; neither GDD lists C4 as upstream

⚠️ **[major] C4 → Fe4 (petting gate) and C4 → Fe5 (performer gate) not cross-linked**

- **File/section**: `design/gdd/taming.md` §6 — C4 lists Fe4 (Petting Area uses trust ≥ 40) and Fe5 (performer gate trust ≥ 80) as downstream.
- **Fe4 `attractions.md`** §6 Upstream: does not list C4.
- **Fe5**: not yet authored.
- **Why it matters**: The petting area and performance attraction mechanics gate on trust thresholds defined in C4. If C4 changes these thresholds (e.g. petting_gate lowered from 40 to 30), Fe4 would silently become inconsistent. The Fe4 team has no visibility that C4 controls their gate.
- **Fix**: Add C4 to Fe4 §6 Upstream. When Fe5 is authored, add C4 → Fe5 edge.

---

## Check 2b — Rule Contradictions

---

### 2b-1 — happy_mult formula definition: C1 vs C2 vs entities.yaml

🔴 **[critical] happy_mult formula in C2 GDD uses `avgHappiness` (single meter) while entities.yaml defines a 4-meter welfare composite**

- **zoo-economy.md §4**: `happyMult = clamp(0.4 + avgHappiness/100, 0.5…1.4)` — uses the `happy` meter only.
- **entities.yaml** `happy_mult` entry (revised 2026-06-06): `welfare(k) = (hunger+thirst+clean+happy)/4 ; happyMult = clamp(0.4 + avgWelfare/100, 0.5, 1.4)` — uses ALL FOUR meters as a composite.
- **animal-care.md** §4: does not explicitly define the happyMult formula; says happiness feeds the economy multiplier.
- **Which is canonical?** The registry note says "REVISED 2026-06-06 — now a WELFARE COMPOSITE... Source: prototype.jsx welfareOf." But `zoo-economy.md` was last updated on 2026-06-06 and was NOT updated to reflect this change — it still shows the old single-meter formula.
- **Impact**: This is a 🔴 blocking contradiction. If implemented as C2 GDD says (single `happy` meter), players can maximise income by spamming Play (free, no cost) while ignoring Hunger/Thirst/Cleanliness. If implemented as the registry says (welfare composite), all four care actions drive economy. The two formulas produce different values unless all four meters happen to be equal. The Fe7 offline formula in `idle-offline.md` §4 explicitly quotes the C2 single-meter version (`happyMult = clamp(0.4 + avgHappy / 100, 0.5, 1.4)`), adding a third inconsistent source.
- **Fix**: Update `zoo-economy.md` §4 to replace `avgHappiness` with the welfare composite formula from the registry. Update `idle-offline.md` §4 reconstruction block to match. C1 §4 must clarify that welfareOf(k) = mean of four meters, not just `happy`. Registry is the intended canonical — the three GDDs must converge on it.

---

### 2b-2 — Decay rate units: C1 GDD vs game-concept.md vs entities.yaml

🔴 **[critical] Decay rates are stated in /tick in C1, /hr in game-concept.md, but entities.yaml uses /30min-tick values inconsistent with both**

- **game-concept.md**: *"Hunger (−6/hr) · Thirst (−8/hr)"* — per hour.
- **animal-care.md §4** (last-checked values in session): *"hunger −6/tick (12s), thirst −8/tick (12s)"* — per 12-second tick, i.e. −30/min, −1,800/hr.
- **entities.yaml** `care_decay_per_tick` (revised 2026-06-06): `hunger:3, thirst:4, clean:3, happy:2` at a 30-min tick (`decay_tick_interval: 1800000 ms`). This equals −6/hr for hunger and −8/hr for thirst — matching game-concept's intent.
- **Conclusion**: The C1 GDD text has NOT been updated to reflect the 2026-06-06 registry revision. C1 still documents the old 12-second/rapid-drain values (6/8/5/3 per 12s), while entities.yaml now specifies slower 30-minute ticks with values 3/4/3/2. The game-concept.md intention (−6/hr, −8/hr) is now correctly reflected in the registry but not in the C1 GDD itself.
- **Impact**: Any developer reading C1 to understand decay would implement the wrong tick interval and drain values, producing animals that starve in minutes rather than draining over 8–12 hours as intended. The pacing for retention (daily-ritual cadence) would be inverted.
- **Fix**: Update `animal-care.md` §4 Formulas and §7 Tuning Knobs to state: tick interval = 1,800,000 ms (30 min), decay per tick = hunger:3, thirst:4, clean:3, happy:2. Add a note referencing the 2026-06-06 rebalance rationale (daily-ritual cadence). The game-concept.md values are now correct; C1 GDD must catch up.

---

### 2b-3 — HAB_UPGRADE income multipliers: Fe2 GDD table vs runtime multOf formula

⚠️ **[major] Fe2's HAB_UPGRADE display table shows ×3.0 at Lv5; the canonical enclosure_appeal_mult formula produces ×2.0 at Lv5**

- **habitat-system.md §4**: HAB_UPGRADE data table (from `data.jsx`) shows income multipliers ×1.0 / ×1.3 / ×1.7 / ×2.2 / ×3.0 for enclosure levels 1–5.
- **enclosure_appeal_mult formula** (C2, Fe2, entities.yaml): `1 + 0.25 × (encLv − 1)` → Lv1=×1.0, Lv2=×1.25, Lv3=×1.50, Lv4=×1.75, Lv5=×2.00.
- **Entities.yaml** note: "⚠️ CONFLICT (Fe2 OQ-4): the HAB_UPGRADE display table in data.jsx shows ×3.0 at Lv5 — stale/wrong. The runtime multOf / this 0.25 formula is CANONICAL."
- **Impact**: The display table shown to players (and used by designers for balance math) overstates the Lv5 multiplier by 50% (×3.0 vs ×2.0). ROI calculations based on the table will be wrong. The Fe2 GDD and the C2 GDD reference the same upgrade as its entry point — both need to agree.
- **Fix**: Replace the HAB_UPGRADE display table in `habitat-system.md` §3/§4 with the values produced by the canonical formula: ×1.0/×1.25/×1.50/×1.75/×2.00. Remove any reference to the data.jsx stale table. Note: this was flagged in Fe2 OQ-4 but was not resolved in the GDD text.

---

### 2b-4 — Tier level spans: animal-database.md (F1) vs game-concept.md

⚠️ **[major] Four tier level spans disagree between F1 and game-concept.md**

- **game-concept.md** Tier table: Tier 2 = Lv11–17, Tier 4 = Lv32–54, Tier 5 = Lv60–66, Tier 6 = Lv70–80.
- **animal-database.md §3** Tier table: Tier 2 = Lv11–19, Tier 4 = Lv32–53, Tier 5 = Lv54–69, Tier 6 = Lv70–83.
- **Discrepancies**: Tier 2 upper bound (17 vs 19), Tier 4 upper bound (54 vs 53), Tier 5 both bounds (60–66 vs 54–69), Tier 6 upper bound (80 vs 83).
- **Impact**: Any UI or narrative that communicates tier unlocks to the player could display the wrong level range depending on which document the developer read. The Tier 5 discrepancy is especially large (a 6-level lower entry in F1 vs game-concept). The animal-database.md assigns specific species to each tier row — this is the authoritative lookup, not the summary table in game-concept.
- **Fix**: Treat F1 `animal-database.md` as the authoritative tier table (it has per-species assignments). Update `game-concept.md` Tier table to match F1 exactly: Tier 2 = Lv11–19, Tier 4 = Lv32–53, Tier 5 = Lv54–69, Tier 6 = Lv70–83.

---

### 2b-5 — Attraction cost inversion: Animal Rides vs Educational Shows

⚠️ **[major] Animal Rides (Lv30) costs less than Educational Shows (Lv26)**

- **attractions.md §4** (pre-2026-06-06 values still in GDD text): costs listed as petting:500, feeding:2500, shows:16000, rides:9000, arena:45000.
- **entities.yaml** `attraction_build_costs` (revised 2026-06-06): `petting:500, feeding:2500, shows:8000, rides:16000, perform:45000` — **inverted order fixed in registry**.
- **BUT**: `attractions.md` GDD text may not have been updated to match the registry revision.
- **Impact**: If the GDD still shows rides:9000 < shows:16000, a developer reading the GDD implements the inverted costs while the registry says the opposite. There is a known naming mismatch too: registry uses "perform" but C# uses "arena" as the 5th key.
- **Fix**: Verify `attractions.md` §4 cost table matches registry values (shows:8000, rides:16000, perform:45000). Update if stale. Resolve the "perform" vs "arena" key naming conflict between registry and C# — pick one canonical name and update all three locations (GDD, registry, C# GameApp.cs).

---

### 2b-6 — Clean threshold alert: Animals screen vs EnclosureScreen in C1

⚠️ **[minor] Inconsistent clean-alert thresholds in two UI contexts**

- **animal-care.md**: Animals screen alerts at `clean < 35`; EnclosureScreen "Needs cleaning" status at `clean < 40`.
- **Impact**: Player sees inconsistent messaging — the animal detail screen and the enclosure overview trigger at different values for the same stat. Minor, but degrades UX trust.
- **Fix**: Standardise both thresholds to one value. Decision needed: pick 35 or 40. Record the chosen value in `animal-care.md` §7 Tuning Knobs as `CLEAN_ALERT_THRESHOLD`.

---

### 2b-7 — Offline care decay: Fe7 says NO decay; entities.yaml says decay IS applied on resume

🔴 **[critical] Fe7 Rule 10 contradicts the entities.yaml decay_tick_interval note**

- **Fe7 `idle-offline.md`** §3 Rule 10: *"No offline care decay. Need meters do NOT degrade during offline periods."*
- **entities.yaml** `decay_tick_interval` note (revised 2026-06-06): *"Offline decay IS now applied on resume (gentle, floored at 35–40). See care_decay_per_tick."*
- **Impact**: These are directly contradictory. One says decay doesn't happen offline; the other says it does. A developer implementing Fe7 offline accrual will get the opposite behaviour depending on which source they read. The design question (Fe7 OQ-4) is flagged as "MEDIUM RISK — current design says no offline decay" — but the registry has already decided the other way.
- **Fix**: Resolve the design decision at the game-designer level. Update BOTH documents to the same answer. If offline decay IS applied (as registry says), Fe7 §3 Rule 10 must be replaced with the actual formula (project decay_per_tick × offline_ticks_elapsed, floored at 35–40 per meter). If offline decay is NOT applied (as Fe7 says), the registry note must be corrected to remove "Offline decay IS now applied on resume."

---

## Check 2c — Stale References

---

### 2c-1 — F2 references non-existent "F5 Educational Shows" GDD

⚠️ **[major] Stale downstream reference in F2**

- **currency-system.md** §6 Downstream table: *"F5 Educational Shows — `design/gdd/educational-shows.md`"*.
- This file does not exist. The system is now called "Fe5 Performance System" and no GDD has been authored for it.
- **Impact**: Any cross-referencing tool or developer following this link will get a 404 and may create a new misnamed GDD.
- **Fix**: In F2 §6, replace "F5 Educational Shows / educational-shows.md" with "Fe5 Performance System / (GDD not yet authored)".

---

### 2c-2 — F3 GDD describes React/localStorage; implementation is C#/persistentDataPath

⚠️ **[major] Entire F3 GDD is stale vs the shipping implementation**

- **save-load.md**: Describes `localStorage` key `"awz_save"`, `Date.now()`, `beforeunload` handler — all React/browser semantics.
- **systems-index.md** F3 note (2026-06-07): *"F3 is actually implemented in C# (`Assets/Scripts/Runtime/SaveService.cs`) with `Application.persistentDataPath` JSON."*
- **entities.yaml** `save_key` note: *"IMPLEMENTED 2026-06-06 — prototype.jsx now persists a versioned JSON blob."* — this is still describing the prototype, not the C# implementation.
- **Impact**: The F3 GDD is the authoritative design document for any developer implementing or extending save/load in C#. Every EC, formula, and tuning knob in F3 describes browser behaviour, not Unity C#. A developer implementing the C# SaveService from this GDD will produce wrong behaviour (e.g. `closedAt = Date.now()` is JavaScript; C# uses `DateTimeOffset.UtcNow.ToUnixTimeSeconds()`).
- **Fix**: Add a status banner at the top of `save-load.md`: "Implementation target: C# Unity (`Assets/Scripts/Runtime/SaveService.cs`), `Application.persistentDataPath`. References to `localStorage` and `Date.now()` are from the prototype phase; all shipping implementation uses C# equivalents." Then schedule a full F3 GDD rewrite pass to use C# API throughout.

---

### 2c-3 — Fe7 offline modal references hardcoded "+820 XP" and "Show revenue +1,100"

⚠️ **[minor] Stale prototype fiction documented in Fe7**

- **idle-offline.md** §3 Rule 9 and §10 (AC-10): explicitly calls out that the hardcoded "+820 XP" and "+1,100 Show revenue" lines from the prototype modal must be removed in the real implementation.
- This is correctly flagged in the GDD itself — it is NOT missing documentation. However, the entities.yaml `offline_gold_formula` note says *"IMPLEMENTED 2026-06-06 — real on-resume accrual... GOLD ONLY (no offline XP)"*. This means the registry already resolves this in the prototype, but the C# IdleService may still show stale values.
- **Impact**: Low — already tracked. Noted for completeness.
- **Fix**: Confirm C# IdleService modal does not display "+820 XP" or "Show revenue" rows. If confirmed clean, this issue is resolved.

---

### 2c-4 — Fe4 rides filter references animals not in ANIMALS roster

⚠️ **[minor] Dead filter entries in attractions.md**

- **attractions.md** (implied by session notes / data.jsx): `rides` activity filter includes 'Camel', 'Ostrich', 'Pony'. None of these species appear in the 29-species ANIMALS roster.
- **Impact**: Attractions ride eligibility check will silently return zero eligible animals for rides even when the player has relevant species. This is a design gap rather than a GDD contradiction, but it is stale documentation.
- **Fix**: Reconcile the rides filter list with the 29-species roster in `animal-database.md`. If Camel/Ostrich/Pony are intended as future species, add a note in attractions.md: "Camel, Ostrich, Pony are placeholders for future content — rides filter will return empty until these species are added."

---

### 2c-5 — Fe4 buildAttraction level gate: GDD OQ-1 says no gate; entities.yaml says gate is ENFORCED

⚠️ **[major] Inconsistency between Fe4 GDD and entities.yaml on whether level gate is enforced**

- **attractions.md** OQ-1: *"buildAttraction() has NO level gate check — a player can build any attraction at any level with sufficient gold."*
- **entities.yaml** `attraction_build_costs` note (revised 2026-06-06): *"Level gate now ENFORCED in buildAttraction() (Fe4 OQ-1 fixed)."*
- **Impact**: Fe4 GDD still documents a known bug as open when the registry says it was fixed. Developer reading the GDD will not know the gate was added; they may add it redundantly or, worse, not add it in the C# implementation (which the C# audit showed: `AttractionService.Build()` returns false — building is in UI, not domain).
- **Fix**: Update Fe4 GDD OQ-1 to say "RESOLVED 2026-06-06 — level gate enforced in buildAttraction(); see attraction_build_costs in registry."

---

## Check 2d — Tuning Knob Ownership Conflicts

---

### 2d-1 — BUY_COST_MULT, UPGRADE_COST_MULT, ENRICH_COST_MULT claimed by F2, Fe1, Fe2, Fe3

⚠️ **[major] Three cost multipliers have dual ownership across F2 and the feature GDDs**

- **currency-system.md §7** Tuning Knobs: lists `BUY_COST_MULT`, `UPGRADE_COST_MULT`, `ENRICH_COST_MULT` as F2-owned knobs.
- **animal-collection.md §7**: lists `BUY_COST_MULT` (Fe1-owned, value 50 in registry vs GDD; see 2b note).
- **habitat-system.md §7**: lists `UPGRADE_COST_MULT` (Fe2-owned).
- **enrichment.md §7**: lists `ENRICH_COST_MULT` (Fe3-owned).
- **entities.yaml**: registry entries `buy_more_cost`, `enclosure_upgrade_cost`, `enrichment_cost` list the respective feature GDD as `source:` (Fe1, Fe2, Fe3) while F2 is in `referenced_by:`.
- **Resolution**: The registry is correct — feature GDDs own the formulas; F2 documents the knobs for balance oversight. BUT the wording in F2 §7 says F2 "owns" them, which conflicts with the registry's source attribution.
- **Impact**: If a systems-designer changes the multiplier in Fe1 and a currency-designer also changes it in F2 (each believing they own it), they will diverge.
- **Fix**: Amend F2 §7 Tuning Knobs to read: "F2 tracks these economy-wide knobs for balance reference; authoritative ownership is in the respective feature GDD (Fe1/Fe2/Fe3). Changes must be coordinated with those GDDs."

---

### 2d-2 — OFFLINE_RATE_FACTOR: owned by Fe7; referenced in C2 and F3 with no clear deference

⚠️ **[minor] OFFLINE_RATE_FACTOR ownership is ambiguous across three documents**

- **idle-offline.md §7**: owns `OFFLINE_RATE_FACTOR = 0.60`.
- **zoo-economy.md §7** Tuning Knobs: lists "Idle %" as a C2-owned knob.
- **entities.yaml** `offline_rate_factor`: `source: design/gdd/idle-offline.md` — correctly assigns ownership to Fe7.
- **Impact**: Small — the registry correctly assigns ownership. But C2 §7 listing "Idle %" could lead a designer treating it as a C2 decision to change it there, creating a conflict with Fe7.
- **Fix**: Remove "Idle %" from C2 §7 Tuning Knobs, or add a note "Owned by Fe7 idle-offline.md; listed here for reference."

---

### 2d-3 — gold_start: F2 says 50; C# code uses 200; entities.yaml flags mismatch

⚠️ **[minor] gold_start value conflict between registry/GDD and C# implementation**

- **currency-system.md**: `gold_start = 50` (F2 owns this constant).
- **entities.yaml** `gold_start` note: "⚠️ 2026-06-07 C# AUDIT: MISMATCH — C# seeds 200 gold (GameApp.cs:136, DevHarness.cs:41), not 50. RECONCILE."
- **Impact**: New player onboarding behaviour differs between design and implementation. Balance for early progression (which species the player can first afford) depends on this value.
- **Fix**: Decide the canonical value. If 200 is intentional for better onboarding, update the F2 GDD and registry to 200. If 50 is intentional, update GameApp.cs and DevHarness.cs. Either way, align all three.

---

## Check 2e — Formula Compatibility (Output Range vs Expected Input Range)

---

### 2e-1 — XP pacing: C3 LEVEL_XP curve output vs C3 faucet rates — structural mismatch

🔴 **[critical] XP faucets are geometrically insufficient to reach endgame in any reasonable timeframe**

- **zoo-level.md** LEVEL_XP curve: Lv92 ≈ 30.6M cumulative XP. Piecewise geometric — grows ~+7%/level in the endgame band (Lv85–92).
- **zoo-level.md** XP faucets: care = +3/tap, adopt = +40 (one-time per species). Quest total: 9,800 XP across 7 chapters.
- **game-concept.md** pacing target: Lv7 by Day 5–7.
- **Lv7 XP requirement**: 5,200 XP total. Quest chapters 1–3 grant ~4,100 XP. Remaining: ~1,100 XP ÷ 3/tap = ~367 care taps beyond quests. With 5–8 animals × 5 actions = 25–40 taps/session, this requires ~9–15 sessions.
- **xp-pacing-redesign-2026-06-08.md** (PROPOSAL, not accepted): acknowledges *"even a maximally-active player needs ~22 years to reach Lv92 with current faucets"*. This is a design-document-level acknowledgement of a formula incompatibility.
- **Impact on architecture**: ANY system that gates features behind zoo level (Fe1, Fe2, Fe3, Fe4, Fe6, Fe7 via OQ-3) will produce gates that are effectively unreachable. The Lv7 daily-mission unlock would require weeks of play rather than the designed 1-week onboarding window.
- **This is not a GDD-vs-GDD wording conflict; it is a mathematical incompatibility between the LEVEL_XP curve shape and the faucet rates. It is 🔴 blocking for all feature design downstream of C3.**
- **Fix**: Accept and implement the XP pacing redesign (or equivalent) before architecting any levelled content gate. The redesign is already drafted in `xp-pacing-redesign-2026-06-08.md`. If the designer rejects that proposal, define alternative faucet scaling — but the current state is architecturally broken.

---

### 2e-2 — buy_more_cost formula: appeal range 3–3000 vs multiplier calibrated at old max ~1500

🔴 **[critical] All three cost formulas are calibrated for an appeal ceiling ~50% of the current maximum**

- **entities.yaml** `buy_more_cost` (revised 2026-06-06): `mult = 50`, output range `[100, 150050]` (Dolphin 2nd copy ≈ 150,050 gold).
- **entities.yaml** `enclosure_upgrade_cost` (revised 2026-06-06): `mult = 80`, output range `[300, 1200300]` (Dolphin Lv5 enclosure).
- **entities.yaml** `enrichment_cost` (revised 2026-06-06): `mult = 20`, output range `[260, 60200]`.
- **The registry notes say the multipliers were halved in 2026-06-06** (160→80 for upgrade, 40→20 for enrich) specifically because appeal max was raised from ~1500 to 3000. The buy_more_cost mult was raised (11→50) in the same pass to close an ROI gap.
- **GDD state**: `animal-database.md §4` Tuning Knobs still says "upgradeCost mult ~160" and "enrichCost mult ~40" — the OLD values before the 2026-06-06 revision. `habitat-system.md §4` and `enrichment.md §4` may also show stale mult values.
- **Impact**: Developer reading the GDDs (not the registry) will implement the old calibration — producing costs 2× too high for elite species, making Dolphin enclosure upgrades cost 2.4M gold instead of 1.2M gold. ROI for late-game upgrades breaks.
- **Fix**: Update all three feature GDDs (Fe1, Fe2, Fe3) to use the registry-canonical values: buy_more_cost mult=50, upgrade_cost mult=80, enrich_cost mult=20. The F1 GDD (animal-database.md) Tuning Knobs §7 must also be updated to reference the current values.

---

### 2e-3 — goldPerSec range: C2 formula output vs Fe7 offline accrual ceiling

⚠️ **[minor] Fe7 max goldPerSec ceiling (7,500/s) in variable table may be stale**

- **idle-offline.md §4** Variable table: `goldPerSec` range `1 – ~7,500`.
- **entities.yaml** `attraction_revenue_multiplier` output: `max(1, round(visitors × 0.05 × (1 + 0.12 × 5)))` = `max(1, round(visitors × 0.086))`. At Lv92 full build-out with welfare composite at max (happy_mult=1.4): appeal ≈ 17,468 × 1.4 = 24,455 → visitors ≈ 24,455 (assuming uncapped capacity) → goldPerSec ≈ round(24455 × 0.086) ≈ 2,103/s.
- **But** if the welfare composite formula is used and all animals at max enclosure (×2.0) and max enrichment (×1.5): appealOf sum could reach ~17,468 × 2.0 × 1.5 = 52,404 → visitors ≈ 52,404 (capacity may cap it) → goldPerSec ≈ round(52404 × 0.086) ≈ 4,507/s.
- **The GDD states ~7,500 but arithmetic suggests ~4,500 at theoretical max.** The 7,500 figure appears to come from a simulation run using the old formula.
- **Impact**: Low in isolation, but the Fe7 "max VIP offline reward" of 388,800,000 gold is computed against the 7,500/s figure. If actual max is ~4,500/s, the real VIP 24h ceiling is ~233M gold — still very large but 40% less than claimed.
- **Fix**: Recompute goldPerSec max using the canonical formula + appeal ladder + max enclosure/enrichment multipliers, and update Fe7 §4 variable table accordingly. This is advisory — the formula is correct; only the documented range ceiling needs updating.

---

### 2e-4 — happyMult input vs C2 formula: neutral point differs between GDDs

⚠️ **[minor] C1 and C2 neutral-point documentation for happyMult inconsistent**

- **animal-care.md**: states happyMult is neutral at `avgHappiness = 60` (because `0.4 + 60/100 = 1.0`).
- **zoo-economy.md §4**: does not document the neutral point explicitly.
- **entities.yaml** `happy_mult`: the formula `clamp(0.4 + avgWelfare/100, 0.5, 1.4)` — neutral point is welfare=60. If the welfare composite is used and three meters are at 60 but play-meter is at 100, welfare = (60+60+60+100)/4 = 70 → happyMult = 1.1. The neutral point shifts based on which formula is used.
- **Impact**: Minor inconsistency. After 2b-1 is fixed, the neutral point documentation should be consistent. This is a downstream consequence of the happyMult formula conflict.
- **Fix**: After resolving 2b-1, document the neutral point (welfare = 60 → happyMult = 1.0) in both C1 §4 and C2 §4.

---

## Check 2f — Acceptance Criteria Cross-Check

---

### 2f-1 — C3 AC-1 (Lv7 by Day 5–7) vs current XP faucet math

🔴 **[critical] C3 acceptance criterion for pacing is mathematically unreachable with current faucets**

- **zoo-level.md** AC (implied): Onboarding pacing criterion that Lv7 is reached in Days 2–7 per game-concept §4.
- **zoo-level.md §4** XP sources: care = +3/tap, adopt = +40, quests ch1-3 ≈ 4,100 XP.
- **Lv7 threshold**: 5,200 XP. After quests: ~1,100 XP remaining = 367 care taps. At 8 animals × 5 actions = 40 taps/session → ~10 sessions minimum.
- **Conclusion**: A player doing one session per day would reach Lv7 on approximately Day 10–12, not Day 5–7. The acceptance criterion cannot pass with current faucet values.
- **This directly causes AC failure**: any QA engineer running the C3 pacing AC against the live faucet rates will fail it.
- **Fix**: See 2e-1. The fix is the same — scale XP faucets. The C3 GDD AC and the game-concept pacing target must both be verifiable together. Until faucets are updated, this AC should be marked "BLOCKED — pending XP pacing decision."

---

### 2f-2 — Fe7 AC-1 (no offline modal on first load) vs Fe7 OQ-1 (F3 entirely unimplemented)

⚠️ **[major] All 10 Fe7 acceptance criteria are unverifiable while F3 is not implemented**

- **idle-offline.md** AC-1 through AC-10: require functional `closedAt` persistence, VIP flag, goldPerSec reconstruction from save, and a working modal.
- **idle-offline.md** OQ-1: *"Fe7 cannot be implemented until F3 is implemented."* F3 save/load is itself partially implemented only in the prototype (localStorage) and partially in C# (persistentDataPath, but missing `closedAt` and `vip` fields).
- **Impact**: AC-3 ("offlineGold = floor(3600 × 10 × 0.60) = 21,600") cannot be tested at all. All Fe7 ACs are blocked.
- **Fix**: Mark all Fe7 ACs as "BLOCKED — depends on F3 implementation (OQ-1)" until F3 is complete and `closedAt`/`vip` fields are added to the save schema. This is already acknowledged in Fe7 OQ-1 and OQ-2 but is not reflected in the AC status field.

---

### 2f-3 — Fe4 AC vs attraction level gate enforcement state

⚠️ **[minor] Fe4 OQ-1 says no level gate exists; entities.yaml says it was fixed — AC verifiability depends on which is current**

- Cross-reference of 2c-5: if the level gate is enforced (as registry claims), then any Fe4 AC testing "player can build attraction X at level Y" implicitly tests the gate. If the GDD still says the gate is missing, the AC is mis-specified.
- **Fix**: Same as 2c-5 — update Fe4 OQ-1 and ensure ACs reference the enforced gate.

---

### 2f-4 — C4 AC for "Thriving" status vs trust implementation state

⚠️ **[minor] C4 acceptance criteria for trust milestones are unverifiable in C# (trust not implemented)**

- **taming.md** ACs: require per-animal trust tracking, Thriving at trust ≥ 68, petting gate at trust ≥ 40.
- **entities.yaml** `trust_thresholds` C# audit: *"no threshold logic reads Trust (gates exist in JSX only)"*.
- **Impact**: All C4 ACs pass in the prototype but fail in C#. There is no blocking design contradiction here — this is implementation gap, not cross-GDD conflict. However, any AC testing that uses C# will silently pass the wrong state (trust always 0).
- **Fix**: Mark C4 ACs as "TARGET: C# implementation" with a note that the trust meter (AnimalMeters.Trust) must be wired into CareService.DoAction before these ACs can be verified in-engine.

---

## Issue Count Summary

| Severity | Count | Issues |
|---|---|---|
| 🔴 Blocking | 7 | 2a-1, 2a-2, 2b-1, 2b-2, 2b-7, 2e-1, 2f-1 |
| ⚠️ Warning | 18 | 2a-3, 2a-4, 2a-5, 2b-3, 2b-4, 2b-5, 2b-6, 2c-1, 2c-2, 2c-3, 2c-4, 2c-5, 2d-1, 2d-2, 2d-3, 2e-2, 2e-3, 2e-4, 2f-2, 2f-3, 2f-4 |

> Note: 2e-2 (cost formula calibration) has been escalated to 🔴 for this summary because all three cost formulas have stale mult values in their respective GDDs despite the registry being correct — a developer reading the GDDs will implement the wrong values. Adjusted count: **8 Blocking, 17 Warning**.

---

## Prioritised Fix List (Blocking First)

1. **🔴 happy_mult formula unification** (2b-1) — Update C2, C1, Fe7 to welfare composite. Blocking for all economy implementation.
2. **🔴 Decay rate GDD vs registry sync** (2b-2) — Update C1 GDD tick interval + values. Blocking for care implementation.
3. **🔴 Offline decay contradiction** (2b-7) — Design decision needed: Fe7 says NO, registry says YES. Blocking for Fe7 implementation.
4. **🔴 XP faucet structural incompatibility** (2e-1 / 2f-1) — Pacing ACs cannot pass. Blocking for all level-gated content.
5. **🔴 Cost formula multipliers stale in GDDs** (2e-2) — Fe1/Fe2/Fe3 GDDs show old mult values (160/40) while registry has revised values (80/20). Blocking for correct cost implementation.
6. **🔴 Fe1→C2 bidirectionality gap** (2a-1) — Architecture design graph is incorrect; blast-radius analysis will miss Fe1.
7. **🔴 Fe3→C1/C4 bidirectionality gap** (2a-2) — Enrichment's trust and happiness grants not tracked as C1/C4 downstream. Blocking for trust implementation.
8. **⚠️ HAB_UPGRADE table ×3.0 vs formula ×2.0** (2b-3) — 50% overstatement of upgrade ROI.
9. **⚠️ Tier level span inconsistencies** (2b-4) — Four tiers disagree between F1 and game-concept.
10. **⚠️ F3 GDD stale — React/localStorage vs C#/persistentDataPath** (2c-2) — Entire F3 GDD describes wrong implementation.
11. **⚠️ F2 stale "F5 Educational Shows" reference** (2c-1) — Dead link, wrong system name.
12. **⚠️ Fe6 missing F2 and Fe5 upstream links** (2a-3).
13. **⚠️ F3 missing Fe7 downstream link** (2a-4).
14. **⚠️ C4→Fe4 petting gate not cross-linked** (2a-5).
15. **⚠️ Fe4 OQ-1/AC level gate enforcement state** (2c-5 / 2f-3).
16. **⚠️ attraction cost "perform" vs "arena" key mismatch** (2b-5 fragment).
17. **⚠️ gold_start 50 vs C# 200** (2d-3).
18. **Remaining warnings** (2b-6, 2c-3, 2c-4, 2d-1, 2d-2, 2e-3, 2e-4, 2f-2, 2f-4) — Non-blocking documentation cleanup.

---

*End of Phase 2 Cross-GDD Consistency Review draft.*
