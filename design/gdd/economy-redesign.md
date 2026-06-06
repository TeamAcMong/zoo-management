---
status: proposed-redesign
date: 2026-06-06
author: Genji240696 + Claude
revises: zoo-economy.md (C2), habitat-system.md (Fe2), enrichment.md (Fe3), attractions.md (Fe4)
---

# Economy Redesign — Role-Differentiated Sinks + Day/Night Visitor Rhythm

> ⚠️ **STATUS: PROPOSAL — NOT YET IMPLEMENTED.**
> The current code in `act/prototype.jsx` and the values in `design/registry/entities.yaml`
> reflect the **pre-redesign** model (all four investments feed `appeal`; no day/night
> cycle). This document is the **target design**. Every number is a design target pending
> a `/balance-check` simulation. The redesign does **not** change the
> `appeal → visitors → gold` spine; it (1) re-roles the four gold sinks so they stop all
> resolving to "more appeal", (2) adds a within-session day/night visitor rhythm decoupled
> from the real-world clock, and (3) gives gold somewhere to flow once appeal sinks cap out.

---

## Overview

Animal World Zoo's gold loop is mechanically coherent but **strategically flat**: the four
ways a player can spend gold — adopt more animals, upgrade an enclosure, add enrichment,
build an attraction — all currently increase the *same* variable (`appeal`) and produce the
*same* outcome (more gold/sec). Every spending decision is therefore the same decision at a
different exchange rate, which collapses into "buy more appeal" and produces the
"watch-the-number, then get-stuck" feel.

This redesign solves that by giving each sink a **distinct, orthogonal role** mapped onto the
terms already present in the C2 formula chain (appeal · capacity · welfare-multiplier ·
spend-per-head), so the player faces a real diagnosis ("what is my bottleneck *right now*?")
with four different answers. On top of that it layers a **5-minute in-game day/night cycle**
that gives visitor volume a living rhythm (rush hours and quiet nights) **without ever tying
income to the real time of day** — the cycle is a free-running fast loop whose time-weighted
average is ≈1.0×, so total earnings are unchanged and offline accrual stays trivially simple.
Finally it adds an **anti-dead-zone sink** so a gold-rich, level-poor player always has
something worthwhile to buy.

## Player Fantasy

"I run a zoo, and I can *read* it." The player glances at the gate and knows what their zoo
needs: a thin crowd at midday means it isn't appealing enough; a packed gate turning people
away at rush hour means it's time to expand; sluggish, unhappy animals mean it's time to care.
The zoo *breathes* — mornings fill up, midday roars, evenings wind down, nights glow quiet —
and the player learns its rhythm, timing their shows to the lunch rush and lighting the park
to keep guests after dark. Crucially, the game never punishes *when* they log in: the rhythm
is something to enjoy and engage with, not a clock to beat. Spending gold feels like making
*decisions about a place*, not feeding a single number.

## Detailed Design

### The Problem We Are Fixing — Over-Dependence on `appeal`

**Today (pre-redesign):** every gold sink raises appeal.

| Sink | Current effect | Resolves to |
|------|----------------|-------------|
| Adopt animal (population) | `appealOf += base × count` | ↑ appeal |
| Upgrade enclosure | `× (1 + 0.25·(encLv−1))` on appeal **and** seats | ↑ appeal (+ capacity) |
| Enrichment | `× (1 + 0.10·enr)` on appeal | ↑ appeal |
| Attraction | `× (1 + 0.12·built)` spend **and** `× (1 + 0.15·built)` capacity | ↑ gold (+ capacity) |

Because three of four sinks add appeal and the fourth multiplies the gold appeal produces, the
"correct" move is always whichever currently offers the most appeal-per-gold. There is **one
axis** of optimisation. The capacity cap (`visitors = min(demand, capacity)`) is the *only*
source of tension, and it has exactly one answer (raise capacity), so it reads as a chore, not
a choice.

### Move 1 — Role-Differentiated Sinks (the core fix)

Re-role the four sinks so each owns **one** term of the chain. No sink overlaps another.

| Sink | New role | Formula change |
|------|----------|----------------|
| **Adopt animal (population)** | **APPEAL** — raw visitor draw (breadth) | `appealOf(k) = base[k] × count[k]` — *enclosure term removed* |
| **Upgrade enclosure** | **CAPACITY** — lets you realise the demand you have | drives `seatsOf` only; **no longer adds appeal** |
| **Enrichment** | **WELFARE / efficiency** — feeds `happyMult` and cuts care burden | each level slows that animal's decay and raises its welfare floor; **no flat +appeal** |
| **Attraction** | **SPEND/HEAD** — monetise the crowd you already have | keeps `× (1 + 0.12·built)` on gold; **capacity term removed** |

This yields **four readable bottleneck states**, surfaced as a single HUD "next best action"
line (cross-review D-W2 requested exactly this):

| Symptom | Bottleneck | Lever |
|---------|-----------|-------|
| `happyMult` low (animals neglected) | welfare | **Care / Enrichment** |
| avg demand > capacity (gate clips) | capacity | **Upgrade enclosures** |
| capacity > avg demand (empty seats) | appeal | **Adopt animals / raise happiness** |
| crowd full, want more yield | spend/head | **Build attractions** |

Appeal is now **one of four axes**, not the only one. (See the Scenario Walkthrough for a
session-by-session demonstration of the player using a *different* lever for each bottleneck.)

### Move 2 — Crowd Surge (wire the active layer into the passive loop)

The 15 entertainment activities are currently a separate cooldown vending machine. Connect them
to the gate: running an activity triggers a **timed Crowd Surge** — for `SURGE_DURATION` after a
show, `timeMult` (see Day/Night) is boosted by `+SURGE_BONUS`. Running a show **during the midday
rush stacks** with the time-of-day peak, creating the best gold moment in the loop. Optionally,
gold can be spent to upgrade a surge ("premium feed" → larger bonus), giving gold a **burst sink**
that competes with slow appeal investment.

### Move 3 — Gold Sinks Past the Appeal Cap (kill the "rich-but-stuck" dead zone)

Root cause of "stuck": appeal sinks all cap (encLv 5, enrich 5, 5 attractions) while the *next*
species is gated by **XP**, not gold — so a gold-rich player has nothing to buy and just waits.
Three tiers, escalating in scope:

1. **Comfort Levels (ship first).** An always-available, diminishing-returns sink: enclosure
   "comfort" beyond Lv5 grants `+1%` appeal per level at escalating cost. Gold always has a
   marginal use; never a dead pile.
2. **Zoo Improvements (mid).** Gold-bought park facilities (paths, signage, decor) grant a small
   *permanent* `happyMult`/capacity bonus **plus a chunk of Zoo XP**, bleeding excess gold back
   into the level track. Must use diminishing returns + level-scaled cost so it does not break the
   months-long pacing pillar.
3. **Zoo Tour / Prestige (endgame).** Soft-reset a maxed biome for a permanent multiplier
   (roadmap Q4 already names "Endgame prestige — Zoo Tour"). The genre-standard answer to
   "infinite gold, nothing to buy."

### Day/Night Visitor Rhythm

**Anchor principle (why the timing is "reasonable"):** *every session, whenever the player logs
in, must see the full day/night rhythm and catch at least one rush peak.* Sessions are 5–10 min,
so **one in-game day = 5 minutes (`CYCLE = 300s`)**: the shortest session sees one full day, a
10-minute session sees two. No one is stuck in an all-quiet window.

The cycle is driven by a **free-running clock** `phase = (Date.now()/1000) mod 300` — it loops
288×/day, so it has **no correlation with the real time of day** (logging in at 11pm does not mean
in-game night). It survives reload (no jarring reset) and requires no stored cycle state.

| Phase | Window | `timeMult` | Feel |
|-------|--------|-----------|------|
| 🌅 Dawn | 0:00–1:00 | 0.7 → 1.1 (ramp) | crowds trickle in |
| ☀️ Midday peak | 1:00–2:30 | **1.4** | packed — run shows here |
| ⛅ Afternoon | 2:30–3:30 | 1.1 | still lively |
| 🌇 Dusk | 3:30–4:15 | 0.8 | winding down |
| 🌙 Night | 4:15–5:00 | 0.5 (raised by lighting) | quiet, lamplit |

Time-weighted average ≈ **1.0×** → total gold per cycle is **identical** to the no-cycle model;
the system adds *rhythm*, not net income change.

**Capacity synergy (a feature, not a bug):** `timeMult` multiplies **demand**. If the zoo is
under-built, the midday peak pushes demand above capacity and the gate clips — a *correct* signal
("you're turning guests away at rush hour → expand"). Once capacity ≥ peak demand, the average
returns to true neutral. Day/night thus *teaches* the capacity lever from Move 1.

**Player control of visitor volume (the player's lever, not the clock's):**
- **Night Lighting** (gold sink, tiers 0–3): raises the night floor `0.5 → 0.63 → 0.76 → 0.89`.
  Literally "spend gold to flatten the curve and turn quiet nights into earning time."
- **HUD sun/moon dial + "Next rush in 1:40" countdown** — converts the quiet window into
  *anticipation* instead of *punishment*.

### Two-Clock Model (and why it stays coherent)

| Clock | Drives | Rationale |
|-------|--------|-----------|
| **Wall-clock (real time)** | Offline accrual (8h cap) · care decay (daily cadence) | "The game respects your time" — animal biology tracks real hours |
| **Free-running 5-min cycle** | Ambient lighting · visitor `timeMult` | Within-session texture; loops fast so every session catches the rhythm |

They model different things (slow animal biology vs. fast crowd ambiance) and never interact, so
there is no contradiction. **Offline accrual forces `timeMult = 1.0`** (the daily average) —
offline math never needs to know whether the tab was closed at noon or midnight.

## Formulas

```
# ---- Appeal (Move 1: population only) ----
appealOf(k)  = base[k] × count[k]                          # enclosure term REMOVED
happyMult    = clamp(0.4 + avgWelfare/100, 0.5, 1.4)       # welfare = mean(hunger,thirst,clean,happy)
appeal       = round( Σ appealOf(k) × happyMult )

# ---- Capacity (Move 1: enclosure only; attraction term REMOVED) ----
seatsOf(k)   = base[k] × count[k] × (0.6 + 0.6·(encLv[k] − 1))
capacity     = round( BASE_GATE + Σ seatsOf(k) )           # BASE_GATE = 5

# ---- Day/Night (free-running clock) ----
phase        = (Date.now()/1000) mod CYCLE                 # CYCLE = 300s
nightFloor   = 0.50 + 0.13 · nightLightLv                  # lv 0..3 → 0.50..0.89
timeMult     = curve(phase, nightFloor) ∈ [nightFloor, 1.4],  time-weighted avg ≈ 1.0
surge        = (now − lastShowAt < SURGE_DURATION) ? SURGE_BONUS : 0   # Move 2

# ---- Realised income (Move 1: attraction = spend/head only) ----
demand       = round( appeal × VISITORS_PER_APPEAL × (timeMult + surge) )   # VPA = 1.0
visitors     = min(demand, capacity)
goldPerSec   = max(1, round( visitors × SPEND_PER_VISITOR × (1 + 0.12·built) ))  # SPV = 0.05

# ---- Enrichment (Move 1: welfare/efficiency, not appeal) ----
decayMult(k)   = max(0.25, 1 − 0.15·enr[k])                # enr5 → 75% slower decay
welfareFloor(k)= 40 + 8·enr[k]                             # enr5 → floor 80

# ---- Offline (Fe7): timeMult forced to 1.0, recomputed from saved state ----
offlineGold  = floor( min(elapsed, cap) × goldPerSec[timeMult=1.0] × 0.60 )
```

**Variable ranges:** `timeMult` 0.5–1.4 (lv0) up to 0.89–1.4 (lv3 lighting); `appeal` 0–~tens of
thousands; `capacity` ≥ 5; `goldPerSec` floored at 1. `CYCLE`, `SURGE_DURATION`, `SURGE_BONUS`,
`nightLightLv` are tuning knobs.

> **Rebalance dependency:** removing the encLv-appeal term and the attraction-capacity term
> changes the magnitude of `appeal` and `capacity`, so the buy/upgrade/enrich cost multipliers
> (already flagged ~2× high) **must be re-derived per-role** in the balance pass. All cost numbers
> are out of scope here and owned by `/balance-check` (see Open Questions).

## Scenario Walkthrough (driven by the in-game clock)

### Part A — One in-game day (5:00) at a mid-game zoo

State: `appeal = 1200`, `capacity = 1300`, `built = 2` (spend ×1.24), no night lighting, no surge.

| Clock | Phase | `timeMult` | demand | visitors | gold/s | What the player sees / does |
|-------|-------|-----------|--------|----------|--------|------------------------------|
| 0:30 | 🌅 Dawn | ~0.9 | 1080 | 1080 | **67** | gate filling, calm |
| 1:45 | ☀️ Peak | 1.4 | 1680 | **1300 (CLIPPED)** | **81** | gate pill turns **amber** — "turning guests away!" (uncapped would be 104). Player reads it as *capacity*, not appeal → queues an **enclosure upgrade** |
| 3:00 | ⛅ Afternoon | 1.1 | 1320 | 1300 (just clipped) | 81 | still busy |
| 3:50 | 🌇 Dusk | 0.8 | 960 | 960 | 60 | crowd thinning |
| 4:40 | 🌙 Night | 0.5 | 600 | 600 | **37** | quiet, lamplit → player buys **Night Lighting Lv2** (floor 0.63) → demand 756 → **47/s** |

**After** the player raises capacity to ~1700: the midday peak no longer clips → 1680 visitors →
**104/s** at noon, and the daily average climbs back to true neutral. The fix for "low peak
income" was **capacity**, not "more animals/appeal" — the bottleneck the old model could not
express.

### Part B — Four sessions, four different bottlenecks (the anti-appeal-dependence proof)

| Session | Symptom across the whole day | Diagnosis | Correct lever (NOT just "buy appeal") |
|---------|------------------------------|-----------|----------------------------------------|
| **A — early** | capacity ≫ demand even at the 1.4 peak; seats sit empty | appeal-starved | **Adopt animal / raise happiness** (appeal) |
| **B — mid** | gate clips at midday, fine at night | capacity-capped | **Upgrade enclosures** (capacity) ← the lever the old model hid |
| **C — neglected** | `happyMult` at 0.8; demand soft all day | welfare | **Care + Enrichment** (multiplier + slower decay) |
| **D — built-out** | crowd full all peak, nothing clipping | under-monetised | **Build attraction / run surge show** (spend/head) |

Four sessions → four genuinely different right answers. Appeal is one axis among four.

## Edge Cases

- **EC-1 — Clock moved back / `phase` discontinuity:** `phase` is `mod 300` of wall-clock; a
  backward clock jump simply lands at a different phase. No income error (income is per-second on
  the *current* phase). Offline uses `timeMult=1.0`, so a clock jump cannot inflate offline gold.
- **EC-2 — Under-built zoo, permanent peak clip:** intended. Average dips *below* 1.0 only while
  capacity < peak demand — a correct "expand" pressure, in the player's control. Never punishes
  login time (it punishes under-building).
- **EC-3 — Night with no lighting + low appeal:** `goldPerSec` floors at 1; the night dip can
  never zero income.
- **EC-4 — Surge active across phase boundary:** `surge` adds to `timeMult`; a surge started at
  dusk can push a quiet phase up — desirable (rewards active play in off-peak).
- **EC-5 — Enrichment + offline decay:** `decayMult` reduces *wall-clock* decay, so enrichment
  also softens the offline decay applied on resume. Floor at `welfareFloor(k)`.
- **EC-6 — Appeal sinks all maxed:** Move 3 Comfort Levels guarantee a non-zero marginal sink, so
  the "rich-but-stuck" dead zone cannot recur.

## Dependencies

- **C2 Zoo Economy** (`zoo-economy.md`) — this redesign **revises** C2's §4 formulas (appeal loses
  encLv term; capacity loses built term; demand gains `timeMult`). C2 is the spine; this is the
  re-roling of its inputs.
- **Fe2 Habitat** (`habitat-system.md`) — enclosure becomes the **capacity** lever (not appeal).
  Revise Fe2's appeal-bonus framing.
- **Fe3 Enrichment** (`enrichment.md`) — enrichment becomes a **welfare/decay** lever (not flat
  appeal). Revise Fe3's `+10%/level` rule.
- **Fe4 Attractions** (`attractions.md`) — attraction becomes the **spend/head** lever only
  (drop the capacity contribution).
- **C1 Animal Care** (`animal-care.md`) — `decayMult`/`welfareFloor` interact with the decay loop;
  welfare composite already feeds `happyMult`.
- **Fe7 Idle/Offline** (`idle-offline.md`) — offline forces `timeMult=1.0`; otherwise unchanged.
- **F2 Currency System** (`currency-system.md`) — Night Lighting + Comfort Levels + Zoo
  Improvements are new **Gold sinks**; Move 3 tier 2 introduces a Gold→XP bleed (new XP faucet).
- **P1 HUD** *(unwritten)* — must render the sun/moon dial, "next rush" countdown, amber clip
  signal, and the "next best action" line.

## Tuning Knobs

| Knob | Symbol | Proposed | Safe range | Affects |
|------|--------|----------|-----------|---------|
| Cycle length | `CYCLE` | 300 s | 240–360 s | Must be ≤ min session (5 min) for the fairness anchor |
| Peak multiplier | peak `timeMult` | 1.4 | 1.2–1.6 | Rush-hour intensity; higher = more capacity pressure |
| Night floor (base) | `nightFloor₀` | 0.5 | 0.4–0.7 | Quiet-night depth; <0.4 feels punishing even if avg=1.0 |
| Night lighting step | per tier | +0.13 (×3) | 0.08–0.15 | Strength of the night-flattening sink |
| Surge bonus | `SURGE_BONUS` | +0.5 | +0.3–+0.8 | How much a show spikes demand |
| Surge duration | `SURGE_DURATION` | 90 s | 45–180 s | How long the spike lasts |
| Enclosure seat coeff | — | 0.6 + 0.6·(encLv−1) | — | Capacity-per-level (sole capacity lever now) |
| Enrichment decay slow | per level | −15% | −10%…−20% | Care-burden relief from enrichment |
| Comfort Level appeal | per level | +1% | +0.5%…+2% | The infinite diminishing gold sink |
| Offline rate factor | — | 0.60 | 0.30–0.90 | (inherited from Fe7) |

## Acceptance Criteria

- **AC-1** Each of the four sinks changes a **different** chain term: adopting raises `appeal` only;
  enclosure raises `capacity` only; enrichment changes `happyMult`/`decayMult` only; attraction
  raises `goldPerSec` per-head only. No sink raises two terms.
- **AC-2** The HUD surfaces the current bottleneck and recommends the matching lever; in the four
  Scenario-B states it recommends four different levers.
- **AC-3** Over one full `CYCLE`, total gold accrued at a capacity-sufficient zoo equals (±2%) the
  total under a flat `timeMult=1.0` model — the day/night rhythm is net-neutral.
- **AC-4** `phase` is a pure function of wall-clock mod `CYCLE`; two players who log in at different
  real times of day see the same rhythm shape and the same long-run average.
- **AC-5** Offline accrual uses `timeMult=1.0`; the offline reward for a given elapsed time and
  saved state does not vary with the real time of day at close or resume.
- **AC-6** When `demand > capacity` at peak, `visitors == capacity`, the gate signal flips amber,
  and upgrading enclosures (not adopting animals) raises peak visitors.
- **AC-7** Buying Night Lighting strictly raises night-phase `goldPerSec` and the daily average.
- **AC-8** With appeal sinks all maxed, a Comfort Level purchase still produces a measurable
  appeal increase — gold is never a dead pile.
- **AC-9** The day/night cycle is **gated at Lv18** (Feeding Zone milestone). Before Lv18,
  `timeMult = 1.0` (flat) and the sun/moon HUD dial is hidden. At Lv18 unlock, a one-time
  tutorial chip appears: *"Your zoo now has a visitor rhythm — crowds peak at midday and quiet
  at night."* This gates income variance until after the player understands care→appeal→visitors
  and capacity-clip. `DAY_NIGHT_UNLOCK_LEVEL = 18` is the sole tuning knob; can be raised to
  Lv26 (Shows) if Lv18 playtests show confusion.

## Open Questions

- **OQ-1 (BLOCKER for numbers)** — Re-derive buy/upgrade/enrich cost multipliers per-role against
  the new appeal/capacity magnitudes via `/balance-check economy` + a pacing sim. All cost numbers
  in this doc are placeholders.
- **OQ-2** — Move 3 tier 2 (Gold→XP bleed): how steep must diminishing returns be to preserve the
  months-long pacing pillar? Needs the pacing sim (cross-review D-W6).
- **OQ-3** — Surge and time-peak stacking cap: should `timeMult + surge` be clamped (e.g. ≤2.0) to
  bound the capacity pressure it creates?
- **OQ-4** — Night content vs. night dip: MVP ships night as quiet+cosmetic; should nocturnal
  species (owl/bat/raccoon) make night a *different* mode rather than a *lesser* one? (Roadmap
  "Spooky Night Zoo" is the natural home.)
- **OQ-5** — Does `decayMult` apply to offline decay linearly, or at the same reduced offline rate?
  Reconcile with idle-offline OQ-4.
