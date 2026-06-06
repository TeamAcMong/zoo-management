# Currency System

> **Status**: In Design
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — currencies are the means of progression, never the goal

## Overview

The Currency System defines the five resource types in Animal World Zoo — Gold,
Gems, Zoo XP, Conservation Tokens, and Reputation — and the rules that govern how
each is earned, spent, and displayed. It is the accounting layer every other system
draws on: care actions cost Gold, Zoo Level is driven by XP, premium convenience is
bought with Gems, seasonal events run on Tokens, and the Reputation meter amplifies
visitor draw without being spent. From the player's perspective, currencies are
never the goal — they are the language of progress. Gold says "your zoo is
thriving"; a new Gem stash says "you've earned a shortcut"; a rising XP bar says
"something new is almost unlocked."

**Core monetisation guardrail**: Animals may only be acquired with Gold (soft
currency) — never with Gems (hard currency). This rule is foundational and
non-negotiable: it ensures every species in the game is reachable by any player
who invests time, and the game is not pay-to-collect.

## Player Fantasy

No player thinks "I'm managing a currency system." They think "I almost have enough
gold for the Zebra enclosure" or "three more gems and I can grab the VIP weekend."
The currency system is invisible when it works well — a growing Gold counter feels
like the zoo's heartbeat; an XP bar inching toward the next level feels like
anticipation; a Gem notification feels like a small daily gift.

The emotional guardrail is *fairness*: players should never feel that spending real
money is required to enjoy the core experience. Gems speed things up and unlock
cosmetics; they do not unlock animals. A free player and a paying player will
eventually collect the same species — the paying player just waited less. That
distinction is the system's most important design decision.

## Detailed Design

### Core Rules

**The five currencies**

| Currency | Key | Type | Cap | Earned from | Spent on |
|----------|-----|------|-----|-------------|----------|
| **Gold** 🪙 | `gold` | Soft | None | Gate income (passive), attractions, idle | Care, upgrades, animal unlocks, attraction builds |
| **Gems** 💎 | `gems` | Hard | None | Daily missions (5–15/day), IAP | Speed-ups, cosmetics, VIP membership, gem→gold exchange |
| **Zoo XP** ⭐ | `xp` | Level | None | Care actions, quest rewards | Never spent — accumulates to raise Zoo Level |
| **Conservation Tokens** 🌿 | `tokens` | Event | Event-track length | Seasonal event objectives | Event shop (animals, decor) — expires at event end |
| **Reputation** 🏅 | `rep` | Meter | 5 stars (conceptual) | Educational Shows, event activities | Never spent — acts as a multiplier on visitor count |

**Transaction rules**

1. **Gold** is the primary gameplay currency. All non-cosmetic, non-progression purchases deduct Gold.
2. **Gems** are the premium currency. Gem purchases are validated before execution — `if (gems < cost) reject`. Gems are never automatically converted to Gold.
3. **Zoo XP** only flows in one direction (in). Level is derived by comparing accumulated XP against the `LEVEL_XP` threshold table. XP never decreases.
4. **Conservation Tokens** are scoped to the active seasonal event. They have no value outside the event shop. Unused tokens are not carried forward.
5. **Reputation** is a display meter, not a spendable balance. It is modified by show activities and is read by the economy chain as a multiplier.
6. **No currency may go below zero.** All spending functions check balance first. Insufficient funds → flash message, action blocked.
7. **Animals are never purchasable with Gems.** This rule must be enforced at every purchase-validation point, not just the UI.

**Starting balances (new game)**

| Currency | Starting value |
|----------|---------------|
| Gold | 50🪙 |
| Gems | 10💎 |
| Zoo XP | 0 |
| Tokens | 0 |
| Reputation | 0 |

**Transaction feedback**

Every successful deduction: floating numeric FX at the interaction point (e.g. "−116 🪙").
Every successful earn: positive FX (e.g. "+500 🪙").
Insufficient funds: flash message with the required amount (e.g. "Need 3,000 🪙").

---

### States and Transitions

Currency balances have no discrete states — they are continuous real-time values.
The only "state change" is the threshold crossing when XP reaches the next `LEVEL_XP[n]`:

```
Zoo Level state machine (XP-driven):
  LEVEL n
    ├── xp < LEVEL_XP[n+1]  → stay at LEVEL n
    └── xp ≥ LEVEL_XP[n+1]  → transition to LEVEL n+1 (triggers content unlock)
```

`MAX_LEVEL = 92` (from registry, owned by animal-database.md) — at Lv92, the XP bar fills to 100% and shows "MAX"; further XP accumulation is allowed but has no effect.

---

### Interactions with Other Systems

| System | Currency consumed | Currency produced | Interface |
|--------|------------------|------------------|-----------|
| **C1 Animal Care** | Gold (care action costs) | Zoo XP (care reward) | `pay(cost)`, `setXp(x => x + reward)` |
| **C2 Zoo Economy** | — | Gold (passive per-second) | `setGold(g => g + zooRate)` each tick |
| **C3 Zoo Level** | Zoo XP (threshold check) | — | `level = LEVEL_XP.findIndex(threshold > xp)` |
| **C4 Taming** | Gold (implicit via care) | — | Via C1; taming requires sustained care spend |
| **Fe1 Animal Collection** | Gold (unlock + buy-more cost) | — | `pay(unlockCost)`, `pay(buyCost)` |
| **Fe2 Habitat System** | Gold (upgrade cost) | — | `pay(upgradeCost)` |
| **Fe3 Enrichment** | Gold (enrich cost) | — | `pay(enrichCost)` |
| **Fe4 Attractions** | Gold (build cost) | — | `pay(attractionCost)` |
| **Fe5 Performance** | — | Gold (show reward), Zoo XP | Activity cooldown rewards |
| **Fe7 Idle/Offline** | — | Gold (offline accrual) | Computed on session resume |
| **M2 Monetisation Shell** | Gems (IAP) | Gems (purchased packs) | IAP purchase → `setGems(g => g + pack.gems)` |

## Formulas

### Gold income rate (per second)

Owned by **C2 Zoo Economy GDD** — reproduced here for reference:

```
zooAppeal   = Σ (baseAppeal[k] × count[k] × (1 + 0.25·(encLv[k]−1)) × (1 + 0.10·enr[k]))
visitors    = zooAppeal × VISITORS_PER_APPEAL           // VISITORS_PER_APPEAL = 1.0
goldPerSec  = visitors × SPEND_PER_VISITOR              // SPEND_PER_VISITOR = 0.05
```

The Currency System is responsible for maintaining the `gold` state variable;
the formula is authored and tuned in C2.

---

### Gold unlock cost (animal unlock gate)

Owned by **Fe1 Animal Collection** — from `data.jsx` UNLOCKS derivation:

```
unlockGold[k] = roundNice(500 × 1.06^(lv[k]−1))
```

Where:
- `lv[k]` = `ANIMALS[k].unlock` level (integer 1–92)
- `roundNice(x)` = rounds to nearest "pretty" number (multiples of 50, 100, 500 depending on magnitude)

Range: ~500 🪙 (Lv 1) → ~∞ 🪙 (Lv 92, approximately 28,000–35,000 🪙)

---

### Gold buy-more cost (additional animal copies)

Owned by **Fe1 Animal Collection** — from `prototype.jsx`:

```
buyCost[k] = round(appeal[k] × 22 × currentCount[k]) + 50
```

Where:
- `appeal[k]` = `ANIMALS[k].appeal` (baseAppeal, 3–3000)
- `currentCount[k]` = existing count before this purchase (so 1 → buys 2nd copy)

⚠️ **Known balance gap**: multiplier 22 was calibrated at old max appeal ~1500.
Current max = 3000 → elite species buy-more costs are ~2× intended. Balance pass pending.

---

### Gold upgrade cost (enclosure level-up)

Owned by **Fe2 Habitat System** — from `proto-screens.jsx`:

```
upgradeCost[k] = round(appeal[k] × 160 × encLv[k]) + 300
```

Where:
- `encLv[k]` = current enclosure level before upgrade

⚠️ Same balance gap as buyCost — multiplier 160 needs revisiting at max appeal 3000.

---

### Gold enrichment cost

Owned by **Fe3 Enrichment System** — from `proto-screens.jsx`:

```
enrichCost[k] = round(appeal[k] × 40 × (enrLv[k] + 1)) + 200
```

Where:
- `enrLv[k]` = current enrichment level before applying next tier

---

### Zoo Level thresholds (XP → Level)

Owned by **C3 Zoo Level Progression GDD** (not yet authored). Provisional:

```
LEVEL_XP[n] = threshold of accumulated XP to reach level n
```

The level-up check after any XP gain:
```
newLevel = LEVEL_XP.findLastIndex(threshold => xp >= threshold)
```

Exact curve (shape + values) is C3's responsibility. This GDD only specifies that:
1. XP accumulates monotonically — it never decreases.
2. Level is derived from XP — there is no separate "level" variable that is set independently.
3. MAX_LEVEL = 92 (registry constant; further XP accumulation is silently ignored).

---

### Gem daily free trickle (from daily missions)

```
dailyGems = missionCount × missionGems
```

Where:
- `missionCount` ∈ [1, 5] depending on player activity
- `missionGems` ∈ [5, 15] per mission (tunable in Tuning Knobs)

Intended daily free gem gain: **5–75 gems/day** depending on activity level.

## Edge Cases

### EC-1: Insufficient funds — purchase blocked

**Trigger**: Player attempts an action whose cost exceeds current balance.
**Behaviour**: Action is rejected. Flash a red affordance on the currency display (e.g. brief red pulse on the gold counter) and show the shortfall: "Need [cost] 🪙 — you have [balance] 🪙." Do not deduct any amount; treat the transaction as atomic.
**Edge within edge**: Never partially deduct. If an upgrade costs 500 🪙 and the player has 499 🪙, the balance stays at 499 🪙 and no state changes.

---

### EC-2: Simultaneous earn + spend (passive gold while shopping)

**Trigger**: The passive gold ticker fires at the same moment a player taps a purchase button.
**Behaviour**: Both state updates are applied in the same React render cycle (batch update). The ticker adds gold first in the per-tick effect; the purchase subtracts after. If the post-tick balance is still sufficient, the purchase succeeds; if not, it fails (EC-1 applies).

---

### EC-3: XP at MAX_LEVEL (92)

**Trigger**: Player receives XP after reaching Zoo Level 92.
**Behaviour**: XP accumulates silently (no animation, no level-up toast, no further content unlock). The XP bar renders as 100% / "MAX" — it does not overflow or wrap. This is cosmetically harmless; the XP state variable holds the true accumulated value for save purposes but has no further gameplay effect.

---

### EC-4: Conservation Tokens at event end

**Trigger**: A seasonal event ends (the event track closes) while the player has unspent Tokens.
**Behaviour**: Token balance is reset to 0 at event close. A warning is shown 24 hours before end ("Event ends in 24 hours — spend your Tokens!"). Tokens are NOT converted to any other currency; they simply expire. This rule is the canonical monetisation guard against tokens accumulating and distorting future event economies.

---

### EC-5: Gem→Gold exchange edge cases

**Trigger**: Player uses the Gem→Gold exchange (if implemented by M2 Monetisation Shell).
**Behaviour**: Exchange rate and caps are owned by M2. This GDD only mandates:
1. The exchange is one-directional: Gems → Gold only. Gold never converts to Gems.
2. Gems are checked for sufficiency before Gold is credited.
3. Negative gem balance after exchange is impossible — the exchange is rejected if `gems - exchangeCost < 0`.

---

### EC-6: IAP failure or interrupted purchase (Gems)

**Trigger**: Player initiates an IAP gem pack, completes payment, but the app crashes before `setGems` is called.
**Behaviour**: IAP validation and receipt handling is owned by M2 Monetisation Shell. This GDD only specifies: Gems are never credited without a validated receipt. The currency system's `gems` state must not be directly set by UI — it must go through a receipt-validated IAP handler. Duplicate receipt replay must be idempotent (same receipt ID → no second credit).

---

### EC-7: Reputation at 5 stars

**Trigger**: Reputation meter reaches the conceptual "5 star" cap.
**Behaviour**: Further reputation-earning actions still trigger feedback (toast, sound), but the reputation display remains at 5 stars and the multiplier does not increase further. Reputation cannot exceed 5 stars regardless of how many shows or events the player completes.

---

### EC-8: Negative gold via offline exploit

**Trigger**: Player sets device clock backwards to undo idle gold accrual and then rapidly taps purchases.
**Behaviour**: The idle engine (Fe7) must never accrue negative time deltas. If the elapsed-time delta is ≤0, accrue 0 gold for that tick. This is a data-integrity guard, not an anti-cheat system — it prevents accidental negative-balance scenarios from system clock corrections, not deliberate manipulation.

---

### EC-9: ZooXP never negative

**Trigger**: Any code path that might attempt `xp -= value`.
**Behaviour**: XP has no spend mechanic — it accumulates only. Any call-site attempting to subtract XP is a bug. Guard: `setXp(x => Math.max(0, x + delta))` where delta is always ≥ 0 by contract. If a bug produces a negative delta, the clamp prevents underflow and the anomaly should be logged.

## Dependencies

### Upstream (this GDD depends on these)

| System | GDD | Dependency nature |
|--------|-----|-------------------|
| None | — | The Currency System has no upstream gameplay dependencies — it is Foundation layer. It depends only on the browser's `localStorage` API (via F3 Save/Load) for persistence, and on React state management for runtime balances. |

### Downstream (these GDDs depend on this one)

| System | GDD | What they consume |
|--------|-----|-------------------|
| **F3 Save/Load** | `design/gdd/save-load.md` *(not yet authored)* | Serialises and deserialises all 5 currency balances; must treat balance as atomic |
| **C1 Animal Care** | `design/gdd/animal-care.md` *(not yet authored)* | Spends Gold for care actions; earns Zoo XP as care reward |
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` ✅ | Produces Gold per second via `setGold(g => g + rate)` |
| **C3 Zoo Level** | `design/gdd/zoo-level.md` *(not yet authored)* | Reads accumulated XP to compute Zoo Level; LEVEL_XP curve defined there |
| **C4 Taming** | `design/gdd/taming.md` *(not yet authored)* | Taming requires sustained care spend — indirect Gold dependency via C1 |
| **Fe1 Animal Collection** | `design/gdd/animal-collection.md` *(not yet authored)* | Spends Gold for unlock and buy-more; reads `UNLOCKS[k].gold` and `buyCost` |
| **Fe2 Habitat System** | `design/gdd/habitat-system.md` *(not yet authored)* | Spends Gold for enclosure upgrade |
| **Fe3 Enrichment** | `design/gdd/enrichment.md` *(not yet authored)* | Spends Gold for enrichment tiers |
| **Fe4 Attractions** | `design/gdd/attractions.md` *(not yet authored)* | Spends Gold for attraction builds |
| **Fe5 Educational Shows** | `design/gdd/educational-shows.md` *(not yet authored)* | Earns Gold and Zoo XP on show completion |
| **Fe7 Idle/Offline** | `design/gdd/idle-offline.md` *(not yet authored)* | Computes accumulated Gold on session resume |
| **M2 Monetisation Shell** | `design/gdd/monetisation-shell.md` *(not yet authored)* | Credits Gems after validated IAP; debits Gems for speed-ups/cosmetics |
| **P1 HUD** | `design/gdd/hud.md` *(not yet authored)* | Displays live balances for Gold, Gems, XP progress bar; Tokens and Reputation during relevant events |

### Cross-system monetisation guardrail

The core rule "Animals may only be acquired with Gold — never with Gems" is
enforced at the **Fe1 Animal Collection** level (purchase-validation code), not
here. This GDD establishes the rule; Fe1 must implement and enforce it. Any system
that adds an animal-acquisition path in the future must also check this rule.

## Tuning Knobs

All values below are configurable. Changes to these values do **not** require a code change — they should be declared in `act/data.jsx` under the `CURRENCIES` or `TUNING` section.

| Knob | Current value | Safe range | Gameplay effect |
|------|---------------|-----------|-----------------|
| `GOLD_START` | 50 🪙 | 20–500 🪙 | Starting cushion for a new player — affects how quickly they can make the first meaningful purchase |
| `GEMS_START` | 10 💎 | 0–50 💎 | Onboarding gem gift — sets first-session impression of premium currency value |
| `VISITORS_PER_APPEAL` | 1.0 | 0.5–2.0 | Gold income rate multiplier — raising this makes the economy faster overall |
| `SPEND_PER_VISITOR` | 0.05 | 0.01–0.20 | Gold income per visitor — secondary rate dial; combined with VISITORS_PER_APPEAL, controls the Gold faucet |
| `BUY_COST_MULT` | 22 | 10–40 | Multiplier in `buyCost` formula — controls how quickly buying additional copies of an animal becomes expensive ⚠️ *needs balance pass* |
| `UPGRADE_COST_MULT` | 160 | 80–300 | Multiplier in `upgradeCost` formula — controls enclosure upgrade cost scaling ⚠️ *needs balance pass* |
| `ENRICH_COST_MULT` | 40 | 20–80 | Multiplier in `enrichCost` formula — controls enrichment cost scaling ⚠️ *needs balance pass* |
| `DAILY_MISSION_GEMS_MIN` | 5 | 1–20 | Minimum free gems per daily mission — sets the floor for free-player gem accumulation |
| `DAILY_MISSION_GEMS_MAX` | 15 | 5–50 | Maximum free gems per daily mission |
| `DAILY_MISSION_COUNT_MAX` | 5 | 1–10 | Maximum missions available per day — controls total daily gem faucet ceiling |
| `REP_MAX` | 5 (stars) | 3–10 | Reputation meter cap — changing this requires rescaling all reputation-earning events |
| `REP_VISITOR_MULTIPLIER` | [not yet defined] | [TBD by Fe5] | How much each reputation star multiplies visitor draw — defined when Fe5 Educational Shows is designed |

### ⚠️ Pending balance pass

The three cost multipliers (`BUY_COST_MULT`, `UPGRADE_COST_MULT`, `ENRICH_COST_MULT`) were calibrated when the maximum appeal value was ~1500. The current max (Dolphin, appeal 3000) makes elite-species costs roughly 2× too high. A dedicated `/balance-check` pass is required before these values go to production.

See also: `design/gdd/animal-database.md` §D Open Questions.

## Acceptance Criteria

### AC-1: Gold spend is blocked when balance is insufficient

**GIVEN** a player has 99 🪙  
**WHEN** they attempt a purchase costing 100 🪙  
**THEN** the gold balance remains at 99 🪙, no state changes, and a "Need 100 🪙" flash message appears.

---

### AC-2: Gold balance increases from passive income

**GIVEN** the zoo has at least one animal with appeal > 0  
**WHEN** 1 second elapses in active session  
**THEN** the gold balance increases by `floor(totalAppeal × VISITORS_PER_APPEAL × SPEND_PER_VISITOR)` (within ±1 🪙 for float rounding).

---

### AC-3: Zoo Level advances when XP threshold is crossed

**GIVEN** the player is at Zoo Level 5  
**WHEN** a care action grants enough XP to reach the Level 6 threshold  
**THEN** Zoo Level advances to 6, a level-up toast appears, and any content gated at Lv 6 becomes available.

---

### AC-4: XP never decreases

**GIVEN** a player is at any Zoo Level with accumulated XP = X  
**WHEN** any game event occurs (session resume, care, purchase, etc.)  
**THEN** the accumulated XP value is ≥ X (it never goes down).

---

### AC-5: Animals cannot be purchased with Gems

**GIVEN** any animal unlock or buy-more flow  
**WHEN** the purchase is initiated  
**THEN** the deduction is always from the Gold balance, and there is no code path that deducts Gems for an animal purchase.  
*(This criterion is verified by code review of `prototype.jsx` / `proto-screens.jsx` — all animal purchase calls must use `setGold`, not `setGems`.)*

---

### AC-6: Gem balance cannot go negative

**GIVEN** a player has 5 💎  
**WHEN** they attempt a gem purchase costing 6 💎  
**THEN** the gem balance stays at 5 💎 and the purchase is rejected with an appropriate message.

---

### AC-7: Conservation Tokens expire at event end

**GIVEN** a player has 50 🌿 tokens at the moment a seasonal event closes  
**WHEN** the event end timestamp is reached  
**THEN** the token balance resets to 0 and any remaining event-shop items are no longer purchasable.

---

### AC-8: Starting balances for a new game

**GIVEN** a brand-new player (no save data)  
**WHEN** the game initialises  
**THEN** Gold = 50 🪙, Gems = 10 💎, XP = 0, Tokens = 0, Reputation = 0.

---

### AC-9: Currency state persists across sessions

**GIVEN** a player has Gold = 1,234 🪙, Gems = 7 💎 at the end of a session  
**WHEN** they close and reopen the game  
**THEN** Gold = 1,234 🪙, Gems = 7 💎 (plus any offline accrual from Fe7).  
*(Persistence is owned by F3 Save/Load — this criterion verifies the interface contract.)*

---

### AC-10: Reputation is display-only, never spent

**GIVEN** a player with any Reputation value  
**WHEN** they perform any in-game action  
**THEN** the Reputation value is never deducted; it can only increase or stay the same.

## Open Questions

**OQ-1 — Balance pass on cost multipliers** *(High priority)*
The three Gold-spend multipliers (`BUY_COST_MULT=22`, `UPGRADE_COST_MULT=160`, `ENRICH_COST_MULT=40`) were designed for baseAppeal max ~1500. Since the appeal redesign pushed max to 3000, elite species are ~2× more expensive than intended. A full `/balance-check` run is needed before the economy is considered production-ready.
*Owner: Economy Designer. Blocked by: Fe1/Fe2/Fe3 GDDs being written (need cost curve targets).*

**OQ-2 — Reputation → visitor multiplier formula** *(Medium priority)*
`REP_VISITOR_MULTIPLIER` is flagged as "TBD" in Tuning Knobs. The formula that converts reputation stars to a visitor-count multiplier is not yet designed. It must be defined before Fe5 Educational Shows is implemented, as shows are the primary reputation-earning mechanism.
*Owner: Fe5 GDD author (Educational Shows).*

**OQ-3 — Gems daily trickle rate** *(Medium priority)*
The current daily mission gem values (5–15/mission × 1–5 missions/day = 5–75/day) are provisional. The free-to-play gem economy needs a full sink/faucet model to ensure:
- Free players can afford meaningful Gem purchases after 7–14 days of play
- The acquisition rate doesn't undermine IAP motivation
*Owner: Economy Designer. Input from: M2 Monetisation Shell GDD.*

**OQ-4 — Gem→Gold exchange rate** *(Low priority, post-MVP)*
If a Gem→Gold exchange is added (M2 Monetisation Shell decision), this GDD needs a section on the exchange rate and whether it is time-gated (e.g. once per day) or unlimited. Currently deferred to M2.

**OQ-5 — XP curve** *(Blocked on C3)*
The LEVEL_XP threshold table is provisional (empty). It must be defined in C3 Zoo Level Progression GDD. Until then, all XP-related acceptance criteria (AC-3, AC-4) cannot be fully implemented.
*Owner: C3 GDD author.*

**OQ-6 — VIP membership** *(Low priority, post-MVP)*
Gems spent on VIP membership were mentioned in the Overview but not detailed here. VIP benefits (e.g. gold multiplier, skip-ad equivalent) and pricing are M2's responsibility. This GDD will need a "Gem spend: VIP" row in the interactions table when M2 is designed.
*Owner: M2 Monetisation Shell GDD.*
