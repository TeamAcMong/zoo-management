---
status: proposed-redesign
date: 2026-06-08
author: Genji240696 + Claude
revises: zoo-level.md (C3 — XP sources), currency-system.md (F2 — XP faucets), idle-offline.md (Fe7 — adds offline XP), quests-missions.md (Fe6 — daily/weekly mission XP)
target: an "engaged" player reaches Lv92 (current max) in ~180 days (6 months)
companion-data: design/gdd/xp-pacing-6month-2026-06-08.xlsx
sim: tools/sim/xp_pacing.js (model + solver), tools/sim/build_xlsx.js (xlsx emit)
---

# XP Pacing Redesign — "Scaling Faucets" for a 6-Month Endgame

> ⚠️ **STATUS: PROPOSAL.** This document specifies the *target* XP economy. It revises
> the XP **sources** in the GDDs listed above; it does **not** change the `LEVEL_XP`
> curve or any content-unlock level. Concrete constants are validated by the model in
> `tools/sim/xp_pacing.js`; the headline `XP_PER_VISITOR` must be confirmed by an
> economy (visitor-flow) simulation before lock.

---

## 1. Overview

The current XP economy has a fatal structural mismatch: the `LEVEL_XP` content gate
grows **geometrically** (~+7%/level in the endgame, Lv92 ≈ 30.6M cumulative XP) while
every XP source is **flat and additive** — care = +3/tap forever, the 7-chapter quest
chain = 9,800 XP *once*, activities are capped by cooldowns, and offline XP is an inert
stub. Modelled against realistic play, this means even a maximally-active player needs
~22 years to reach Lv92, and an engaged player ~58 years (`tools/sim/xp_pacing.js`,
status-quo run).

This redesign fixes the **shape** of XP income rather than chipping at the curve: it
makes the dominant XP faucet **scale with the zoo** (i.e. with the same compounding
visitor stream that already drives Gold), so that **days-per-level become roughly
constant** and the journey is predictable. Calibrated to the 6-month target, an engaged
player reaches Lv92 in **180 days**, a casual player in ~13 months, and a maximally
active player in ~3.3 months. The `LEVEL_XP` curve and all unlock levels are untouched.

---

## 2. Player Fantasy

"My zoo grows *with* me." Progress no longer stalls into an impossible grind at the
mid-game. As the zoo gets bigger and busier, the XP it generates grows in step, so each
new biome feels reachable on a human timescale — Polar Peaks around the 3-month mark,
the Dolphin endgame at six months for a dedicated keeper. The player feels a steady,
honest climb: every visitor that walks the gate is both a coin and a lesson (Education
XP), daily missions give the day a rhythm, and a monthly event is a reason to come back
and a visible jump on the bar. No dead zones, no decade-long walls.

---

## 3. Detailed Rules

### 3.1 The fix in one rule

> **XP income must scale at the same geometric rate as the `LEVEL_XP` curve.** The
> primary faucet (Education XP) is tied to the visitor stream, which already compounds
> with the economy as appeal/tiers/upgrades grow. Secondary faucets (daily/weekly
> missions, shows, events) are level-scaled. The result: `days_per_level ≈ constant`.

### 3.2 The five XP faucets (post-redesign)

| # | Faucet | Scales? | Role |
|---|--------|---------|------|
| 1 | **Education XP** (passive, active + offline) — NEW | Yes (∝ visitors) | Primary engine (~60% of late-game XP) |
| 2 | **Daily missions** (5/day) — XP added (currently gems-only) | Yes (level) | Daily hook (~25%) |
| 3 | **Show / activity XP** — now level-scaled | Yes (level) | Active-play reward (~15%) |
| 4 | **Weekly mission set** | Yes (level) | Weekly cadence (lump) |
| 5 | **Monthly event** | Yes (level) | Retention spike (lump) |
| — | Care (+3), Quest chain (9,800), Adopt (+40) | No (flat) | **Early-game ramp only** (Lv1→~10) |

### 3.3 Pacing result (validated by the model)

| Milestone | Casual (×0.45) | **Engaged (×1.0)** | Max (×1.9) | Content |
|---|---|---|---|---|
| Lv7  | 0.1 mo | 0.1 mo | 0.1 mo | Petting Area, daily missions |
| Lv18 | 0.5 mo | 0.3 mo | 0.2 mo | Feeding Zone, Day/Night |
| Lv30 | 1.8 mo | 0.9 mo | 0.5 mo | Woodland, Rides |
| Lv45 | 4.2 mo | 2.0 mo | 1.1 mo | Performance Arena |
| Lv60 | 7.3 mo | 3.4 mo | 1.8 mo | Polar Peaks |
| Lv75 | 10.0 mo | 4.6 mo | 2.5 mo | Reptile House |
| **Lv92** | **13.1 mo** | **6.0 mo (180 d)** | **3.3 mo (98 d)** | Dolphin (endgame) |

*Casual/Engaged/Max differ only by activity intensity (×0.45 / ×1.0 / ×1.9); the
casual:engaged:max spread is fixed at ≈ 2.2 : 1 : 0.55. Full per-level table in the
companion `.xlsx`, sheet `Curve_Pacing`.*

---

## 4. Formulas

All XP is integer; level is `levelFromXp(xp)` (unchanged). The curve constant
`G = (18,000,000 / 3,600,000)^(1/24) ≈ 1.0694` is the endgame ratio; the faucet scale
`S = 1431` is solved so engaged hits Lv92 at 180 days.

### 4.1 Curve (UNCHANGED — restated for completeness)
```
LEVEL_XP[]  : generated from LEVELS anchors by geometric interpolation (see zoo-level.md)
              Lv7=5,200 · Lv18=42,000 · Lv30=210,000 · Lv45=980,000 ·
              Lv60=3,600,000 · Lv84=18,000,000 · Lv92≈30,600,000
level       = levelFromXp(xp)          # highest n with xp >= LEVEL_XP[n-1], max 92
```

### 4.2 Scaling daily pool (design quantity that the faucets sum to)
```
P(level) = round( S * G^level )        # S=1431, G=1.0694
                                        # P(7)≈2,300 · P(30)≈11k · P(60)≈101k · P(92)≈684k
```

### 4.3 Faucet 1 — Education XP (PRIMARY, scales with visitors)
```
# Active (per second the zoo is open), mirroring goldPerSec:
xpPerSec       = round( visitors * XP_PER_VISITOR )            # XP_PER_VISITOR ≈ 0.02
# Offline (mirrors offline gold), recomputed from saved state, same caps as gold:
offlineXP      = floor( min(elapsed, cap) * xpPerSec * OFFLINE_XP_FACTOR )   # factor 0.60
                 # cap = 28,800 s free / 86,400 s VIP ; elapsed<=0 -> 0
```
`XP_PER_VISITOR` is calibrated so that Education XP ≈ **0.60 × P(level)** per day for the
engaged session profile. Because `visitors` grows with appeal/tier/upgrades, this term
**auto-tracks the curve** without a per-level table. (`visitors` per the chosen economy
model — see Dependencies; constant must be re-derived if the economy model changes.)

### 4.4 Faucet 2 — Daily missions (5/day, now grant XP + gems)
```
dailyMissionXP   = round( 0.05 * P(level) )    # per mission; 5 missions/day => ~0.25*P(level)
dailyMissionGems = randInt(5, 15)             # per mission (the existing free Gem faucet)
# resets at 00:00 UTC; dailyCounts separate from lifetime counts (per ADR-0010)
```

### 4.5 Faucet 3 — Show / activity XP (now level-scaled)
```
showXP(level)    = round( SHOW_XP_BASE * (1 + SHOW_XP_SLOPE * level) )   # BASE=120, SLOPE=0.05
                   # replaces the flat 120/180/240 constants
```

### 4.6 Faucet 4 — Weekly mission set (lump, once per week)
```
weeklyXP(level)  = round( 0.9 * P(level) )      # granted on weekly mission-set completion
```

### 4.7 Faucet 5 — Monthly event (lump, once per ~month)
```
eventXP(level)   = round( EVENT_XP_MULT * P(level) )   # EVENT_XP_MULT = 4
```

### 4.8 Early-game ramp (flat, unchanged) and total
```
careXP           = 3 per care action
adoptXP          = 40 per newly-unlocked species
questChainXP     = 9,800 total across the 7 chapters (one-time, all by ~Lv10)

# Effective engaged XP/day at a given level (what the model integrates):
dailyXP(level)   ≈ 1.262 * P(level) + (species_owned * 5 * 3)
                   # 1.0 (faucets 1-3 = pool P) + 0.9/7 (weekly) + 4/30 (event amortized)
                   # + flat care, dominant only in early game
```

**Worked example (Lv60, engaged):** `P(60) ≈ 101,000`. Daily XP ≈ `1.262×101,000 + (≈19 species ×15) ≈ 127,700 + 285 ≈ 128,000 XP/day`. The Lv60→Lv61 gate delta ≈ 250,000 XP, so ≈ 2 days for that level — consistent with a constant ~2 day/level cadence reaching Lv92 at ~180 days.

---

## 5. Edge Cases

- **EC-1 — Offline clock pushed forward (XP farm):** offline XP uses the same guard as
  offline gold — `elapsed ≤ 0 → 0`, clamp to 8h/24h cap. A forward clock jump can buy at
  most one capped offline window; single-player, low stakes. Content unlocks still gate
  on level, so a farmed level still respects gates.
- **EC-2 — Neglected zoo (low happyMult):** Education XP ∝ visitors ∝ appeal × happyMult.
  Neglect lowers **both** gold and XP. Floors (`happyMult ≥ 0.5`, `goldPerSec ≥ 1`,
  `xpPerSec ≥ 0`) prevent a hard stall, but progression deliberately slows under neglect.
- **EC-3 — Capacity-clipped zoo:** `visitors = min(demand, capacity)`, so an under-built
  zoo caps XP just as it caps gold. Capacity becomes a *progression* lever, not only an
  income one. Intended pressure; surfaced via the existing amber gate signal.
- **EC-4 — MAX_LEVEL (92):** XP keeps accumulating silently; no level-up, no further
  unlock (per C3 EC-1). All faucets continue to pay (harmless).
- **EC-5 — Day/Night variance (Lv18+):** `timeMult` scales demand → scales Education XP
  within a day, but the cycle is net-neutral (avg ≈ 1.0), so daily XP is unaffected on
  average. Surge/peak create the same brief XP spikes as gold spikes.
- **EC-6 — Daily/weekly/event not yet shipped:** if a faucet is absent, the player falls
  back toward the lower-intensity curve (≈ casual). The 6-month promise is contingent on
  these faucets existing (see §"Potential & Emergent Issues" #4).
- **EC-7 — Number magnitude:** cumulative XP reaches ~30.6M and XP/day ~684k at Lv92 —
  store XP as 64-bit; UI must abbreviate (e.g. "30.6M", "12.4K/s").

---

## 6. Dependencies

- **C3 Zoo Level (`zoo-level.md`)** — REVISED: replaces the flat XP-source table; curve
  and unlock levels unchanged. C3 remains the owner of `LEVEL_XP`.
- **F2 Currency (`currency-system.md`)** — REVISED: Zoo XP gains new scaling faucets;
  daily-mission Gem faucet now also live.
- **Fe7 Idle/Offline (`idle-offline.md`)** — REVISED: adds **offline XP** (was a dead
  stub) mirroring offline gold (`OFFLINE_XP_FACTOR`, same caps).
- **Fe6 Quests (`quests-missions.md`)** — REVISED: daily/weekly missions grant XP per the
  formulas above; requires the daily-reset infra (ADR-0010) and F3 persistence.
- **C2 Zoo Economy (`zoo-economy.md` OR `economy-redesign.md`)** — CRITICAL: Education XP
  reads `visitors`. `XP_PER_VISITOR` must be calibrated against **whichever economy model
  is chosen** (the flat model and the role-differentiated redesign produce different
  visitor magnitudes). **Lock the economy model before locking this constant.**
- **C1 Animal Care (`animal-care.md`)** — Education XP inherits the `happyMult` basis;
  the care→happy incoherence (only Play/Heal raise `happy`) propagates into XP unless
  fixed (see §"Potential & Emergent Issues" #9).
- **ADR-0003 / ADR-0005 / ADR-0010** — mutation pipeline, wall-clock offline, daily-reset
  integrity. No new architectural decision required; this is a tuning/faucet design.

---

## 7. Tuning Knobs

| Knob | Symbol | Proposed | Safe range | Effect |
|------|--------|----------|-----------|--------|
| Faucet scale | `S` | 1431 | 715 – 2862 | Master pacing lever; ×0.5 → ~12 mo, ×2 → ~3 mo |
| Curve ratio (endgame) | `G` | 1.0694 | 1.05 – 1.09 | Late-curve steepness; keep matched to faucet |
| Education XP per visitor | `XP_PER_VISITOR` | 0.02 | 0.005 – 0.05 | Calibrate so Education ≈ 0.60·P(L)/day; confirm via economy sim |
| Offline XP rate factor | `OFFLINE_XP_FACTOR` | 0.60 | 0.30 – 0.90 | Offline XP as fraction of active (mirrors gold) |
| Daily mission count | `DAILY_MISSION_COUNT` | 5 | 3 – 8 | Each ≈ 0.05·P(L) XP + 5–15 gems |
| Show XP base | `SHOW_XP_BASE` | 120 | 60 – 240 | `showXP = BASE·(1+SLOPE·level)` |
| Show XP level slope | `SHOW_XP_SLOPE` | 0.05 | 0.02 – 0.10 | Per-level growth of show XP |
| Monthly event XP mult | `EVENT_XP_MULT` | 4 | 2 – 8 | `eventXP = mult·P(L)`, once/month |
| Offline cap (free) | `OFFLINE_CAP_FREE_SEC` | 28,800 | 14,400 – 86,400 | Shared with gold; anti clock-exploit |
| Quest chain total | `QUEST_XP_TOTAL` | 9,800 | 5,000 – 15,000 | One-time early ramp Lv1→10 |

> Single most important lever: **`S`** moves the whole journey; **`XP_PER_VISITOR`** is
> how `S`'s effect is realised in-engine via the visitor stream.

---

## 8. Acceptance Criteria

- **AC-1** With the proposed constants, the model in `tools/sim/xp_pacing.js` reports the
  engaged profile reaching Lv92 at **180 ± 5 days**, casual at 12–14 months, max at 3–4
  months. (Re-run after any constant change.)
- **AC-2** `days_per_level` for the engaged profile stays within a 0.5×–2× band of its
  median across Lv20–Lv92 (no wall, no trivial stretch).
- **AC-3** Education XP accrues both active (1/sec) and offline (× `OFFLINE_XP_FACTOR`,
  capped); `elapsed ≤ 0` grants 0 XP; offline XP recomputes from saved state, not a stored
  rate.
- **AC-4** Each daily mission grants `round(0.05·P(level))` XP and 5–15 gems; the daily set
  resets at 00:00 UTC without wiping lifetime XP or `claimed`.
- **AC-5** `showXP(level)` is strictly increasing in level; at level 0 equals `SHOW_XP_BASE`.
- **AC-6** Reducing `S` to 715 (and recalibrating `XP_PER_VISITOR`) shifts engaged Lv92 to
  ~360 days; doubling `S` to 2862 shifts it to ~90 days. (Lever monotonic & predictable.)
- **AC-7** A neglected zoo (happyMult at floor 0.5) still earns non-zero Education XP, and a
  capacity-clipped zoo's XP rises when capacity is upgraded.

---

## Potential & Emergent Issues (đọc kỹ trước khi lock)

Issues this design **introduces or surfaces** — beyond the formulas themselves:

1. **Care → economy → XP becomes a double coupling.** Since Education XP now flows from
   `visitors` (which depends on `happyMult`), neglect penalises *both* gold *and* level
   progression. Upside: care finally matters for progression. Risk: a struggling player
   can feel a mild down-spiral. *Mitigated by the 0.5 happyMult floor.* Decide if that
   floor is generous enough.

2. **Offline XP creates a clock-manipulation surface for content gates.** Offline gold was
   already exploitable, but offline XP lets a clock-setter *unlock content* early, not just
   bank currency. *Mitigated by the 8h/24h cap + wall-clock guard + single-player low
   stakes.* If a leaderboard/competitive event is ever added, this needs server time.

3. **Capacity now gates progression, not just income.** Because `visitors = min(demand,
   capacity)`, an under-built zoo throttles XP. This is good synergy with the economy
   redesign's "capacity is a real lever", but a player who over-collects animals and
   under-builds enclosures will *stall on level*, not just gold. Surface it via the
   existing amber gate + a "expand to keep growing" nudge.

4. **The 6-month promise is a content-cadence commitment.** ~45% of late-game XP comes from
   daily missions + weekly sets + monthly events. If those systems slip (daily missions are
   currently unimplemented; events are post-MVP), pacing reverts toward the casual curve or
   worse. **This design assumes daily missions + scaling show XP + a monthly event all
   ship.** Treat them as launch-blocking for the pacing target.

5. **Number inflation.** Cumulative XP ~30.6M, XP/sec into the thousands at endgame. Needs
   64-bit storage (already long) and UI abbreviation. Watch for `int` overflow in any
   intermediate (visitors × rate × elapsed) — `min(elapsed,cap)` bounds it, but verify.

6. **Whale compression / monetisation interaction.** Max profile reaches Lv92 in ~3.3
   months. If the shop ever sells direct XP boosts, endgame trivialises. **Recommendation:
   do not sell direct XP**; VIP's value stays the 24h offline cap (already modelled in the
   ×1.9 ceiling). Revisit if a "double XP weekend" event is added (treat as a temporary `S`
   multiplier and re-sim).

7. **`XP_PER_VISITOR` is coupled to the economy model + its constants.** The flat
   `zoo-economy.md` model and the `economy-redesign.md` model yield *different* visitor
   magnitudes (the redesign strips the enclosure-appeal term, raising the role of capacity).
   **Lock the economy model first**, then calibrate `XP_PER_VISITOR`, then re-sim. Any later
   change to `VISITORS_PER_APPEAL` / `SPEND_PER_VISITOR` / the appeal ladder forces a
   re-calibration.

8. **Early "quest cliff" risk (Lv10–18).** The flat ramp (quests 9,800 + care) carries
   Lv1→~10; the scaling pool only becomes large later. The model shows a smooth handover
   (Lv18 at ~0.3 mo engaged), but with the *real* early economy (tiny appeal → tiny
   Education XP) the bridge may sag. Validate Lv10–20 explicitly in the economy sim; if it
   dips, raise `QUEST_XP_TOTAL` or add a couple of early daily-mission XP grants.

9. **This redesign inherits the care→happy incoherence (separate bug).** Education XP, like
   gold, scales with `happyMult`, which today only rises from **Play/Heal/Enrichment** — not
   Feed/Water/Bathe (see `animal-care.md` OQ-2). So the "education from happy visitors"
   fantasy is, mechanically, "Play-spam → XP". **Fix the care→happy logic** (derive `happy`
   from hunger/thirst/clean) or this faucet rewards the same degenerate "spam free Play"
   strategy. Tracked separately; flagged here because it directly distorts faucet #1.

10. **Day/Night + surge add XP variance (Lv18+).** `timeMult` and show-surge scale demand →
    scale Education XP intra-day. Net-neutral on the daily average (avg ≈ 1.0), so the
    pacing table holds, but expect "rush-hour XP spikes" — fine, even desirable, just
    document it so it isn't read as a bug.

---

## Formula Conversion Sheet (current → 6-month)

Direct, plug-and-play conversion of every timing-affecting formula. Neutral constants:
`S = 1431`, `G = 1.0694`, scaling pool `P(level) = round(1431 * 1.0694^level)`.

### A. KEEP unchanged (do not touch)

| Formula | Value | Why |
|---|---|---|
| `LEVEL_XP[]` (92-anchor curve) | Lv7=5,200 … Lv92≈30.6M | Only the XP **sources** change, not the gate |
| `level = levelFromXp(xp)` | — | Unchanged |
| Care XP | +3 / action | Early-game ramp |
| Adopt XP | +40 / species | Early-game ramp |
| Quest chain (7 chapters) | 9,800 XP one-time | Early-game ramp (done ~Lv10) |

### B. CONVERT (XP-source changes)

| # | CURRENT | → CONVERTED (6-month) |
|---|---|---|
| 1 | Offline XP = **0** (dead stub) | `offlineXP = floor( min(elapsed,cap) * xpPerSec * 0.60 )` — cap 8h/24h; `elapsed<=0 -> 0` |
| 2 | *(none)* | **Education XP/sec** = `round( visitors * XP_PER_VISITOR )`; accrues active 1/sec + offline 0.6×. Calibrate `XP_PER_VISITOR` so **Education/day ≈ 0.60 * P(level)** |
| 3 | Show XP = flat 120 / 180 / 240 | `showXP = round( 120 * (1 + 0.05 * level) )` |
| 4 | Daily missions = gems only | + XP: each mission `round(0.05 * P(level))`, 5/day |
| 5 | *(none)* | Weekly set = `round(0.9 * P(level))` /week · Monthly event = `round(4 * P(level))` /month |

### C. Concrete values (representative levels — full 92-row table in the .xlsx `Faucet_PerLevel`)

| level | P(L) | Education/day (0.60·P) | daily mission each / ×5 | Show XP | Weekly (0.90·P) | Event (4·P) | ΔLEVEL_XP/level |
|---|---|---|---|---|---|---|---|
| 7  | 2,288 | 1,373 | 114 / 572 | 162 | 2,059 | 9,152 | 1,090 |
| 18 | 4,785 | 2,871 | 239 / 1,196 | 228 | 4,307 | 19,140 | 6,000 |
| 30 | 10,699 | 6,419 | 535 / 2,675 | 300 | 9,629 | 42,796 | 23,000 |
| 45 | 29,256 | 17,554 | 1,463 / 7,314 | 390 | 26,330 | 117,024 | 90,000 |
| 60 | 79,995 | 47,997 | 4,000 / 19,999 | 480 | 71,996 | 319,980 | 250,000 |
| 75 | 218,736 | 131,242 | 10,937 / 54,684 | 570 | 196,862 | 874,944 | 660,000 |
| 92 | 683,950 | 410,370 | 34,198 / 170,988 | 672 | 615,555 | 2,735,800 | — |

**Check:** engaged total ≈ `1.262 * P(level) + care` → ≈ 2 days/level → **Lv92 = 180 days (6 months)** ✅
(casual ~13 mo, max ~3.3 mo).

### D. The two levers
- **`S = 1431`** — master time lever: ×0.5 → ~12 mo, ×2 → ~3 mo.
- **`XP_PER_VISITOR ≈ 0.02`** — how `S` is realised via the visitor stream; **calibrate after locking the economy model** (flat vs redesign give different `visitors`).

---

## Companion Files

- **`design/gdd/xp-pacing-6month-2026-06-08.xlsx`** — 5 sheets: `Curve_Pacing` (all 92
  levels: XP threshold, delta, engaged XP/day, day-reached per profile, content),
  `Faucet_Allocation` (per-source XP at key levels), `Faucet_PerLevel` (full 92-row
  per-source breakdown + engaged day-reached), `Profile_Comparison` (months to each
  milestone), `Tuning_Knobs`.
- **`tools/sim/xp_pacing.js`** — the model + solver (edit `S`/`G`/faucet shares and re-run).
- **`tools/sim/build_xlsx.js`** — regenerates the `.xlsx` from the model output.
