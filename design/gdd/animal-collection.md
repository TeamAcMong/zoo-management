# Animal Collection System

> **Status**: In Design (Reverse-Documented)
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — every species earned through play, never pay
> **Source files**: `act/data.jsx` (ANIMALS, UNLOCKS, ENC_COUNTS, MAX_LEVEL, roundNice), `act/prototype.jsx` (unlockAnimal, confirmBuy, buyMoreAnimal), `act/proto-screens.jsx` (AnimalsScreen, EnclosureScreen)
> **Reverse-documentation note**: Every value, formula, and behavior in this document was extracted from the running implementation as of 2026-06-06. No mechanics were invented. Where the code is silent this is called out in Open Questions.

---

## 1. Overview

The Animal Collection System is the unlock-and-adopt loop at the heart of Animal World Zoo. It governs which of the 29 species are available to the player at any given moment and how they are acquired. The system operates on two levels: **first adoption** (bringing a species into the zoo for the first time) and **buy-more** (purchasing additional copies of an already-owned species to fill an enclosure). Both paths are gated by Gold and Zoo Level exclusively — no species in the game can be purchased with Gems. As the player's Zoo Level rises from 1 to 92, species unlock in a strict sequence tied to their unlock level in the `ANIMALS` dataset; each newly unlocked species then has a Gold cost derived from the same `UNLOCKS` table. First adoption also grants 40 Zoo XP, reinforcing the level-progression loop. The complete collection of all 29 species across 8 themed tiers (Starter through Marine Cove) is the game's primary long-term goal.

---

## 2. Player Fantasy

"I just hit Level 32. The Zebra is finally available. I've been saving for this."

The collection loop is built on anticipation. Every level-up is a door half-opening: the player can see the next locked silhouette, read its name and unlock level, and feel the pull of its appeal value joining their zoo. The Gold cost of adoption transforms that anticipation into a concrete short-term savings goal — the player works their zoo, collects income, taps care actions, and watches the gold counter climb toward the unlock price.

The moment of adoption completes that arc. The naming modal appears; the player types a personal name; they tap "Adopt" and the animal arrives with a celebration flash. From that moment, the species is *theirs* — a permanent part of their collection, contributing its unique appeal every second the zoo runs.

The buy-more mechanic extends this into an ongoing loop: after first adoption the player can keep purchasing additional copies of the same species, each one raising the enclosure's total appeal. The cost scales with count already owned, so each additional copy is a meaningful decision, not a trivial repeat.

This system primarily serves the **Collection** aesthetic (MDA): the satisfaction of completeness, the itch of one empty slot, and the quiet pride of a full biome row.

---

## 3. Detailed Rules

### 3.1 Starter Animal

**Rabbit** (`key: 'rabbit'`) is free and owned from the first frame. It does not appear in `UNLOCKS` and does not require a Gold purchase. Its initial meters are seeded from `FRESH_METERS` (hunger:42, thirst:36, clean:64, happy:70, trust:30). All other 28 species must be unlocked and adopted.

---

### 3.2 Unlock Gating by Zoo Level

Every non-Rabbit species has a Zoo Level requirement stored in `ANIMALS[k].unlock`:

- `'Start'` or `'Tutorial'` → available at Zoo Level 1 (mapped to `lv = 1` in `UNLOCKS`)
- `'LvN'` (e.g. `'Lv32'`) → available when `level >= N`

The `UNLOCKS` array is derived at module load from `ANIMALS` (filtered to exclude Rabbit, sorted by `lv` then `gold`). This derivation is the single source of truth — `ANIMALS` and `UNLOCKS` can never drift apart.

**Visibility rules in `AnimalsScreen`:**

| Condition | Display |
|-----------|---------|
| `level < u.lv` | Species emoji replaced with 🔒; button reads "Reach Lv N" (greyed, tappable but blocked) |
| `level >= u.lv AND gold < u.gold` | Species emoji shown; "Buy · X 🪙" button visible but visually dimmed (opacity 0.55) |
| `level >= u.lv AND gold >= u.gold` | "Buy · X 🪙" button fully opaque; tap initiates adoption |

Tapping a level-gated species when below the required level calls `unlockAnimal(k)` which fires the flash "Reach Lv N first" and returns without opening the naming modal.

**On the live zoo map (`LiveZoo`):** locked species appear as greyed-out 🔒 placeholder plots at their fixed map positions. Tapping one switches the view to the Animals tab, not to an adopt modal.

---

### 3.3 Adoption Flow (First Copy)

1. Player taps "Buy · X 🪙" for a level-gated and affordable species.
2. `unlockAnimal(k)` validates: `level >= u.lv` AND `gold >= u.gold`. If either fails, flash and return.
3. Naming modal opens (`buyTarget = k`). `nameInput` is pre-filled with the species name.
4. Player edits or accepts the name and taps "Adopt".
5. `confirmBuy()` runs:
   a. Calls `pay(u.gold)` → deducts Gold via `setGold(g => g - cost)`.
   b. Appends `k` to `owned` via `setOwned(o => [...o, k])`.
   c. Grants `+40 Zoo XP` via `setXp(x => x + 40)`.
   d. Sets initial population `pops[k] = 1`.
   e. Seeds care meters: `{ hunger:60, thirst:58, clean:64, happy:66, trust:30 }`.
   f. Saves any custom name to `names[k]`.
   g. Shows flash "Welcome, [Name]!".
6. If a tutorial step requires `need === 'buy'`, `nextTut()` is called after adoption.

**The Gold deduction in step 5a uses `pay()` which calls `setGold` — not `setGems`. This is the enforced implementation of the Gold-only monetisation guardrail.**

---

### 3.4 Buy-More (Additional Copies)

After first adoption, the player can purchase additional copies of the same species to fill the enclosure. The entry point is the **Enclosure screen** (`EnclosureScreen`), accessible by tapping any owned animal on the zoo map or the Animals screen.

**Flow:**

1. Player taps "Buy [Species]" on the Enclosure screen.
2. `buyMoreAnimal(k)` runs:
   a. Checks `cntOf(k) >= capOf(k)` → if enclosure is full, flash "Enclosure full — upgrade it first" and return.
   b. Computes cost: `Math.round(AA[k].appeal * 22 * cntOf(k)) + 50`.
   c. Checks `gold < cost` → if insufficient, flash "Need X 🪙" and return.
   d. Calls `pay(cost)` → deducts Gold via `setGold(g => g - cost)`.
   e. Increments `pops[k]` by 1.
   f. Opens renaming modal for the new animal.
   g. Shows flash "+1 [Species]".

**The cost parameter in step 2b uses `pay()` → `setGold` only. No Gems are involved at any stage.**

The Enclosure screen button always shows the next buy-more cost inline: `(Math.round((a.appeal||1)*22*count)+50).toLocaleString() + " 🪙"`.

---

### 3.5 Enclosure Capacity and the Buy-More Cap

Each enclosure has a maximum animal count (`capOf`) derived from its upgrade level:

```
capOf(k) = 2 + (lvOf(k) - 1)
```

| Enclosure Level | Maximum animals |
|-----------------|----------------|
| 1 | 2 |
| 2 | 3 |
| 3 | 4 |
| 4 | 5 |
| 5 | 6 |

Attempting to buy a copy when `cntOf(k) >= capOf(k)` is blocked. The buy button is visually dimmed at full capacity (opacity 0.5 on the Enclosure screen button). The player must upgrade the enclosure first (Fe2 Habitat System) to expand the cap.

---

### 3.6 Collection Progress

The total collection consists of 28 adoptable species (all except Rabbit). Progress is tracked implicitly: `owned.length - 1` adopted species out of 28 possible. No explicit collection completion screen exists in the current implementation (see Open Questions OQ-1).

The `AnimalsScreen` header reads "{owned.length} species · Zoo Level {level}". The locked section shows all non-owned species with their level gates and costs.

**Full collection state** = `owned` contains all 29 keys. This is achievable without any IAP at Max Level 92.

---

### 3.7 Gold-Only Guardrail (Enforced Invariant)

**Rule**: No animal may be acquired via any path that deducts Gems. This is an invariant, not a convention.

**Call-site audit (as of 2026-06-06):**

| Function | File | Currency deducted |
|----------|------|-------------------|
| `confirmBuy()` | `act/prototype.jsx` line 167 | `pay(u.gold)` → `setGold(g => g - cost)` |
| `buyMoreAnimal()` | `act/prototype.jsx` line 114 | `pay(cost)` → `setGold(g => g - cost)` |
| Admin `adminUnlockNext()` | `act/prototype.jsx` line 211 | No currency deducted (admin bypass) |
| Admin `adminUnlockAll()` | `act/prototype.jsx` line 212 | No currency deducted (admin bypass) |

Admin functions bypass currency checks entirely — they are debug tools, not purchasable paths. The `ShopScreen` `onBuyGold` handler (line 259) exchanges Gems for Gold but does not interact with animal ownership. No code path deducts Gems for an animal purchase.

---

## 4. Formulas

### F-1: Unlock Gold Cost

```
unlockGold[k] = roundNice(500 × 1.06^(lv[k] − 1))
```

**Variables:**

| Variable | Type | Range | Source |
|----------|------|-------|--------|
| `lv[k]` | integer | 1–92 | `ANIMALS[k].unlock` parsed to integer |
| `1.06` | constant | — | Geometric growth rate per Zoo Level |
| `500` | constant (base) | — | Cost floor at Lv 1 |
| `roundNice(x)` | function | — | Rounds to nearest 500 if x≥10000; nearest 100 if x≥1000; nearest 10 otherwise |

**Output range:** ~500 🪙 (Lv 1) to ~94,000 🪙 (Lv 92)

**Example calculations:**

| Species | Unlock Level | Raw value | roundNice | Notes |
|---------|-------------|-----------|-----------|-------|
| Chicken | Lv 1 | 500 × 1.06^0 = 500 | **500** 🪙 | Start-tier, immediate |
| Dog | Lv 3 | 500 × 1.06^2 = 561.8 | **560** 🪙 | |
| Goat | Lv 6 | 500 × 1.06^5 = 669.1 | **670** 🪙 | |
| Horse | Lv 11 | 500 × 1.06^10 = 895.4 | **900** 🪙 | |
| Zebra | Lv 32 | 500 × 1.06^31 = 3,044 | **3,000** 🪙 | First savanna animal |
| Lion | Lv 48 | 500 × 1.06^47 = 7,757 | **7,800** 🪙 | |
| Dolphin | Lv 92 | 500 × 1.06^91 = 93,850 | **94,000** 🪙 | Final animal |

---

### F-2: Buy-More Gold Cost

```
buyCost[k] = round(appeal[k] × 22 × cntOf(k)) + 50
```

**Variables:**

| Variable | Type | Range | Source |
|----------|------|-------|--------|
| `appeal[k]` | integer | 3–3000 | `ANIMALS[k].appeal` (base appeal, not multiplied by enclosure level or enrichment) |
| `22` | constant (multiplier) | — | `BUY_COST_MULT` in currency-system.md §Tuning |
| `cntOf(k)` | integer | 1–(cap−1) | Existing population count *before* this purchase |
| `50` | constant (floor) | — | Minimum cost regardless of appeal |

**Output range:** 116 🪙 (Rabbit, 2nd copy) to 66,050 🪙 (Dolphin, 2nd copy)

**Example calculations:**

| Species | Appeal | Count before | Raw | Total cost |
|---------|--------|-------------|-----|-----------|
| Rabbit | 3 | 1 | round(3×22×1)+50 | **116** 🪙 |
| Rabbit | 3 | 2 | round(3×22×2)+50 | **182** 🪙 |
| Dog | 30 | 1 | round(30×22×1)+50 | **710** 🪙 |
| Wolf | 330 | 1 | round(330×22×1)+50 | **7,310** 🪙 |
| Elephant | 850 | 1 | round(850×22×1)+50 | **18,750** 🪙 |
| Dolphin | 3000 | 1 | round(3000×22×1)+50 | **66,050** 🪙 |

> ⚠️ **Balance gap (from F2 currency-system.md §D)**: The multiplier `22` was calibrated when the maximum appeal was ~1500. Current max is 3000 (Dolphin). This makes the Dolphin's 2nd-copy cost ~66,050 🪙 — approximately 2× the intended ceiling. A `/balance-check` pass is required before these values are finalised for production. See Tuning Knobs and Open Questions OQ-3.

---

### F-3: XP Grant on Adoption

```
xpGrant = 40 Zoo XP (flat, one-time, per species)
```

Granted once per species in `confirmBuy()`. Does not apply to buy-more purchases. Does not stack (re-adopting is impossible — once a species is in `owned`, the adopt flow is gated by `owned.includes(k)` check in `unlockAnimal()`).

This value is the `xp_per_adopt` constant registered in `design/registry/entities.yaml`.

---

### F-4: Enclosure Capacity

```
capOf(k) = 2 + (lvOf(k) − 1)
```

Where `lvOf(k)` = current enclosure upgrade level (1–5, owned by Fe2 Habitat System).

This formula is duplicated between `prototype.jsx` (capOf computation) and `proto-screens.jsx` (EnclosureScreen display). Both use the same expression.

---

## 5. Edge Cases

### EC-1: Insufficient Gold — Purchase Blocked

**Trigger**: Player taps "Buy" for a species when `gold < u.gold` (adopt) or `gold < buyCost` (buy-more).
**Behaviour**: `unlockAnimal()` returns after `flash("Need X 🪙")` without opening the naming modal. `buyMoreAnimal()` returns after `flash("Need X 🪙")` without modifying state.
**State**: Gold balance unchanged. `owned`, `pops`, and `xp` unchanged. No partial deduction. This matches F2 EC-1.

---

### EC-2: Level Gate — Attempt Below Required Level

**Trigger**: Player taps the "Reach Lv N" button for a level-gated species.
**Behaviour**: `unlockAnimal(k)` fires `flash("Reach Lv N first")` and returns immediately. The naming modal does not open.
**Edge within edge**: If the player somehow reaches the species card while both conditions fail simultaneously (`level < u.lv` AND `gold < u.gold`), the level check fires first in `unlockAnimal()` (code order: level check before gold check). The level message takes precedence.

---

### EC-3: Adopting the Final Species (Dolphin at Lv 92)

**Trigger**: Player reaches Zoo Level 92 and has enough Gold to adopt the Dolphin (≥94,000 🪙).
**Behaviour**: Standard adopt flow applies. `confirmBuy()` succeeds, Dolphin added to `owned`, +40 XP granted. Since `owned` now contains all 29 species, `locked.length === 0` in `AnimalsScreen` and the "Adopt new animals" section disappears entirely.
**No completion screen currently exists** — see OQ-1.

---

### EC-4: Re-Adopting an Already-Owned Species

**Trigger**: Any code path tries to call `unlockAnimal(k)` for a `k` already in `owned`.
**Behaviour**: `unlockAnimal()` checks `owned.includes(k)` as its second guard and returns silently if true. The adopt button is not rendered for owned species (they appear in the "Your animals" section instead). This cannot be triggered through normal UI.

---

### EC-5: Buy-More at Full Enclosure Capacity

**Trigger**: Player taps "Buy [Species]" when `cntOf(k) >= capOf(k)`.
**Behaviour**: `buyMoreAnimal()` fires flash "Enclosure full — upgrade it first" and returns without modifying any state. The buy button on the Enclosure screen is visually dimmed (opacity 0.5) when at capacity, but remains tappable (it produces the flash message as feedback).

---

### EC-6: Buy-More When Population Would Exceed Capacity After Upgrade

**Trigger**: Player upgrades enclosure (raises `capOf`) and then has population below new cap.
**Behaviour**: Standard flow — `cntOf(k) < capOf(k)` passes; buy-more proceeds normally. There is no maximum population above 6 (enclosure level 5 cap). This is not an edge case in the current implementation but is noted here for completeness.

---

### EC-7: Simultaneous Income Tick and Adoption

**Trigger**: The passive Gold income timer fires at the same tick a player initiates `confirmBuy()`.
**Behaviour**: React batch updates apply: the income increment and the `pay()` decrement are batched. The net result is correct: the post-adoption balance = pre-adoption balance + tick income − unlock cost. If the post-tick net is negative (income tick plus balance < cost), the adoption would still have been blocked at the pre-tick balance by the initial `gold < u.gold` check (which reads state before the batch). This is an acceptable race condition — it errs on the side of rejection, which is consistent with F2 EC-2.

---

### EC-8: Animals Acquired via Admin Tools

**Trigger**: Developer taps "Unlock Next" or "Unlock All" in the Admin panel.
**Behaviour**: Admin unlocks bypass `confirmBuy()` entirely — they directly modify `owned` and `meters` without calling `pay()` or granting XP. Gold is not deducted. XP is not granted. This is intentional debug behaviour, not a production path. The Admin panel is not available in production builds.

---

### EC-9: Degenerate Strategy — Adopting High-Appeal Species Early via Gold Accumulation

**Description**: A patient player could idle-grind gold at a low level before adopting the next species, building up a large gold reserve before they level up. This is intentional and healthy — it represents a saving mini-game.
**Risk**: None identified. The unlock level gate prevents accessing higher-tier species regardless of gold balance. Players cannot skip tiers.

---

### EC-10: Degenerate Strategy — Buy-More Spam on Low-Appeal Species

**Description**: At `buyCost = round(appeal × 22 × count) + 50`, a Rabbit's 2nd copy costs only 116 🪙 and each subsequent copy costs a trivially increasing amount. A player could fill every early enclosure with low-appeal Rabbits cheaply.
**Impact**: Mild. Low-appeal animals provide minimal economy benefit. The enclosure capacity cap (max 6) bounds this. The appeal gained from 6 Rabbits (3×6=18 net) is minor compared to a single higher-tier animal. This is not a degenerate strategy under Sirlin's framework — it is a valid but suboptimal play pattern.

---

## 6. Dependencies

### Upstream (systems this GDD depends on)

| System | GDD | Dependency |
|--------|-----|-----------|
| **F1 Animal Database** | `design/gdd/animal-database.md` | Provides `ANIMALS` — all species data including `appeal`, `unlock`, `tier`, `taming`, `perform` |
| **F2 Currency System** | `design/gdd/currency-system.md` | Defines the Gold-only monetisation guardrail; `pay()` function; Gold balance state |
| **C3 Zoo Level** | `design/gdd/zoo-level.md` | Provides the live `level` integer that gates unlocks; `LEVEL_XP` curve |
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` | Gold income rate that fills the reserve used for adoptions |

### Downstream (systems that depend on this GDD)

| System | GDD | What they consume |
|--------|-----|------------------|
| **C1 Animal Care** | `design/gdd/animal-care.md` | Reads `owned` to know which animals need care meters; receives adopted animals from `confirmBuy()` with seeded meters |
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` | Reads `owned` and `pops[k]` to compute total zoo appeal → Gold income |
| **C4 Taming** | `design/gdd/taming.md` | Adoption seeds the initial trust meter (30 points); Trust accumulates from care afterward |
| **Fe2 Habitat System** | `design/gdd/habitat-system.md` | Reads `pops[k]` (population count) and `encLv[k]` to compute enclosure state; `capOf(k)` formula shared |
| **Fe3 Enrichment** | `design/gdd/enrichment.md` | Enrichment applies per-animal after adoption; `enrich[k]` keyed on `owned` entries |
| **Fe4 Attractions** | `design/gdd/attractions.md` | Petting/performance attractions check `owned` for eligible species |
| **Fe5 Performance** | `design/gdd/educational-shows.md` | Performance Arena checks `owned` for `perform === true` species |
| **P1 HUD** | `design/gdd/hud.md` | Displays owned count, locked count, and Gold balance during collection flow |

### Integration contracts

**This system provides to others:**
- `owned: string[]` — the live list of adopted species keys
- `pops[k]: number` — current animal count per enclosure
- The adopt event triggers `setXp(x => x + 40)` — consumed by C3 Zoo Level

**This system requires from others:**
- `gold: number` — from F2 Currency System (read-only for gating; mutated via `pay()`)
- `level: number` — from C3 Zoo Level (read-only; derived from `xp` against `LEVEL_XP`)
- `ANIMALS`, `UNLOCKS` — from F1 Animal Database (static data)

---

## 7. Tuning Knobs

All tunable values should be declared in `act/data.jsx` (or a future `assets/data/collection.json`), not hardcoded.

| Knob | Current value | Category | Safe range | Gameplay effect |
|------|---------------|----------|-----------|-----------------|
| `UNLOCK_BASE_GOLD` | 500 🪙 | Curve | 200–2,000 | Shifts the entire unlock cost curve up or down; affects early-game adoption pace |
| `UNLOCK_GROWTH_RATE` | 1.06 | Curve | 1.02–1.10 | Steepness of the unlock cost curve; higher = more expensive late-game unlocks |
| `BUY_COST_MULT` | 22 | Curve | 10–40 | Controls how expensive each additional copy is relative to the animal's appeal ⚠️ *needs balance pass — was calibrated at old appeal max ~1500, current max is 3000* |
| `BUY_COST_FLOOR` | 50 🪙 | Feel | 10–200 | Minimum buy-more cost regardless of appeal; prevents trivially free purchases |
| `XP_PER_ADOPT` | 40 | Curve | 20–100 | XP grant per new species; raising this compresses early-level advancement |
| `ADOPT_METERS_INITIAL` | hunger:60, thirst:58, clean:64, happy:66, trust:30 | Feel | All 0–100 | Starting care meter values for newly adopted animals; affects immediate care urgency |

### Pending balance pass

> ⚠️ `BUY_COST_MULT = 22` was calibrated when the maximum appeal value was ~1500. Current max (Dolphin, appeal 3000) produces a 2nd-copy cost of ~66,050 🪙 — approximately 2× the intended ceiling. This is a **high-priority balance gap** registered in F2 currency-system.md §Tuning Knobs. A `/balance-check animal-collection` run is required before these values go to production.

---

## 8. Acceptance Criteria

### AC-1: First adoption deducts Gold, not Gems

**GIVEN** a player with Gold ≥ `unlockGold[k]` and at `level >= u.lv`  
**WHEN** they complete the adopt flow for any non-Rabbit species  
**THEN** the Gold balance decreases by exactly `unlockGold[k]`, the Gem balance is unchanged, and the species appears in `owned`.

---

### AC-2: Adoption grants exactly 40 Zoo XP

**GIVEN** a player who adopts any non-Rabbit species for the first time  
**WHEN** `confirmBuy()` completes  
**THEN** Zoo XP increases by exactly 40. This XP grant does not apply to buy-more purchases.

---

### AC-3: Zoo Level gate blocks adoption below required level

**GIVEN** a player at Zoo Level 10  
**WHEN** they tap any species with unlock level > 10 (e.g. Horse at Lv 11)  
**THEN** the naming modal does not open, a "Reach Lv N first" flash appears, and Gold is unchanged.

---

### AC-4: Insufficient Gold blocks adoption

**GIVEN** a player at the correct Zoo Level but with Gold < `unlockGold[k]`  
**WHEN** they tap the Buy button for that species  
**THEN** the naming modal does not open, a "Need X 🪙" flash appears, and Gold is unchanged.  
*(This criterion mirrors F2 AC-1.)*

---

### AC-5: Animals are NEVER purchasable with Gems

**GIVEN** any state of the game  
**WHEN** a player adopts a new species OR buys more copies of an existing species  
**THEN** the Gem balance (`gems`) is unchanged; only the Gold balance decreases via `pay()`.  
*Verified by code review: `confirmBuy()` (prototype.jsx line 167) calls `pay(u.gold)` which calls `setGold(g => g - cost)`. `buyMoreAnimal()` (prototype.jsx line 114) calls `pay(cost)` which calls `setGold(g => g - cost)`. No code path in either function reads or modifies `gems`.*  
*(This criterion enforces F2 AC-5.)*

---

### AC-6: Buy-more is blocked when enclosure is at capacity

**GIVEN** a player whose enclosure for species `k` has `pops[k] >= capOf(k)`  
**WHEN** they tap "Buy [Species]" on the Enclosure screen  
**THEN** population does not increase, Gold is unchanged, and the flash "Enclosure full — upgrade it first" appears.

---

### AC-7: Buy-more cost formula matches in-code display

**GIVEN** a player viewing the Enclosure screen for species `k` with current count `n`  
**WHEN** the buy-more button is visible  
**THEN** the displayed cost equals `Math.round(appeal[k] × 22 × n) + 50`. The actual cost deducted on confirmation is identical to the displayed cost.

---

### AC-8: Full collection is achievable without IAP

**GIVEN** a new player who reaches Zoo Level 92 through normal gameplay  
**WHEN** they have accumulated enough Gold from zoo income  
**THEN** all 29 species can be adopted using Gold only, with no Gem expenditure required at any point.

---

### AC-9: Rabbit is never offered for purchase

**GIVEN** any state of the game  
**WHEN** the AnimalsScreen or any UI renders the "Adopt new animals" section  
**THEN** the Rabbit does not appear in the `locked` array and has no "Buy" button; it is always present in `owned` from game start.

---

### AC-10: Unlock cost formula is consistent between display and deduction

**GIVEN** any unlockable species `k`  
**WHEN** the AnimalsScreen shows the cost "Buy · X 🪙" for that species  
**THEN** `X = UNLOCKS.find(u => u.key === k).gold` and the actual deduction in `confirmBuy()` is that same value with no rounding discrepancy.

---

## Open Questions

**OQ-1 — Collection completion event** *(Medium priority)*
The current implementation has no completion screen or reward when the player adopts all 29 species (Dolphin at Lv 92 is the final unlock). The `locked.length === 0` state silently removes the "Adopt new animals" section. Should there be a dedicated "Collection complete" reward screen, achievement badge, or persistent HUD marker?
*Owner: Game Designer / UX Designer. Blocks: P1 HUD, Fe5 Performance (endgame loop implications).*

**OQ-2 — Buy-more XP grant** *(Low priority)*
`confirmBuy()` grants +40 XP on first adoption. `buyMoreAnimal()` grants zero XP. Is this correct intent? An argument exists for granting a small XP reward (e.g. 10 XP) for each additional copy to reward continued investment, especially for high-tier species.
*Owner: Systems Designer / Economy Designer. Depends on: C3 Zoo Level XP curve balance pass.*

**OQ-3 — BUY_COST_MULT balance pass** *(High priority)*
The multiplier `22` produces a Dolphin 2nd-copy cost of ~66,050 🪙, which is ~2× the intended ceiling (calibrated at old appeal max ~1500). The full buy-more cost curve for all 29 species across all copy counts needs a `/balance-check` run against the expected gold income rate at each Zoo Level band. The correction may require reducing the multiplier (e.g. to 11–14) or introducing a tiered multiplier (lower for high-appeal species).
*Owner: Economy Designer. Blocked by: Zoo Economy income rate finalisation (C2).*

**OQ-4 — Unlock cost display at level gate** *(Low priority)*
When a species is below the required Zoo Level (player sees 🔒), the Gold cost is still visible in the meta-text ("needs Lv N"). Should the full cost be shown before the player reaches that level? Showing it may motivate pre-saving; hiding it reduces cognitive load. Current implementation shows it.
*Owner: UX Designer.*

**OQ-5 — Per-species ENC_COUNTS vs. pops runtime state** *(Medium priority)*
`ENC_COUNTS` in `data.jsx` provides a per-species baseline count used in UI display (e.g. `proto-screens.jsx` line 43: `cnt = ENC_COUNTS[u.key]||1`). However, the *actual runtime population* is tracked in `pops[k]` which starts at 1 on `confirmBuy()`. These two sources can diverge (e.g. `ENC_COUNTS.rabbit = 3` but `pops.rabbit` starts at whatever it was reset to). The appeal displayed on the Animals screen uses `ENC_COUNTS` for locked species (cosmetic) but `cntOf(k)` for owned species (real). This is cosmetically consistent but the data.jsx `ENC_COUNTS` values are never written back from runtime state and are not persisted. Their design purpose (initial target population vs. actual count) needs to be clarified and documented.
*Owner: Systems Designer / Gameplay Programmer. Affects: F1 Animal Database, Fe2 Habitat System.*
