# Balance Check: Zoo Economy
**Date**: 2026-06-06
**System**: Economy (C2 Zoo Economy chain + Fe1/Fe2/Fe3/Fe4 gold sinks)
**Model**: Pre-redesign (current implementation in act/prototype.jsx)

---

## Data Sources Analyzed
- `design/gdd/zoo-economy.md` — C2 formula chain
- `design/gdd/economy-redesign.md` — Proposed redesign (NOT YET IMPLEMENTED)
- `design/gdd/habitat-system.md`, `enrichment.md`, `attractions.md`, `idle-offline.md`, `zoo-level.md`
- `design/registry/entities.yaml` — All cost multipliers and constants
- `act/data.jsx` — ANIMALS (29 species, appeal 3–3000), ENTERTAINMENT (15 activities), LEVELS anchors
- `act/prototype.jsx` — Live formula code (appealOf, seatsOf, capacity, zooRate, buyMoreAnimal, upgradeEnc, addEnrichment)

---

## Health Summary: 🔴 CRITICAL ISSUES

Two critical structural breaks and one dominant degenerate strategy make two of the four gold
sinks near-worthless. The economy-redesign.md proposal is validated by this analysis — the
problems it describes are quantifiable and confirmed.

---

## Simulation Results by Stage

| Stage | Animals | Enc | Built | happyMult | goldPerSec |
|-------|---------|-----|-------|-----------|-----------|
| Tutorial (Rabbit only) | 1 | Lv1 | 0 | 1.0 | 1 (floored) |
| 4 starters | 4 | Lv1 | 0 | 1.0 | 2 |
| Lv7 + Petting Area | 6 | Lv1 | 1 | 1.0 | 7 |
| Lv18 + Feeding Zone | 11 | Lv1 | 2 | 1.0 | 44 |
| Lv45 + Performance Arena | 20 | Lv1 | 5 | 1.4 | 398 |
| Lv84, all 29 animals | 29 | Lv1 | 5 | 1.4 | 1,468 |
| Lv92 fully maxed (encLv5, enrLv5) | 29 | Lv5/5 | 5 | 1.4 | 5,869 |

> GDD cites ~2,836/s healthy at Lv92. Simulation at uniform Lv5 enc gives 5,869/s.
> GDD value implies average encLv≈3 + partial enrichment — realistic for a real player.
> Income curve shape is healthy.

---

## ROI Table — The Core Problem

Scenario: 29 animals at Lv1 enclosure, count=1, built=5, happyMult=1.4 (1,468 gold/s baseline)

| Sink | Animal | Cost | Δ gold/s | Payback | Status |
|------|--------|------|----------|---------|--------|
| Buy 2nd copy | Goat (70) | 820 | +6 | 137s (2.3 min) | 🟢 |
| Buy 2nd copy | Lion (700) | 7,750 | +59 | 131s (2.2 min) | 🟢 |
| Buy 2nd copy | Dolphin (3000) | 33,050 | +252 | 131s (2.2 min) | 🟢 |
| Buy 3rd copy | Dolphin | 66,050 | +252 | 262s (4.4 min) | 🟢 degrades |
| Buy 4th copy | Dolphin | 99,050 | +252 | 393s (6.6 min) | 🟡 |
| Enc Upgrade Lv1→2 | Goat (70) | 5,900 | +5 | 1,180s (19.7 min) | 🟡 |
| Enc Upgrade Lv1→2 | Lion (700) | 56,300 | +49 | 1,149s (19.2 min) | 🟡 |
| Enc Upgrade Lv1→2 | Dolphin (3000) | 240,300 | +210 | 1,144s (19.1 min) | 🟡 |
| Enc Upgrade Lv1→2 | Rabbit (3) | 540 | ~0 | ∞ | 🔴 |
| Enrichment 0→1 | Goat | 1,600 | 0 | ∞ | 🔴 capacity-capped |
| Enrichment 0→1 | Lion | 14,200 | 0 | ∞ | 🔴 capacity-capped |
| Enrichment 0→1 | Dolphin | 60,200 | 0 | ∞ | 🔴 capacity-capped |

### Root causes

**Rabbit upgrade gives 0 income (540g → 0):**
The delta-appeal (+0.75) and delta-seats (+1.5) vanish under `Math.round()`. The cost formula
`base × 80 × encLv` produces nonsense for appeal ≤ 20.

**Enrichment = 0 when capacity-capped:**
Enrichment only adds to `appealOf`, not `seatsOf`. At Lv1 enclosures the zoo is always
capacity-capped: demand/capacity ≈ 2.3× (demand=24,455 vs capacity=10,486). Income is limited
by seats, not appeal — enrichment changes nothing until the zoo is appeal-limited (requires
all enclosures at Lv2+).

---

## Outliers Detected

| Item | Expected | Actual | Issue |
|------|---------|--------|-------|
| Buy-more vs Upgrade payback gap | ≤ 2× | 8.5× | Buy-more dominates; upgrade always suboptimal |
| Enrichment ROI when capped | 5–20 min payback | ∞ (zero gain) | Useless for ~80% of the game |
| Rabbit enc upgrade gain | Some income improvement | 0 gold/s | Cost formula unscaled for low-appeal animals |
| Capacity-capped frequency | Mixed states | Always, at Lv1 enc | "Expand" signal is permanent background noise |
| Viral bonus magnitude | 1–5s income | 30s income = 12,440g @ Lv45 | Outsized compared to active investment ROI |
| VIP bonus magnitude | 5–10s income | 15s income = 22,220g @ Lv45 | Same concern |

---

## Degenerate Strategies Found

1. **Buy-more spam, never upgrade**: Buying 2nd copies has 8.5× better ROI than upgrading.
   Optimal play = max-count every high-appeal animal before ever touching enclosure upgrades.

2. **Build all 5 attractions first**: Each attraction adds +15% capacity AND +12% revenue
   simultaneously. Performance Arena (45,000g) pays back in ~12 min. Best single investment.

3. **Skip enrichment indefinitely**: Enrichment has 0 income gain whenever the zoo is
   capacity-capped (which spans most of mid-game). Should rationally never be purchased
   until all enclosures are at Lv2+.

---

## Activity Gold vs Passive Income

| Activity | Gold | Cooldown | Gold/hr active |
|---------|------|---------|---------------|
| Rabbit Photo | 120 | 15 min | 480/hr |
| Elephant Feeding | 760 | 30 min | 1,520/hr |
| Elephant Riding | 980 | 1 hr | 980/hr |
| Dolphin Encounter | 2,200 | 4 hr | 550/hr |
| VIP Safari Tour | 2,600 | 4 hr | 650/hr |
| **Passive gate income @ Lv45** | — | — | **1,432,800/hr** |

Activities contribute ~0.1% of total income at Lv45. They are purely cosmetic for gold.
Move 2 (Crowd Surge) from economy-redesign.md is required to make activities strategic.

---

## XP Pacing

**Lv7 by D7 — FEASIBLE ✅**
Quest XP (Ch1–4): ~4,550; adoption XP: ~160; care actions needed: ~490 = 70/day → achievable.

**Lv22 by D30 — AT RISK ⚠️**
- Non-care XP available: ~9,800 quest + ~360 adopt ≈ 10,160
- Care XP needed: ~89,840 / 3 XP/action = 29,947 actions over 30 days = **998/day**
- Max feasible from play: 3 sessions × 5.4 min × 40 actions/min = **648/day**
- **Gap: 35% short** without daily missions

Daily missions (Fe6, not yet implemented) must contribute ≥350 XP/day to hit D30 targets.

---

## Recommendations

| Priority | Issue | Suggested Fix | Target |
|----------|-------|--------------|--------|
| **P1 — DONE ✅** | BUY_COST_MULT = 11 too low | Raised to **50** in prototype.jsx + registry | Buy payback ~10 min |
| **P1** | Enrichment 0 ROI when capped | Implement economy-redesign.md Move 1 (enrichment→welfare, not appeal) | Enrichment viable mid-game |
| **P1** | D30 XP pacing gap | Implement Fe6 daily missions with XP ≥350/day | D30 target met |
| **P2** | UPGRADE_COST_MULT = 80 too high vs buy-more | Reduce to **65** | Upgrade payback ~15 min (1.5× over buy-more) |
| **P2** | Low-appeal upgrade yields 0 income | Min income floor or only apply to appeal≥50 | No pointless 540g purchases |
| **P2** | Activities irrelevant to gold loop | Implement Move 2 Crowd Surge | Activities become strategic |
| **P3** | Viral bonus outsized (×30) | Reduce to ×8 or cap at 3,000 | Still "wow" moment, not economy-breaking |
| **P3** | VIP bonus outsized (×15) | Reduce to ×5 or cap at 2,000 | Consistent with activity economy |

### Values changed this run

```
// BEFORE                          // AFTER (committed)
BUY_COST_MULT = 11                → 50   (+355%)

// PENDING (next pass after Move 1 implementation)
UPGRADE_COST_MULT = 80            → 65   (−19%)
VIRAL_MULT = 30                   → 8
VIP_MULT = 15                     → 5
```

> ⚠️ **Post-redesign caveat**: After implementing economy-redesign.md Move 1, the formula
> magnitudes for appeal and capacity change significantly (encLv term removed from appeal;
> attraction term removed from capacity). ALL cost multipliers must be re-derived from scratch
> against the new formulas. The values above are for the current pre-redesign model only.

---

*Re-run `/balance-check economy` after implementing Move 1 to validate the redesign numbers.*
