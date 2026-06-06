# Animal Care System

> **Status**: Reverse-Documented
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — care is the daily ritual that keeps animals (and the economy) alive
> **Source files**: `act/prototype.jsx`, `act/proto-screens.jsx`, `act/live-scene.jsx`, `act/data.jsx`
> **Reverse-documentation note**: Every value, formula, and behavior in this document was extracted from
> the running implementation as of 2026-06-06. No mechanics were invented. Where the code is silent
> (e.g. offline decay) this is called out explicitly in Open Questions.

---

## 1. Overview

Animal Care is the active, tactile heart of Animal World Zoo. Every owned animal
carries five live meters — Hunger, Thirst, Cleanliness, Happiness, and Trust — that
decay on a real-time timer while the player is in session. Five one-tap care actions
(Feed, Water, Bathe, Play, Health) restore these meters, costing a small amount of
Gold and awarding 3 Zoo XP each. The player opens the Care screen for any animal,
taps to fill a depleted meter, watches the emoji bounce and a flash of gold spend,
and closes the screen knowing the animal is cared for.

Happiness is the critical output: it is read directly by C2 Zoo Economy as `happyMult`,
a multiplier that scales the entire zoo's appeal — and therefore visitor count and
gold income. Neglected animals drag happiness down, drag the economy down with it,
and create a feedback pressure that motivates daily return. Well-cared-for animals
maximise the `happyMult` ceiling of 1.4×, meaningfully lifting income versus a
neglected zoo at the 0.5× floor.

Trust is a second output — it builds slowly through play and heal actions and gates
access to Attractions and Performance shows (C4 Taming).

---

## 2. Player Fantasy

"I know every animal's name and what they need."

The care loop is the game's emotional core. Every day the player opens their zoo,
scans their animals for the amber warning ring, and makes a small round of care
taps — feed Clover, water Pyjama, bathe Snap. It is a nurturing ritual, not a
chore: each tap produces an immediate animated reward (the animal bounces, a toast
says "Fed · −40 🪙", XP ticks up), and watching a sad, neglected meter climb back
to green closes a tiny satisfaction loop that keeps the player returning.

The fantasy is that these animals *know* you. A high-Trust dolphin who has been
played with every day for weeks feels genuinely earned. The system supports this
by making Trust the only stat that never decays — it is a permanent record of
attention, not something that gets accidentally lost overnight.

This aligns with the game's collection pillar: animals are the point, not
resources. Caring for them is the verb that makes owning them feel real.

---

## 3. Detailed Design

### 3.1 Per-Animal Stats

Every owned animal has an independent meter object with five fields, each a
clamped integer in the range [0, 100].

| Stat | Key | Icon | Range | Decays? | Description |
|------|-----|------|-------|---------|-------------|
| Hunger | `hunger` | 🍖 | 0–100 | Yes (−6 per tick) | Food level; refilled by Feed |
| Thirst | `thirst` | 💧 | 0–100 | Yes (−8 per tick) | Water level; refilled by Water |
| Cleanliness | `clean` | 🫧 | 0–100 | Yes (−5 per tick) | Habitat hygiene; refilled by Bathe |
| Happiness | `happy` | 😊 | 0–100 | Yes (−3 per tick) | Mood outcome; refilled by Play; also rises from Feed/Water/Bathe indirectly via enrichment. **Direct input to C2 happyMult.** |
| Trust | `trust` | ❤️ | 0–100 | No — trust never decays | Relationship meter; raised by Play (+4/tap) and Health (+2/tap); gates taming milestones |

All five stats are stored in the `meters` React state object, keyed by animal key
(e.g. `meters.rabbit`). The `clamp(n)` helper enforces the 0–100 range on every
write: `Math.max(0, Math.min(100, Math.round(n)))`.

**Initial stat values on adoption (from `confirmBuy`):**

| Stat | Value |
|------|-------|
| `hunger` | 60 |
| `thirst` | 58 |
| `clean` | 64 |
| `happy` | 66 |
| `trust` | 30 |

**Starter rabbit (FRESH_METERS) initial values:**

| Stat | Value |
|------|-------|
| `hunger` | 42 |
| `thirst` | 36 |
| `clean` | 64 |
| `happy` | 70 |
| `trust` | 30 |

The rabbit starts with slightly lower hunger and thirst to give the tutorial a
natural first task to perform.

---

### 3.2 Decay Mechanic

A single `setInterval` in `prototype.jsx` fires every **12,000 ms (12 seconds)**
and applies a fixed decrement to all owned animals simultaneously. Trust is
excluded from decay.

**Decay per 12-second tick:**

| Stat | Δ per tick | Equivalent per minute | Full-drain time from 100 |
|------|-----------|----------------------|--------------------------|
| `hunger` | −6 | −30 / min | ~3.3 minutes |
| `thirst` | −8 | −40 / min | ~2.5 minutes |
| `clean` | −5 | −25 / min | ~4.0 minutes |
| `happy` | −3 | −15 / min | ~6.7 minutes |
| `trust` | 0 | 0 | Never decays |

⚠️ **Balance note**: These decay rates are very fast for an idle game intended to
run over hours — a fully-fed animal becomes hungry again in ~3.3 minutes of active
session time. In practice, players do not watch the game continuously; the session
model means they check in, care, and close the tab. The behavioral contract is:
"care every session". The implications for offline play are unresolved — see
Open Questions OQ-1.

The decay loop is tied to the `owned` array via the `useEffect` dependency. When a
new animal is added to `owned`, the interval re-registers to include it.

---

### 3.3 Care Actions

Five actions are defined in the `ACTIONS` array in `act/data.jsx`. Each action has:
- A `stat` field: the action is blocked if that stat is already ≥ 98 ("already full" flash)
- A `cost` field: the base Gold cost before tier scaling
- An `effect` object: stat delta applied via `adjust()`

**Action definitions (from `ACTIONS` in `act/data.jsx`):**

| Action | Key | Stat guarded | Base cost | Effect | XP | Note |
|--------|-----|-------------|-----------|--------|-----|------|
| Feed | `feed` | `hunger` | 40 🪙 | `hunger +100` | +3 | Sets hunger to 100 (clamped) |
| Water | `water` | `thirst` | 10 🪙 | `thirst +100` | +3 | Sets thirst to 100 (clamped) |
| Bathe | `clean` | `clean` | 20 🪙 | `clean +100` | +3 | Sets cleanliness to 100 (clamped) |
| Play | `play` | `happy` | 0 🪙 (free) | `happy +100, trust +4` | +3 | Only free action; also raises trust |
| Health | `heal` | `happy` | 30 🪙 | `happy +40, trust +2` | +3 | Partial happiness restore + trust |

**Actual Gold cost with tier scaling (from `doAction` in `prototype.jsx`):**

```
actualCost = round(baseCost × (1 + tier × 0.4))
```

Where `tier` is the species' tier field (0–7). At tier 0 the cost equals the base;
at tier 7 (Dolphin) costs are 2.8× the base.

**Tier-scaled costs by species tier:**

| Tier | Feed | Water | Clean | Heal |
|------|------|-------|-------|------|
| 0 (Rabbit, Chicken, Duck, Dog) | 40 🪙 | 10 🪙 | 20 🪙 | 30 🪙 |
| 1 (Cat, Goat, Sheep) | 56 🪙 | 14 🪙 | 28 🪙 | 42 🪙 |
| 2 (Horse, Donkey, Alpaca, Cow) | 72 🪙 | 18 🪙 | 36 🪙 | 54 🪙 |
| 3 (Fox, Monkey, Raccoon, Wolf) | 88 🪙 | 22 🪙 | 44 🪙 | 66 🪙 |
| 4 (Zebra, Giraffe, Rhino, Hippo, Lion, Elephant) | 104 🪙 | 26 🪙 | 52 🪙 | 78 🪙 |
| 5 (Brown Bear, Polar Bear) | 120 🪙 | 30 🪙 | 60 🪙 | 90 🪙 |
| 6 (Turtle, Python, Crocodile) | 136 🪙 | 34 🪙 | 68 🪙 | 102 🪙 |
| 7 (Seal, Sea Lion, Dolphin) | 152 🪙 | 38 🪙 | 76 🪙 | 114 🪙 |

Play is always free regardless of tier.

**Cost insufficiency**: if `gold < cost`, the action is blocked. A "Need X 🪙"
flash appears. No stat change or XP grant occurs. This is F2 rule EC-1 applied
at the care action level.

---

### 3.4 Enrichment (side path to care)

Enrichment is triggered from the Enclosure screen, not the Care screen. It is
a one-time per-level spend that immediately applies:
- `happy +18`
- `trust +8`

It also raises the enclosure's appeal multiplier (+10% per enrichment level) which
is an economy effect (C2), not a care effect. Enrichment does not grant XP.

**Enrichment cost formula (from `addEnrichment` in `prototype.jsx`):**

```
enrichCost = round(appeal × 40 × (enrLv + 1)) + 200
```

Where `enrLv` is the current enrichment level before applying the next tier.

---

### 3.5 Animal Mood States

The `EnclosureScreen` derives a status label for each individual animal from its
effective meter values. This is a display-only read — it drives UI badges but does
not change gameplay rules.

| Status | Label | Icon | Trigger conditions |
|--------|-------|------|--------------------|
| Hungry | "Hungry" | 🍖 | `hunger < 35` |
| Thirsty | "Thirsty" | 💧 | `thirst < 35` |
| Needs cleaning | "Needs cleaning" | 🫧 | `clean < 40` |
| Restless | "Restless" | 😕 | `happy < 50` |
| Content | "Content" | 😊 | None of the above triggered, and `trust < 68` |
| Thriving | "Thriving" | 🌟 | None of the above triggered, **and** `trust ≥ 68` |

Status checks are evaluated in this priority order — a hungry animal shows
"Hungry" even if trust is 90. The Animals screen shows a ⚠️ alert ring for any
animal where `hunger < 35 || thirst < 35 || clean < 35` (slightly stricter clean
threshold on the Animals screen vs. the Enclosure screen's `clean < 40`).

The LiveZoo map also checks `happy < 45` as a distress condition and shows 😕, and
treats `hunger < 22 && thirst < 22` as 🤒 (critically ill).

**Mood state thresholds consolidated:**

| Threshold | Context | Signal |
|-----------|---------|--------|
| `hunger < 35` | Enclosure, Animals list | Alert ring, "Hungry" status |
| `thirst < 35` | Enclosure, Animals list | Alert ring, "Thirsty" status |
| `clean < 35` | Animals list alert ring | Alert, no label on list |
| `clean < 40` | Enclosure status label | "Needs cleaning" |
| `happy < 45` | Zoo map | 😕 distress icon on plot |
| `happy < 50` | Enclosure status | "Restless" |
| `hunger < 22 && thirst < 22` | Zoo map | 🤒 critically ill icon |
| `trust ≥ 68` | Enclosure status | "Thriving" (top state) |

---

### 3.6 Interactions with Other Systems

| System | Direction | What C1 reads | What C1 writes | Interface |
|--------|-----------|--------------|----------------|-----------|
| **F1 Animal Database** | Upstream | `ANIMALS[k].tier` (action cost scaling); `ANIMALS[k].taming` (displayed in care UI); `ANIMALS[k].appeal` (enrichment cost); `ANIMALS[k].perform` (show eligibility) | — | Read-only `AA[k]` lookup |
| **F2 Currency System** | Upstream | `gold` balance (spend check before each action) | `gold -= actualCost` per paid action; `xp += 3` per any action | `pay(cost)`, `setXp(x => x + 3)` |
| **F3 Save/Load** | Upstream | `meters` state (initial load) | `meters` state persisted on save | React state → save blob |
| **C2 Zoo Economy** | Downstream | — | `meters[k].happy` read by C2 to compute `happyMult` → appeal → visitors → gold/sec | `happyMult` IIFE reads `meters` |
| **C3 Zoo Level** | Downstream | — | `xp += 3` per action triggers level-up check | `setXp()`, `levelFromXp()` |
| **C4 Taming** | Downstream | — | `trust += 4` (play), `trust += 2` (heal), `trust += 8` (enrichment) | `adjust(sel, effect)` |
| **Fe6 Quests/Missions** | Downstream | — | `counts.feed++`, `counts.clean++` per respective action (quest progress) | `bump2('feed')`, `bump2('clean')` |

---

## 4. Formulas

### 4.1 Happiness → happyMult (the C2 contract)

The `happyMult` is computed inline in `prototype.jsx` as an IIFE (immediately
invoked function expression) that runs on every render:

**Named expression:**

```
happyMult = clamp_band( 0.4 + avgHappiness / 100 )
```

where:

```
avgHappiness = ( Σ meters[k].happy  for k in owned ) / |owned|
clamp_band(x) = max(0.5, min(1.4, x))
```

**Variable table:**

| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| `meters[k].happy` | int | 0–100 | The `happy` stat of owned animal k |
| `owned` | string[] | 1–29 entries | Array of owned animal keys |
| `avgHappiness` | float | 0–100 | Simple arithmetic mean of all owned animals' happiness values |
| `happyMult` | float | 0.5–1.4 | Appeal multiplier applied to total zoo appeal in C2 |

**Output range:** Clamped to [0.5, 1.4].
- Floor 0.5 — income never fully dies from neglect alone.
- Ceiling 1.4 — a well-cared-for zoo produces 40% more appeal than the neutral 1.0 baseline.
- Neutral point (happyMult = 1.0): `avgHappiness = 60`.
- Below neutral below avgHappiness 60; above neutral above avgHappiness 60.

**Worked example:**

Player owns 3 animals: Rabbit (happy=80), Horse (happy=50), Zebra (happy=30).

```
avgHappiness = (80 + 50 + 30) / 3 = 53.33
happyMult    = 0.4 + 53.33/100 = 0.9333
             → clamped to 0.9333  (within [0.5, 1.4] → no clamp needed)
```

At avgHappiness=100 (all animals perfectly happy):
```
happyMult = 0.4 + 1.0 = 1.4  (ceiling clamp applies)
```

At avgHappiness=0 (all animals have zero happiness):
```
happyMult = 0.4 + 0.0 = 0.4  → clamped to 0.5  (floor clamp applies)
```

---

### 4.2 Decay Function

**Named expression:**

For each owned animal k, on every timer tick (interval T = 12,000 ms):

```
hunger[k]  ← clamp( hunger[k]  − D_hunger )
thirst[k]  ← clamp( thirst[k]  − D_thirst )
clean[k]   ← clamp( clean[k]   − D_clean  )
happy[k]   ← clamp( happy[k]   − D_happy  )
trust[k]   unchanged
```

**Variable table:**

| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| `hunger[k]` | int | 0–100 | Current hunger stat for animal k |
| `thirst[k]` | int | 0–100 | Current thirst stat for animal k |
| `clean[k]` | int | 0–100 | Current cleanliness stat for animal k |
| `happy[k]` | int | 0–100 | Current happiness stat for animal k |
| `D_hunger` | int | 6 (fixed) | Hunger decrement per tick |
| `D_thirst` | int | 8 (fixed) | Thirst decrement per tick |
| `D_clean` | int | 5 (fixed) | Cleanliness decrement per tick |
| `D_happy` | int | 3 (fixed) | Happiness decrement per tick |
| `T` | int | 12000 ms (fixed) | Timer interval |

**Output range:** All stats clamped to [0, 100] — they never go negative.

**Worked example (starting from post-feed state):**

An adopted animal at hunger=100 (just fed) after N ticks:

| N ticks | Time elapsed | hunger |
|---------|-------------|--------|
| 0 | 0s | 100 |
| 5 | 60s | 70 |
| 10 | 120s | 40 |
| 16 | 192s | 4 |
| 17 | 204s | 0 (clamped) |

---

### 4.3 Care Action Cost

**Named expression:**

```
actualCost(action, animal) = round( baseCost[action] × (1 + tier[animal] × 0.4) )
```

**Variable table:**

| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| `baseCost[action]` | int | 0–40 | Base Gold cost defined in ACTIONS: feed=40, water=10, clean=20, heal=30, play=0 |
| `tier[animal]` | int | 0–7 | Species tier from ANIMALS[k].tier |
| `actualCost` | int | 0–152 | Gold deducted per action; 0 for play regardless of tier |

**Output range:** [0, 152]. Play is always 0; max is Feed for a Tier 7 animal
(Seal, Sea Lion, Dolphin): round(40 × (1 + 7 × 0.4)) = round(40 × 3.8) = round(152) = 152.

**Worked example (Dolphin, tier=7, feed action):**

```
actualCost = round(40 × (1 + 7 × 0.4))
           = round(40 × 3.8)
           = round(152)
           = 152 🪙
```

**Worked example (Rabbit, tier=0, feed action):**

```
actualCost = round(40 × (1 + 0 × 0.4))
           = round(40 × 1.0)
           = 40 🪙
```

---

### 4.4 XP Grant per Care Action

**Named expression:**

```
xpGrant = XP_PER_CARE_ACTION = 3  (flat, per action, all five actions)
```

**Variable table:**

| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| `XP_PER_CARE_ACTION` | int | 3 (fixed) | Zoo XP awarded per care action tap; registry constant |
| `xpGrant` | int | 3 | Output — same for every action, every species, every tier |

This is the `xp_per_care_action` registry constant (source: `design/gdd/zoo-level.md`,
value: 3). No species, tier, or action type alters the XP award.

**Worked example:** A player performs all 5 care actions on a Dolphin in one session:
```
Total XP = 5 × 3 = 15 Zoo XP
```

---

### 4.5 Happiness Change from Care Actions

Happiness is a direct state variable. It is modified by:
- Decay: −3 per 12s tick (passive drain)
- Play action: +100 (clamped to 100 — effectively sets to max)
- Heal action: +40
- Enrichment (non-action): +18 one-time per level
- No other care action (Feed, Water, Bathe) directly modifies happiness

⚠️ **Design gap**: Feed, Water, and Bathe restore their own stat but do NOT
directly improve happiness. There is no happiness formula combining all stats.
Happiness is a standalone meter that only rises from Play, Heal, or Enrichment.
This is a notable contrast to the `care` tab description in the UI ("Happiness is
the visible outcome") — in the code, happiness is not *derived* from other stats;
it is its own independent metric. See Open Questions OQ-2.

---

## 5. Edge Cases

### EC-1: Action blocked when stat is already full (≥ 98)

**Trigger**: Player taps an action when the target stat is ≥ 98.
**Behavior**: The action is blocked. Flash message: "[Species]'s [stat] is already full!"
No Gold is deducted, no stat change, no XP granted.
**Note**: The threshold is 98, not 100 — a stat at 98 or 99 is treated as "full" to
avoid trivial +2 taps. Exact code: `if (stat && (meters[sel][stat]||0) >= 98)`.

---

### EC-2: Care cost exceeds Gold balance

**Trigger**: Player taps a paid action (Feed/Water/Bathe/Heal) and `gold < actualCost`.
**Behavior**: Action is blocked. Flash message: "Need [cost] 🪙". No deduction, no
stat change, no XP. This is F2 EC-1 applied in C1's `doAction`.

---

### EC-3: Stat reaches 0 (fully depleted)

**Trigger**: Decay continues past the point where the stat would go negative.
**Behavior**: `clamp()` holds the stat at 0. The animal shows the highest-priority
alert status. The `happyMult` reflects the low happiness value in the economy
calculation — income drops toward the 0.5× floor. No special "animal death" or
"animal leaves" mechanic exists in the current implementation.

---

### EC-4: Stat at maximum from enrichment bonus

**Trigger**: `adjust(k, {happy:18, trust:8})` is called when `happy` is already 90+.
**Behavior**: `clamp()` caps the result at 100. The excess is lost (no overflow
carry-forward). This applies to all stat deltas from any source.

---

### EC-5: Offline / backgrounded decay

**Trigger**: Player closes the browser tab or backgrounds the app.
**Behavior**: The `setInterval` in `prototype.jsx` is a browser timer. Browser
tabs that are backgrounded or hidden may have their timers throttled (typically
to 1-second minimum interval, sometimes suspended). There is currently no
timestamp-based elapsed-time calculation on resume — the game does NOT compute
"you were offline for 3 hours, here is what decayed." The offline modal
(`offline` state in `prototype.jsx`) is a placeholder with hardcoded values
and no live computation. **This is a known gap.** See Open Questions OQ-1.

---

### EC-6: New animal has no meters entry yet

**Trigger**: Player navigates to care for an animal whose key is not yet in
the `meters` state object (e.g. tapping an animal before it is formally adopted,
or immediately after an admin unlock).
**Behavior**: `openCare(k)` initializes the meter on-the-spot:
`{ hunger:60, thirst:60, clean:60, happy:64, trust:40 }`. This is a safe
fallback — the animal is never displayed without a meter object.

---

### EC-7: Viral bonus interaction with care

**Trigger**: `tryViral()` checks `avgHappiness ≥ 68` with a 30% chance after any
entertainment activity or VIP event — not after care actions.
**Behavior**: Care actions do not directly trigger the viral bonus. However,
high happiness (maintained through Play/Heal/Enrichment) makes the viral trigger
condition achievable. The viral bonus awards a one-time Gold bonus of
`round(zooRate × 30) + 500` — this is an economy event, not a care event.

---

### EC-8: Trust at 100 (ceiling)

**Trigger**: Play or Heal is performed when `trust` is already 96–100.
**Behavior**: `clamp()` caps trust at 100. The action still costs Gold (for Heal),
still grants 3 XP, and still raises `happy` as normal. Trust accumulation above
the 100 ceiling is silently discarded. No "trust full" flash is shown — only the
happiness full check (`stat: 'happy'`) gates the Play/Heal action, not trust.

---

### EC-9: Decay during tutorial

**Trigger**: The decay `setInterval` runs from the moment `owned` contains animals,
including during the tutorial (`tutStep !== null`).
**Behavior**: Decay is not paused during the tutorial. A tutorial that takes longer
than ~2.5 minutes (the full-drain time for thirst) will naturally deplete the
starter rabbit's thirst, potentially creating unintended tutorial prompts. This
is an unverified risk — the tutorial is short in practice but the gap exists.

---

## 6. Dependencies

### Upstream (C1 reads these)

| System | GDD | Dependency nature |
|--------|-----|-------------------|
| **F1 Animal Database** | `design/gdd/animal-database.md` | Reads `tier` (action cost scaling), `taming` (UI display), `appeal` (enrichment cost), `perform` (show eligibility) — all read-only |
| **F2 Currency System** | `design/gdd/currency-system.md` | Reads `gold` balance for spend checks; writes `gold -= cost` and `xp += 3` per action |
| **F3 Save/Load** | `design/gdd/save-load.md` | The `meters` state (all 5 stats × all owned animals) must be persisted and restored |

### Downstream (these depend on C1)

| System | GDD | What they consume from C1 |
|--------|-----|--------------------------|
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` | Reads `meters[k].happy` for all owned animals to compute `avgHappiness` → `happyMult` → appeal scaling |
| **C3 Zoo Level** | `design/gdd/zoo-level.md` | Each care action calls `setXp(x => x + 3)`; accumulated XP drives level-up |
| **C4 Taming** | `design/gdd/taming.md` *(not yet authored)* | Trust values (`meters[k].trust`) gate taming milestones; Play and Heal are the primary trust-building actions |
| **Fe6 Quests/Missions** | `design/gdd/quests-missions.md` *(not yet authored)* | `counts.feed` and `counts.clean` are incremented per action and read by the QuestTracker component |

---

## 7. Tuning Knobs

All values are in `act/data.jsx` (ACTIONS array and STATS array) or inline in
`prototype.jsx`. They should be moved to a `TUNING` config section in `data.jsx`
before production.

| Knob | Current value | Safe range | Gameplay effect |
|------|---------------|-----------|-----------------|
| **Decay tick interval** | 12,000 ms | 8,000–60,000 ms | How quickly stats drain; lower = more frequent care sessions needed; higher = more idle-friendly |
| **Hunger decay per tick** (`D_hunger`) | 6 | 2–10 | Full-drain time from 100; at 6 it drains in ~3.3 min of active session; major pacing lever |
| **Thirst decay per tick** (`D_thirst`) | 8 | 3–12 | Thirst drains fastest; at 8 it drains in ~2.5 min; should remain faster than hunger to ensure variety |
| **Cleanliness decay per tick** (`D_clean`) | 5 | 2–8 | Habitat hygiene; at 5 drains in ~4 min; slowest of the three basic needs |
| **Happiness decay per tick** (`D_happy`) | 3 | 1–6 | Happiness drains slowest naturally; at 3 it takes ~6.7 min; key C2 economy lever — faster decay punishes neglect more |
| **Feed base cost** | 40 🪙 | 10–100 🪙 | Primary Gold sink from care; scales with tier (×1–×3.8); calibrate alongside zoo income rate |
| **Water base cost** | 10 🪙 | 2–30 🪙 | Cheapest paid action; high-frequency at early game |
| **Bathe base cost** | 20 🪙 | 5–50 🪙 | Mid-cost; less frequent than water |
| **Heal base cost** | 30 🪙 | 10–80 🪙 | Partial happiness restore at cost; competes with free Play |
| **Tier cost multiplier** | 0.4 per tier | 0.1–0.8 | How much more expensive higher-tier animals are to care for; at 0.4 a Dolphin (tier 7) costs 2.8× a Rabbit |
| **Play happiness restore** | +100 (full) | +50–+100 | How much happiness a single Play tap restores; at 100 it sets happy to max |
| **Heal happiness restore** | +40 | +10–+60 | Partial happiness from the paid heal action; should be less than Play's 100 to maintain Play's free value |
| **Play trust bonus** | +4 | +1–+10 | Trust gained per Play tap; trust accumulation rate is a pacing lever for C4 Taming |
| **Heal trust bonus** | +2 | +1–+5 | Trust gained per Heal tap; should be less than Play to reinforce free engagement |
| **Enrichment happiness bonus** | +18 | +5–+30 | One-time happiness boost per enrichment level; too high risks trivializing the care loop |
| **Enrichment trust bonus** | +8 | +2–+15 | One-time trust boost per enrichment level |
| **XP per care action** | 3 | 1–10 | Flat XP per tap; registry constant — changes here require compensating edits to LEVELS anchors in C3 |
| **happyMult floor** | 0.5 | 0.3–0.7 | Minimum appeal multiplier even at 0% happiness; lower = harder neglect penalty; owned by C2 formula |
| **happyMult ceiling** | 1.4 | 1.1–2.0 | Maximum appeal multiplier at 100% happiness; owned by C2 formula |
| **Thriving trust threshold** | 68 | 50–90 | Trust value at which an animal displays "Thriving" status |

---

## 8. Acceptance Criteria

### AC-C1-1: Care action restores the correct stat

**GIVEN** an animal with `hunger = 30` (below max)
**WHEN** the player taps "Feed"
**THEN** `hunger` becomes 100 (clamped), `3 Zoo XP` is awarded, and Gold is
deducted by `round(40 × (1 + tier × 0.4))`. All other stats are unchanged.

---

### AC-C1-2: XP grant is flat 3 per action, all actions

**GIVEN** any owned animal at any stat level, for each of the 5 actions
**WHEN** the action completes successfully (stat not full, gold sufficient)
**THEN** `xp` increases by exactly 3. No action awards more or fewer than 3 XP.

---

### AC-C1-3: Play is free and raises both happiness and trust

**GIVEN** an animal with `happy < 98` and `trust < 100`
**WHEN** the player taps "Play"
**THEN** Gold balance is unchanged, `happy` becomes `min(100, happy + 100)` = 100,
`trust` becomes `min(100, trust + 4)`, and `xp += 3`.

---

### AC-C1-4: Action is blocked when stat is already full

**GIVEN** an animal with `hunger = 98`
**WHEN** the player taps "Feed"
**THEN** a flash message "[Species]'s hunger is already full!" appears, Gold is not
deducted, no XP is awarded, and no stat changes.

---

### AC-C1-5: Action is blocked when Gold is insufficient

**GIVEN** a player with Gold = 39 tapping "Feed" on a tier-0 animal (cost = 40 🪙)
**WHEN** the action is attempted
**THEN** Gold remains 39, flash shows "Need 40 🪙", no stat change, no XP. (F2 EC-1)

---

### AC-C1-6: Decay reduces all stats over time

**GIVEN** an animal at `hunger=100, thirst=100, clean=100, happy=100, trust=50`
**WHEN** 12 seconds elapse (one decay tick)
**THEN** `hunger=94, thirst=92, clean=95, happy=97, trust=50` (trust unchanged).
Tolerances: ±0 (exact integer arithmetic).

---

### AC-C1-7: happyMult contract with C2 Zoo Economy

**GIVEN** owned animals with mean happiness = 60
**WHEN** `happyMult` is computed in `prototype.jsx`
**THEN** `happyMult = 0.4 + 60/100 = 1.0` (neutral multiplier, no clamp needed).
At mean happiness = 100: `happyMult = 1.4`. At mean happiness = 0: `happyMult = 0.5`
(floor clamp). These values must match exactly what C2 `zoo-economy.md` §4 documents.

---

### AC-C1-8: Animal adopts with correct initial stats

**GIVEN** a player adopts any non-starter animal via `confirmBuy`
**WHEN** the adoption is confirmed
**THEN** the animal's meters initialise to `{hunger:60, thirst:58, clean:64, happy:66, trust:30}`.

---

### AC-C1-9: Trust never decays

**GIVEN** any animal with `trust = 65` that has received no Play or Heal actions
**WHEN** any number of decay ticks elapse
**THEN** `trust` remains 65. Trust can only increase, never decrease passively.

---

### AC-C1-10: Thriving status requires trust ≥ 68 with all other needs met

**GIVEN** an animal with `hunger=80, thirst=80, clean=80, happy=80, trust=68`
**WHEN** the Enclosure screen derives its status label
**THEN** the status shown is "Thriving 🌟".

**GIVEN** the same animal but `trust=67`
**WHEN** the Enclosure screen derives its status label
**THEN** the status shown is "Content 😊" (not Thriving).

---

## 9. Open Questions

**OQ-1 — Offline decay behavior (CRITICAL, unimplemented gap)**

The decay `setInterval` only fires while the browser tab is active. There is no
timestamp-based resume calculation. The offline modal in `prototype.jsx` is a
placeholder with hardcoded values ("+5,240 🪙", "+820 XP") — not live computed data.
This means:
1. Offline care degradation is effectively zero (no decay while app is closed).
2. The "while you were away" screen is cosmetically misleading — it shows fake numbers.
3. For an idle game, this is a fundamental behavior gap.

Questions: Should stats decay at a reduced rate while offline (e.g. 50% of active
rate)? Should offline decay be time-bounded to match the idle income cap (8h / 24h VIP)?
Should stats be clamped to a "neglected floor" (e.g. minimum 20) to prevent returning
to a fully-depleted zoo?

*Owner: Fe7 Idle/Offline GDD author + game-designer. Blocking: F3 Save/Load design
(timestamp persistence), Fe7 offline engine design.*

---

**OQ-2 — Happiness is not derived from other stats (design intent gap)**

In the current implementation, `happy` is a standalone meter that only rises from
Play, Heal, or Enrichment. Hunger, Thirst, and Cleanliness have no formula influence
on happiness. The UI copy says "Happiness is the visible outcome" (implying it should
aggregate the other stats), and `data.jsx` STATS entry says "Low hunger cuts happiness
(→ appeal) & XP gain" — but neither of these behaviors exist in the code.

This creates a situation where a perfectly-fed, watered, and clean animal can still
be at 0% happiness (if Play has never been used), which is counter-intuitive and
potentially confusing. Conversely, a player who only plays (never feeds/waters/cleans)
could maintain high happiness while those other stats decay.

Question: Should a derived happiness formula replace or supplement the current
standalone `happy` stat? For example:
`happiness = w_hunger × hunger + w_thirst × thirst + w_clean × clean + w_play × playBonus`

If the formula is added, it changes the happyMult calculation and the C2 interface
contract must be updated.

*Owner: game-designer (design intent decision). Blocked on: creative-director if
it changes core feel.*

---

**OQ-3 — Decay rates are calibrated for active sessions, not idle play**

At current decay rates, a fully-fed animal becomes hungry again in ~3.3 minutes
of active session time. For an idle game intended to be checked in a few times per
day, this means:
1. A player returning after 4 hours will find their animals at floor values regardless
   of when they were last cared for (since all stats hit 0 well within 4 hours of
   active time — though see OQ-1 about whether offline decay even runs).
2. The XP economics of care are affected: if stats drain fast in active play but
   not offline, active players earn care XP much faster than idle players.

Suggested investigation: what is the intended "care session" frequency?
If daily: decay should take ~20+ hours from full. If twice-daily: ~10 hours.
Currently: ~3–7 minutes from full. A 100–1000× calibration adjustment may be needed.

*Owner: game-designer + economy-designer. Input needed from: Fe7 Idle/Offline GDD.*

---

**OQ-4 — Trust threshold for C4 Taming is partially documented in UI but C4 GDD is unwritten**

The care screen shows `TAMING[a.taming]` — difficulty labels and approximate taming
times — but C4 Taming GDD does not yet exist. The `trust` stat accumulates to 100
and the "Thriving" threshold at 68 is documented here, but the full taming
milestone table (e.g. "trust ≥ 40 = tame, trust ≥ 68 = bonded, trust ≥ 90 =
perform-ready") is not implemented. The Performance Arena in the code gates on
`a.perform` (a boolean from F1) but not on a trust threshold check.

*Owner: C4 Taming GDD author. Blocking: any trust-gated content design.*

---

**OQ-5 — No "neglect penalty" mechanic beyond happyMult reduction**

The current design has no explicit consequences for sustained neglect beyond lower
`happyMult` → lower income. There is no animal-leaves mechanic, no sickness system
(the 🤒 icon on the map is cosmetic only), and no escalating penalty. The data.jsx
STATS entry mentions "Low hunger cuts happiness (→ appeal) & XP gain" — but the
XP reduction from low hunger is not in the code.

Question: Is the income reduction (happyMult floor at 0.5×) sufficient neglect
pressure for the target player? Or should sustained neglect trigger a recoverable
"sick" state with a Heal-action requirement?

*Owner: game-designer.*

