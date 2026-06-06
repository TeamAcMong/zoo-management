# Attractions System

> **Status**: In Design (Reverse-Documented)
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — attractions are the milestones that reward
>   zoo growth, turning a collection of animals into a place people want to visit
> **Source files**: `act/data.jsx` (ATTRACTIONS, ENT_CATS, ENTERTAINMENT, SINKS),
>   `act/proto-screens.jsx` (AttractionsScreen, ActivitiesScreen, participants()),
>   `act/prototype.jsx` (built state, buildAttraction(), zooRate formula line ~101,
>   capacity formula line ~97)
> **Reverse-documentation note**: All mechanical behavior in this document was extracted
>   from the running implementation as of 2026-06-06. Per-attraction effect labels
>   (`+12% visitors`, `+15% revenue`, etc.) come from the ATTRACTIONS data array and
>   are displayed in the UI — they are NOT wired as discrete mechanical effects; the
>   actual implemented effect of every built attraction is the unified `|built|`
>   counter that drives both capacity (+15%/attraction) and gold spend (+12%/attraction)
>   in the C2 economy formulas. This gap is documented in Section 3 and the Open
>   Questions. Gaps are marked ⚠️.

---

## 1. Overview

The Attractions System governs five milestone buildings the player constructs to grow
their zoo's capacity and gold income. Each attraction — Petting Area, Feeding Zone,
Educational Shows, Animal Rides, and Performance Arena — is a permanent, one-time
Gold purchase gated by Zoo Level. Once built, an attraction increments the global
`|built|` counter, which is the single live input to two C2 economy formulas: the
capacity multiplier (`+15% per attraction`) and the gold-per-second multiplier
(`+12% per attraction`). In addition, each built attraction unlocks a category of
visitor activities in the Activities screen (photo sessions, feeding experiences,
rides, educational demos, and premium encounters), giving the player new cooldown-based
gold and reputation taps to run during active sessions.

Attractions are the primary bridge between the Care loop and the Economy chain: the
player earns gold by caring for animals, saves that gold, builds attractions, and
earns more gold as a result. Building all five attractions multiplies gold-per-second
by `(1 + 0.12 × 5) = 1.60×` — a 60% revenue lift over a zoo with no attractions.

---

## 2. Player Fantasy

"I've been saving for the Feeding Zone for three days. When I finally tap Build and
watch the card flip to 'Built', my zoo feels like a real destination."

Attractions are deliberate, expensive milestones — not passive trickle upgrades.
Each one represents a savings arc (several days of income collection at the relevant
stage of the game) followed by a moment-of-completion payoff. The Petting Area
opening at Lv7 is the player's first glimpse of what a real zoo attraction feels
like; the Performance Arena at Lv45 is the marquee achievement of months of play.

The participant panel below each built attraction — showing which of the player's
owned animals are featured — makes the abstract multiplier tangible: "My Dog and my
Monkey are performing here." This satisfies the **Collection** aesthetic (MDA) by
linking the animal roster directly to the attraction system. It also serves
**Discovery**: building the Performance Arena reveals a visual performer lineup that
the player didn't know would appear.

**Self-Determination Theory mapping:**
- **Autonomy**: The player chooses the order of attraction builds. There is no forced
  sequence beyond the level gate; a player who focuses on habitat upgrades could
  delay attractions or vice versa.
- **Competence**: The +12%/attraction formula provides clear, readable confirmation
  that each build has made the zoo measurably more profitable.
- **Relatedness**: The participant list shows named animals in each attraction,
  reinforcing the personal bond the player has built with those animals.

---

## 3. Detailed Rules

### 3.1 The ATTRACTIONS Array (source of truth: `act/data.jsx`)

There are exactly **five** attractions, stored in the `ATTRACTIONS` array in level
unlock order:

| # | Key | Name | Icon | Unlock Level | Build Cost (🪙) | Effect Label | Description |
|---|-----|------|------|-------------|----------------|--------------|-------------|
| 1 | `petting` | Petting Area | 🤲 | Lv 7 | 500 | +12% visitors | Visitors interact with Very Easy / Easy animals. Needs Trust ≥ 40. |
| 2 | `feeding` | Feeding Zone | 🥕 | Lv 18 | 2,500 | +15% revenue | Visitors buy food to feed selected animals — a steady gold tap. |
| 3 | `shows` | Educational Shows | 🎤 | Lv 26 | 16,000 | +18% reputation | Animals demonstrate natural behaviours on a timed schedule. |
| 4 | `rides` | Animal Rides | 🐎 | Lv 30 | 9,000 | +20% revenue | Horse · camel · ostrich · elephant rides. Premium ticket. |
| 5 | `perform` | Performance Arena | 🎪 | Lv 45 | 45,000 | +25% revenue | Trained, high-trust animals perform routines. The marquee attraction. |

**Level ordering is confirmed correct** in the array (7, 18, 26, 30, 45).

⚠️ **Cost anomaly**: Animal Rides (Lv30) costs **9,000 🪙** — less than Educational
Shows (Lv26) at **16,000 🪙**, despite unlocking four levels later. This is
inconsistent with the expected pattern of increasing cost with level. The relative
costs are not currently enforced by any formula, but this reversal could mislead
players about relative build priority. See Open Questions OQ-4.

⚠️ **SINKS table discrepancy**: The `SINKS` array in `data.jsx` lists attraction
build cost as "40k–900k 🪙." The actual ATTRACTIONS costs are 500–45,000 🪙 — the
SINKS copy is off by approximately 20×. This is a documentation error in `data.jsx`
itself; the ATTRACTIONS array values are the authoritative costs. See OQ-4.

### 3.2 Build Flow

1. The player opens the **Attractions** tab. The `AttractionsScreen` component renders
   all five attractions from the `ATTRACTIONS` array in order.
2. Unbuilt attractions show a **Build** button. The button is dimmed (opacity 0.6)
   if `gold < at.cost`; fully opaque when affordable.
3. The first affordable, unbuilt attraction has a `tut-hi` highlight class applied as
   a soft UI guide (`guideKey` in `AttractionsScreen`).
4. Tapping **Build** calls `buildAttraction(key)` in `prototype.jsx`, which:
   a. Validates `gold >= at.cost`. If not: flashes "Need X 🪙 to build" and returns.
   b. Calls `pay(at.cost)` — deducts Gold via `setGold(g => g − at.cost)`.
   c. Appends the attraction key to the `built` array via `setBuilt(b => [...b, key])`.
   d. Finds the matching `ENT_CATS` entry (by `cat.attr === key`) and flashes
      "🎡 [Name] built · [Activity category] activities open!" or "🎡 [Name] built!"
      if no ENT_CATS entry matches.
5. The `built` array is React state on the `Phone` component. It persists for the
   session only — F3 Save/Load is not yet implemented. ⚠️

**There is no sell or demolish mechanic.** Once built, an attraction cannot be
removed. The `built` array only ever grows.

**There is no Zoo Level gate enforced in `buildAttraction()`.** The unlock level
displayed in the UI (e.g. "Lv 7") is shown in the ATTRACTIONS data (`at.unlock`)
and rendered in the `views-world.jsx` table, but `buildAttraction()` does not check
`level >= unlockLevel` before processing the transaction. The player can build any
attraction as long as they have the gold, regardless of Zoo Level. ⚠️ See OQ-1.

### 3.3 The |built| Counter and Its Effect on the Economy

Every built attraction increments `built.length` — the `|built|` counter — by 1.
This counter enters both economy formulas in `prototype.jsx`:

```javascript
// line ~97 — capacity formula
const capacity = Math.round(
  (5 + owned.reduce((s,k) => s + seatsOf(k), 0)) * (1 + 0.15 * built.length)
);

// line ~101 — gold per second formula
const zooRate = Math.max(1, Math.round(
  visitors * SPEND_PER_VISITOR * (1 + 0.12 * built.length)
));
```

These are the **only** economic effects of built attractions that are mechanically
enforced in code. The per-attraction effect labels in `ATTRACTIONS` (`+12% visitors`,
`+15% revenue`, `+18% reputation`, `+20% revenue`, `+25% revenue`) are **display
strings** — they are not wired as individual bonuses. All five attractions
contribute identically to the same two multipliers: capacity and gold/sec.

⚠️ This means Educational Shows (`+18% reputation`) and Performance Arena
(`+25% revenue`) are mechanically indistinguishable from Petting Area (`+12% visitors`)
in their economic effect. The unique effect labels are design intent for a future
differentiated system, not current behavior. The Reputation currency (`rep`) is
tracked in `data.jsx` and awarded by entertainment activity runs, but it is NOT wired
into the `zooRate` or `capacity` formulas. See OQ-2 and OQ-3.

### 3.4 Participant Lists — Which Animals Appear in Each Attraction

After an attraction is built, the `AttractionsScreen` renders a participant panel
showing which owned animals are featured. The participant lists are computed by the
`participants(key)` function in `AttractionsScreen` (`proto-screens.jsx`):

| Attraction Key | Filter Logic | Eligible Species |
|---------------|--------------|-----------------|
| `petting` | `['Very Easy', 'Easy'].includes(a.taming)` | Rabbit, Chicken, Duck, Dog, Cat, Goat, Sheep, Horse, Donkey, Cow, Turtle |
| `feeding` | All owned animals (`has`) | All 29 species |
| `rides` | `['Horse', 'Donkey', 'Camel', 'Ostrich', 'Elephant', 'Pony'].includes(a.species)` | Horse, Donkey, Elephant (from current ANIMALS roster; Camel, Ostrich, Pony not in roster) |
| `shows` | `a.perform === true` | Dog, Monkey, Elephant, Seal, Sea Lion, Dolphin |
| `perform` | `a.perform === true` | Dog, Monkey, Elephant, Seal, Sea Lion, Dolphin |

**Notes on the participant filters:**

- **Petting Area**: The filter checks the species-level `taming` string, not the
  individual animal's live `trust` value. The ATTRACTIONS description says "Needs
  Trust ≥ 40" but this threshold is **not enforced in code** — it appears only in
  the data description field. See OQ-5 (trust gate enforcement gap, cross-referenced
  from C4 OQ-3).

- **Feeding**: All animals are eligible. This is the most inclusive attraction and
  the easiest to populate immediately after building.

- **Rides**: The filter checks for species names in a hardcoded array that includes
  `'Camel'`, `'Ostrich'`, and `'Pony'` — none of which exist in the ANIMALS roster.
  Only Horse, Donkey, and Elephant will ever match from the current roster. ⚠️ See OQ-6.

- **Shows and Performance Arena**: Both use the identical `a.perform` filter, so the
  `shows` and `perform` attraction participant lists are always the same. The
  `perform` flag is a species-level boolean in the ANIMALS array. It does NOT check
  the individual animal's live `trust` value. The ATTRACTIONS description says
  "Trained, high-trust animals" but the trust gate is **not enforced in code** —
  only the `perform` flag is checked. See OQ-5.

### 3.5 Activity Unlock via Attractions

Each built attraction opens a category of visitor activities in the Activities screen.
The `ActivitiesScreen` component checks `built.includes(cat.attr)` for each activity
category:

| Attraction Built | Activity Category Unlocked | Cooldown | Example Activities |
|-----------------|---------------------------|----------|--------------------|
| `petting` | Photo Experience | 15 min | Rabbit Photo Session, Pony Photo Session, Monkey Photo Session |
| `feeding` | Feeding Experience | 30 min | Rabbit Feeding, Goat Feeding, Giraffe Feeding, Elephant Feeding |
| `rides` | Riding Experience | 1 hr | Horse Riding, Donkey Riding, Elephant Riding |
| `shows` | Educational | 2 hr | Monkey Intelligence Demo, Elephant Memory Session, Dolphin Learning Session |
| `perform` | Premium Experience | 4 hr | Dolphin Encounter, Sea Lion Interaction, VIP Safari Tour |

Activities are detailed in the Fe5 Performance System GDD. For this document, it is
sufficient to note that each attraction build is a **prerequisite** for its activity
category — activities show "Locked" until the backing attraction is built.

Activities also have a secondary lock on species ownership — a specific species must
be owned to run an activity that requires it. The activity system reads `owned` and
checks `ownedSpecies.has(a.req)`. Both gates (attraction built + species owned) must
be satisfied to run an activity.

---

## 4. Formulas

### Formula F1 — Revenue Multiplier per Attraction Built

The primary economic effect of every built attraction is captured in the `goldPerSec`
formula (C2 Zoo Economy, `prototype.jsx` line ~101):

```
goldPerSec = max(1, round( visitors × SPEND_PER_VISITOR × (1 + ATTRACTION_REVENUE_MULT × |built|) ))
```

**Variable definitions:**

| Variable | Value | Source | Description |
|----------|-------|--------|-------------|
| `visitors` | integer ≥ 0 | C2 formula | Actual visitor count (min of demand and capacity) |
| `SPEND_PER_VISITOR` | 0.05 | `prototype.jsx` tuning knob | Gold per second each visitor spends at the gate |
| `ATTRACTION_REVENUE_MULT` | 0.12 | `prototype.jsx` inline constant | Revenue multiplier contribution per built attraction |
| `|built|` | integer, 0–5 | `built.length` React state | Number of attractions built (0 = none, 5 = all) |
| `goldPerSec` | integer ≥ 1 | output | Gold earned per active second; floored at 1 |

**Worked example — 100 visitors, 3 attractions built:**
```
goldPerSec = max(1, round(100 × 0.05 × (1 + 0.12 × 3)))
           = max(1, round(5.0 × 1.36))
           = max(1, round(6.8))
           = 7 gold/sec
```

**Compared to 0 attractions built:**
```
goldPerSec = max(1, round(100 × 0.05 × (1 + 0.12 × 0)))
           = max(1, round(5.0 × 1.0))
           = 5 gold/sec
```
Difference: +2 gold/sec, or +40% revenue, from 3 attractions.

**Revenue multiplier at each |built| step:**

| |built| | Multiplier | % gain over 0 attractions |
|---------|-----------|--------------------------|
| 0 | 1.00× | baseline |
| 1 | 1.12× | +12% |
| 2 | 1.24× | +24% |
| 3 | 1.36× | +36% |
| 4 | 1.48× | +48% |
| 5 | 1.60× | +60% |

### Formula F2 — Capacity Multiplier per Attraction Built

Built attractions also widen the zoo's guest capacity (C2, `prototype.jsx` line ~97):

```
capacity = round( (BASE_GATE + Σ seatsOf(k)) × (1 + ATTRACTION_CAPACITY_MULT × |built|) )
```

| Variable | Value | Source | Description |
|----------|-------|--------|-------------|
| `BASE_GATE` | 5 | `prototype.jsx` inline constant | Minimum gate capacity with no animals |
| `Σ seatsOf(k)` | computed | C2 | Sum of per-enclosure seat counts |
| `ATTRACTION_CAPACITY_MULT` | 0.15 | `prototype.jsx` inline constant | Capacity multiplier contribution per built attraction |
| `|built|` | integer, 0–5 | `built.length` | Number of attractions built |

**Capacity multiplier at each |built| step:**

| |built| | Multiplier | Capacity effect |
|---------|-----------|----------------|
| 0 | 1.00× | baseline |
| 1 | 1.15× | +15% more guests fit |
| 2 | 1.30× | +30% |
| 3 | 1.45× | +45% |
| 4 | 1.60× | +60% |
| 5 | 1.75× | +75% |

**Combined effect at all 5 attractions built:** Revenue is 1.60× base; capacity is
1.75× base. A zoo with all attractions built at the same appeal level as one with no
attractions will earn 60% more gold per second and can serve 75% more visitors.

### Formula F3 — Build Cost per Attraction

Build costs are static values in the `ATTRACTIONS` data array. There is no formula
— each attraction has a hand-authored cost.

| Attraction | Unlock Level | Build Cost (🪙) | Approx. earnings-days to afford (at stage) |
|-----------|-------------|----------------|-------------------------------------------|
| Petting Area | Lv 7 | 500 | ~1–2 days at Lv7 income (~200–400/hr) |
| Feeding Zone | Lv 18 | 2,500 | ~2–3 days at Lv18 income |
| Educational Shows | Lv 26 | 16,000 | ~3–5 days at Lv26 income |
| Animal Rides | Lv 30 | 9,000 | ~1–2 days at Lv30 income (⚠️ cheaper than Shows) |
| Performance Arena | Lv 45 | 45,000 | ~5–7 days at Lv45 income |

Income-at-stage estimates are approximate and require a full balance simulation to
validate. See Open Questions OQ-4.

### Formula F4 — Payoff Per Attraction (Revenue Gain)

To evaluate whether an attraction purchase is worthwhile, compute the revenue gain:

```
deltaGoldPerSec = visitors × SPEND_PER_VISITOR × ATTRACTION_REVENUE_MULT
                = visitors × 0.05 × 0.12
                = visitors × 0.006
```

**Worked example — Petting Area at Lv7 (estimated 200 visitors):**
```
deltaGoldPerSec = 200 × 0.006 = 1.2 → +1 gold/sec
goldPerSec before = 200 × 0.05 × 1.00 = 10
goldPerSec after  = 200 × 0.05 × 1.12 = 11.2 → 11
Payback period = 500 / 1.2 ≈ 416 seconds ≈ 7 minutes of active play
```

**Worked example — Performance Arena at Lv45 (estimated 5,000 visitors):**
```
deltaGoldPerSec = 5000 × 0.006 = 30 gold/sec
goldPerSec before (|built|=4) = 5000 × 0.05 × 1.48 = 370
goldPerSec after  (|built|=5) = 5000 × 0.05 × 1.60 = 400
Payback period = 45,000 / 30 = 1,500 seconds ≈ 25 minutes of active play
```

All five attractions have fast payback periods once the player reaches the relevant
unlock level — this is intentional; the barriers to building are the Gold cost as a
savings arc and the Zoo Level gate, not a slow ROI.

---

## 5. Edge Cases

### EC-1: All Five Attractions Built — |built| = 5 (Maximum)

**Trigger:** Player builds all five attractions.
**Behaviour:** `built.length === 5`. Revenue multiplier is `(1 + 0.12 × 5) = 1.60×`;
capacity multiplier is `(1 + 0.15 × 5) = 1.75×`. The `ATTRACTIONS.find(...)` scan
for the `guideKey` highlight returns `undefined` — no unbuilt, affordable attraction
exists — so no Build button is highlighted. The Attractions tab shows all five cards
with a "✓ Built" chip. The player has no further attraction actions available.

**Is there a cap?** There is no explicit cap constant — the formula `(1 + 0.12 × N)`
scales linearly. However, the `ATTRACTIONS` array has exactly 5 entries, and each
key can only be built once (checked implicitly: `built.includes(at.key)` prevents
re-building). The effective cap is 5. ⚠️ If attractions are ever added to the
data array without also adding a guard against double-building, the multiplier would
exceed the 1.60× ceiling.

**Design note:** No prestige, re-build, or upgrade mechanic exists for attractions.
Once all five are built, this design lever is exhausted. The ongoing revenue growth
comes from animals, enclosure upgrades, and enrichment — not attractions.

### EC-2: Insufficient Gold — Build Blocked

**Trigger:** Player taps Build when `gold < at.cost`.
**Behaviour:** `buildAttraction(key)` checks `gold < (at.cost || 0)` and fires
`flash('Need ${at.cost.toLocaleString()} 🪙 to build')`. No gold is deducted. The
button remains dimmed (opacity 0.6) — the state check is re-evaluated on each render.

### EC-3: Zoo Level Gate Not Enforced — Out-of-Order Build

**Trigger:** Player has sufficient gold to build the Performance Arena (45,000 🪙)
before reaching Lv45.
**Behaviour (as implemented):** `buildAttraction()` does **not** check
`level >= unlockLevel`. If the player somehow accumulates 45,000 🪙 at, say, Lv10
(e.g., through the admin Gold button), they CAN build the Performance Arena. The
`|built|` counter increments and the revenue multiplier applies regardless of level.
The participant panel for Performance Arena would show any `perform: true` animals
the player has adopted, and the Premium Experience activities unlock in the Activities
tab.
**Design implication:** The level gate is a UI display only in the current
implementation, not a hard enforcement gate. This is a gap for production. See OQ-1.

### EC-4: Petting Area Built but No Eligible Animals

**Trigger:** Player builds the Petting Area at Lv7 but has not yet adopted any
`taming: 'Very Easy'` or `taming: 'Easy'` species beyond the starter Rabbit.
**Behaviour:** The Petting Area card shows the participant section with an empty list
and the message "No eligible animals yet — unlock one to feature it here." The
revenue/capacity multiplier still applies (the `|built|` counter increases regardless
of participants). The Photo Experience activity category unlocks in Activities but
individual activities are blocked by species ownership (`!unlocked` → "Unlock [req]"
chip shown).

### EC-5: Performance Arena Built but No Performer Species Owned

**Trigger:** Player builds the Performance Arena but does not own Dog, Monkey,
Elephant, Seal, Sea Lion, or Dolphin.
**Behaviour:** Identical to EC-4. The arena is built, the multiplier applies, the
Premium Experience activities appear in the Activities screen but are blocked by
species ownership. The participant panel shows no animals.

### EC-6: Shows and Performance Arena — Identical Participant Lists

**Trigger:** Player has built both `shows` and `perform`.
**Behaviour:** Both use `participants('shows')` and `participants('perform')`, both
of which return `has.filter(a => a.perform)`. The participant panels for Educational
Shows and Performance Arena will show the exact same list of owned animals. This is
correct by the current filter logic — both require `perform: true` species. The
distinction between them is in their linked activity categories (Educational vs.
Premium), not in their participant filters.

### EC-7: Rides Attraction — Camel, Ostrich, Pony Filter Entries

**Trigger:** Player builds Animal Rides.
**Behaviour:** The rides participant filter checks for `['Horse', 'Donkey', 'Camel',
'Ostrich', 'Elephant', 'Pony']`. From the current ANIMALS roster, only Horse,
Donkey, and Elephant match. Camel, Ostrich, and Pony are referenced by the rides
activity filter but do not appear in ANIMALS — they will never match. This is a
filter maintenance gap: either these species should be added to ANIMALS in a future
update, or the filter should be pruned to match the actual roster. ⚠️ See OQ-6.

### EC-8: Duplicate Build Attempt (Defensive Case)

**Trigger:** Some code path calls `buildAttraction(key)` when `key` is already in
`built`.
**Behaviour:** There is no explicit guard in `buildAttraction()`. The `gold < at.cost`
check would still pass (if the player has gold). The `setBuilt(b => [...b, key])`
would add a duplicate key to the array, causing `built.length` to exceed 5 and the
multipliers to exceed their intended 1.60× / 1.75× caps.
⚠️ This is a defensive gap. The UI prevents this (built attractions have no Build
button), but a guard `if (built.includes(key)) return;` should be added to
`buildAttraction()` for safety.

### EC-9: |built| Multiplier — Is There an Explicit Cap?

**Trigger:** Any scenario where `built.length` could exceed 5.
**Behaviour:** The formulas `(1 + 0.12 × N)` and `(1 + 0.15 × N)` are unbounded.
There is no `Math.min()` cap on either multiplier. If `N = 6` (via the duplicate-build
bug above), `goldPerSec` would use a 1.72× multiplier instead of 1.60×. This is
only reachable through a bug path — not normal gameplay — but the lack of a cap
is a fragility. The cap should be enforced as `Math.min(built.length, ATTRACTIONS.length)`.

---

## 6. Dependencies

### Upstream (Fe4 depends on these)

| System | GDD | What Fe4 reads |
|--------|-----|----------------|
| **C3 Zoo Level Progression** | `design/gdd/zoo-level.md` | Attraction unlock levels (Lv7, Lv18, Lv26, Lv30, Lv45). Level is derived from `levelFromXp(xp)`. ⚠️ Level gate is display-only, not enforced in `buildAttraction()`. |
| **F2 Currency System** | `design/gdd/currency-system.md` | Build cost deducted from Gold via `pay()`. Gold-only purchases enforced by `pay()` using `setGold`. |
| **C4 Taming System** | `design/gdd/taming.md` | Petting Area filter reads `ANIMALS[k].taming` (rank ≤ 2 string check). Performance Arena reads `ANIMALS[k].perform` flag. ⚠️ Neither gate checks the live `meters[k].trust` value — see OQ-5 and C4 OQ-3. |
| **F1 Animal Database** | `design/gdd/animal-database.md` | `ANIMALS[k].taming`, `ANIMALS[k].perform`, `ANIMALS[k].species` — used by participant filters. |
| **Fe1 Animal Collection** | `design/gdd/animal-collection.md` | `owned` array — participant filters run over owned animals only. Activity gates check species ownership against `owned`. |

### Downstream (systems that depend on Fe4)

| System | GDD | What they consume from Fe4 |
|--------|-----|-----------------------------|
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` | `built.length` (|built|) enters both the capacity and goldPerSec formulas. C2 §4 documents the full formulas; Fe4 owns the input. **This is the primary payoff mechanism.** |
| **Fe5 Performance System** | (not yet authored) | `built.includes('perform')` gates access to Premium Experience activities. ShowStage and the performance training loop depend on the Performance Arena being built. |
| **P5 Attractions Screen** | — | Renders `ATTRACTIONS` array; calls `participants()` per attraction; shows Build buttons. Reads `built` state. |
| **ActivitiesScreen** | — | Reads `built` to determine which activity categories are open (`built.includes(cat.attr)`). |
| **Fe8 Reputation System** | (not yet authored) | Educational Shows (`shows`) is the listed source of the `+18% reputation` label. The reputation effect is currently unimplemented — see OQ-3. |
| **F3 Save / Load System** | `design/gdd/save-load.md` | The `built` array must be persisted. If F3 is not implemented, all attraction builds are lost on session close. ⚠️ F3 is currently NOT implemented. |

**Bidirectional consistency notes:**
- `design/gdd/zoo-economy.md §6` lists Fe4 Attractions as a dependency that provides
  the `built.length` input to capacity and goldPerSec formulas. This is consistent.
- `design/gdd/taming.md §6` lists Fe4 as a downstream consumer of C4, noting the
  taming-string participant gate. This is correct — C4 owns the trust thresholds;
  Fe4 consumes the taming-string filter only.
- When F3 Save/Load GDD is implemented, it must note that `built` (array of strings)
  must be included in the save blob.

---

## 7. Tuning Knobs

All tuning values are currently inline constants in `act/prototype.jsx` or hardcoded
values in the `ATTRACTIONS` array in `act/data.jsx`. They must be consolidated into
a named `TUNING` section of `data.jsx` before production. All should be registered
in `design/registry/entities.yaml` as constants with `referenced_by` entries for
both `design/gdd/zoo-economy.md` and this GDD.

| Knob | Current Value | Category | Safe Range | Gameplay Effect | What Breaks at Extremes |
|------|--------------|----------|-----------|-----------------|------------------------|
| `ATTRACTION_REVENUE_MULT` | 0.12 | Curve | 0.05 – 0.25 | Revenue bonus per built attraction; at 0.12 all 5 = +60% total | Too low (< 0.05): attractions feel worthless vs. their cost; too high (> 0.25): attractions dwarf animal income, making care less important |
| `ATTRACTION_CAPACITY_MULT` | 0.15 | Curve | 0.05 – 0.30 | Capacity bonus per built attraction; at 0.15 all 5 = +75% capacity | Too low: attractions don't relieve the capacity crunch; too high: capacity ceases to be a constraint worth managing |
| Petting Area build cost | 500 🪙 | Gate | 200 – 2,000 | Savings arc at Lv7; at 500 it is reachable in ~1–2 days | Too low: trivial first build, no savings arc; too high: blocks early engagement |
| Feeding Zone build cost | 2,500 🪙 | Gate | 1,000 – 10,000 | Mid-early savings milestone (Lv18) | Too low: bought too easily; too high: competes badly with habitat upgrades |
| Educational Shows build cost | 16,000 🪙 | Gate | 8,000 – 40,000 | Mid-game milestone; currently most expensive before arena | Out of order vs. Rides (see OQ-4) |
| Animal Rides build cost | 9,000 🪙 | Gate | 5,000 – 20,000 | ⚠️ Cheaper than Shows despite unlocking later — price inversion (OQ-4) | Current value may need raising to restore monotonic cost curve |
| Performance Arena build cost | 45,000 🪙 | Gate | 20,000 – 120,000 | Late-game marquee milestone; should feel like a multi-day savings arc at Lv45 | Too low: unlocked without effort; too high: discourages building the capstone attraction |
| ATTRACTIONS array length | 5 (fixed) | Gate | 5 (locked at launch) | Total |built| cap | Adding attractions without a multiplier cap guard creates unbounded revenue scaling |
| Petting Area taming filter | rank ≤ 2 (Very Easy / Easy) | Gate | rank ≤ 1–3 | Controls which species appear in Petting Area | Too permissive (rank 3+): Hard/Expert animals in Petting contradicts "safe interaction" feel |
| Rides species filter | hardcoded name list | Gate | Expand as new rideable species are added | Controls which species appear in Rides participant panel | Stale list leaves Camel/Ostrich/Pony as dead filter entries (OQ-6) |

---

## 8. Acceptance Criteria

### AC-Fe4-1: Build deducts Gold and adds to built array

**GIVEN** a player at any level with `gold = 600` and `built = []`
**WHEN** they tap Build on the Petting Area (cost: 500 🪙)
**THEN** `gold` becomes 100, `built` becomes `['petting']`, and the flash message
reads "🤲 Petting Area built · Photo Experience activities open!"

---

### AC-Fe4-2: Insufficient gold blocks the build

**GIVEN** a player with `gold = 400` and Petting Area not yet built (cost: 500 🪙)
**WHEN** they tap Build on the Petting Area
**THEN** no Gold is deducted, `built` is unchanged, and the flash reads
"Need 500 🪙 to build".

---

### AC-Fe4-3: |built| increments goldPerSec correctly

**GIVEN** a player with exactly 100 visitors and `built = []`
**WHEN** `zooRate` is computed
**THEN** `zooRate = max(1, round(100 × 0.05 × 1.00)) = 5` gold/sec.

**WHEN** one attraction is built (`built.length = 1`)
**THEN** `zooRate = max(1, round(100 × 0.05 × 1.12)) = 6` gold/sec.

**WHEN** all five attractions are built (`built.length = 5`)
**THEN** `zooRate = max(1, round(100 × 0.05 × 1.60)) = 8` gold/sec.

---

### AC-Fe4-4: |built| increments capacity correctly

**GIVEN** a zoo with `Σ seatsOf(k) = 995` (so base capacity = 5 + 995 = 1,000)
and `built = []`
**WHEN** `capacity` is computed
**THEN** `capacity = round(1000 × 1.00) = 1,000`.

**WHEN** all five attractions are built (`built.length = 5`)
**THEN** `capacity = round(1000 × 1.75) = 1,750`.

---

### AC-Fe4-5: Attractions screen participant list — Petting Area filter

**GIVEN** the Petting Area is built and the player owns a Rabbit (Very Easy),
a Dog (Very Easy), a Horse (Easy), and a Wolf (Hard)
**WHEN** the participant panel for Petting Area renders
**THEN** Rabbit, Dog, and Horse appear in the participant list. Wolf does NOT appear
(taming: 'Hard').

---

### AC-Fe4-6: Attractions screen participant list — Performance Arena filter

**GIVEN** the Performance Arena is built and the player owns a Monkey (perform: true),
a Zebra (perform: false), and a Dolphin (perform: true)
**WHEN** the participant panel for Performance Arena renders
**THEN** Monkey and Dolphin appear. Zebra does NOT appear.

---

### AC-Fe4-7: Activity categories gate on attraction build

**GIVEN** `built = []` (no attractions built)
**WHEN** the player opens the Activities screen
**THEN** all five activity categories show "Locked" chips. No Run button is available
for any activity.

**GIVEN** `built = ['petting']` (Petting Area only)
**WHEN** the Activities screen renders
**THEN** the Photo Experience category shows individual activities. All other
categories (Feeding, Riding, Educational, Premium) remain locked.

---

### AC-Fe4-8: Built attractions persist within session (and are lost on refresh)

**GIVEN** the player has built the Petting Area and Feeding Zone
**WHEN** they navigate to a different tab and return to Attractions
**THEN** both attractions show "✓ Built" and no Build button.

**GIVEN** F3 Save/Load is NOT implemented (current state)
**WHEN** the player closes and reopens the browser tab
**THEN** `built` resets to `[]` and all attractions show Build buttons. ⚠️ This is
the expected (but undesirable) behavior until F3 is implemented.

---

### AC-Fe4-9: No attraction can be double-built via the UI

**GIVEN** the Petting Area has been built (`built.includes('petting') === true`)
**WHEN** the Attractions screen renders the Petting Area card
**THEN** the Build button is absent (replaced by "✓ Built" chip). There is no UI
path that re-triggers `buildAttraction('petting')`.

---

### AC-Fe4-10: Rides participant panel only shows roster-valid species

**GIVEN** the Animal Rides attraction is built and the player owns a Horse,
a Donkey, and a Giraffe
**WHEN** the rides participant panel renders
**THEN** Horse and Donkey appear. Giraffe does NOT appear (not in the rides filter
list). Camel, Ostrich, and Pony do NOT appear (not in the ANIMALS roster).

---

## 9. Open Questions

**OQ-1 — Zoo Level gate not enforced in buildAttraction() (HIGH — gameplay gap)**
*(Owner: gameplay-programmer; Priority: High)*

`buildAttraction(key)` in `prototype.jsx` checks only `gold < at.cost`. It does NOT
check `level >= unlockLevel`. The `at.unlock` field in the ATTRACTIONS array is used
for display purposes in `views-world.jsx` but is not a runtime guard.

A player with sufficient gold (e.g., via admin or extreme grinding) can build any
attraction regardless of Zoo Level. For a retail build this is a progression exploit
that would allow early access to the Performance Arena and its 1.60× multiplier
without completing the mid-game content.

**Proposed fix:** Add a level check to `buildAttraction()`:
```javascript
const unlockLv = parseInt((at.unlock || 'Lv0').replace(/\D/g, ''), 10) || 0;
if (level < unlockLv) { flash(`Reach Lv ${unlockLv} first`); return; }
```
This aligns with the `unlockAnimal()` pattern already in the codebase.

*Owner: gameplay-programmer. Blocked by: design sign-off on whether the level gate
should be a hard block or a soft warning.*

---

**OQ-2 — Per-attraction effect labels are display-only, not wired (HIGH — design gap)**
*(Owner: game-designer; Priority: High)*

The ATTRACTIONS array has unique effect labels: `+12% visitors`, `+15% revenue`,
`+18% reputation`, `+20% revenue`, `+25% revenue`. These are displayed as "combo
pills" in the UI but are NOT individual mechanical effects — all five attractions
contribute identically to the same two multipliers (capacity +15%/each, goldPerSec
+12%/each).

The stated design intent (distinct effects per attraction) is not implemented. This
creates a gap between player expectation and reality: a player who reads "+18%
reputation" on Educational Shows expects their Reputation stat to increase when they
build it, but it does not.

Three design options:
A. **Status quo with honest labelling**: Relabel all attractions as "+12% revenue /
   +15% capacity per attraction" to match reality. Simplest — no new systems needed.
B. **Differentiate at the multiplier level**: Assign per-attraction contribution
   weights to capacity and revenue (e.g., Petting Area raises capacity more;
   Performance Arena raises revenue more). Still uses the unified `|built|` counter
   structure but with different multipliers per key.
C. **Full differentiation**: Implement distinct effects — Petting Area adds capacity
   only, Feeding Zone adds a separate direct Gold faucet, Shows wires into
   Reputation, Rides adds a premium ticket faucet, Performance Arena adds the
   highest revenue multiplier. This matches the label intentions but requires
   designing and implementing new sub-systems.

Option B is recommended as a middle path — it honors the label intent without
requiring a Reputation system implementation. But it should not be implemented until
Fe8 Reputation is designed.

*Owner: game-designer. Blocked by: Fe8 Reputation System GDD (for Shows effect).*

---

**OQ-3 — Reputation currency not wired into the economy chain (MEDIUM)**
*(Owner: game-designer + systems-designer; Priority: Medium)*

The `rep` (Reputation) currency is defined in `data.jsx CURRENCIES`, awarded by
educational activities and shows, and displayed in the ATTRACTIONS label for
Educational Shows (`+18% reputation`). But `rep` is NOT read by the `zooRate` or
`capacity` formulas. The Fe8 Reputation System is listed as "data only" in the
systems index with a design question about whether it should be a visitor multiplier,
a star-rating system, or a hidden bonus.

Until Fe8 is designed and wired into C2, Educational Shows' stated effect (reputation
bonus) has no gameplay impact beyond the displayed label.

*Owner: Fe8 Reputation System GDD author. Blocked by: Fe8 design decision.*

---

**OQ-4 — Animal Rides costs less than Educational Shows (MEDIUM — balance gap)**
*(Owner: economy-designer; Priority: Medium)*

Animal Rides (Lv30) costs 9,000 🪙, but Educational Shows (Lv26) costs 16,000 🪙.
A later-unlocking attraction is cheaper than an earlier one. Additionally, the
`data.jsx SINKS` array says attraction costs are "40k–900k 🪙" — approximately 20×
higher than the actual ATTRACTIONS costs (500–45,000 🪙). The SINKS data is clearly
a stale stub value.

These issues should be resolved together in a balance pass:
1. Decide whether build costs should be strictly monotonic with unlock level.
2. Update the SINKS table to reflect actual ATTRACTIONS costs.
3. Run a balance simulation to validate that each attraction's cost represents a
   meaningful savings arc at the point the player unlocks it.

*Owner: economy-designer. Run `/balance-check Fe4` after updating costs.*

---

**OQ-5 — Petting Area and Performance Arena trust gates are data-only, not enforced
(HIGH — cross-referenced from C4 OQ-3)**
*(Owner: gameplay-programmer; Priority: High)*

The Petting Area data description says "Needs Trust ≥ 40" and the Performance Arena
description says "Trained, high-trust animals." Neither threshold is enforced in the
participant filter code:
- Petting Area: `participants('petting')` filters by `taming` string only, not
  `meters[k].trust >= 40`.
- Performance Arena: `participants('perform')` filters by `ANIMALS[k].perform` flag
  only, not `meters[k].trust >= 80`.

This means any Very Easy / Easy species can appear in the Petting Area regardless of
their actual trust level, and any `perform: true` species can appear in the
Performance Arena with trust = 30 (the adoption minimum).

The proposed trust thresholds from `entities.yaml` (`trust_thresholds`):
- `petting_gate_PROPOSED: 40`
- `performer_gate_PROPOSED: 80`

These gates are PROPOSED (not yet implemented). Implementing them would require:
1. Adding `meters[k].trust >= PETTING_TRUST_THRESHOLD` to `participants('petting')`.
2. Adding `meters[k].trust >= PERFORM_TRUST_THRESHOLD` to `participants('perform')`.
3. Declaring `PETTING_TRUST_THRESHOLD = 40` and `PERFORM_TRUST_THRESHOLD = 80` as
   named constants in `data.jsx TUNING` and registering them in `entities.yaml`.

*Owner: gameplay-programmer. Design sign-off needed on threshold values.*

---

**OQ-6 — Rides participant filter includes non-roster species (LOW)**
*(Owner: gameplay-programmer; Priority: Low)*

The rides filter in `participants('rides')` checks for
`['Horse', 'Donkey', 'Camel', 'Ostrich', 'Elephant', 'Pony']`.
Camel, Ostrich, and Pony are not in the current ANIMALS roster. These filter entries
are dead code — they will never match.

Resolution options:
A. Prune the list to `['Horse', 'Donkey', 'Elephant']` to match the live roster.
B. Add Camel, Ostrich, and Pony as future ANIMALS entries and document them as
   "rides-eligible on arrival."

Option A is simpler and reduces maintenance surface. Option B signals design intent
for future species.

*Owner: gameplay-programmer + game-designer.*

---

**OQ-7 — Attraction build state not persisted (BLOCKING for retention)**
*(Owner: F3 Save/Load author; Priority: Critical — dependent on F3)*

The `built` array lives in React state on the `Phone` component and is not persisted
to localStorage (F3 is not implemented). Every session begins with `built = []` —
all attraction builds are lost on page reload.

For a game where building the Performance Arena may take months of real-world play,
this means the player's most significant milestone purchases are ephemeral. F3 must
include `built` in the save blob before any retention testing can be meaningful.

*Owner: F3 Save/Load GDD (design/gdd/save-load.md). Blocking: all Fe4 ACs that
reference persistence.*

---

*End of Fe4 Attractions System GDD*
