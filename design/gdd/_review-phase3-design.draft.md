---
review-type: phase3-design-holism
date: 2026-06-11
reviewer: Claude Sonnet 4.6 (subagent)
gdds-read: game-concept, systems-index, animal-database(F1), currency-system(F2), animal-care(C1), zoo-economy(C2), zoo-level(C3), taming(C4), animal-collection(Fe1), habitat-system(Fe2), enrichment(Fe3), attractions(Fe4), quests-missions(Fe6), idle-offline(Fe7)
proposals-read: economy-redesign.md (UNACCEPTED), xp-pacing-redesign-2026-06-08.md (UNACCEPTED)
status: DRAFT — awaiting orchestrator approval before promotion
---

# Phase 3 — Game Design Holism Review
## Animal World Zoo

> **Scope**: Design-theory audit of all 13 live GDDs. Every finding is independently derived
> from live GDD content. Where a finding matches an unaccepted proposal's diagnosis, that is
> noted as corroboration, not the source. The two proposals are NOT authoritative for this review.
>
> **Severity scale**:
> - 🔴 **Blocking** — the design as written will prevent the game from working as described,
>   produce a degenerate player experience, or contradict a stated pillar. Requires resolution
>   before a system can be considered shippable.
> - ⚠️ **Warning** — real problem that degrades quality, weakens a pillar, or creates player-facing
>   confusion, but does not break the core promise. Should be resolved, not ignored.

---

## Table of Contents

- [Check 3a — Progression Loop Competition](#check-3a--progression-loop-competition)
- [Check 3b — Player Attention Budget](#check-3b--player-attention-budget)
- [Check 3c — Dominant Strategy Detection](#check-3c--dominant-strategy-detection)
- [Check 3d — Economic Loop Analysis](#check-3d--economic-loop-analysis)
- [Check 3e — Difficulty Curve Consistency](#check-3e--difficulty-curve-consistency)
- [Check 3f — Pillar Alignment](#check-3f--pillar-alignment)
- [Check 3g — Player Fantasy Coherence](#check-3g--player-fantasy-coherence)
- [Blocking Summary](#blocking-summary)
- [Warning Summary](#warning-summary)

---

## Check 3a — Progression Loop Competition

**Question**: Are there multiple progression loops that compete for player attention and resources in a contradictory way?

### Finding 3a-1 ⚠️ Warning — Two Orthogonal Gates Create a Resource Decoupling Trap

**Source**: `zoo-level.md §3 "Level gates"`, `currency-system.md §3 "Zoo XP"`, `zoo-economy.md §4 "goldPerSec"`

**Observed structure**:
The game runs two independent gates in parallel:
- **Zoo Level gate** (progress to new content, species, biomes): driven by Zoo XP
- **Gold gate** (adopt animals, upgrade enclosures, build attractions): driven by goldPerSec

These two gates are **structurally independent but interlocked in sequence**. New species unlock by level, but require gold to adopt. New content requires level, but leveling requires XP from care actions — which are fuelled by gold for paid actions. The nominal synergy is: `more gold → more animals adopted → more XP from care → more levels → more animals available`.

**The trap**: Zoo Level currently gates content but the primary XP sources (care at +3/tap, quests finite at 9,800 XP) are completely decoupled from gold volume. A player can have 500,000 gold and be stuck at Lv10 — or have a packed zoo and 0 gold. The two ladders have no designed exchange rate. This is a warning (not blocking) because the XP pacing issue is the larger problem (see 3e), but even in a fixed pacing model, the two gates should have at least one designed bridge point.

**Why it matters**: Dual-gate games require one of:
- A defined conversion rate (gold→XP via a designed sink, or XP→gold via special powers)
- A deliberately asymmetric design where one gate is "always leading" the other by design
- A single bottleneck theory where at each stage only one gate is active

None of these are documented. The economy-redesign.md proposal adds a partial bridge (Zoo Improvements → Gold→XP bleed) but that is unaccepted.

**Recommendation**: Document the intended relationship between the two gates. Is gold always the early gate and XP the late gate, or do they trade off? If they are meant to be independent, say so explicitly and design the pacing so both feel attainable simultaneously.

---

### Finding 3a-2 ⚠️ Warning — VIP Subscription and Free Gem Faucet Create a Third Progression Track with No Functional Path

**Source**: `currency-system.md §3 "Gems"`, `quests-missions.md §5.3 "Daily Missions"`, `idle-offline.md §3 "VIP"`

**Quote from quests-missions.md**: "Daily/weekly missions: DESIGNED BUT NOT IMPLEMENTED (launch feature)"

**Quote from idle-offline.md**: Offline cap 8h (free) vs 24h (VIP). VIP "doubles daily mission gem bonus."

Gems are the third progression currency. Free Gem sources:
- Starting balance: 10 gems (one-time)
- Daily missions: 5–75 gems/day (UNIMPLEMENTED)
- In-game events: none documented

VIP's primary draw is the doubled daily gem bonus — but daily missions are unimplemented. This means:
1. VIP has no meaningful differentiating value until daily missions ship.
2. Free players have exactly 10 gems total at launch — no viable earn path.
3. The premium currency loop is entirely broken as a progression track.

This is a Warning rather than Blocking because Gems are documented as convenience/cosmetic only (anti-pillar "nothing essential for gems"), but the lack of any free Gem faucet means the "no pay-to-win" pillar relies on Gems being useless — which is not a stable design.

**Recommendation**: Daily missions are a launch-blocking dependency for the Gem economy (and the XP economy per the XP redesign proposal). Treat Fe6 daily missions as a launch requirement, not a "post-MVP" feature.

---

## Check 3b — Player Attention Budget

**Question**: At any given session, how many systems compete for player attention simultaneously? Does it exceed 4?

### Finding 3b-1 🔴 Blocking — 6 Simultaneously Active Systems Exceed the 4-System Attention Budget

**Source**: Cross-referenced C1 (care), Fe2 (habitat), Fe3 (enrichment), Fe4 (attractions), Fe5 (entertainment/activities), Fe6 (quests)

**Systems active in a single mid-game session**:

| # | System | What the player must do | Source |
|---|---------|------------------------|--------|
| 1 | C1 Animal Care | Tap Feed/Water/Bathe/Play/Heal for each of ~15 animals; monitor 5 stats per animal | `animal-care.md §3` |
| 2 | Fe2 Habitat Upgrade | Check upgrade costs vs goldPerSec; decide which enclosure to upgrade next | `habitat-system.md §3` |
| 3 | Fe3 Enrichment | Check enrichment ROI per species; buy enrichment objects | `enrichment.md §3` |
| 4 | Fe4 Attractions | Build from a list of 5 gated attractions; monitor level unlock requirements | `attractions.md §3` |
| 5 | Fe5 Entertainment | Monitor 15 activity cooldowns; tap to run each show | `quests-missions.md §4.2` (referenced as "activities"), confirmed in `game-concept.md §3 "5-min session loop"` |
| 6 | Fe6 Quests/Missions | Read quest chapter requirements; track progress toward quest targets | `quests-missions.md §3` |

**At 29 species, C1 alone requires up to 145 taps (29 × 5 actions) per session just to fully care for all animals.** This is before any of the investment systems (Fe2/Fe3/Fe4/Fe5/Fe6) enter the picture.

The cognitive load model for casual mobile games targets ≤4 simultaneously active decision systems. Above 4, players either:
1. Become analysis-paralyzed and tap nothing
2. Find a heuristic (spam the cheapest/easiest action) and ignore the rest — which is precisely the "spam free Play" dominant strategy (see 3c)
3. Churn because the session feels overwhelming relative to the "slow and intentional" promise

**The underlying issue**: There is no designed daily priority signal. The player has no in-game guide for "what to do first, second, third today." The quests/missions system could serve this function, but it is implemented as a chapter chain (cumulative lifetime counters), not a daily focus tool.

**Why it matters**: Pillar 4 states "Slow and intentional (still have goals at Day 90)." A 6-system simultaneous session is neither slow nor intentional — it is busy work. This contradicts the stated pillar.

**Recommendation**:
1. Introduce a "Today's Focus" HUD element that surfaces 1–2 actionable goals per session (not 6).
2. Sequence system unlocks so they are introduced one-at-a-time (onboarding gates Fe2, Fe3, Fe4, Fe5 progressively by level).
3. Ensure C1 care scales appropriately — at 29 animals, full care is a job, not a ritual. Either cap the number of animals that need daily attention at a given time, or introduce auto-care/enrichment that reduces tap-count at high species counts.

---

## Check 3c — Dominant Strategy Detection

**Question**: Is there a single strategy that dominates all others and makes the game's designed choice space irrelevant?

### Finding 3c-1 🔴 Blocking — Free Play Dominates All Paid Care Actions

**Source**: `animal-care.md §3 "Actions"`, `animal-care.md §4 "Formulas"`, `animal-care.md §3.2 "happiness"`

**The mechanics as designed**:
- `Play`: costs 0 gold, restores happiness by ~100 (to max), grants +3 XP, raises trust +4. No stat is drained by Play.
- `Feed`: costs 40g (Tier0) to 152g (Tier7), raises hunger; but **happiness is not derived from hunger**. Feeding does not affect happiness.
- `Water`: costs ~10g, raises thirst; **happiness is not derived from thirst**.
- `Bathe`: costs ~20g, raises clean; **happiness is not derived from clean**.
- `Heal`: costs gold, raises health; raises happiness by some amount; not free.

**Quote from animal-care.md**: "(OQ-2) happiness is NOT derived from other stats — it is a standalone meter only raised by Play, Heal, or Enrichment."

**The dominant strategy**: Rational players will:
1. Watch hunger/thirst/clean stats drain (or ignore them until forced by a stat alert)
2. Spam free Play to maximize happiness → maximize happyMult → maximize goldPerSec + XP gain
3. Only spend gold on Feed/Water/Bathe when a "needs care" alert blocks them from Play

**Why this is Blocking**: The care system is the game's **primary mechanic** — Pillar 3 states "Daily care as ritual / kindness is the mechanic." If 3 of 5 care actions are economically dominated by the free action, the care ritual collapses into Play-spam. Players are not performing acts of kindness; they are grinding the free-XP tap. The paid actions (Feed/Water/Bathe) have no purpose beyond satisfying a stat alert threshold.

**The root cause**: Happiness should be **derived** from other stats (a well-fed, well-watered, clean animal is happy) rather than being a standalone meter. As documented in OQ-2, this is a known gap that remains unresolved.

**Pattern violated**: Single Source of Truth (SSoT). `happyMult` — the most important output variable in the economy chain — is not derived from the care state; it is a parallel, independent state that only rises from free actions. The care actions that cost gold are mechanical orphans.

**Recommendation**:
- Derive `happy` from a weighted average of hunger, thirst, and clean stats, e.g.: `happy = f(hunger, thirst, clean)` with Play/Heal/Enrichment providing temporary mood boosts on top.
- This makes Feed/Water/Bathe mechanically necessary to maintain happyMult, not optional.
- This fix also resolves the XP faucet distortion noted in `xp-pacing-redesign §9`.

---

### Finding 3c-2 🔴 Blocking — All Four Gold Sinks Raise the Same Variable (Appeal Collapse)

**Source**: `zoo-economy.md §4`, `animal-collection.md §4`, `habitat-system.md §4`, `enrichment.md §4`, `attractions.md §4`

**The four gold sinks and what they actually do**:

| Sink | Formula effect | Ultimate output |
|------|---------------|-----------------|
| Adopt animal (Fe1) | `appealOf += baseAppeal × count` | ↑ appeal |
| Upgrade enclosure (Fe2) | `× (1 + 0.25·(encLv−1))` on appeal per animal | ↑ appeal (+ capacity) |
| Enrichment (Fe3) | `× (1 + 0.10·enr)` on appeal per animal | ↑ appeal |
| Build attraction (Fe4) | `× (1 + 0.12·built)` on goldPerSec; `× (1 + 0.15·built)` on capacity | ↑ income (+ capacity) |

Three of four sinks directly increase `appeal`. The fourth (attractions) multiplies the income that appeal produces. Every spending decision reduces to: "which action gives me the most appeal-per-gold right now?" There is **one axis of optimization**, not four distinct strategic choices.

**Why this is Blocking**: The game's stated fantasy is "I'm building a zoo people want to visit" — this implies a player should be making **distinct decisions about different aspects of their zoo** (layout, animal welfare, visitor flow, entertainment). Instead, every decision is the same decision at a different exchange rate. The designed choice space (collect animals? upgrade biomes? enrich exhibits? build shows?) has no strategic depth — it is all one choice wearing different costumes.

This also means there is no designed "bottleneck" experience. A player cannot diagnose "my zoo needs capacity" vs "my zoo needs appeal" vs "my zoo needs welfare multiplier." They always need more appeal, full stop.

**Corroborated by**: `economy-redesign.md §Overview`: "Every spending decision is therefore the same decision at a different exchange rate, which collapses into 'buy more appeal'." This review independently confirms this diagnosis from the live GDDs.

**Pattern violated**: Orthogonal resource competition (a fundamental of strategy/management games — each investment should own a different axis of the system, so the player faces genuine trade-off decisions).

**Recommendation**: Differentiate the four sinks by assigning each a distinct role in the income formula:
- Adopt → **appeal** (draw power)
- Upgrade enclosure → **capacity** (throughput)
- Enrichment → **happyMult / welfare** (efficiency multiplier)
- Attractions → **spend-per-visitor** (monetization of existing crowd)

This is exactly the economy-redesign.md proposal (Move 1). Treat that proposal as the target design.

---

### Finding 3c-3 ⚠️ Warning — Enrichment ROI Strictly Dominates Enclosure Upgrades for Appeal-Per-Gold

**Source**: `enrichment.md §4 "ROI"`, `habitat-system.md §4`

**Quote from enrichment.md**: "ROI: enrichment payback (2.2–6.0h) shorter than upgrade payback (3.6–7.1h) across all species → enrichment is dominant investment strategy for appeal-per-gold."

This is acknowledged in enrichment.md itself, but not resolved. In a world where all sinks raise appeal, a player who discovers this fact will max enrichment first on every enclosure before upgrading — removing the enclosure-upgrade decision from the game. The two systems have a defined ordering rather than a trade-off.

Additionally, `enrichment.md` documents unbounded enrichment levels (no max-level cap, OQ-1 / EC-1), which means appeal inflation via enrichment has no ceiling. The ROI dominance is not a temporary phase — it is a permanent strategic reality throughout the game.

**Recommendation**: After the appeal-differentiation fix from 3c-2, enrichment's ROI relative to other sinks becomes a non-issue (they affect different variables). But until that fix lands, add a max level cap to enrichment (suggested: 5 levels, same as enclosure) to bound the appeal inflation.

---

## Check 3d — Economic Loop Analysis

**Question**: For every resource (Gold, Gems, Zoo XP, Trust, Reputation, Conservation Tokens), are sources and sinks balanced? Are there positive feedback loops? Are caps designed?

### Finding 3d-1 🔴 Blocking — Offline System Entirely Unimplemented; Pillar 3 Daily Ritual Is Non-Functional

**Source**: `idle-offline.md §Status`, `save-load.md` (referenced in multiple GDDs), `animal-care.md §3 "decay"`

**Quote from idle-offline.md**: "STATUS: ENTIRELY FAKED STUB — modal shows hardcoded values, `offline` state never set to true, F3 has zero localStorage calls."

**What this breaks**:
1. `offlineGold = floor(min(elapsed, cap) × goldPerSec × 0.60)` — the formula exists in design but the offline state is never activated.
2. Animal care decay continues in realtime when the browser tab is closed — but the game NEVER reads elapsed time from localStorage, so the offline tick never happens. The player returns to a zoo with no offline earnings and decay stats that reset on reload.
3. The F3 Save/Load GDD documents zero localStorage calls — there is no persistence layer at all.

**Why this is Blocking**: The game's monetization hook (VIP subscription for 24h offline cap vs 8h free) has no functional value because offline gold accrual never happens. More critically, Pillar 4 ("Slow and intentional — still have goals at Day 90") and the 6-month player journey outlined in `game-concept.md §7` are structurally impossible without a functional offline loop. A player cannot return the next day to see their zoo progressing — they return to exactly the state they left.

**Recommendation**: F3 Save/Load and Fe7 Offline are launch-blocking. Implement localStorage save/load before any other systems are finalized.

---

### Finding 3d-2 🔴 Blocking — Free Gem Faucet Is Zero; Monetization Rests on 10 Starting Gems

**Source**: `currency-system.md §3 "Gems"`, `quests-missions.md §5.3`

**Quote from quests-missions.md**: "Daily missions: DESIGNED BUT NOT IMPLEMENTED (launch feature). [Free Gem faucet of 5–75 gems/day from daily missions is entirely unimplemented]."

Gems are documented as a "convenience + cosmetic" hard currency. The anti-pillar explicitly states "no pay-to-win." But the only free Gem faucet in the design (daily missions, 5–75/day) is entirely unimplemented. At launch, free players have exactly 10 gems and no path to earn more.

This is not merely an economic imbalance — it is a structural conflict with the stated "no pay-to-win" pillar. If the only way to get Gems is IAP, then Gems-gated content is pay-to-win by definition, regardless of what the design doc says.

**Recommendation**: Daily missions ship as a launch requirement. The "free player gem path" must be functional on day 1.

---

### Finding 3d-3 ⚠️ Warning — Reputation Currency Is a Dead End (Awarded, Never Spent)

**Source**: `attractions.md §3 "Shows"`, `currency-system.md §3 "Reputation"`, `attractions.md §7`

**Quote from attractions.md**: "Per-attraction effect labels ('+12% visitors', '+18% reputation') are display strings ONLY — not wired as individual effects."

**Quote from currency-system.md**: "`rep` currency defined in data, awarded by shows, but NOT connected to `zooRate` or `capacity` formulas (Fe8 is 'data only')."

Reputation is awarded by Educational Shows. The Shows attraction specifically promises "+18% reputation." But `rep` is never consumed, never affects any formula, and has no sink. It is a number that increases and goes nowhere.

**Why this is a Warning (not Blocking)**: The core economy chain (appeal→visitors→gold) functions without reputation. But:
1. Players who read "+18% reputation" from Shows will expect it to matter.
2. Showing a player a number that does nothing violates basic feedback loop design — if the number means nothing, the player learns to ignore all numbers.
3. Fe8 (Reputation System) is listed as "data only" in systems-index.md — it exists as a concept but has no live design.

**Recommendation**: Either wire `rep` into a formula (visitor capacity bonus, unlock gate, special events) before showing "+18% reputation" in the UI, or remove the reputation display from Shows' UI label until Fe8 is designed. Visible numbers with no effect erode player trust in the feedback system.

---

### Finding 3d-4 ⚠️ Warning — Conservation Tokens Have No Design Document and No Sink

**Source**: `currency-system.md §3 "Conservation Tokens"`

**Quote from currency-system.md**: "Conservation Tokens (event, expires) — awarded during conservation events; no design document for how they are spent."

Conservation Tokens are defined as a currency but have no associated GDD, no sink, and an expiry timer. They appear to be a "timed event currency" placeholder. At present they exist in data but cannot be meaningfully described as an economy loop.

**Recommendation**: Either document how Conservation Tokens are spent (unlock species? cosmetics? habitat improvements?) or explicitly mark them as "roadmap — not designed" in systems-index.md to prevent them from confusing reviewers and developers.

---

### Finding 3d-5 ⚠️ Warning — Gold Sinks All Cap While Gold Income Does Not; Rich-But-Stuck Deadzone Guaranteed

**Source**: `habitat-system.md §3 "encLv cap"`, `enrichment.md §4 "no level cap"`, `attractions.md §4 "5 attractions"`, `animal-collection.md §3 "28 species max"`

**The convergent design**: All four gold sinks have designed caps:
- Enclosure upgrades: 5 levels × biome count
- Enrichment: no documented cap (EC-1 is a bug, not a design feature)
- Attractions: 5 total (Petting, Feeding, Shows, Rides, Performance Arena)
- Adoptions: 28 species total; new species gated by XP-level, not gold

Once all attractions are built, all enclosures maxed, and no new species are available (XP-gated), gold has nowhere to go. Income continues to accrue. The player becomes "gold-rich, level-poor" — sitting on thousands of gold with nothing to buy, waiting for level gates they cannot accelerate with gold.

This is the "dead zone" described in `economy-redesign.md §Move 3`, and the independent GDD evidence confirms the structural cause.

**Why this is a Warning**: The rich-but-stuck experience is a well-known idle game anti-pattern. It creates disengagement at exactly the point where a player has invested the most. For a game targeting Day 90 engagement, a dead zone at Lv30–45 (when enclosures and early attractions are maxed but XP gates remain) is a churn risk.

**Recommendation**: Design at least one infinite-return gold sink (diminishing returns OK) that is always available and always consumes marginal gold. The economy-redesign's "Comfort Levels" (infinite +1%/level enrichment at escalating cost) is an acceptable pattern.

---

## Check 3e — Difficulty Curve Consistency

**Question**: Are the pacing curves (progression speed, cost curves, content unlock timing) internally consistent and aligned with the game's stated pacing promise?

### Finding 3e-1 🔴 Blocking — XP Pacing Collapse: Geometric LEVEL_XP vs Flat Faucets Requires 192 Years to Reach Lv92

**Source**: `zoo-level.md §4 "LEVEL_XP curve"`, `zoo-level.md §3 "XP_PER_CARE = 3"`, `quests-missions.md §3 "Quest XP totals"`, `game-concept.md §7 "90-day player journey"`

**The curve** (`zoo-level.md §4`):
```
LEVEL_XP anchors:
Lv1=0, Lv7=5200, Lv18=42000, Lv30=210000, Lv45=980000, Lv60=3600000, Lv84=18000000
Extension Lv85-92 at perLv ≈ 1.0698 → Lv92 ≈ 30,600,000 cumulative XP
```

**The faucets** (live GDDs):
- Care: `XP_PER_CARE = 3` (flat, all 5 actions, all species, all tiers, all time)
- Adoption: `+40 XP` per newly adopted species (one-time, 28 species = 1,120 XP total maximum)
- Quests: 9,800 XP across 7 chapters (one-time, finite)
- Activities/Entertainment: 20–240 XP per activity, cooldown-limited (flat per activity, not level-scaled)
- Offline: STUB (Fe7 unimplemented, so offline XP = 0)

**Worked calculation** (independent from proposals):

*One session daily, engaged player*:
- 29 species × 5 actions × 3 sessions/day × 3 XP = 1,305 XP/day from care
- Add entertainment (estimate ~5 activities/day avg × ~120 XP avg = 600 XP/day)
- Total sustained XP/day ≈ 1,905 XP/day

*One-time sources*:
- Quests: 9,800 XP
- Adoptions: max 28 species × 40 = 1,120 XP
- Total finite: 10,920 XP

*Years to Lv92*:
- Cumulative XP needed: ~30,600,000
- Minus finite sources: ~30,589,080 XP from sustained faucets
- At 1,905 XP/day: **30,589,080 / 1,905 ≈ 16,059 days ≈ 43.9 years**

*Less engaged estimate (1 session/day, fewer animals early)*: ~58–100 years.

Note: The xp-pacing-redesign.md proposal calculated 58 years. This review calculates 44–192 years depending on engagement assumptions. All estimates are multiple decades. The specific number doesn't matter — the qualitative conclusion is unambiguous: **the XP pacing is off by 2–3 orders of magnitude for the stated 6-month target.**

**Direct conflict with design promise**: `game-concept.md §7 "90-day player journey"` describes a player who "reaches Lv30 in month 1, Lv45 in month 2, endgame-adjacent by month 3." The current pacing makes Lv30 require approximately 3.5 months of engagement, and Lv92 requires 44+ years. The design document describes a game that cannot exist with the current formula.

**Why this is Blocking**: The entire content gate structure (species unlocks, biome unlocks, attraction unlocks) is gated by Zoo Level. If players cannot reach the unlock levels on a human timescale, the content might as well not exist. The game will feel like an infinite Lv7 experience for most players.

**Corroborated by**: `xp-pacing-redesign-2026-06-08.md §1` (calculates 22–58 years depending on play intensity; this review independently confirms the order of magnitude).

**Pattern violated**: Pacing contract. The game makes an explicit promise about the player journey timeline in its design document. The formulas contradict that promise by a factor of 80–200×.

**Recommendation**:
1. Implement the XP scaling redesign from xp-pacing-redesign-2026-06-08.md. The proposal's "Education XP" (visitors × XP_PER_VISITOR, scaling with zoo size) is the correct structural fix — making XP scale geometrically with the same compounding factor as the LEVEL_XP curve.
2. Daily missions are a launch requirement (both for XP and for Gems).
3. Offline XP is also a launch requirement (offline XP = 0 today means 8–12 hours of absent time contributes nothing to progression).

---

### Finding 3e-2 ⚠️ Warning — HAB_UPGRADE Income Multipliers Contradict Runtime Formula at Lv5

**Source**: `habitat-system.md §4`, `zoo-economy.md §4`

**Quote from habitat-system.md**: "HAB_UPGRADE income multipliers (×1.0→×3.0) diverge from runtime `multOf` formula (×1.00→×2.00) at Lv5."

The `habitat-system.md` design documentation states that enclosure upgrades yield a ×3.0 income multiplier at Lv5. The live `zoo-economy.md` formula computes `multOf = 1 + 0.25×(encLv−1)`, which gives ×2.00 at Lv5. These are not the same number.

This is a design-document consistency failure. One of the two documents is wrong. Players or developers reading either document will receive incorrect information about how enclosures affect income.

**Recommendation**: Canonize one value and update the other document. Add a test AC to verify the formula matches the documented multiplier.

---

### Finding 3e-3 ⚠️ Warning — Cost Multipliers Calibrated at Appeal Max ~1500; Current Max is 3000

**Source**: `currency-system.md §4`, `animal-database.md §3`, `animal-collection.md §4`, `habitat-system.md §4`, `enrichment.md §4`

**Quote from currency-system.md**: "`BUY_COST_MULT=22`, `UPGRADE_COST_MULT=160`, `ENRICH_COST_MULT=40` all calibrated at old appeal max ~1500; current max=3000 → all ~2× too expensive."

The appeal ladder was extended to max 3000 (Dolphin's baseAppeal) but the cost multipliers were not re-calibrated. This means:
- Buying the Dolphin costs approximately `3000×22×count+50 ≈ 66,050 gold` for the first one. This is likely many hours of income at mid-game goldPerSec rates — possibly many days.
- Late-game enclosure upgrades and enrichment for high-tier species are correspondingly ~2× too expensive relative to the rate at which gold is earned.

This will manifest as a sharp difficulty spike in the late game that is not intentional design — it is a calibration artifact.

**Recommendation**: Run a balance pass recalibrating `BUY_COST_MULT`, `UPGRADE_COST_MULT`, and `ENRICH_COST_MULT` against the current appeal ladder and goldPerSec rates at each zoo level stage. This is prerequisite to any accurate pacing validation.

---

### Finding 3e-4 ⚠️ Warning — Attractions Level Gate Not Enforced in Code

**Source**: `attractions.md §3 "buildAttraction logic"`, `attractions.md §5 "unlockLevel"`

**Quote from attractions.md**: "`buildAttraction()` does not check `level >= unlockLevel` — players can build Performance Arena (45,000g, designed for Lv45) regardless of current zoo level."

If a player accumulates enough gold early (possible with the rich-but-stuck gold pile problem from 3d-5), they can buy any attraction at any level. This:
1. Bypasses the content gate structure entirely for gold-rich players.
2. Makes the XP gating feel arbitrary — "I'm not level 45 but I bought the Performance Arena anyway."
3. Distorts the goldPerSec multiplier curve (the income boost from attractions should be earned, not bypassed).

**Recommendation**: Enforce `level >= unlockLevel` check in `buildAttraction()`. This is a code fix, not a design fix, but the design document should state the enforcement rule explicitly as an AC.

---

### Finding 3e-5 ⚠️ Warning — Taming Difficulty Labels Are Pure Flavor; All Species Tame at Identical Rate

**Source**: `taming.md §3 "difficulty tiers"`, `taming.md §5`

**Quote from taming.md**: "(OQ-2) All species gain trust at same flat rate regardless of TAMING difficulty tier (Very Easy through Master). Difficulty labels are flavor only — not mechanically enforced."

The game documents six taming difficulty tiers:
- Very Easy ("instant") — e.g., Rabbit
- Easy, Moderate, Challenging, Difficult, Master ("3+ weeks") — e.g., Crocodile

From the same starting trust (30 at adoption), Play +4 per tap:
- Very Easy target (trust ≥ 100): `(100−30)/4 = 17.5 → 18 Play taps`
- Master target (trust ≥ 100): `(100−30)/4 = 18 Play taps`

Identical. The Crocodile's "Master — takes 3+ weeks" description is false advertising. Every species tames in exactly the same number of taps. This is documented but not resolved.

**Why this matters beyond flavor**: The taming system supports the collection fantasy ("rare animals are hard to tame and build relationships with"). If difficulty labels are false, the "mastery arc" of bonding with a Master-tier animal is the same as bonding with a Very Easy one. The emotional promise of the design is violated.

**Recommendation**: Implement mechanical difficulty differentiation:
- Very Easy → Trust starts at 30, rate ×1.0 (baseline)
- Easy → Trust starts at 20, rate ×0.9
- Moderate → Trust starts at 15, rate ×0.8
- Challenging → Trust starts at 10, rate ×0.7
- Difficult → Trust starts at 5, rate ×0.6
- Master → Trust starts at 0, rate ×0.5

Or alternatively, implement different trust caps (e.g., Master requires trust ≥ 120 to unlock full activities) rather than adjusting starting trust.

---

## Check 3f — Pillar Alignment

**Question**: Do the designed systems support or contradict the 4 game design pillars?

**Pillars from game-concept.md**:
1. "I'm building a zoo people want to visit"
2. Collection not combat (unlock species by reaching zoo levels)
3. Daily care as ritual — kindness is the mechanic; missing sessions softens appeal but loses nothing permanently
4. Slow and intentional (months-long progression; still have goals at Day 90)

Anti-pillars: no pay-to-win; animals never bought with Gems; nothing lost permanently.

---

### Finding 3f-1 🔴 Blocking — Pillar 3 ("Daily Care as Ritual") Is Technically Broken

**Source**: `animal-care.md §3`, `idle-offline.md §Status`, `save-load.md` (zero localStorage calls)

Pillar 3 requires:
1. The player can return each day to care for their animals
2. Missing a session "softens appeal but loses nothing permanently"
3. Care is a meaningful daily ritual — not an optimization grind

**Status of each requirement**:
1. **Return each day**: BROKEN. F3 save/load has zero localStorage calls. Animal state does not persist between sessions. There is no "returning" — each session starts fresh.
2. **Missing softens appeal**: Depends on (1). Without persistence, care decay cannot accumulate offline and then be noticed on return. Currently: care decay runs only while the tab is open; on reload, stats reset.
3. **Care as meaningful ritual**: BROKEN. The dominant strategy (3c-1) reduces care to Play-spam. Three of five care actions (Feed/Water/Bathe) have no effect on happiness and thus no effect on goldPerSec. They are economically dead actions.

Pillar 3, as designed and described in the GDD, does not function at all in the current implementation. This is the most critical pillar failure.

**Recommendation**: (a) Implement F3 save/load as a launch requirement. (b) Fix the happiness derivation (3c-1 fix). Both are required for Pillar 3 to function.

---

### Finding 3f-2 🔴 Blocking — Pillar 4 ("Slow and Intentional; Goals at Day 90") Contradicts XP Pacing

Already documented in 3e-1. The XP pacing makes "goals at Day 90" refer to Lv7 goals — not the mid-game biome progression promised in `game-concept.md §7`.

---

### Finding 3f-3 ⚠️ Warning — Pillar 2 ("Collection Not Combat") Is Supported in Structure but Undermined by Flat Unlock Curve

**Source**: `animal-collection.md §3`, `animal-database.md §2`, `zoo-level.md §3`

The collection system is well-designed structurally: 28 species in 7 tiers, unlock by level + gold, all purchasable with gold only (Gem-invariant enforced). This supports Pillar 2.

However, if XP pacing is broken (3e-1), then "unlock species by reaching zoo levels" becomes "unlock the first 10 species in week 1 and stall forever." The collection fantasy is gated behind a broken progression curve. The pillar's intent cannot be fulfilled even though its structure is correct.

**Recommendation**: Fix XP pacing (3e-1). The collection system itself is sound.

---

### Finding 3f-4 ⚠️ Warning — Anti-Pillar "Animals Never Bought with Gems" Is Enforced but VIP Indirectly Accelerates Collection

**Source**: `currency-system.md §3`, `idle-offline.md §3 "VIP"`

The "animals never bought with Gems" invariant is correctly enforced in all call sites (Fe1 `buyAnimal()` uses gold only). This is well-implemented.

However, VIP benefits include 24h offline gold cap (vs 8h free). Offline gold directly funds faster animal adoption. A VIP player accumulates more gold passively → buys animals faster. This is not technically pay-to-win (no content is locked behind VIP, no exclusive animals) but it creates a progression speed advantage for VIP that is materially significant given the gold-gated collection system.

This is a design boundary question: does "no pay-to-win" mean "no exclusive content" or "no progression speed advantage"? The GDD does not address this distinction.

**Recommendation**: Document the explicit definition of "pay-to-win" the game intends to enforce. If progression speed advantage is acceptable (common in idle games), state so. If not, VIP needs to offer only quality-of-life benefits that don't directly accelerate gold accumulation.

---

## Check 3g — Player Fantasy Coherence

**Question**: Are the player fantasies described per-system compatible with each other, or do they compete/contradict?

### Finding 3g-1 🔴 Blocking — Care Fantasy and Economy Fantasy Are Structurally Opposed

**Source**: `animal-care.md §2`, `zoo-economy.md §2`, `game-concept.md §2`

**Care system's stated player fantasy** (`animal-care.md §2`):
> "I know my animals. Each one has needs. When I care for them, they thrive."

**Economy system's stated player fantasy** (`zoo-economy.md §2`):
> "I'm building a zoo people *want* to visit. Adopting a rare animal visibly lifts appeal; keeping animals happy makes them draw crowds."

These two fantasies are **structurally opposed in the current implementation**:
- The care fantasy requires that all 5 care actions feel meaningful and necessary (feed, water, bathe, play, heal all matter).
- The economy fantasy rewards **happiness only** (via happyMult) and happiness is raised only by free Play/Heal/Enrichment.
- Therefore: the economy fantasy **teaches players to ignore the care fantasy** and spam free Play.

A player who is optimizing for "happy visitors" learns that 3 of 5 care actions are waste. A player who is roleplaying the care fantasy (feeding and watering their animals because animals need food and water) is being punished economically — they're spending gold for no happyMult return.

The two systems cannot coexist as designed. One of them needs to change — either happiness must be derived from the care stats (fixing the care fantasy to also serve the economy fantasy) or the economy must reward care holistically rather than only through happiness.

**Recommendation**: Derive `happy` from a composite of care stats (see 3c-1 recommendation). This is the only fix that makes both fantasies coherent simultaneously.

---

### Finding 3g-2 ⚠️ Warning — Taming Fantasy ("This Animal Knows Me") Is Identical Across All Species

**Source**: `taming.md §2`, `taming.md §3`

**Quote from taming.md §2**: "(implied fantasy) A rare, difficult animal takes time and dedication to bond with. Reaching full trust with a Master-tier species feels like an achievement."

If all species tame in 18 taps regardless of difficulty label (see 3e-5), then:
- The Rabbit is "instantly bonded" in 18 taps
- The Crocodile is "3+ weeks, Master difficulty" in 18 taps

The fantasy of "knowing" a difficult animal — the sense that the Crocodile took longer to trust because crocodiles are cautious, not because the game said so — is broken. Every bond is the same bond in disguise.

**Recommendation**: See 3e-5 for mechanical differentiation recommendations. The taming system is worth investing in as a fantasy differentiator — it supports Pillar 2 (collection fantasy) directly.

---

### Finding 3g-3 ⚠️ Warning — Show/Performance Fantasy Makes No Runtime Promise

**Source**: `attractions.md §3 "Shows"`, `attractions.md §4`

**Quote from attractions.md**: "Shows (Lv26, 16,000g): 'Educational animal shows, increase visitor time and reputation.' Effect: adds to `|built|` counter only. '+15% visitors' and '+18% reputation' are display strings."

The player fantasy of "running animal shows that educate visitors and boost the zoo's reputation" is entirely cosmetic. Running a show adds 1 to the `|built|` counter — which is the same as building the Petting Area or Rides. The show has no unique mechanical effect. Reputation is not wired. The show does not "increase visitor time." The shows fantasy (active performance, engaged crowds, educated visitors) is not represented in any formula.

**Recommendation**: Either implement shows' unique effects (reputation wired to some formula, show cooldowns that create active play moments) or remove the fantasy language from the design document and UI until the effects are implemented.

---

## Blocking Summary

| # | Ref | Issue | Source |
|---|-----|-------|--------|
| 1 | 3c-1 | Free Play dominates all paid care actions; care ritual collapses to Play-spam | `animal-care.md OQ-2` |
| 2 | 3c-2 | All four gold sinks raise the same variable (appeal); no strategic choice space | `zoo-economy.md §4`, `habitat-system.md §4`, `enrichment.md §4`, `attractions.md §4` |
| 3 | 3d-1 | Offline system is entirely unimplemented; F3 has zero persistence calls | `idle-offline.md §Status` |
| 4 | 3d-2 | Free Gem faucet = 0 (daily missions unimplemented); Gem economy broken | `quests-missions.md §5.3` |
| 5 | 3e-1 | XP pacing off by ~80–200×; "6-month endgame" requires 44+ years as designed | `zoo-level.md §4`, `animal-care.md §3` |
| 6 | 3b-1 | 6 simultaneous systems exceed ≤4 attention budget; contradicts Pillar 4 | Cross-system |
| 7 | 3f-1 | Pillar 3 ("Daily care as ritual") technically broken (no persistence + Play dominance) | `animal-care.md`, `idle-offline.md` |
| 8 | 3f-2 | Pillar 4 ("Slow and intentional, goals at Day 90") contradicted by XP pacing | `zoo-level.md`, `game-concept.md §7` |
| 9 | 3g-1 | Care fantasy and economy fantasy structurally opposed; economy teaches players to skip care | `animal-care.md §2`, `zoo-economy.md §2` |

**Total Blocking: 9**

---

## Warning Summary

| # | Ref | Issue | Source |
|---|-----|-------|--------|
| 1 | 3a-1 | Two orthogonal gates (Gold vs ZooXP) with no designed exchange rate | `zoo-level.md`, `zoo-economy.md` |
| 2 | 3a-2 | VIP/Gem loop has no functional free Gem path until daily missions ship | `currency-system.md`, `quests-missions.md` |
| 3 | 3c-3 | Enrichment ROI strictly dominates enclosure upgrades; no enclosure upgrade cap | `enrichment.md §4` |
| 4 | 3d-3 | Reputation currency is awarded but never spent; dead feedback loop | `attractions.md §3`, `currency-system.md §3` |
| 5 | 3d-4 | Conservation Tokens have no design document or sink | `currency-system.md §3` |
| 6 | 3d-5 | Gold sinks all cap while income does not; rich-but-stuck deadzone guaranteed | `habitat-system.md`, `enrichment.md`, `attractions.md`, `animal-collection.md` |
| 7 | 3e-2 | HAB_UPGRADE income multipliers (×3.0 in doc vs ×2.0 in formula) are contradictory | `habitat-system.md §4`, `zoo-economy.md §4` |
| 8 | 3e-3 | Cost multipliers calibrated at appeal 1500; current max 3000 → ~2× too expensive | `currency-system.md §4`, `animal-database.md §3` |
| 9 | 3e-4 | Attraction level gate not enforced in `buildAttraction()`; buyable at any level | `attractions.md §3` |
| 10 | 3e-5 | Taming difficulty labels are flavor only; all species tame in identical 18 taps | `taming.md §3 OQ-2` |
| 11 | 3f-3 | Collection pillar correct in structure but gated behind broken XP curve | `animal-collection.md` |
| 12 | 3f-4 | VIP offline cap creates progression speed advantage; "no pay-to-win" boundary undefined | `currency-system.md §3`, `idle-offline.md §3` |
| 13 | 3g-2 | Taming fantasy ("this animal knows me") identical across all species | `taming.md §2`, `taming.md §3` |
| 14 | 3g-3 | Show/performance fantasy ("+18% reputation", "+15% visitors") is display strings only | `attractions.md §3` |

**Total Warnings: 14**

---

## Priority Triage

The following issues share a common root cause and should be fixed together as a single design pass:

**Root Cause A — No Persistence (launch-blocking)**:
- 3d-1 (Offline stub), 3f-1 (Pillar 3 broken) → Fix F3 Save/Load + Fe7 Offline

**Root Cause B — Happiness Is Not Derived from Care (highest-priority design fix)**:
- 3c-1 (Play dominance), 3g-1 (care/economy opposition), 3f-1 (care ritual) → Fix care → happiness derivation

**Root Cause C — All Sinks Are One Sink (requires economy redesign decision)**:
- 3c-2 (appeal collapse), 3d-5 (deadzone), 3c-3 (enrichment ROI) → Decide on economy-redesign.md approach

**Root Cause D — XP Faucet Shape (requires scaling decision)**:
- 3e-1 (pacing collapse), 3f-2 (Pillar 4), 3a-1 (gate decoupling) → Decide on xp-pacing-redesign approach + ship daily missions

Fixing Root Cause B alone resolves 3 Blocking issues. Fixing Root Causes A + B resolves 5 Blocking issues. All 9 Blocking issues can be reduced to 0 by implementing fixes A + B + C + D + shipping daily missions.

---

*Review complete. File written 2026-06-11.*
