# Taming System

> **Status**: Partial — Reverse-Documented
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — taming is the earned bond that makes
>   owning an animal feel real, not just numeric
> **Source files**: `act/prototype.jsx`, `act/proto-screens.jsx`, `act/show-stage.jsx`,
>   `act/data.jsx`, `act/views-train.jsx`
> **Reverse-documentation note**: Taming is PARTIAL. Trust accumulation and its
>   consumption in ShowStage are in the code; the milestone threshold gates (Petting
>   Area check at 40, performer-ready gate) are **documented in data descriptions
>   only — they are NOT enforced in the attraction/activity gate code.** Every
>   PROPOSED section is a gap-fill derived from design intent signals in the code and
>   UI copy, not from implemented logic. Gaps are marked ⚠️.

---

## 1. Overview

The Taming System is a per-animal relationship meter — the `trust` stat — that
accumulates over time through care actions and enrichment, and serves as the
primary gate for deeper player-animal interactions. Each owned animal carries a
`trust` value from 0 to 100, raised by Play (+4 per tap), Health (+2 per tap), and
Enrichment (+8 per level). Trust never decays: once earned it is a permanent record
of the care invested in that animal.

At key trust thresholds the animal unlocks access to visitor-facing Attractions
(Petting Area at trust ≥ 40) and ultimately to the Performance Arena (PROPOSED:
trust ≥ 80, species must be in the `PERFORMERS` list). The `TAMING` lookup table
in `data.jsx` maps a per-species difficulty label (Very Easy → Master) to an
approximate real-time range for reaching full trust, giving each species a distinct
feel without requiring a separate numeric difficulty parameter in formulas.

The system is the bridge between daily care (C1) and late-game content (Fe4
Attractions, Fe5 Performance): you cannot rush it, and that is the point.

---

## 2. Player Fantasy

"This animal knows me."

The taming arc is about earning an animal's trust over days or weeks of consistent
care — not unlocking a stat gate. A Dolphin whose trust meter sits at 95 after
months of daily play sessions feels genuinely different from a newly-adopted one at
30. The heart icon pulsing a little warmer, the "Thriving" status badge, the moment
the Performance Arena spotlight turns on for the first time — these are emotional
payoffs that the system delivers precisely because they cannot be bought or rushed.

This aligns with the **Emotional attachment** pillar stated in `views-doc.jsx`:
"Trust & daily care make players bond with individual animals." The mechanic
deliberately serves the MDA aesthetic of **Fellowship** (connection to a specific
named animal) layered over **Fantasy** (a real animal-keeper bond) and **Discovery**
(the gradual unlocking of new interaction layers).

Self-Determination Theory mapping:
- **Autonomy**: Players choose which animal to invest care in first.
- **Competence**: The trust number provides clear feedback that care is working.
- **Relatedness**: The named animal ("Echo the Dolphin") is the recipient of that
  care — trust makes the bond legible.

---

## 3. Detailed Design

### 3.1 Core Rules

1. **Trust is a per-animal integer in the range [0, 100].** It is stored in the
   `meters[k].trust` field of the React state object, alongside the four decaying
   care stats. It is subject to the same `clamp(n)` helper (capped at 100, floored
   at 0) that governs all stat writes.

2. **Trust never decays.** The decay `setInterval` in `prototype.jsx` applies
   decrements to hunger, thirst, clean, and happy only. Trust is explicitly excluded
   — it is the only meter that is a permanent accumulator.

3. **Initial trust on adoption is 30** for normally-adopted animals (`confirmBuy`).
   The starter Rabbit (FRESH_METERS) also begins at 30. Admin-unlocked animals
   begin at 40 (a convenience for testing). All values are subject to `clamp()`.

4. **Trust sources** (implemented):
   - `play` action: `trust += 4` (via `adjust(sel, {happy:+100, trust:+4})`)
   - `heal` action: `trust += 2` (via `adjust(sel, {happy:+40, trust:+2})`)
   - `addEnrichment(k)`: `trust += 8` (one-time per enrichment level, via
     `adjust(k, {happy:18, trust:8})`)

   ⚠️ `views-train.jsx` describes Play as "+5" and "brush as +2" — these figures
   are design-doc copy that does not match the code (+4 and +2). See Open Questions
   OQ-1.

5. **Taming difficulty (F1 `taming` field)** maps to six named tiers in the
   `TAMING` object in `data.jsx`. The difficulty label controls:
   - The approximate time-to-max-trust displayed in the Care screen UI
   - The Petting Area participant filter (`TAMING[a.taming].rank <= 2`)
   - The player's expectation for how long bonding will take

   It does NOT currently control the per-action trust delta or the threshold values.
   All species gain trust at the same rate per action regardless of taming
   difficulty. The difficulty label reflects the *time investment* implied by the
   taming time range, not a mechanical rate multiplier. ⚠️ This is an open design
   gap — see OQ-2.

6. **Attraction participation gate (IMPLEMENTED — taming-rank based):**
   The Petting Area participant filter in `AttractionsScreen` reads:
   ```js
   has.filter(a => ['Very Easy', 'Easy'].includes(a.taming))
   ```
   This admits species with `TAMING.rank` 1 or 2. It checks the species-level
   `taming` string directly — it does NOT check the individual animal's current
   `trust` value. The `ATTRACTIONS` data entry for petting reads "Needs Trust ≥ 40"
   but this threshold is data-only description; the code does not enforce it.
   ⚠️ See OQ-3.

7. **Performance Arena gate (IMPLEMENTED — species flag based):**
   The Performance Arena and shows participant filter in `AttractionsScreen` reads:
   ```js
   has.filter(a => a.perform)
   ```
   It checks `ANIMALS[k].perform === true` only. It does NOT check the individual
   animal's current `trust` value against any threshold.
   ⚠️ A live trust gate for performance is design intent but not in the code.
   See OQ-3.

8. **Trust affects Show reward (IMPLEMENTED):** `ShowStage` reads live trust values
   and computes a crowd bonus multiplier:
   ```js
   const avg = lineup.reduce((s,a) => s + (meters[a.key]?.trust||50), 0) / N;
   const mult = avg>70 ? 1.5 : avg>50 ? 1.2 : 1.0;
   const stars = avg>78 ? 3 : avg>55 ? 2 : 1;
   ```
   This IS the primary implemented trust-consumption mechanic. High trust = better
   show outcome (more gold, rep, XP). The star rating also appears in the "Thriving"
   status label threshold at trust ≥ 68.

---

### 3.2 States and Transitions

The taming arc for each animal has four logical states. The first two are
IMPLEMENTED (trust value tracked, Thriving label triggered). The latter two are
PROPOSED (threshold gates not enforced in code).

```
Untamed  ─── care actions ───►  Bonding  ─── sustained care ───►
  trust 0–39                    trust 40–67

  ──► Bonded ─── care + eligible species ───► Performer Ready
      trust 68–79                              trust 80–100
      "Thriving" label                         (PROPOSED gate)
      (IMPLEMENTED)
```

| State | Trust range | Label | Mechanics enabled | Implementation |
|-------|------------|-------|-------------------|----------------|
| Untamed | 0–39 | (none / Restless / Content) | Standard care only; excluded from Petting Area if taming rank > 2 | IMPLEMENTED |
| Bonding | 40–67 | Content | Petting Area eligible (if taming rank ≤ 2) per taming-string filter | IMPLEMENTED (taming-string check only, not trust check) |
| Bonded | 68–79 | Thriving 🌟 | "Thriving" status in EnclosureScreen; 1–2 star show performance | IMPLEMENTED |
| Performer Ready | 80–100 | Thriving 🌟 | PROPOSED: unlocks performer training / premium activities / 3-star shows | PROPOSED |

⚠️ The transition from Bonding → Bonded → Performer Ready has no code-enforced
gate on the per-animal trust value for attraction access. The distinction is
currently only cosmetic (the "Thriving" label at 68).

---

### 3.3 Taming Difficulty Scale

The `TAMING` object in `data.jsx` defines six difficulty tiers. Each species carries
one of these labels in its `ANIMALS[k].taming` field.

| Difficulty | Rank | Approx. time | Mechanic notes |
|-----------|------|-------------|----------------|
| Very Easy | 1 | Instant (trust starts at 30, 8 taps to full) | Eligible for Petting Area; earliest animals |
| Easy | 2 | 2–4 hours (active) | Eligible for Petting Area; Tier 1–2 species |
| Medium | 3 | 1–2 days (active) | NOT eligible for Petting Area by taming filter |
| Hard | 4 | 3–5 days (active) | NOT eligible for Petting Area; large savanna animals |
| Expert | 5 | 1–2 weeks (active) | Bears, reptiles, marine — endgame |
| Master | 6 | 3+ weeks (active) | Crocodile only; ultimate taming challenge |

"Active" time above assumes a steady diet of Play taps (+4/tap). At the current
rate (70 points needed from trust=30 to trust=100, at +4/play) any species requires
~18 Play taps, regardless of difficulty tier. The "time" estimates from the TAMING
data table therefore reflect a PROPOSED model where difficulty modulates the trust
gain rate or required threshold — that is not yet implemented. ⚠️ See OQ-2.

Species by taming difficulty (from `ANIMALS` in `data.jsx`):

| Difficulty | Species |
|-----------|---------|
| Very Easy | Rabbit, Chicken, Duck, Dog |
| Easy | Cat, Goat, Sheep, Horse, Donkey, Cow, Turtle |
| Medium | Alpaca, Fox, Monkey, Raccoon, Zebra |
| Hard | Wolf, Giraffe, Rhino, Hippo, Elephant, Seal |
| Expert | Lion, Brown Bear, Polar Bear, Python, Sea Lion, Dolphin |
| Master | Crocodile |

---

### 3.4 Interactions with Other Systems

C4 occupies the middle of the care-to-content pipeline:

| System | Direction | What C4 reads | What C4 writes / gates | Notes |
|--------|-----------|--------------|------------------------|-------|
| **F1 Animal Database** | Upstream | `ANIMALS[k].taming` (difficulty label, rank); `ANIMALS[k].perform` (performer eligibility) | — | Taming difficulty label is the species-level tuning input |
| **F3 Save / Load** | Upstream | `meters[k].trust` (persisted trust value) | `meters[k].trust` (must be saved; trust represents long-term investment) | F3 is unimplemented ⚠️ |
| **C1 Animal Care** | Upstream | — | Receives `trust` delta from Play (+4), Heal (+2), Enrichment (+8) via `adjust()` calls in C1 | Trust is a C1 side-effect |
| **Fe4 Attractions** | Downstream | `ANIMALS[k].taming` string (Petting Area filter) | Gates which animals appear in Petting Area participant list | Trust value NOT checked — only taming string |
| **Fe5 Performance** | Downstream | `meters[k].trust` (ShowStage crowd-bonus formula) | Show reward multiplier (1.0–1.5×) and star rating (1–3★) | Trust actively consumed by show formula |
| **P3 Care Screen** | Downstream | `meters[k].trust`, `TAMING[a.taming]` | Displays trust bar + taming difficulty chip | Display only |
| **P5 Attractions Screen** | Downstream | `ANIMALS[k].perform`, `ANIMALS[k].taming` | Participant list for each attraction | Display gate; no live trust threshold check |

---

## 4. Formulas

### 4.1 Trust Gain per Care Action (IMPLEMENTED)

```
trust_new = clamp( trust_old + delta_trust )
```

where `delta_trust` depends on the action:

| Action | delta_trust | Notes |
|--------|------------|-------|
| Play | +4 | Free action; primary trust builder |
| Health | +2 | Paid action (30 🪙 base × tier); secondary builder |
| Enrichment (any level) | +8 | One-time-per-level gold spend; one-shot boost |
| Feed | 0 | No trust effect |
| Water | 0 | No trust effect |
| Bathe | 0 | No trust effect |

**Variable table:**

| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| `trust_old` | int | 0–100 | Current trust before action |
| `delta_trust` | int | 0, 2, 4, 8 | Increment based on action type |
| `trust_new` | int | 0–100 | Post-clamp result |

**Worked example (Rabbit, starting at trust=30):**

Full path to trust=100 via Play only:
- Taps needed: ceil((100 − 30) / 4) = 18 Play taps
- Each Play tap restores happy to max (free action)
- Total Play taps for any species from adoption: ceil((100 − 30) / 4) = **18 taps**

With a mix of Play + Heal (at 2:1 ratio):
- 12 Play (+48) + 6 Heal (+12) = +60 → trust 30 + 60 = 90 in 18 actions
- 15 Play (+60) + 3 Heal (+6) = +66 → trust 30 + 66 = 96 in 18 actions

With enrichment boosts (e.g., 3 levels of enrichment applied):
- +24 from enrichment → reduces remaining play taps to ceil((100 − 30 − 24) / 4) = 12 taps

---

### 4.2 Time-to-Tame Estimate (PROPOSED — not in code)

⚠️ **This formula is PROPOSED. The `TAMING` time ranges are data descriptions only.
No code applies a per-species trust rate modifier. This is the gap-fill formula
needed to make the TAMING table mechanically true.**

If implemented, a species-level trust rate multiplier would work as follows:

```
trust_gain_per_play = BASE_TRUST_PER_PLAY × (1 / TAMING[species.taming].rank)
```

Alternatively (simpler, less severe): a required-trust threshold per species:

```
TAMING_THRESHOLD[species] = BASE_TAMING_THRESHOLD × TAMING[species.taming].rank_mult
```

where `rank_mult` could be:

| Difficulty | Rank | Suggested rank_mult | Threshold (if BASE = 40) |
|-----------|------|-------------------|--------------------------|
| Very Easy | 1 | 0.5 | 20 (instantly tamed near adoption) |
| Easy | 2 | 1.0 | 40 |
| Medium | 3 | 1.5 | 60 |
| Hard | 4 | 2.0 | 80 |
| Expert | 5 | 2.25 | 90 |
| Master | 6 | 2.5 | 100 |

This would make the taming label mechanically meaningful: a Crocodile (Master) only
unlocks Bonded state at trust=100, while a Dog (Very Easy) is Bonded at trust=20.
**This is PROPOSED — requires design decision before implementation.** See OQ-2.

---

### 4.3 Show Crowd Bonus (IMPLEMENTED — trust-consuming formula)

From `show-stage.jsx`:

```
avg_trust   = Σ(meters[a.key].trust) / N   (default 50 if trust missing)
crowd_mult  = 1.5  if avg_trust > 70
            = 1.2  if avg_trust > 50
            = 1.0  otherwise
star_rating = 3    if avg_trust > 78
            = 2    if avg_trust > 55
            = 1    otherwise

show_reward   = round( Σ(a.appeal × 6) × crowd_mult )   [gold]
show_rep      = star_rating × 3
show_xp       = star_rating × 40
```

**Variable table:**

| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| `meters[a.key].trust` | int | 0–100 | Trust value of each performer in the lineup |
| `N` | int | 1–6 | Number of performers in the lineup |
| `avg_trust` | float | 0–100 | Arithmetic mean trust across the lineup |
| `crowd_mult` | float | 1.0–1.5 | Reward multiplier; three discrete tiers |
| `star_rating` | int | 1–3 | Show quality indicator |
| `a.appeal` | int | 30–3000 | Base appeal of the performer species |
| `show_reward` | int gold | varies | Gold earned from the show |
| `show_rep` | int | 3–9 | Reputation earned |
| `show_xp` | int | 40–120 | Zoo XP earned |

**Worked example — Dolphin solo show (appeal=3000, trust=80):**
```
avg_trust  = 80
crowd_mult = 1.5  (80 > 70)
star_rating = 3   (80 > 78)

show_reward = round(3000 × 6 × 1.5) = round(27,000) = 27,000 🪙
show_rep    = 3 × 3 = 9
show_xp     = 3 × 40 = 120
```

**Worked example — Dog solo show (appeal=30, trust=45):**
```
avg_trust  = 45
crowd_mult = 1.0  (45 not > 50)
star_rating = 1   (45 not > 55)

show_reward = round(30 × 6 × 1.0) = 180 🪙
show_rep    = 1 × 3 = 3
show_xp     = 1 × 40 = 40
```

This formula confirms trust matters most for high-appeal species: a Dolphin's show
reward at max trust is 1.5× its minimum, a 9,000 gold difference per run.

---

### 4.4 Trust Thresholds Summary (IMPLEMENTED + PROPOSED)

| Trust value | Effect | Status |
|------------|--------|--------|
| ≥ 40 | `ATTRACTIONS` data says "Needs Trust ≥ 40" for Petting Area | DATA ONLY — not enforced in code |
| ≥ 50 | ShowStage: crowd_mult = 1.2× | IMPLEMENTED |
| ≥ 55 | ShowStage: star_rating = 2★ | IMPLEMENTED |
| ≥ 68 | EnclosureScreen: "Thriving 🌟" status label | IMPLEMENTED |
| > 70 | ShowStage: crowd_mult = 1.5× | IMPLEMENTED |
| > 78 | ShowStage: star_rating = 3★ | IMPLEMENTED |
| ≥ 80 | PROPOSED: Performer-ready gate (enable premium activities) | PROPOSED |
| 100 | Maximum; no further effect beyond show bonus | IMPLEMENTED (clamp) |

---

## 5. Edge Cases

### EC-1: Trust at ceiling (100)

**Trigger:** Play or Heal is performed when `trust` is at 96–100.
**Behaviour:** `clamp()` caps trust at 100. The action still completes normally:
gold is deducted for Heal, happy is raised, 3 XP is granted. No "trust full" UI
feedback is shown — only the `happy >= 98` check gates the Play/Heal actions, not
a trust-full check. Excess trust delta is silently discarded.
**Design note:** No penalty for over-investing in a fully-trusted animal. This is
correct — the player is still maintaining the bond, not wasting effort.

---

### EC-2: Trust at initial value (30) — newly adopted animal

**Trigger:** Player adopts a new animal.
**Behaviour:** Trust initialises to 30 via `confirmBuy`: `{hunger:60, thirst:58, clean:64, happy:66, trust:30}`. The animal is immediately NOT in "Untamed" state at 0 — it begins partway through the Bonding arc. This reflects "you've just met" rather than "you are a total stranger."
**For Very Easy species (Dog, Rabbit):** Starting at trust=30, only 10 taps of Play
are needed to reach trust=70 (crowd_mult threshold) and 18 to reach trust=100.
**For Master species (Crocodile):** Same 18-tap mechanical path to trust=100, but
per the PROPOSED difficulty model, the meaningful Bonded threshold would be trust=100
anyway, so the journey feels harder and longer even without a rate multiplier.

---

### EC-3: Selling or removing an animal

**Trigger:** ⚠️ No sell/remove mechanic exists in the current implementation.
**Behaviour:** If a future version adds a sell mechanic, the trust value for that
species should be treated as follows: if the player re-adopts the same species later
(another Dolphin), the trust should reset to the adoption default (30), not inherit
the previous animal's trust. Trust is a bond with a specific animal, not a species
mastery score. The save-state implication: the `meters[k]` entry should be removed
from the save blob when an animal is removed from the zoo.

---

### EC-4: Trust when F3 Save/Load is not implemented

**Trigger:** Player closes the browser tab or refreshes the page.
**Behaviour:** ⚠️ F3 Save/Load is NOT implemented. All state — including trust values
— is lost on session end. For a system whose primary value proposition is "investment
over days and weeks," this is a critical gap: a player who invests 30 Play sessions
building trust loses all progress on refresh. Until F3 is implemented, taming as a
long-term mechanic is non-functional.
**Mitigation:** F3 must be implemented before trust-gated content is surfaced to
real players.

---

### EC-5: taming='Very Easy' species — instantaneous taming design intent vs. code reality

**Trigger:** Very Easy species (Rabbit, Chicken, Duck, Dog) have TAMING entry
`time: 'instant'` and note `'Tames on adopt.'`
**Behaviour in code:** These species adopt with trust=30, the same as any other
species. There is no code that auto-sets trust to 100 on adoption of a Very Easy
species. The "instant" description is design intent, not implementation. If the
intent is that Very Easy species are immediately fully tamed at adoption, trust
should be initialised to 100 (or the Bonded threshold) in `confirmBuy` for those
species.
⚠️ See OQ-4.

---

### EC-6: Multiple performers at different trust levels in one show

**Trigger:** ShowStage is called with a lineup of 2–6 performers with mixed trust
values (e.g., Dolphin at trust=90, Dog at trust=40).
**Behaviour (IMPLEMENTED):** `avg_trust` is computed as the arithmetic mean across
all performers. In the example: avg = (90 + 40) / 2 = 65. `crowd_mult` = 1.2×
(65 > 50 but not > 70); star_rating = 2★ (65 > 55 but not > 78). A low-trust
performer dilutes the show quality. This creates a natural incentive to only field
fully-bonded performers.

---

### EC-7: taming='Master' (Crocodile) reaching trust=100 — no post-max content

**Trigger:** Player invests in taming Crocodile (Master tier) to trust=100.
**Behaviour:** Crocodile has `perform: false`. Trust=100 unlocks the "Thriving"
label and raises the show bonus if used in a show (it cannot be — `perform=false`).
No special reward or acknowledgement exists in the current code for fully taming
a Master-difficulty species. The player invests 18+ Play taps over weeks and the
only payoff is the "Thriving" badge. This is a known design gap: Master-level taming
should have a distinct reward. See OQ-5.

---

### EC-8: Trust of 0 (fully untrusted)

**Trigger:** Technically reachable only via admin manipulation; normal adoption
starts at trust=30 and trust never decays.
**Behaviour:** An animal at trust=0 is in Untamed state. It shows a Content or
Restless label (not Thriving). In a show it contributes a 1.0× crowd_mult (default
50 assumed if trust missing, but if explicitly 0: 0 is not > 50, so mult = 1.0).
No crash or undefined state results; `clamp()` handles the 0 floor correctly.

---

## 6. Dependencies

### Upstream (C4 depends on these)

| System | GDD | Dependency nature |
|--------|-----|-------------------|
| **F1 Animal Database** | `design/gdd/animal-database.md` | Owns `ANIMALS[k].taming` (difficulty label for species), `ANIMALS[k].perform` (performer flag). C4 reads both as species-level taming parameters. Any change to TAMING object keys or species taming assignments must be reviewed against C4. |
| **F3 Save / Load** | `design/gdd/save-load.md` | Trust values in `meters[k].trust` must be persisted and restored. Trust is a long-term investment metric — loss on session end breaks the core taming value proposition. F3 is NOT YET IMPLEMENTED ⚠️. |
| **C1 Animal Care** | `design/gdd/animal-care.md` | All trust accumulation happens via C1's care action dispatcher (`doAction`) and enrichment (`addEnrichment`). C4 is a passive accumulator — it does not have its own action; it only reads and gates. Changes to trust deltas in ACTIONS must be reflected here. |

### Downstream (systems that depend on C4)

| System | GDD | What they consume from C4 |
|--------|-----|--------------------------|
| **Fe4 Attractions System** | `design/gdd/attractions.md` (not yet authored) | Petting Area participant filter reads `ANIMALS[k].taming` (rank ≤ 2 check). PROPOSED: should also read `meters[k].trust >= threshold`. |
| **Fe5 Performance System** | `design/gdd/educational-shows.md` (not yet authored) | ShowStage reads `meters[a.key].trust` live for every performer to compute crowd_mult, star_rating. Performance Arena participant gate reads `ANIMALS[k].perform`. PROPOSED: should gate on `meters[k].trust >= PERFORM_TRUST_THRESHOLD`. ⚠️ Until that GDD exists, the **show-reward economy formula** it would own (`show_reward`, `show_rep`, `show_xp`, crowd-mult tiers) is **interim-documented and owned by this Taming GDD** — see §3.1/§4.3 and the ownership note in §6. |
| **P3 Care Screen** | — | Displays the trust bar (❤️) and the taming difficulty chip (`TAMING[a.taming]`). Display-only read of `meters[k].trust` and `ANIMALS[k].taming`. |
| **P5 Attractions Screen** | — | Filters participant lists using `ANIMALS[k].taming` and `ANIMALS[k].perform`. Display-only. |

**Bidirectional consistency notes:**
- `design/gdd/animal-database.md §5` lists C4 as a downstream consumer of `F1.taming`.
  This is correct — F1 owns the taming label, C4 consumes it.
- `design/gdd/animal-care.md §3.6` lists C4 as a downstream consumer of C1, noting
  that trust deltas flow from `adjust()` calls in C1. This is correct.
- When Fe4 Attractions GDD is authored, it must note: "C4 Taming gates Petting Area
  participant eligibility via `ANIMALS[k].taming` rank check."
- **Show-reward formula ownership (interim).** The show economy formula
  (`show_reward = round(Σ appeal × 6 × crowd_mult)`, `show_rep`, `show_xp`, the crowd-mult
  tiers at trust 50/70, and the 1–3★ star rating) is documented in §3.1 / §4.3 of THIS
  GDD. Because the Fe5 Performance GDD (`educational-shows.md`) does not yet exist and
  `attractions.md` defers show detail to it, **C4 Taming is the interim owning document
  for this formula** — it feeds C2 Zoo Economy (gold) and C3 Zoo Level (XP), so it must
  not be left ownerless. When the Fe5 Performance GDD is authored, it **inherits** this
  ownership and must note: "C4 Taming gates show reward quality via live trust values in
  `meters[k].trust`," and the formula body should move there with a back-reference here.

---

## 7. Tuning Knobs

Values currently live in `act/data.jsx` (ACTIONS array, TAMING object) and inline
in `act/prototype.jsx` (`addEnrichment`) and `act/show-stage.jsx`. They should be
consolidated into a `TUNING` section of `data.jsx` before production.

| Knob | Current value | Category | Safe range | Gameplay effect | What breaks at extremes |
|------|--------------|----------|-----------|-----------------|------------------------|
| **Play trust delta** | +4 per tap | Feel | +1 to +10 | Primary trust gain rate; at +4, 18 taps reach trust=100 from 30 | Too high → trust feels trivial; too low → grind without reward feeling |
| **Heal trust delta** | +2 per tap | Feel | +1 to +5 | Secondary trust gain (paid action); at +2, always less than Play to keep free Play valuable | At +5 or above, Heal overtakes Play as trust builder |
| **Enrichment trust delta** | +8 per level | Feel | +2 to +15 | One-time boost per level; 3 levels = +24 trust, saving ~6 Play taps | Too high (>20) trivializes taming for high-enrichment players; too low feels unrewarding |
| **Initial trust on adoption** | 30 | Gate | 0 to 50 | Starting trust for non-starter animals; at 30, Bonded state requires 10 more Play taps (Very Easy) to ~18 (any) | At 0: all species start fully untamed; at 50: Very Easy species are near-Bonded on arrival |
| **Thriving threshold** | 68 | Gate | 50–90 | The trust value that triggers the "Thriving" status label and signals readiness for shows | Too low: badge meaningless; too high: most animals never achieve it |
| **Show crowd_mult tier 1** | avg_trust > 50 → 1.2× | Curve | avg 40–60 | Lower tier for moderate show quality | Too low: trivially achievable; too high: show bonus unreachable for early-game players |
| **Show crowd_mult tier 2** | avg_trust > 70 → 1.5× | Curve | avg 60–80 | Upper tier; max show bonus | Too low: easy to achieve; too high: only Performer Ready animals can unlock it |
| **Show star_rating tier 1** | avg_trust > 55 → 2★ | Curve | avg 40–65 | 2-star show threshold | See crowd_mult notes |
| **Show star_rating tier 2** | avg_trust > 78 → 3★ | Curve | avg 65–90 | 3-star show threshold | Above 85: only max-trust animals achieve 3 stars |
| **Petting Area taming gate** | rank ≤ 2 (Very Easy/Easy) | Gate | rank ≤ 1–3 | Which species-difficulty tiers can participate in the Petting Area | Too permissive: Hard/Expert animals in Petting Area contradicts "safe interaction" feel |
| **PROPOSED: Performer trust threshold** | 80 (proposed) | Gate | 70–95 | Trust level required to be a qualified performer | Too low: players can show with barely-bonded animals; too high: months of grinding required |
| **PROPOSED: Per-species taming rate mult** | 1.0 (all equal, proposed: 1/rank) | Curve | 0.25–1.0 | Scales trust delta by difficulty | Not implemented; would make Master species take ~4× longer to tame than Very Easy |

---

## 8. Acceptance Criteria

### AC-C4-1: Trust initialises correctly on adoption

**GIVEN** a player adopts any non-starter animal via `confirmBuy`
**WHEN** the adoption is confirmed
**THEN** `meters[k].trust` is exactly 30, matching the adoption initialization in `prototype.jsx`.

---

### AC-C4-2: Play action raises trust by exactly 4

**GIVEN** an owned animal with `trust = 50` and `happy < 98`
**WHEN** the player taps "Play"
**THEN** `trust` becomes exactly 54 (50 + 4), `happy` becomes `min(100, happy + 100)` = 100, and 3 Zoo XP is awarded. No Gold is deducted.

---

### AC-C4-3: Heal action raises trust by exactly 2

**GIVEN** an owned animal with `trust = 50` and `happy < 98`
**WHEN** the player taps "Health"
**THEN** `trust` becomes exactly 52 (50 + 2), `happy` becomes `min(100, happy + 40)`, and 3 Zoo XP is awarded. Gold is deducted by `round(30 × (1 + tier × 0.4))`.

---

### AC-C4-4: Enrichment raises trust by exactly 8

**GIVEN** an owned animal with `trust = 60` and sufficient Gold
**WHEN** the player purchases the next Enrichment level via `addEnrichment(k)`
**THEN** `trust` becomes exactly 68 (60 + 8) and `happy` increases by 18. Gold is deducted by the enrichment cost formula.

---

### AC-C4-5: Trust never decays

**GIVEN** any owned animal with `trust = 65`
**WHEN** any number of decay ticks elapse (hunger/thirst/clean/happy all drain)
**THEN** `trust` remains exactly 65. Trust can only increase; it never decreases passively.

---

### AC-C4-6: Trust clamps at 100

**GIVEN** an owned animal with `trust = 98`
**WHEN** the player taps "Play" (+4)
**THEN** `trust` is clamped to 100, not 102. No error is thrown. No "trust full" message is shown (the action succeeds normally via the `happy` gate).

---

### AC-C4-7: Thriving status requires trust >= 68

**GIVEN** an animal with all care stats above their alert thresholds (hunger≥35, thirst≥35, clean≥40, happy≥50) and `trust = 68`
**WHEN** the Enclosure screen derives the status label
**THEN** the label shown is "Thriving 🌟".

**GIVEN** the same animal but `trust = 67`
**WHEN** the Enclosure screen derives the status label
**THEN** the label shown is "Content 😊" (not Thriving).

---

### AC-C4-8: Petting Area admits only Very Easy and Easy animals

**GIVEN** the Petting Area attraction is built
**WHEN** the participant list for the Petting Area is computed in `AttractionsScreen`
**THEN** only owned animals whose `ANIMALS[k].taming` value is 'Very Easy' or 'Easy' appear in the list. Animals with taming 'Medium', 'Hard', 'Expert', or 'Master' are excluded regardless of their current trust value.

---

### AC-C4-9: Show reward scales correctly with trust

**GIVEN** a performance show lineup of one Dolphin (appeal=3000) with `trust = 80`
**WHEN** `ShowStage` computes the result
**THEN** `crowd_mult = 1.5` (80 > 70), `star_rating = 3` (80 > 78), `show_reward = round(3000 × 6 × 1.5) = 27,000 🪙`, `show_rep = 9`, `show_xp = 120`.

**GIVEN** the same Dolphin with `trust = 45`
**WHEN** `ShowStage` computes the result
**THEN** `crowd_mult = 1.0` (45 not > 50), `star_rating = 1` (45 not > 55), `show_reward = round(3000 × 6 × 1.0) = 18,000 🪙`.

---

### AC-C4-10: Performance Arena shows only performer-eligible animals

**GIVEN** the Performance Arena attraction is built
**WHEN** the participant list for the Performance Arena is computed in `AttractionsScreen`
**THEN** only owned animals where `ANIMALS[k].perform === true` appear. This currently admits: Dog, Monkey, Elephant, Seal, Sea Lion, Dolphin — and no other species.

---

## 9. Open Questions

**OQ-1 — Play trust delta: +4 in code vs "+5" in design doc copy**
*(Owner: game-designer; Priority: Low)*

`act/views-train.jsx` reads: "Builds via Play (+5), brush (+2), daily streaks."
The code in `act/data.jsx` ACTIONS defines `play: { effect: {happy:+100, trust:+4} }`.
This is a +4 vs +5 discrepancy. Additionally, "brush" is referenced in the design
doc but no "brush" action exists — the Heal (+2 trust) action is named "Health" in
the code. The design-doc copy pre-dates the final action set.

Decision needed: Is the intended trust gain +4 or +5 per Play tap? Should Heal be
renamed "Brush" in the UI? Update the ACTIONS data and this GDD to match the
confirmed values before production.

---

**OQ-2 — Taming difficulty has no mechanical rate effect (PARTIAL, design gap)**
*(Owner: game-designer; Priority: High)*

The `TAMING` difficulty tiers (Very Easy through Master) have approximate taming
times ranging from "instant" to "3+ weeks," but all species gain trust at the same
flat rate (+4/play, +2/heal). A Crocodile (Master) takes the same 18 Play taps to
reach trust=100 as a Rabbit (Very Easy).

Options to close this gap:
A. **Variable threshold per difficulty**: Petting/Bonded/Performer thresholds scale
   with taming rank (proposed in Formula 4.2). No rate change; the destination moves.
B. **Variable rate per difficulty**: Trust delta is divided by rank
   (Very Easy: +4/tap → Master: +0.67/tap). More realistic but creates decimal values.
C. **Status quo with better labelling**: Remove the time-range copy from TAMING
   and treat the label as flavour only. Simplest — honest about the current state.

Option A is recommended: it keeps the formula simple, makes difficulty labels
mechanically true, and gives Master species a genuine long-term arc without
introducing fractional trust values.

*Blocked by: creative-director sign-off on which option to implement.*

---

**OQ-3 — Trust threshold gates are data descriptions, not code enforcement (PARTIAL)**
*(Owner: gameplay-programmer; Priority: High — blocking Fe4/Fe5 design)*

The `ATTRACTIONS` data for Petting Area says "Needs Trust ≥ 40" and the Performance
Arena description says "Trained, high-trust animals." Neither threshold is enforced
in the attraction participant filters, which use `taming` string and `perform` flag
only.

What needs to be built:
1. **Petting Area:** Add a per-animal trust check: `meters[k].trust >= PETTING_TRUST_THRESHOLD`
   (proposed: 40) in the `AttractionsScreen` `participants('petting')` filter,
   in addition to the existing taming-string check.
2. **Performance Arena:** Add a per-animal trust check: `meters[k].trust >= PERFORM_TRUST_THRESHOLD`
   (proposed: 80) in the `participants('perform')` filter.
3. **Trust threshold constants** should be declared in a `TUNING` block in `data.jsx`
   and referenced by both the participant filters and this GDD.

*Blocked by: design decision on threshold values (proposed 40 / 80 respectively).*

---

**OQ-4 — Very Easy species should auto-tame on adoption ("tames on adopt")**
*(Owner: game-designer + gameplay-programmer; Priority: Medium)*

The `TAMING['Very Easy']` entry carries `time: 'instant'` and `note: 'Tames on adopt.'`
This implies Rabbit, Chicken, Duck, and Dog should have trust=100 (or trust=BONDED_THRESHOLD)
at the moment they are adopted — not trust=30 like all other species.

If this intent is confirmed, `confirmBuy` should initialise meters with
`trust: (TAMING[AA[k].taming].rank === 1 ? 100 : 30)`. This would make the
Petting Area immediately accessible for Very Easy species without any Play actions.

Decision: should Very Easy species auto-tame, or does the player still need to
invest a small amount of care to "earn" the Petting Area access even for easy animals?

*Owner: game-designer. Input: C1 team (care loop feel).*

---

**OQ-5 — No reward for fully taming Master-difficulty species (design gap)**
*(Owner: game-designer; Priority: Medium)*

The Crocodile (Master difficulty) reaching trust=100 has `perform: false`, meaning
it cannot participate in shows. The only acknowledgement of this achievement is the
"Thriving" label (shared with any trust=68+ animal). There is no special animation,
badge, achievement, or unlock to mark the completion of the hardest taming arc in
the game.

Proposal: Fully taming a Master species should trigger a unique milestone event —
a special animation, a title ("Master Tamer"), or a unique visitor reaction. This is
especially important for long-term player retention around the D60–D90 goal horizon.

*Owner: game-designer. Coordinate with UX designer for the acknowledgement moment.*

---

**OQ-6 — Weekly activity "Raise 1 animal to max trust" uses undefined threshold**
*(Owner: game-designer; Priority: Low)*

`data.jsx ACTIVITIES.weekly` contains: `'Raise 1 animal to max trust'`. "Max trust"
is trust=100, but there is no quest objective of type `{t:'trust', n:100}` defined
in the `QUESTS` or `VIP_SERVICES` arrays. The weekly activity is display-only copy
and is not tracked in the `counts` object in `prototype.jsx`.

This weekly mission needs a formal quest implementation: a `{t:'trust', n:100}` or
equivalent objective type with tracking in `counts`. It also needs to resolve whether
"max trust" means trust=100 or trust=PERFORMER_THRESHOLD (PROPOSED: 80).

*Owner: Fe6 Quests/Missions GDD author.*
