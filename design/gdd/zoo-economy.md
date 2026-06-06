---
status: reverse-documented
source: act/data.jsx, act/prototype.jsx, act/views-systems.jsx
date: 2026-06-06
verified-by: Genji240696
---

# Zoo Economy — Design

> **Note**: This document was reverse-engineered from the existing implementation
> after the appeal→visitors→gold redesign. It captures current behavior and the
> design intent clarified with the owner. Balance values are prototype-tuned and
> flagged as tuning knobs; some downstream systems (reputation, costs) are noted
> as follow-up work.

## 1. Overview
The zoo's gold income is a single causal chain: **animals create appeal →
appeal draws visitors (capped by capacity) → visitors spend gold at the gate**.
No animal pays gold directly; an animal's worth is how *attractive* it makes the
zoo. This binds collection, animal care, and build-out (enclosures/attractions)
into one loop the player must grow together.

## 2. Player Fantasy
"I'm building a zoo people *want* to visit." Adopting a rare animal visibly lifts
appeal; keeping animals happy makes them draw crowds; when the gate is packed you
expand to let more guests in. Success feels like a thriving, busy park — not a
spreadsheet of per-animal payouts.

## 3. Detailed Rules
- Each owned animal contributes **appeal** (its visitor draw). Higher tier = rarer = more appeal.
- Average **happiness** of owned animals scales total appeal (happy animals are more appealing).
- **Enclosure upgrades** raise an animal's appeal and its viewer **seats**; **enrichment** raises its appeal.
- **Capacity** = how many guests the zoo can show (sum of per-animal seats + a base gate, widened by attractions).
- **Visitors** = the lesser of demand (from appeal) and capacity. If demand > capacity, appeal is wasted — the HUD visitor pill turns amber, signalling "expand."
- **Gold/sec** = visitors × spend-per-head, with attractions raising spend.
- Income accrues once per second, only after the player opens the zoo ("Let's go"). Offline earns ~60% of active rate, capped 8h (24h with VIP).
- Gold is a **sink-only** resource for progression: care actions, enclosure/facility upgrades, animal unlocks, attractions. XP (leveling) comes from care & quests, **not** idle gold.

## 4. Formulas
Let `count` = animals in an enclosure, `encLv` = enclosure level, `enr` = enrichment level, `built` = attractions built.

```
appealOf(animal)  = baseAppeal × count × (1 + 0.25·(encLv−1)) × (1 + 0.10·enr)
happyMult         = clamp(0.4 + avgHappiness/100, 0.5 … 1.4)
appeal (total)    = round( Σ appealOf × happyMult )

seatsOf(animal)   = baseAppeal × count × (0.6 + 0.5·(encLv−1))
capacity          = round( (5 + Σ seatsOf) × (1 + 0.15·built) )

demand            = round( appeal × VISITORS_PER_APPEAL )        // VPA = 1.0
visitors          = min(demand, capacity)
goldPerSec        = max(1, round( visitors × SPEND_PER_VISITOR × (1 + 0.12·built) ))  // SPV = 0.05
```

baseAppeal ladder (monotonic, unlock-Lv-ordered):
3 · 8 · 14 · 30 · 50 · 70 · 85 · 130 · 150 · 170 · 190 · 230 · 260 · 290 · 330 · 400 · 470 · 540 · 610 · 700 · 850 · 1000 · 1150 · 1350 · 1550 · 1800 · 2100 · 2500 · 3000.

## 5. Edge Cases
- **No animals owned**: avgHappiness defaults to 60 → happyMult 1.0; appeal ≈ 0; goldPerSec floored at 1.
- **Happiness floor**: happyMult clamps at 0.5 even at 0 happiness (income never fully zeroes).
- **Demand ≫ capacity**: visitors hard-capped at capacity; surplus appeal yields no gold (intended pressure to expand). Verified across stages — the cap binds early (pre-upgrades) and when neglected, not in healthy play.
- **Max level (92)**: progression caps; income keeps running. (Guarded — HUD shows "MAX", not "Lv 93".)
- **Offline > cap**: idle earnings stop accruing past 8h / 24h-VIP.

## 6. Dependencies
- **Animal Care** (happiness feeds appeal) · **Collection/Unlocks** (which animals are owned) · **Progression** (level gates content; XP source) · **Attractions** (capacity + spend multipliers) · **Enrichment & Enclosure upgrades** (per-animal appeal/seats).

## 7. Tuning Knobs
- `VISITORS_PER_APPEAL` (1.0), `SPEND_PER_VISITOR` (0.05) — headline gold-rate dials.
- Capacity: base gate (5), seat coefficients (0.6 + 0.5·(encLv−1)), attraction width (0.15/attraction).
- `happyMult` band (0.5–1.4) and slope. Enclosure appeal mult (0.25/level), enrichment mult (0.10/level).
- baseAppeal ladder per animal. Idle %, idle caps. Buy/upgrade/enrich cost multipliers (currently scale off appeal).

## 8. Acceptance Criteria
- Income is gated behind "Let's go"; accrues 1/sec; floors at 1.
- Adopting a higher-Lv animal never lowers total appeal (ladder is monotonic).
- Raising average happiness strictly increases appeal (and thus visitors/gold) until capped.
- When demand > capacity, visitors == capacity and the HUD flags it; building an attraction or upgrading enclosures raises visitors.
- A neglected endgame zoo (low happiness, un-upgraded) earns measurably less than a cared-for one and re-enters the capped state. *(Validated by simulation: ~2,836/s healthy vs ~774/s neglected @ Lv92.)*
- Gold never directly comes from a per-animal payout; it always flows through visitors.

## Follow-up / Known Gaps
- Buy/upgrade/enrich **cost** formulas now scale off the larger appeal magnitudes — needs a balance pass.
- The `satis` prop passed into `LiveZoo` is now unused (cosmetic cleanup).
- Reputation currency (`rep`) is defined in data but not yet wired into the live chain.
