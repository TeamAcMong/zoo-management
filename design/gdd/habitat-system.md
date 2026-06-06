# Habitat System

> **Status**: In Design (Reverse-Documented)
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — habitats are the physical expression of the zoo's growth; upgrading them deepens appeal, not power
> **Source files**: `act/data.jsx` (HABITATS, HAB_UPGRADE, ENC_COUNTS, ANIMALS[].habitat), `act/prototype.jsx` (encLv state, upgradeEnc, capOf, multOf, appealOf, seatsOf), `act/proto-screens.jsx` (EnclosureScreen, upgrade cost formula)
> **Reverse-documentation note**: Every value, formula, and behavior in this document was extracted from the running implementation as of 2026-06-06. No mechanics were invented. Where the code is silent this is called out in Open Questions.

---

## 1. Overview

The Habitat System is the primary Gold sink in Animal World Zoo. It governs the
seven themed biomes the player builds through the game, and the five per-enclosure
upgrade levels (1→5) that raise each animal's appeal contribution and visitor
capacity. Every owned species lives inside a biome habitat matching its
`ANIMALS[k].habitat` key; as the player upgrades that enclosure's level, the
appeal multiplier climbs by +25% per level above 1 (formula `1 + 0.25×(encLv−1)`),
directly feeding the C2 Zoo Economy chain and increasing gold income. Upgrading
also unlocks additional animal slots (cap rises from 2 at Lv1 to 6 at Lv5) and
expands viewer seats used in the capacity model.

Biomes unlock in strict Zoo Level order — Meadow at start, Pasture at Lv6,
Woodland at Lv20, Savanna at Lv32, Polar Peaks at Lv60, Reptile House at Lv70, and
Marine Cove at Lv84 — creating a long horizon of meaningful content gates
throughout the 1→92 progression arc.

---

## 2. Player Fantasy

"My Lion enclosure is at Level 1. Every visitor walks past and the appeal meter
barely moves. After I upgrade it twice the appeal climbs noticeably and the gold
counter visibly speeds up."

Habitat upgrades are the moment when the zoo feels richer. The player watches the
appeal number jump after each level-up — a direct, satisfying translation of gold
spent into zoo income earned. The cost is always meaningful (never trivial, never
impossible), so each upgrade is a short-to-medium savings goal that feels earned
when completed.

The biome unlock is a different beat — grander and rarer. Reaching Level 32 and
watching the Savanna biome appear is a milestone moment: a new palette, new
species silhouettes, and a whole new tier of appeal and income potential stretching
ahead. The zoo transforms visually and economically at each biome gate.

Together these two loops — the granular per-enclosure improvement and the
occasional sweeping biome reveal — give players both short-term satisfaction and
long-term direction.

---

## 3. Detailed Rules

### 3.1 Biome Definitions

There are seven biomes. Each biome is defined in `HABITATS` in `act/data.jsx`.

| Biome key   | Display name   | Icon | Tint colour | Zoo Level unlock | Species that live here |
|-------------|----------------|------|-------------|-----------------|----------------------|
| `meadow`    | Meadow         | 🌾   | `#E3F2DC`   | Start (Lv 1)    | Rabbit, Chicken, Duck, Dog, Cat |
| `pasture`   | Pasture        | 🐎   | `#EFEAD8`   | Lv 6            | Goat, Sheep, Horse, Donkey, Alpaca, Cow |
| `woodland`  | Woodland       | 🌲   | `#DDEAD9`   | Lv 20           | Fox, Monkey, Raccoon, Wolf |
| `savanna`   | Savanna        | 🌅   | `#FBE6C9`   | Lv 32           | Zebra, Giraffe, Rhino, Hippo, Lion, Elephant |
| `polar`     | Polar Peaks    | ❄️   | `#E3EEF7`   | Lv 60           | Brown Bear, Polar Bear |
| `reptile`   | Reptile House  | 🦎   | `#E0EAD4`   | Lv 70           | Turtle, Python, Crocodile |
| `marine`    | Marine Cove    | 🌊   | `#D4ECF5`   | Lv 84           | Seal, Sea Lion, Dolphin |

**Biome unlock gating**: A biome becomes available when the player's Zoo Level
reaches the threshold in the table above. The `HABITATS[].unlock` string is
compared by the UI and by `prototype.jsx` against the current level derived from
`levelFromXp(xp)`. The Meadow is always available from game start; it gates
none of its species (all Meadow animals unlock at Lv1–5, inside the Meadow
biome which is already open).

**Species-to-biome assignment**: `ANIMALS[k].habitat` is the canonical assignment.
Every species has exactly one habitat key, which must match an existing `HABITATS`
key. The biome provides the visual tint (`hab.tint`) displayed as the enclosure
card background in `EnclosureScreen`. No species can belong to two biomes.

---

### 3.2 Per-Enclosure Upgrade Levels

Each adopted species has its own independent enclosure level (`encLv[k]`), tracked
in the `encLv` React state object in `prototype.jsx`. Every enclosure starts at
level 1 on first adoption and can be upgraded up to a maximum of level 5.

| Enclosure Level | Animal capacity (cap) | Appeal multiplier | Seats coefficient | Cumulative upgrade cost (low / mid / high appeal example) |
|:---:|:---:|:---:|:---:|:---|
| 1 | 2 | ×1.00 | 0.6 | — (starting state) |
| 2 | 3 | ×1.25 | 1.1 | See §4 worked examples |
| 3 | 4 | ×1.50 | 1.6 | |
| 4 | 5 | ×1.75 | 2.1 | |
| 5 | 6 | ×2.00 | 2.6 | |

**Capacity formula** (from `prototype.jsx`):
```
capOf(k) = 2 + (lvOf(k) − 1)
```
This matches `HAB_UPGRADE` slots column above (Lv1→2, Lv2→3, … Lv5→6).

**Appeal multiplier formula** (from `prototype.jsx`):
```
multOf(k) = 1 + 0.25 × (lvOf(k) − 1)
```
This is the C2 Zoo Economy enclosure bonus — each level above 1 contributes an
additional +25% to that animal's appeal contribution to the total zoo appeal.

**Seats coefficient formula** (from `prototype.jsx`):
```
seatsCoeff(k) = 0.6 + 0.5 × (lvOf(k) − 1)
```
Used in the capacity model: `seatsOf(k) = baseAppeal × count × seatsCoeff`.
Upgrading an enclosure expands both appeal AND the zoo's visitor capacity.

---

### 3.3 Upgrade Flow

1. Player opens the Enclosure screen for any owned species (via the zoo map or
   Animals tab).
2. `EnclosureScreen` displays the "Upgrade" button with the computed cost:
   `(Math.round((a.appeal||1) × 160 × (encLv||1)) + 300).toLocaleString() + " 🪙"`.
3. Player taps "Upgrade".
4. `upgradeEnc(k)` in `prototype.jsx` runs:
   a. Computes cost: `Math.round(AA[k].appeal × 160 × lvOf(k)) + 300`.
   b. Checks `gold < cost` — if insufficient, fires flash "Need X 🪙" and returns.
   c. Calls `pay(cost)` → deducts Gold via `setGold(g => g − cost)`.
   d. Increments `encLv[k]` by 1 via `setEncLv(e => ({ ...e, [k]: lvOf(k)+1 }))`.
   e. Fires flash "Enclosure → Lv N (+slot & appeal)".
5. On the next income tick, `appealOf(k)` and `seatsOf(k)` recompute using the
   new `lvOf(k)`, immediately increasing zoo appeal and gold income.

**No level cap enforcement in upgradeEnc()**: The function does not guard against
`lvOf(k) >= 5`. At enclosure level 5 the Upgrade button remains active and the
cost would be computed as `round(appeal × 160 × 5) + 300`. This is an
**implementation gap** — see Edge Cases EC-1 and Open Questions OQ-1.

---

### 3.4 ENC_COUNTS Resolution (Fe1 OQ-5 Resolved)

`ENC_COUNTS` in `act/data.jsx` defines a per-species integer (e.g. `rabbit:3`,
`lion:2`, `dolphin:2`). **This is display-only metadata, not a runtime population
source.** Its purpose and constraints are:

**What ENC_COUNTS IS:**
- The initial "cosmetic population count" shown on the locked-species card in
  `AnimalsScreen` (line 43 of `proto-screens.jsx`: `cnt = ENC_COUNTS[u.key]||1`).
  The appeal shown for a locked species is `a.appeal × ENC_COUNTS[a.key]`, giving
  the player a preview of how much appeal that species would add at its natural
  group size.
- The count used for appeal display on the `CareScreen` header
  (`proto-screens.jsx` line 83: `cnt = ENC_COUNTS[a.key]||1`), which is
  cosmetically consistent with the locked-species preview but **does not match
  runtime pops** after buy-more purchases.

**What ENC_COUNTS IS NOT:**
- Not the runtime animal count. Runtime population is tracked in `pops[k]`,
  initialised to `1` on `confirmBuy()` and incremented by `buyMoreAnimal()`.
- Not a cap. The capacity cap is computed from `capOf(k) = 2 + (lvOf(k) − 1)`,
  not from `ENC_COUNTS`.
- Not persisted. `pops[k]` is the persisted state (pending F3 Save/Load).

**Design intent (resolved):** `ENC_COUNTS` represents the *intended steady-state
group size* for each species — the population a fully-engaged player would
naturally build toward (e.g. a pair of lions, a herd of three sheep). It is a
gameplay-feel guide and a UI preview value, not a hard rule enforced by logic.
`ENC_COUNTS[k]` should always be ≤ `capOf(k)` at Lv1 (cap = 2) or Lv5 (cap = 6)
so the displayed count is achievable. Any value above 2 requires at least one
enclosure upgrade to actually reach in runtime pops.

**Consistency audit:**

| Species | ENC_COUNTS | capOf(Lv1) | Achievable at Lv1? |
|---------|:---:|:---:|:---:|
| Rabbit | 3 | 2 | No — needs Lv2 (cap 3) |
| Chicken | 3 | 2 | No — needs Lv2 |
| Duck | 2 | 2 | Yes |
| Sheep | 3 | 2 | No — needs Lv2 |
| Horse | 1 | 2 | Yes |
| Lion | 2 | 2 | Yes |
| Dolphin | 2 | 2 | Yes |

Several species have `ENC_COUNTS` of 3, which exceeds the starting cap of 2.
These are aspirational display values — players must upgrade to Lv2 before the
runtime population can reach the displayed count. This is cosmetically intentional
(showing the fuller, livelier enclosure as the goal) but is a mild source of
confusion. See OQ-2.

---

### 3.5 Biome Unlock and the `built` Array

The `built` state in `prototype.jsx` tracks which **attractions** have been
constructed — it does not track biome availability. Biomes are not "built"; they
become available automatically when the player's Zoo Level reaches the threshold.
The `HABITATS[].unlock` string is used by the UI and content gating logic; it is
not runtime-mutated.

The `built` array affects capacity and gold income via the attraction multipliers
(`0.15 × built.length` in capacity, `0.12 × built.length` in `zooRate`). These
are distinct from enclosure upgrades but interact with them: higher enclosure
levels raise `seatsOf(k)`, and more attractions raise the capacity multiplier —
both expansions feed the same C2 visitors model.

---

## 4. Formulas

### F-1: Upgrade Cost

```
upgradeCost[k] = round(appeal[k] × UPGRADE_COST_MULT × encLv[k]) + UPGRADE_COST_FLOOR
```

**Variables:**

| Variable | Type | Range | Source |
|----------|------|-------|--------|
| `appeal[k]` | integer | 3–3000 | `ANIMALS[k].appeal` — base appeal at count=1, encLv=1, enr=0 |
| `UPGRADE_COST_MULT` | constant | 160 | `act/proto-screens.jsx` line 352; F2 currency-system.md Tuning Knob |
| `encLv[k]` | integer | 1–4 (upgrade from this level) | Current level before the upgrade executes; Lv5 is max |
| `UPGRADE_COST_FLOOR` | constant | 300 | `act/proto-screens.jsx` line 352; minimum addend |

**Source (exact code from `proto-screens.jsx` button label and `prototype.jsx` `upgradeEnc`):**
```js
// proto-screens.jsx line 352 (button display):
Math.round((a.appeal||1)*160*(encLv||1))+300

// prototype.jsx line 118 (upgradeEnc function):
const cost = Math.round((AA[k].appeal||1) * 160 * lvOf(k)) + 300;
```
Both expressions are identical, ensuring displayed cost matches deducted cost.

**Worked examples:**

| Species | Appeal | Current encLv | Raw calc | Cost |
|---------|:---:|:---:|:---:|:---:|
| Rabbit (low) | 3 | 1 | round(3×160×1)+300 | **780 🪙** |
| Rabbit (low) | 3 | 2 | round(3×160×2)+300 | **1,260 🪙** |
| Cat (low-mid) | 50 | 1 | round(50×160×1)+300 | **8,300 🪙** |
| Wolf (mid) | 330 | 1 | round(330×160×1)+300 | **53,100 🪙** |
| Wolf (mid) | 330 | 2 | round(330×160×2)+300 | **105,900 🪙** |
| Elephant (high) | 850 | 1 | round(850×160×1)+300 | **136,300 🪙** |
| Elephant (high) | 850 | 3 | round(850×160×3)+300 | **408,300 🪙** |
| Dolphin (max) | 3000 | 1 | round(3000×160×1)+300 | **480,300 🪙** |
| Dolphin (max) | 3000 | 4 | round(3000×160×4)+300 | **1,920,300 🪙** |

> ⚠️ **Balance gap (from F2 §D, currency-system.md OQ-1):** `UPGRADE_COST_MULT = 160`
> was calibrated when the maximum appeal value was approximately 1,500. With the
> current maximum (Dolphin, appeal = 3,000), the first upgrade to Dolphin's
> enclosure costs **480,300 🪙** — roughly 2× the intended ceiling. A full
> `/balance-check` pass is required before these values go to production. Suggested
> target for correction: reduce `UPGRADE_COST_MULT` to ~80 for the costs to match
> original intent at max appeal, or adopt a tiered multiplier that declines for
> higher-appeal species. See OQ-3.

**Full cost ladder to upgrade one enclosure from Lv1 → Lv5 (no partial):**

| Level upgrade | Multiplied by appeal... | Cost at appeal=3 | Cost at appeal=330 | Cost at appeal=3000 |
|:---:|:---:|:---:|:---:|:---:|
| Lv1 → Lv2 | ×160×1 + 300 | 780 🪙 | 53,100 🪙 | 480,300 🪙 |
| Lv2 → Lv3 | ×160×2 + 300 | 1,260 🪙 | 105,900 🪙 | 960,300 🪙 |
| Lv3 → Lv4 | ×160×3 + 300 | 1,740 🪙 | 158,700 🪙 | 1,440,300 🪙 |
| Lv4 → Lv5 | ×160×4 + 300 | 2,220 🪙 | 211,500 🪙 | 1,920,300 🪙 |
| **Total Lv1→5** | | **6,000 🪙** | **529,200 🪙** | **4,801,200 🪙** |

---

### F-2: Appeal Multiplier Per Enclosure Level (the C2 payoff)

```
multOf(k) = 1 + 0.25 × (encLv[k] − 1)
```

This multiplier is applied inside `appealOf(k)` in `prototype.jsx`:
```
appealOf(k) = baseAppeal[k] × cntOf(k) × multOf(k) × (1 + 0.10 × enrLvOf(k))
```

| encLv | multOf | Appeal as % of base | Additional appeal per +1 level |
|:---:|:---:|:---:|:---:|
| 1 | 1.00 | 100% | — |
| 2 | 1.25 | 125% | +25% |
| 3 | 1.50 | 150% | +25% |
| 4 | 1.75 | 175% | +25% |
| 5 | 2.00 | 200% | +25% |

A fully upgraded (Lv5) enclosure exactly doubles the animal's appeal contribution
relative to its unupgraded (Lv1) state. Combined with the count (up to ×6 at Lv5
cap), the theoretical maximum appeal from a single enclosure is:
`baseAppeal × 6 × 2.00 × (1 + 0.10×enrMax)`.

**Cross-reference C2**: This `+25%/level` bonus is the canonical payoff documented
in `design/gdd/zoo-economy.md` §4 and `design/gdd/currency-system.md` §D. Any
change to this coefficient requires updating both of those GDDs.

---

### F-3: Upgrade Return on Investment (ROI Analysis)

**Setup**: What gold-income gain does one enclosure upgrade produce, and how many
seconds does it take to recoup the cost?

The appeal increase from one upgrade step is:
```
deltaAppeal = baseAppeal × cntOf(k) × 0.25 × (1 + 0.10 × enrLv)
```

The gold-per-second gain (simplified, ignoring capacity ceiling effects):
```
deltaGoldPerSec ≈ deltaAppeal × VISITORS_PER_APPEAL × SPEND_PER_VISITOR
                = deltaAppeal × 1.0 × 0.05
                = deltaAppeal × 0.05
```

**ROI examples (single animal, no enrichment, no capacity constraint):**

| Species | Appeal | Count | encLv before | Cost | deltaAppeal | deltaGold/s | Payback (seconds) | Payback (hours) |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Rabbit | 3 | 1 | 1 | 780 🪙 | 0.75 | 0.04 | ~20,000 s | ~5.6 h |
| Cat | 50 | 1 | 1 | 8,300 🪙 | 12.5 | 0.63 | ~13,200 s | ~3.7 h |
| Wolf | 330 | 2 | 1 | 53,100 🪙 | 165 | 8.25 | ~6,400 s | ~1.8 h |
| Elephant | 850 | 1 | 1 | 136,300 🪙 | 212.5 | 10.6 | ~12,900 s | ~3.6 h |
| Dolphin | 3000 | 1 | 1 | 480,300 🪙 | 750 | 37.5 | ~12,800 s | ~3.6 h |

**Observations:**
- Payback time at current multiplier is roughly 2–6 hours of active or partial-idle
  play for most species — broadly reasonable for a daily-check-in idle game.
- The Rabbit enclosure is the worst ROI (5.6 h payback at count=1) because its
  appeal gain per gold spent is low. At count=3 the payback improves to ~1.9 h.
- The Dolphin payback at 3.6 h is consistent with mid-tier species — confirming
  the cost scale is proportional when assessed on ROI, not absolute cost.
- However, because `UPGRADE_COST_MULT` is 2× the intended value (see ⚠️ above),
  the absolute gold required is 2× intended. If the multiplier is halved to ~80,
  payback times would roughly halve (1–3 h range), which may be more appropriate
  for an endgame idle player's session cadence.

> ⚠️ **ROI verdict**: The upgrade payoff structure is internally coherent (higher
> appeal species pay back on a similar timescale), but the absolute costs at the
> endgame tier are approximately 2× the intended design ceiling due to the
> appeal-max calibration gap. The `/balance-check` pass should target `UPGRADE_COST_MULT`
> reduction to ~80, bringing Dolphin Lv1→Lv2 from 480,300 🪙 to ~240,150 🪙.

---

### F-4: Capacity Contribution Per Enclosure Level

```
seatsOf(k) = baseAppeal[k] × cntOf(k) × (0.6 + 0.5 × (encLv[k] − 1))
```

This formula is defined in `prototype.jsx` and contributes to `capacity`, the
visitor ceiling. Upgrading an enclosure both raises appeal (F-2) and raises
capacity (this formula), making upgrades doubly effective in a capacity-constrained
zoo (when the HUD visitor pill is amber).

| encLv | Coefficient | Seats per (appeal × count) |
|:---:|:---:|:---:|
| 1 | 0.6 | 0.6× |
| 2 | 1.1 | 1.1× |
| 3 | 1.6 | 1.6× |
| 4 | 2.1 | 2.1× |
| 5 | 2.6 | 2.6× |

A Lv5 enclosure provides 4.33× more viewer seats than a Lv1 enclosure, meaning
late-game capacity expansion is primarily driven by enclosure upgrades (and
attraction builds).

---

## 5. Edge Cases

### EC-1: Upgrade at Enclosure Level 5 (Max Level — Implementation Gap)

**Trigger**: Player taps "Upgrade" when `encLv[k] = 5`.
**Current behaviour (code)**: `upgradeEnc(k)` does **not** guard against
`lvOf(k) >= 5`. It computes cost as `round(appeal × 160 × 5) + 300`, deducts
Gold, and sets `encLv[k] = 6`. The enclosure level is silently incremented past 5
into level 6, with no cap enforcement.
**Impact**: Level 6 produces `multOf = 1 + 0.25×5 = 2.25` (25% more than intended
max), `capOf = 7` (one more slot than intended), and seats coefficient `2.6+0.5=3.1`.
This is a mild exploit — the player can over-upgrade and gain unintended extra
appeal and capacity for each additional upgrade step.
**Required fix**: `upgradeEnc(k)` must guard with `if (lvOf(k) >= 5) { flash('Enclosure is at max level'); return; }`. The Upgrade button in `EnclosureScreen` should be hidden or disabled when `encLv === 5`. See OQ-1.

---

### EC-2: Insufficient Gold — Upgrade Blocked

**Trigger**: Player taps "Upgrade" when `gold < upgradeCost`.
**Behaviour**: `upgradeEnc(k)` checks `gold < cost` before calling `pay()`. If
insufficient, fires flash "Need X 🪙" and returns without modifying `encLv` or
`gold`. State is unchanged. This matches the F2 EC-1 (insufficient funds) contract.

---

### EC-3: Upgrading a Full Enclosure

**Trigger**: Player upgrades an enclosure whose `cntOf(k) === capOf(k)` — i.e.,
all slots are occupied. The enclosure is at capacity.
**Behaviour**: `upgradeEnc(k)` does not check for full capacity before upgrading.
The upgrade always succeeds (if Gold is sufficient). The new capacity is immediately
`capOf(k) = capOf(k) + 1`, making one slot available. This is the designed
behaviour: upgrading a full enclosure is the intended route to enabling the next
`buyMoreAnimal()` call. The "Enclosure full — upgrade for +1 slot & more appeal"
hint in `EnclosureScreen` explicitly communicates this.

---

### EC-4: Biome Unlocked Before Its First Species Is Adopted

**Trigger**: Player reaches Zoo Level 20 (Woodland unlocks) but has not yet adopted
a Fox, Monkey, Raccoon, or Wolf (all require Gold in addition to level).
**Behaviour**: The biome is unlocked at the visual level (enclosure slots appear as
empty), but no animal cards exist in that enclosure. No appeal or income is generated
by the empty biome. The player must separately afford the adoption cost for a
Woodland species to populate it.
**No error state**: An empty biome with no owned animals is a valid and expected
transient state.

---

### EC-5: Downgrading Not Possible

**Trigger**: Player looks for a way to reduce enclosure level.
**Behaviour**: No downgrade mechanic exists. `encLv[k]` is monotonically
non-decreasing. Gold spent on upgrades cannot be recovered. This is intentional —
upgrades are permanent investments, creating loss-aversion that makes each upgrade
feel meaningful.

---

### EC-6: Upgrade Cost Display vs. Deduction Match

**Trigger**: Any race condition between the cost computed in `EnclosureScreen`
for the button label and the cost computed inside `upgradeEnc()`.
**Behaviour**: Both expressions are textually identical:
`Math.round((a.appeal||1) * 160 * (encLv||1)) + 300`. Since `encLv` is React
state read at render time, both the button label and the deduction function read
the same `lvOf(k)` snapshot in the same render cycle. A simultaneous income tick
cannot change `encLv`, only `gold` — and `upgradeEnc` re-reads `lvOf(k)` from
state at call time. The displayed cost and the deducted cost are always equal.

---

### EC-7: HAB_UPGRADE Table vs. Code

`data.jsx` defines `HAB_UPGRADE` with a slots-and-income table (Lv1: 2 slots ×1.0
income; Lv2: 3 slots ×1.3 income; … Lv5: 6 slots ×3.0 income). The slot counts
align with `capOf()` exactly. However, the **income multipliers** in `HAB_UPGRADE`
(×1.0, ×1.3, ×1.7, ×2.2, ×3.0) are **not used in any code formula** — the actual
appeal multiplier used at runtime is `multOf(k) = 1 + 0.25×(encLv−1)` (which
gives ×1.0, ×1.25, ×1.50, ×1.75, ×2.00). The `HAB_UPGRADE` income column is
display metadata / design intent only, not a computation input.

**Inconsistency flagged**: At Lv5 `HAB_UPGRADE` shows ×3.0 income but `multOf`
produces ×2.00. These values diverge. See OQ-4.

---

## 6. Dependencies

### Upstream (this GDD depends on these)

| System | GDD | Dependency |
|--------|-----|-----------|
| **F1 Animal Database** | `design/gdd/animal-database.md` | Provides `ANIMALS[k].appeal` (input to cost formula and appeal multiplier), `ANIMALS[k].habitat` (species-to-biome assignment) |
| **F2 Currency System** | `design/gdd/currency-system.md` | Defines Gold as the sink currency; `pay()` interface; `UPGRADE_COST_MULT` and `UPGRADE_COST_FLOOR` tuning knobs; the ⚠️ balance gap applies here |
| **C3 Zoo Level Progression** | `design/gdd/zoo-level.md` | Provides the live `level` integer that gates biome unlocks; biome unlock levels (6, 20, 32, 60, 70, 84) must be reachable on the XP curve |
| **Fe1 Animal Collection** | `design/gdd/animal-collection.md` | Provides `pops[k]` (animal count feeding `cntOf(k)`) and `encLv[k]` starting at 1 on `confirmBuy()`; `capOf(k)` is shared between both systems |

### Downstream (these GDDs depend on this one)

| System | GDD | What they consume |
|--------|-----|------------------|
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` | Reads `encLv[k]` via `multOf(k)` and `seatsOf(k)` — enclosure level directly affects appeal, capacity, and gold income |
| **Fe1 Animal Collection** | `design/gdd/animal-collection.md` | `capOf(k)` (capacity cap) is derived from `encLv[k]`; the "upgrade first" buy-more block references Fe2 state |
| **Fe3 Enrichment** | `design/gdd/enrichment.md` | Enrichment applies on top of `multOf(k)` in `appealOf(k)`; both systems modify the same species' appeal without conflict |
| **P1 HUD** | `design/gdd/hud.md` | Displays enclosure level badge and biome unlock notifications |
| **F3 Save/Load** | `design/gdd/save-load.md` | Must persist `encLv` (per-species object) as part of the save blob; upgrades are permanent |

### Integration contracts

**This system provides to others:**
- `encLv[k]: number` — current enclosure level per species (1–5)
- `capOf(k): number` — derived capacity cap (2–6), consumed by Fe1
- `multOf(k): number` — appeal multiplier (1.00–2.00), consumed by C2 via `appealOf`
- `seatsOf(k): number` — viewer capacity contribution, consumed by C2 `capacity`

**This system requires from others:**
- `appeal[k]: number` — from F1 Animal Database (static; read-only)
- `cntOf(k): number` — from Fe1 Animal Collection runtime `pops[k]`
- `gold: number` — from F2 Currency System (read for gate, mutated via `pay()`)
- `level: number` — from C3 Zoo Level (read-only; gates biome availability)

---

## 7. Tuning Knobs

All values below are in `act/proto-screens.jsx` or `act/prototype.jsx`. They
should be extracted to `act/data.jsx` (or a remote-config JSON) before production.

| Knob | Current value | Safe range | Gameplay effect |
|------|:---:|:---:|:---|
| `UPGRADE_COST_MULT` | 160 | 80–300 | Scales all upgrade costs linearly. ⚠️ 160 is 2× the intended ceiling at max appeal 3000 — recommend 80 for endgame affordability. Higher = slower habitat progression; lower = faster gold sink throughput |
| `UPGRADE_COST_FLOOR` | 300 🪙 | 100–1000 | Minimum addend on every upgrade cost; ensures very-low-appeal enclosures still cost something meaningful |
| `ENC_APPEAL_BONUS_PER_LEVEL` | 0.25 | 0.10–0.50 | Per-level appeal multiplier increment (+25% at default). Raising this makes upgrades more impactful vs. adopting more species; lowering it flattens the payoff curve |
| `MAX_ENCLOSURE_LEVEL` | 5 | 3–8 | Maximum upgrade depth. Adding levels 6–8 requires new HAB_UPGRADE rows, new cost entries, and balance of the full cost ladder. Not currently enforced in code — see EC-1 and OQ-1 |
| `SEATS_BASE_COEFF` | 0.6 | 0.3–1.0 | Viewer-seat coefficient at Lv1. Higher = more capacity at base level (reduces the frequency the amber capacity warning triggers) |
| `SEATS_PER_LEVEL_COEFF` | 0.5 | 0.2–1.0 | Additional seat coefficient per level above 1. Controls how much upgrading helps capacity expansion vs. attraction building |
| `ENC_CAPACITY_BASE` | 2 (at Lv1) | 1–3 | Slot count at Lv1. Raising to 3 would align `capOf(Lv1)` with the `ENC_COUNTS` values of 3, removing EC-5 cosmetic inconsistency, but changes early-game buy-more pacing |
| `BIOME_UNLOCK_LEVELS` | 1, 6, 20, 32, 60, 70, 84 | (must align with C3 XP curve) | Zoo Level thresholds for each biome unlock. Tuning these shifts the pacing of major content reveals; must keep each threshold reachable inside the XP curve |

### ⚠️ Pending balance pass

`UPGRADE_COST_MULT = 160` produces endgame costs approximately 2× too high versus
design intent. This is the same calibration gap documented in `currency-system.md`
§Tuning Knobs (OQ-1). A `/balance-check` pass targeting the full upgrade cost
curve across all 29 species × 4 upgrade steps is required before production.
See also OQ-3.

---

## 8. Acceptance Criteria

### AC-1: Enclosure upgrade deducts correct Gold

**GIVEN** a player with Gold ≥ `upgradeCost[k]` for a species at `encLv = N`
**WHEN** they tap "Upgrade" on the Enclosure screen
**THEN** Gold decreases by exactly `round(appeal[k] × 160 × N) + 300` and `encLv[k]` increases to `N+1`.

---

### AC-2: Upgrade is blocked when Gold is insufficient

**GIVEN** a player with Gold < `upgradeCost[k]`
**WHEN** they tap "Upgrade"
**THEN** Gold balance is unchanged, `encLv[k]` is unchanged, and the flash "Need X 🪙" appears.

---

### AC-3: Appeal multiplier increases after upgrade

**GIVEN** a species at `encLv = 1` contributing `A` appeal to total zoo appeal
**WHEN** the enclosure is upgraded to `encLv = 2`
**THEN** that species' appeal contribution becomes exactly `A × (1.25 / 1.00)` = `1.25A` on the next income tick.

---

### AC-4: Animal capacity increases after upgrade

**GIVEN** an enclosure at `encLv = N` with `capOf = 2 + (N−1)`
**WHEN** the enclosure is upgraded to `encLv = N+1`
**THEN** `capOf` equals `2 + N`, buy-more is no longer blocked by a "full" check if `cntOf(k) = capOf(N)`.

---

### AC-5: Upgrade button shows cost matching actual deduction

**GIVEN** a player viewing `EnclosureScreen` for species `k` at `encLv = N`
**WHEN** the Upgrade button is rendered
**THEN** the displayed cost equals `round(appeal[k] × 160 × N) + 300` and the deduction on tap is identical.

---

### AC-6: Biome becomes available at the correct Zoo Level

**GIVEN** a player at Zoo Level N-1 (one level below a biome gate)
**WHEN** the player gains enough XP to reach Zoo Level N (e.g. Lv 32 for Savanna)
**THEN** the Savanna biome habitat becomes available (enclosure slots appear) and any Savanna species at or below Lv N become unlockable in the Animals screen.

---

### AC-7: Species-to-biome assignment is correct

**GIVEN** any owned species `k`
**WHEN** the Enclosure screen is opened
**THEN** the displayed habitat name and tint match `HABITATS.find(h => h.key === ANIMALS[k].habitat)`.

---

### AC-8: Gold income increases after upgrade (economy payoff)

**GIVEN** a running zoo with total appeal A and gold/sec rate R
**WHEN** an enclosure upgrade completes (not capacity-capped)
**THEN** on the next gold income tick, `gold` increases by strictly more than R, confirming that `multOf(k)` is applied in `appealOf(k)`.

---

### AC-9: Enclosure at max level (Level 5) blocks further upgrade

**GIVEN** a species whose `encLv[k] = 5`
**WHEN** the player taps "Upgrade"
**THEN** `encLv[k]` remains at 5, Gold is unchanged, and a message ("Max level reached") appears.
*(Note: This criterion is currently FAILING — EC-1 documents the missing guard. It is listed here as the required behaviour post-fix.)*

---

### AC-10: ENC_COUNTS display is cosmetically consistent for locked species

**GIVEN** a player viewing a locked species on the Animals screen
**WHEN** the appeal preview is displayed
**THEN** the displayed appeal equals `ANIMALS[k].appeal × ENC_COUNTS[k]` (the species' appeal at its natural group size), making clear what appeal the zoo would gain upon adoption to that group size.

---

## Open Questions

**OQ-1 — Missing max-level guard in `upgradeEnc()`** *(Critical / Implementation Bug)*
`upgradeEnc(k)` does not enforce the cap at `encLv = 5`. Players can upgrade past
level 5 to level 6 (and beyond), gaining unintended extra appeal, capacity, and
slots. Fix: add `if (lvOf(k) >= 5) { flash('Max level — enclosure cannot be upgraded further'); return; }` at the top of `upgradeEnc`. The Upgrade button in `EnclosureScreen` should also be hidden or disabled at `encLv >= 5`.
*Owner: gameplay-programmer. Blocking: AC-9, balance integrity.*

**OQ-2 — ENC_COUNTS > capOf(Lv1) cosmetic inconsistency** *(Low priority)*
Several species have `ENC_COUNTS` values of 3 (Rabbit, Chicken, Sheep) which
exceed the Lv1 capacity cap of 2. The locked-species appeal preview shows a group
of 3 that cannot exist until the player has upgraded to Lv2. The discrepancy is
minor (one upgrade away) but could confuse a new player who adopts Rabbit, sees
the preview said 3-appeal but their runtime count starts at 1. Options: (a) raise
`capOf` base to 3 at Lv1 (`ENC_CAPACITY_BASE = 3`), (b) lower ENC_COUNTS for
these three species to 2, or (c) add UI copy clarifying "full group requires
one upgrade."
*Owner: UX Designer / Economy Designer. Affects: early-game buy-more pacing if (a) chosen.*

**OQ-3 — UPGRADE_COST_MULT balance pass** *(High priority)*
`UPGRADE_COST_MULT = 160` was calibrated at old max appeal ~1500. Current max is
3000, making endgame upgrade costs ~2× too high. This gap is registered in
`currency-system.md` OQ-1 and echoed in `animal-database.md` OQ-1. The Fe2 GDD
provides the full cost ladder (§4 tables) needed as input to the balance check.
Candidate correction: reduce `UPGRADE_COST_MULT` to `~80`, bringing the Dolphin
Lv1→2 upgrade from 480,300 🪙 to ~240,150 🪙 and the total Lv1→5 ladder from
4,801,200 🪙 to ~2,400,600 🪙.
*Owner: Economy Designer. Blocked by: confirming target gold-per-hour at endgame (C2 balance pass).*

**OQ-4 — HAB_UPGRADE income multipliers do not match multOf()** *(Medium priority)*
The `HAB_UPGRADE` data table in `data.jsx` (Lv1: ×1.0, Lv2: ×1.3, Lv3: ×1.7,
Lv4: ×2.2, Lv5: ×3.0) defines income multipliers that diverge from the runtime
formula `multOf = 1 + 0.25×(encLv−1)` (Lv1: ×1.00, Lv2: ×1.25, Lv3: ×1.50,
Lv4: ×1.75, Lv5: ×2.00). `HAB_UPGRADE` appears to be a display-only data table
never consumed by any formula. One of these must become the canonical source.
Options: (a) remove the income column from `HAB_UPGRADE` (pure slots table), or
(b) update `multOf` to match the `HAB_UPGRADE` scale (would increase late-game
appeal and gold income significantly — a balance decision). The discrepancy at
Lv5 is ×3.0 vs ×2.00 — a 50% difference.
*Owner: Economy Designer / Systems Designer. Affects: C2 appeal formula if (b) chosen.*

**OQ-5 — `UPGRADE_COST_FLOOR` is undeclared as a named constant** *(Low priority)*
The addend `300` in `upgradeCost` is a magic number hard-coded in two places
(`proto-screens.jsx` line 352, `prototype.jsx` line 118). It should be extracted
to a named constant `UPGRADE_COST_FLOOR = 300` in `data.jsx` for maintainability
and remote-config eligibility.
*Owner: gameplay-programmer.*
