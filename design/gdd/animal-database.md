# Animal Database

> **Status**: In Design
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — the database IS the collection catalog

## Overview

The Animal Database is the species catalogue at the heart of Animal World Zoo: a
static data layer (the `ANIMALS` array in `act/data.jsx`) that defines every
playable species and the properties that make each one meaningful in the zoo. Each
record encodes what an animal *is* — its tier, habitat, taming difficulty, base
appeal value, performer eligibility, and unlock level — giving every other system a
single source of truth to query rather than hard-coding species facts in multiple
places. From a player perspective, the database is the entire collection goal: 29
species sorted into 7 themed tiers, gated by Zoo Level from the starter Meadow
corner (Tier 0) through the Marine Cove endgame (Tier 7). Adopting a new animal
means adding its unique appeal value to the zoo's daily draw — the numbers are
invisible, but the feeling of watching a Dolphin arrive is the point.

*Implementation note: stored as a plain JS module-level array, transpiled at
page-load by Babel. No database or ORM. Schema changes are in-place edits to
`act/data.jsx`. See ADR-001 (pending) for the React + Babel no-build architecture
decision.*

## Player Fantasy

The player never opens a "database". They open the Animals screen and see a row of
locked species — a Zebra silhouette, a Giraffe outline, a question mark where the
Dolphin will be someday. Each unlock level printed below that silhouette is a
*goal*, not a number. When Zoo Level 32 is finally reached and the Zebra's
enclosure unlocks, the satisfaction is not "I ticked a box" — it is "I built
something worth visiting."

The database makes this possible by ensuring every species has a *distinct
identity*: a name (Pyjama the Zebra, Stretch the Giraffe), a tier that signals
prestige, and an appeal value that makes a measurable difference to the visitor
count the moment the animal moves in. Players feel the database through the
collection arc — the itch of incompleteness, the pull of the next unlock, and the
quiet satisfaction of a full biome.

## Detailed Design

### Core Rules

**Species Record Schema**

Each entry in `ANIMALS` has 10 fields:

| Field | Type | Example | Design meaning |
|-------|------|---------|----------------|
| `key` | string | `'dolphin'` | Unique ID used by all systems; kebab-case, immutable after release |
| `emoji` | string | `'🐬'` | Display icon — quick visual identity for the species |
| `name` | string | `'Echo'` | The individual animal's name (e.g. "Echo the Dolphin") — builds attachment |
| `species` | string | `'Dolphin'` | Full species label for UI display |
| `tier` | int 0–7 | `7` | Thematic / prestige group; affects visual grouping, not economy formulas |
| `habitat` | string | `'marine'` | Biome enclosure key; must match a `HABITATS[].key` |
| `taming` | string | `'Expert'` | Difficulty key; must match a key in the `TAMING` object |
| `appeal` | int ≥ 3 | `3000` | Base visitor-draw contribution at count=1, encLv=1, enr=0; root input for the economy chain |
| `unlock` | string | `'Lv92'` | Zoo Level required to make available; `'Start'` = available at game start; `'Tutorial'` = FTUE unlock |
| `perform` | bool | `true` | Eligible for the Performance Arena |
| `bg` | hex string | `'#D4ECF5'` | Card background colour; should match biome palette |

**Tier System (0–7)**

| Tier | Name | Theme | Zoo Level span | Species count |
|------|------|-------|---------------|---------------|
| 0 | Starter | Local farm corner | Lv1–4 | 4 (Rabbit, Chicken, Duck, Dog) |
| 1 | Tier 1 | Friendly companions | Lv5–10 | 3 (Cat, Goat, Sheep) |
| 2 | Tier 2 | Farmstead & pasture | Lv11–19 | 4 (Horse, Donkey, Alpaca, Cow) |
| 3 | Tier 3 | Woodland natives | Lv20–31 | 4 (Fox, Monkey, Raccoon, Wolf) |
| 4 | Tier 4 | African savanna | Lv32–53 | 6 (Zebra, Giraffe, Rhino, Hippo, Lion, Elephant) |
| 5 | Tier 5 | Giants & bears | Lv54–69 | 2 (Brown Bear, Polar Bear) |
| 6 | Tier 6 | Reptile house | Lv70–83 | 3 (Turtle, Python, Crocodile) |
| 7 | Tier 7 | Marine cove | Lv84–92 | 3 (Seal, Sea Lion, Dolphin) |

**Taming Difficulty Scale**

| Difficulty | Rank | Approximate taming time | Notes |
|-----------|------|------------------------|-------|
| Very Easy | 1 | Instant | Tames on adopt |
| Easy | 2 | 2–4 hours | Light daily care |
| Medium | 3 | 1–2 days | Sustained trust needed |
| Hard | 4 | 3–5 days | Better facilities required |
| Expert | 5 | 1–2 weeks | High zoo level + specialist habitat |
| Master | 6 | 3+ weeks | Endgame challenge animals |

**Appeal Ladder Rule**

The `appeal` field must be **strictly monotonically non-decreasing** ordered by
unlock level. A later-unlocking animal must never have a lower base appeal than an
earlier-unlocking one. This ensures the collection arc is always additive — every
new species can only improve the zoo. Violation of this rule would mean acquiring a
new, "better" animal makes the zoo less attractive.

**Performer Restriction**

`perform: true` may only be set for species in the `PERFORMERS` list: Dog, Monkey,
Elephant, Seal, Sea Lion, Dolphin. These six are animals with established
real-world performance associations. Adding `perform: true` to other species
requires a design decision, not just a flag flip — the Performance Arena roster
should remain curated, not exhaustive.

---

### States and Transitions

The Animal Database is static — records do not have runtime states. Per-player
state (whether a species is owned, how many, enclosure level, enrichment level,
trust score) lives in the prototype game-state layer, not in the database.

The only structural "change" to the database is **adding a new species** during a
content update. That process must satisfy these rules in order:

1. Assign a unique `key` (kebab-case; immutable after release to any player)
2. Assign `tier` consistent with the biome theme
3. Set `habitat` to an existing `HABITATS` key
4. Set `appeal` > the highest `appeal` of any animal at an equal or lower unlock level
5. Set `unlock` as `'LvN'` where N ≥ the highest existing unlock level in that tier
6. Set `perform: true` only if the species is being added to the `PERFORMERS` list (requires designer sign-off)

---

### Interactions with Other Systems

| Downstream system | Fields consumed | Interface |
|-------------------|----------------|-----------|
| **C2 Zoo Economy** | `appeal` | `appealOf(k)` reads `AA[k].appeal` as the base visitor-draw input |
| **C1 Animal Care** | `key` | All care actions and stat meters are keyed by animal key |
| **C3 Zoo Level Progression** | `unlock` | `UNLOCKS` table is derived from `ANIMALS[].unlock` at module load |
| **C4 Taming System** | `taming` | Taming difficulty key determines trust accumulation rate and milestones |
| **Fe1 Animal Collection** | `key`, `unlock`, `tier`, `habitat` | Shop browser, adopt flow, and collection UI |
| **Fe2 Habitat System** | `habitat` | Assigns an adopted animal to the correct biome enclosure |
| **Fe3 Enrichment System** | `appeal` | Enrichment multiplier is applied on top of `appeal` |
| **Fe4 Attractions System** | `taming` | Petting Area access requires `TAMING[taming].rank ≤ 2` (Very Easy or Easy) |
| **Fe5 Performance System** | `perform` | Performance Arena roster is filtered to `perform: true` animals |

## Formulas

**Formula 1 — Initial Unlock Cost (First Adoption)**

```
unlockCost(k) = roundNice( 500 × 1.06^(lv(k) − 1) )
```

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Unlock level | `lv(k)` | int | 1–92 | Zoo Level gate parsed from `ANIMALS[k].unlock`; `'Start'` and `'Tutorial'` → lv=1 |
| Unlock cost | `unlockCost` | int gold | ~500–~98,500 | Gold to adopt the first of this species |

`roundNice` rounds to nearest 500 (≥10,000), nearest 100 (≥1,000), or nearest 10 otherwise.

**Output Range**: ~500🪙 (Rabbit-tier) → ~98,500🪙 (Dolphin, Lv92).

**Example**: Zebra (unlock Lv32) → `roundNice(500 × 1.06^31)` ≈ `roundNice(3,045)` → 3,000🪙.

*This formula is computed once at module load in the `UNLOCKS` projection in `act/data.jsx`.
The single source of truth is `ANIMALS[].unlock` — UNLOCKS is derived and cannot drift.*

---

**Formula 2 — Marginal Animal Cost (Add Another to Enclosure)**

```
buyCost(k, cnt) = round( appeal(k) × 22 × cnt ) + 50
```

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Base appeal | `appeal(k)` | int | 3–3000 | `ANIMALS[k].appeal` |
| Current owned count | `cnt` | int | 1–5 | Animals of this species already in the enclosure after first unlock |
| Buy cost | `buyCost` | int gold | 50–330,050 | Gold to add one more animal to the enclosure |

**Output Range**: 50🪙 (edge case, cnt=0) → 330,050🪙 (Dolphin at cnt=5).

**Example**: Second Monkey (appeal=260, cnt=1) → `round(260 × 22 × 1) + 50` = 5,770🪙.

> ⚠️ **Balance gap (known)**: Formulas 2–4 all multiply raw `appeal`. The appeal
> redesign raised values up to 3,000 (formerly max ~1,500), making costs for elite
> species roughly 2× the original intent. A balance pass on the multipliers (22, 160, 40)
> is logged as a follow-up in `design/gdd/zoo-economy.md` and the Follow-up section below.

---

**Formula 3 — Habitat Upgrade Cost**

```
upgradeCost(k, encLv) = round( appeal(k) × 160 × encLv ) + 300
```

*(Authority: Fe2 Habitat System GDD when written — cross-referenced here because it reads `appeal` from F1.)*

---

**Formula 4 — Enrichment Cost**

```
enrichCost(k, enrLv) = round( appeal(k) × 40 × (enrLv + 1) ) + 200
```

*(Authority: Fe3 Enrichment System GDD when written — cross-referenced here because it reads `appeal` from F1.)*

## Edge Cases

- **If a species `key` is referenced in saved game state but removed from ANIMALS**: Systems
  read via `AA[k]` (a lookup object derived from ANIMALS at load). Missing key → `AA[k]` is
  `undefined` → formulas using `(AA[k]?.appeal || 1)` fall back to appeal=1; the animal
  becomes invisible in UI. Never remove a key once it has been shipped to real players —
  set `perform: false` and deprecate instead.

- **If `appeal` is 0 or undefined on a record**: All cost formulas guard with `(appeal||1)`,
  so the cost floor is 1 gold (not 0). The economy chain floors `goldPerSec` at 1 (see
  `zoo-economy.md §5`). A species with appeal=0 would contribute nothing to visitor draw.

- **If `unlock` is an unrecognised string** (not `'Start'`, `'Tutorial'`, or the pattern
  `'LvN'`): `parseInt` returns NaN → falls back to `lv=1` in the UNLOCKS derivation, making
  the species immediately purchasable at Lv1. Guard: all unlock values must be one of the
  three recognised formats; review any content update that adds a new animal.

- **If two animals share the same `unlock` level**: Both appear in UNLOCKS sorted by unlock
  level then gold cost. Both are visible in the shop simultaneously. This is acceptable design
  (the Savanna tier has 6 animals staggered over Lv32–54); the monotonic appeal rule ensures
  the higher-level one is still more attractive.

- **If a new species uses a `habitat` key absent from HABITATS**: The enclosure assignment
  silently fails at runtime — the animal appears in the Animals screen but cannot be placed.
  Every new species must use an existing HABITATS key; adding a new biome requires a HABITATS
  entry first (and an accompanying Zoo Level gate).

- **If `perform: true` is set but the species is absent from `PERFORMERS`**: The Performance
  Arena roster is filtered from the `PERFORMERS` string array, not the `perform` flag. The
  animal will never appear in the arena roster even with the flag set. Keep `perform` and
  `PERFORMERS` in sync; `PERFORMERS` is the functional gate.

- **If appeal values are NOT monotonically non-decreasing with unlock level**: The economy
  still runs, but the collection loop breaks — a player reaching a new biome might find their
  zoo's appeal *drops*. This is a design violation, not a runtime error. The monotonic rule
  must be validated manually whenever new species are added; code does not enforce it.

## Dependencies

**Upstream (F1 depends on)**: None. This is a Foundation system — no other GDD is a
prerequisite for defining the species catalogue.

**Downstream (systems that consume F1 data)**:

| System | Fields consumed | Relationship |
|--------|----------------|--------------|
| C1 Animal Care System | `key` | Hard — all care stat maps and action handlers are keyed by animal key |
| C2 Zoo Economy | `appeal` | Hard — `baseAppeal` is the root input of the appeal → visitors → gold chain |
| C3 Zoo Level Progression | `unlock` | Hard — the UNLOCKS projection reads unlock level from each record at module load |
| C4 Taming System | `taming` | Hard — taming difficulty key sets trust accumulation rate and milestone thresholds |
| Fe1 Animal Collection | `key`, `unlock`, `tier`, `habitat` | Hard — shop browser list, lock/unlock state, biome grouping in the Animals screen |
| Fe2 Habitat System | `habitat` | Hard — species-to-biome assignment for enclosure placement |
| Fe3 Enrichment System | `appeal` | Soft — enrichment multiplier layers on top of base appeal; system functions without it |
| Fe4 Attractions System | `taming` | Soft — Petting Area gates on `TAMING[taming].rank ≤ 2`; other attractions don't check taming |
| Fe5 Performance System | `perform` | Soft — arena roster filtered to `perform: true`; arena works with any subset of performers |

**Bidirectional consistency note**: `design/gdd/zoo-economy.md §4` documents the `baseAppeal`
ladder values (3→3000). If any animal's `appeal` value changes in `act/data.jsx`, the ladder
table in `zoo-economy.md` must also be updated. These are the same values — the GDD documents
what the code implements.

## Tuning Knobs

| Knob | Current value | Safe range | What it changes | What breaks at extremes |
|------|--------------|-----------|-----------------|------------------------|
| **Base appeal ladder** | 3→3000 (29 values) | ±30% per step | Gold income rate; all appeal-scaled costs | High → economy inflates, costs prohibitive; Low → visitor counts collapse mid/late |
| **Monotonic gap minimum** | Implicit (each step ≥ prev) | Each step ≥ prev by ≥5 | How "valuable" each new tier feels | Too small → tiers feel redundant; Too large → early game feels trivial |
| **Taming time per difficulty** | Instant (VE) → 3+ wk (Master) | ±50% | How long before attractions gate open | Too fast → taming loses meaning; Too slow → players locked out of Petting Area too long |
| **Performer count** | 6 species | 4–8 | Performance Arena variety | Too few → arena feels thin; Too many → dilutes "trained specialist" identity |
| **Max species count** | 29 | 25–50 | Session depth, balance surface area | >50 requires careful appeal-tuning to keep all tiers meaningful |
| **Buy-more cost multiplier** | 22 | 10–35 | Enclosure fill speed; gold sink depth | >35 → elite enclosures unaffordable; <10 → gold sink collapses |
| **Habitat upgrade cost multiplier** | 160 | 80–250 | Habitat upgrade pacing | >250 → upgrades are a months-long bottleneck; <80 → trivially cheap |
| **Enrichment cost multiplier** | 40 | 20–80 | Enrichment depth and grind | >80 → enrichment never worth purchasing; <20 → appeal trivially maximized |

> ⚠️ **Pending balance pass**: The three cost multipliers (22, 160, 40) were tuned when
> `appeal` maxed at ~1,500. With appeal now scaling to 3,000 for Dolphin after the economy
> redesign, these multipliers need recalibration before soft-launch. Tracked in
> `design/gdd/zoo-economy.md — Follow-up`.

## Acceptance Criteria

- **GIVEN** the game is loaded fresh, **WHEN** `ANIMALS` is inspected at runtime,
  **THEN** there are exactly 29 entries, each with a unique `key`, and `appeal` values
  are strictly non-decreasing when entries are ordered by their parsed `unlock` level.

- **GIVEN** any species record, **WHEN** its `habitat` field is read,
  **THEN** the value matches an existing key in the `HABITATS` array.

- **GIVEN** any species with `perform: true`, **WHEN** checking `PERFORMERS`,
  **THEN** the species' `species` name string appears in `PERFORMERS`; and vice versa
  — every string in `PERFORMERS` has a matching `perform: true` record in `ANIMALS`.

- **GIVEN** `unlockAnimal('zebra')` is called at `level ≥ 32` and `gold ≥ 3,000`,
  **WHEN** the function completes, **THEN** gold decreases by the UNLOCKS-derived cost
  (≈3,000🪙 for Zebra, Lv32), `'zebra'` is in the owned array, and count is set to 1.

- **GIVEN** a Rabbit enclosure at count=1, **WHEN** `buyMoreAnimal('rabbit')` is called
  with sufficient gold, **THEN** the cost charged equals `round(3 × 22 × 1) + 50 = 116`🪙
  and rabbit count becomes 2.

- **GIVEN** a species with an unrecognised `unlock` value (e.g. `'ChapterTwo'`),
  **WHEN** the UNLOCKS projection runs at module load, **THEN** the species' derived `lv`
  falls back to 1 (not NaN), no exception is thrown, and the species appears in UNLOCKS.

- **GIVEN** `AA['nonexistent']` is accessed in any formula,
  **WHEN** the expression evaluates `(AA['nonexistent']?.appeal || 1)`,
  **THEN** the result is `1` — not `undefined`, `0`, or NaN — and no exception is thrown.

- **GIVEN** all 29 species are owned at count=1, encLv=1, enr=0, and avgHappy=100,
  **WHEN** total zoo appeal is computed,
  **THEN** the result equals `round( 17,468 × happyMult(100) )` = `round( 17,468 × 1.4 )` = 24,455
  (±1 for rounding). *(17,468 = sum of the full 29-value appeal ladder.)*

## Open Questions

1. **Balance pass on cost multipliers** (Owner: economy-designer)
   Cost formulas 2–4 use multipliers (22, 160, 40) calibrated when `appeal` maxed at
   ~1,500. With Dolphin now at appeal=3,000, late-game costs are roughly 2× higher than
   originally intended. Run `/balance-check act/data.jsx` to validate before soft-launch.

2. **`PERFORMERS` array sync enforcement** (Owner: tools-programmer)
   The `perform` flag and `PERFORMERS` string array must currently be kept in sync
   manually. A future lint or data-validation step should enforce `perform:true ↔ in
   PERFORMERS` at build time to prevent silent mismatches.

3. **New biome content cadence** (Owner: live-ops-designer)
   Roadmap Q2–Q4 adds Polar, Reptile, and Marine biomes. Each requires new ANIMALS
   entries and a new HABITATS entry. Confirm appeal values for each new species maintain
   the monotonic ladder (current ceiling: Dolphin=3,000).

4. **`ENC_COUNTS` vs slot defaults** (Owner: game-designer)
   `ENC_COUNTS` defines recommended animals-per-enclosure per species (rabbit:3, lion:2,
   etc.) but currently this is display metadata only. Confirm whether it should gate the
   initial enclosure slot count (replacing the hardcoded 2-slot default) in a future update.
