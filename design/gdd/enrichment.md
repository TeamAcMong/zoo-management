# Enrichment System

> **Status**: In Design (Reverse-Documented)
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — enrichment is the player expressing care for an animal beyond basic survival needs; it deepens the bond and rewards investment with visible economic returns
> **Source files**: `act/prototype.jsx` (`enrich` state, `enrLvOf`, `addEnrichment`, `appealOf`), `act/proto-screens.jsx` (`EnclosureScreen`, enrichment button and cost expression), `act/data.jsx` (ANIMALS, appeal values referenced by enrichment cost)
> **Reverse-documentation note**: Every value, formula, and behavior in this document was extracted from the running implementation as of 2026-06-06. No mechanics were invented. Where the code is silent — in particular the enrichment level cap — this is called out explicitly in Open Questions and Edge Cases.

---

## 1. Overview

The Enrichment System is a per-species, per-level Gold sink that lets the player add
stimulating toys and structures to an enclosure. Each enrichment purchase raises the
species' appeal contribution by +10% of its current appeal (applied as a multiplicative
factor `(1 + 0.10 × enrLv)`), immediately boosts the animal's Happiness (+18) and
Trust (+8), and advances the enrichment level for that species by one. Enrichment
is triggered from the Enclosure screen alongside the "Upgrade" (Fe2 Habitat System)
and "Buy More" (Fe1 Animal Collection) buttons — it is a third spending path inside
the same screen, representing a deeper investment in an animal already owned.

Unlike enclosure upgrades, which are permanent infrastructure improvements, enrichment
is framed as an ongoing enrichment activity ("Tunnel maze", "Splash pond", "Rope
course"). The cost scales with each subsequent level, creating a familiar sink-escalation
curve. The appeal bonus and the immediate Happiness+Trust boost are the two payoffs:
the first feeds the C2 Zoo Economy chain (more appeal → more visitors → more Gold/sec);
the second accelerates C4 Taming milestones and lifts the C2 `happyMult` multiplier.

The system is intentionally simpler than Fe2 (Habitat System): it has one button,
one cost formula, and one benefit curve. It is a depth layer added on top of Fe2,
not a replacement for it.

---

## 2. Player Fantasy

"My Dolphin enclosure is already at Level 3. I added floating toys — and now the
appeal number jumped again and Echo is back to full happiness."

Enrichment is the luxury decision: the player has already upgraded the enclosure and
bought more copies; now they are making the space *better* for the animals that live
in it. It feels like going beyond the minimum — not just keeping animals alive, but
giving them something to do. The gold spend feels justified because the feedback is
immediate: the appeal number ticks up, the flash says "Enrichment Lv 2 — happier
& more appealing!", and the animal's status may shift from "Content" to "Thriving".

The per-species enrichment item names ("Tunnel maze" for Rabbit, "Splash pond" for
Duck, "Scent boxes" for Lion, "Floating toys" for Dolphin) are a small act of
world-building: each item is species-appropriate, reinforcing the fantasy that the
player knows and cares for each individual animal.

This mechanic primarily serves:
- **MDA Fantasy**: "I am a skilled, attentive zookeeper who goes beyond basic needs."
- **MDA Challenge**: "I need to choose between enriching this enclosure or upgrading
  the next one — I cannot do both right now."
- **SDT Competence**: The appeal number visibly rises; the cause is clear.
- **SDT Autonomy**: The player chooses the order and timing of enrichment investment
  across all owned species.

---

## 3. Detailed Rules

### 3.1 Enrichment State

Enrichment level per species is tracked in the `enrich` React state object in
`prototype.jsx`, keyed by animal key:

```js
const [enrich, setEnrich] = useState({});  // enrichment level per species
```

**Initial state**: `{}` — all species start with no enrichment. `enrLvOf(k)` returns
`enrich[k] || 0`, so the default level is 0 (no enrichment applied).

**State shape**: `{ [animalKey: string]: number }` — a sparse map from species key
to integer enrichment level. Keys are only present after the first enrichment purchase
for that species.

---

### 3.2 The Enrichment Action (`addEnrichment`)

The full handler from `prototype.jsx` line 205:

```js
function addEnrichment(k) {
  const lv = enrLvOf(k);
  const cost = Math.round((AA[k].appeal || 1) * 40 * (lv + 1)) + 200;
  if (gold < cost) { flash(`Need ${cost.toLocaleString()} 🪙`); return; }
  pay(cost);
  setEnrich(e => ({ ...e, [k]: lv + 1 }));
  adjust(k, { happy: 18, trust: 8 });
  zbeep(720, 0.12, 'triangle', 0.14);
  flash(`✨ ${AA[k].species} enrichment Lv ${lv + 1} — happier & more appealing!`);
}
```

**Step-by-step execution:**

1. Read `lv = enrLvOf(k)` — the current enrichment level (0 on first purchase).
2. Compute `cost = round(appeal[k] × 40 × (lv + 1)) + 200`.
3. **Gold check**: if `gold < cost`, show flash "Need X 🪙" and return. No state change.
4. `pay(cost)` — deduct Gold via `setGold(g => g − cost)`, spawn floating "-X 🪙" FX.
5. `setEnrich(e => ({ ...e, [k]: lv + 1 }))` — increment enrichment level by 1.
6. `adjust(k, { happy: 18, trust: 8 })` — apply +18 to `meters[k].happy` and +8
   to `meters[k].trust`, both clamped to [0, 100].
7. Audio feedback and flash toast.

**Triggers**: The "✨ Enrichment · [toy name]" button in `EnclosureScreen`. The button
is visually dimmed (`opacity: 0.6`) when `gold < ecost`, but it is still tappable —
the Gold check inside `addEnrichment` is the authoritative guard.

**Enrichment does not grant XP**. This distinguishes it from care actions (C1) which
grant 3 XP each. Enrichment is purely an economy/appeal investment.

---

### 3.3 Per-Species Enrichment Item Names

The `TOYS` lookup inside `EnclosureScreen` maps species keys to a display name for
the enrichment item. This is cosmetic only — it does not affect any formula.

| Species | Enrichment item |
|---------|----------------|
| Rabbit | Tunnel maze |
| Chicken | Peck garden |
| Duck | Splash pond |
| Dog | Agility hoops |
| Cat | Climbing tree |
| Goat | Balance bridge |
| Horse | Open paddock |
| Lion | Scent boxes |
| Dolphin | Floating toys |
| Sea Lion | Ball play |
| Monkey | Rope course |
| All others | Play set (fallback) |

---

### 3.4 Appeal Payoff

After enrichment, `enrLvOf(k)` returns the new level, and `appealOf(k)` in
`prototype.jsx` line 61 immediately reflects the new level on the next render:

```js
const appealOf = (k) =>
  (AA[k] ? AA[k].appeal : 0) * cntOf(k) * multOf(k) * (1 + 0.10 * enrLvOf(k));
```

The enrichment factor `(1 + 0.10 × enrLv)` is the rightmost term, applied after the
enclosure upgrade multiplier `multOf(k)`. Both multipliers are applied to the same
`baseAppeal × count` base, and they compose multiplicatively — see §4 for the full
appeal formula.

---

### 3.5 Interaction with C2 Zoo Economy

On the next gold income tick (every 1 second in active session), the enriched
species' higher `appealOf(k)` contribution is automatically included in the total
zoo appeal sum:

```
totalAppeal = Σ appealOf(k) × happyMult
```

This means the Gold-income benefit of enrichment is live and continuous — not a
one-time event. The player earns back the enrichment cost over time via higher
gold/sec (see §4 ROI analysis).

---

### 3.6 Interaction with C1 Animal Care and C4 Taming

The `adjust(k, { happy: 18, trust: 8 })` call in `addEnrichment` writes directly
to the `meters[k]` state:

- `happy + 18`: Raises the animal's Happiness stat. Happiness feeds the global
  `happyMult` multiplier (C2). A happiness boost from enrichment immediately
  softens the impact of decay that has occurred since the last Play action. The
  effect is clamped at 100 — if `happy` is already ≥ 82, the excess is lost.
- `trust + 8`: Advances the animal's Trust meter. Trust is the fastest single-action
  trust gain available (Play: +4, Heal: +2; Enrichment: +8 per level purchase). For
  species with high taming difficulty (Hard, Expert, Master), enrichment is a
  meaningful shortcut toward the Petting Area (trust ≥ 40, proposed) and Thriving
  status (trust ≥ 68). The effect is clamped at 100.

Both effects are one-time grants per enrichment level purchase — they do not repeat
over time. The animal's stats then continue to decay normally via the C1 decay loop.

---

## 4. Formulas

### F-1: Enrichment Cost

```
enrichCost[k] = round(appeal[k] × ENRICH_COST_MULT × (enrLv[k] + 1)) + ENRICH_COST_FLOOR
```

**Variable table:**

| Variable | Type | Range | Source |
|----------|------|-------|--------|
| `appeal[k]` | integer | 3–3000 | `ANIMALS[k].appeal` — baseAppeal at count=1, encLv=1, enr=0 |
| `ENRICH_COST_MULT` | constant | 40 (current) | `act/proto-screens.jsx` line 354; `act/prototype.jsx` line 205; tuning knob in `currency-system.md` |
| `enrLv[k]` | integer | 0, 1, 2, … | Current enrichment level before this purchase; 0 on first purchase |
| `ENRICH_COST_FLOOR` | constant | 200 | Flat addend; minimum cost contribution; `proto-screens.jsx` line 354 |

**Source (exact code, two locations — both must stay identical):**

```js
// proto-screens.jsx line 354 (button display):
const ecost = Math.round((a.appeal || 1) * 40 * (enrLv + 1)) + 200;

// prototype.jsx line 205 (addEnrichment — deduction):
const cost = Math.round((AA[k].appeal || 1) * 40 * (lv + 1)) + 200;
```

Both expressions are textually identical, ensuring the displayed cost always matches
the deducted cost.

**Worked examples (ENRICH_COST_MULT = 40):**

| Species | Appeal | enrLv before | Raw calc | Cost |
|---------|:---:|:---:|:---:|:---:|
| Rabbit (Lv 0 → 1) | 3 | 0 | round(3×40×1)+200 | **320 🪙** |
| Rabbit (Lv 1 → 2) | 3 | 1 | round(3×40×2)+200 | **440 🪙** |
| Rabbit (Lv 2 → 3) | 3 | 2 | round(3×40×3)+200 | **560 🪙** |
| Cat (Lv 0 → 1) | 50 | 0 | round(50×40×1)+200 | **2,200 🪙** |
| Wolf (Lv 0 → 1) | 330 | 0 | round(330×40×1)+200 | **13,400 🪙** |
| Wolf (Lv 1 → 2) | 330 | 1 | round(330×40×2)+200 | **26,600 🪙** |
| Elephant (Lv 0 → 1) | 850 | 0 | round(850×40×1)+200 | **34,200 🪙** |
| Elephant (Lv 1 → 2) | 850 | 1 | round(850×40×2)+200 | **68,200 🪙** |
| Dolphin (Lv 0 → 1) | 3000 | 0 | round(3000×40×1)+200 | **120,200 🪙** |
| Dolphin (Lv 1 → 2) | 3000 | 1 | round(3000×40×2)+200 | **240,200 🪙** |
| Dolphin (Lv 2 → 3) | 3000 | 2 | round(3000×40×3)+200 | **360,200 🪙** |

> ⚠️ **Balance gap (from F2 §D currency-system.md OQ-1):** `ENRICH_COST_MULT = 40`
> was calibrated when the maximum baseAppeal value was approximately 1,500. With the
> current maximum (Dolphin, appeal = 3,000), Dolphin's first enrichment step costs
> **120,200 🪙** versus the ~60,100 🪙 that would result from a max-appeal of 1,500 —
> roughly 2× the intended ceiling. This is the same calibration gap documented for
> `BUY_COST_MULT` (22) and `UPGRADE_COST_MULT` (160) in `currency-system.md`.
> A `/balance-check` pass is required before these values go to production.

---

### F-2: Appeal Payoff — Enrichment Factor

The enrichment contribution to `appealOf(k)` is:

```
enrichFactor = 1 + ENRICH_APPEAL_BONUS_PER_LEVEL × enrLv[k]
             = 1 + 0.10 × enrLv[k]
```

**Variable table:**

| Variable | Type | Range | Source |
|----------|------|-------|--------|
| `ENRICH_APPEAL_BONUS_PER_LEVEL` | constant | 0.10 | `prototype.jsx` line 61; `zoo-economy.md` §4; `habitat-system.md` §4 F-2 |
| `enrLv[k]` | integer | 0, 1, 2, … | Current enrichment level (0 = no bonus) |

| enrLv | enrichFactor | Appeal as % of unenriched baseline |
|:---:|:---:|:---:|
| 0 | 1.00 | 100% (no enrichment) |
| 1 | 1.10 | 110% |
| 2 | 1.20 | 120% |
| 3 | 1.30 | 130% |
| 5 | 1.50 | 150% |
| 10 | 2.00 | 200% |

Each enrichment level adds exactly **+10% of the unenriched base** — the bonus is
linear, not compounding. This contrasts with the Fe2 enclosure upgrade (+25%/level),
making each individual enrichment level a smaller but cheaper increment.

---

### F-3: Full appealOf Formula (Combined — Enrichment + Enclosure + Count)

From `prototype.jsx` line 61, the complete formula for one species' appeal contribution:

```
appealOf(k) = baseAppeal[k]
            × cntOf(k)
            × (1 + 0.25 × (encLv[k] − 1))
            × (1 + 0.10 × enrLv[k])
```

**How enrichment and enclosure levels compose:**

The two multipliers are multiplicative — they both apply to the same `baseAppeal × count`
base and are multiplied together. They do **not** add their bonuses to a shared pool.

```
appealOf = baseAppeal × count × encMult × enrichFactor
         = baseAppeal × count × (1 + 0.25·(encLv−1)) × (1 + 0.10·enrLv)
```

**Illustration — Dolphin at various investment levels (count=2):**

| encLv | enrLv | encMult | enrichFactor | appealOf |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 0 | ×1.00 | ×1.00 | 3000×2×1.00×1.00 = **6,000** |
| 1 | 1 | ×1.00 | ×1.10 | 3000×2×1.00×1.10 = **6,600** |
| 2 | 0 | ×1.25 | ×1.00 | 3000×2×1.25×1.00 = **7,500** |
| 2 | 1 | ×1.25 | ×1.10 | 3000×2×1.25×1.10 = **8,250** |
| 5 | 3 | ×2.00 | ×1.30 | 3000×2×2.00×1.30 = **15,600** |

**Key observation**: At equal investment levels, one enclosure upgrade (+25%) is
worth 2.5 enrichment levels (+10% each) in raw appeal gain. However, the cost ratio
is not 2.5:1 — see F-4 for the ROI comparison.

---

### F-4: Enrichment ROI vs. Enclosure Upgrade ROI

This analysis answers the question: "Should I spend my next Gold on an enrichment
level or an enclosure upgrade?"

**Setup**: Appeal gain from one enrichment step vs. one enclosure upgrade step,
for a species with count=1 at encLv=1, enrLv=0.

**Enrichment (Lv 0 → 1):**
```
cost    = round(appeal × 40 × 1) + 200
deltaAppeal = baseAppeal × count × encMult × 0.10
            = baseAppeal × 1.00 × 0.10
            = 0.10 × appeal
deltaGold/s ≈ 0.10 × appeal × 0.05 = 0.005 × appeal
payback_s   = cost / deltaGold/s
            = (appeal × 40 + 200) / (0.005 × appeal)
            = 8000 + 200 / (0.005 × appeal)
```

**Enclosure upgrade (Lv 1 → 2):**
```
cost    = round(appeal × 160 × 1) + 300
deltaAppeal = baseAppeal × 0.25
deltaGold/s ≈ 0.25 × appeal × 0.05 = 0.0125 × appeal
payback_s   = (appeal × 160 + 300) / (0.0125 × appeal)
            = 12800 + 300 / (0.0125 × appeal)
```

**Payback comparison (no capacity constraint, count=1):**

| Species | Appeal | Enrich Lv0→1 cost | Enrich payback | Upgrade Lv1→2 cost | Upgrade payback |
|---------|:---:|:---:|:---:|:---:|:---:|
| Rabbit | 3 | 320 🪙 | ~21,400 s (~6.0 h) | 780 🪙 | ~25,700 s (~7.1 h) |
| Wolf | 330 | 13,400 🪙 | ~8,100 s (~2.3 h) | 53,100 🪙 | ~12,900 s (~3.6 h) |
| Elephant | 850 | 34,200 🪙 | ~8,050 s (~2.2 h) | 136,300 🪙 | ~12,800 s (~3.6 h) |
| Dolphin | 3000 | 120,200 🪙 | ~8,013 s (~2.2 h) | 480,300 🪙 | ~12,800 s (~3.6 h) |

**Verdict**: Enrichment has a **shorter payback period** than an enclosure upgrade at
equivalent investment depth, across all species at the values tested. This is because
enrichment costs use a multiplier of 40 versus 160 for upgrades — the 4:1 cost ratio
is not matched by a 4:1 appeal ratio (0.10 vs 0.25 = 2.5:1). The result is that
enrichment delivers better gold-per-gold-spent ROI. However:

1. **Enclosure upgrades also unlock additional animal slots** (capacity increase from
   `capOf`), which enrichment does not. The buy-more path (Fe1) is gated by upgrade
   level, not enrichment level. A player who upgrades instead of enriching can buy
   more copies of the animal, multiplying appeal through `cntOf(k)` — a potentially
   much larger total gain.
2. **Enrichment stacks multiplicatively** with the count and enclosure multiplier, so
   enriching a fully-upgraded, fully-populated enclosure produces the largest absolute
   appeal gains (e.g., Dolphin at encLv=5, count=6, enrLv=1 yields `3000×6×2.00×1.10
   = 39,600` vs. `36,000` without enrichment — a +3,600 raw delta versus +300 delta at
   count=1, encLv=1).
3. **There is no level cap on enrichment** (see Edge Cases EC-1). In the absence of a
   cap, a player who enriches indefinitely can push the appeal factor arbitrarily high.
   At enrLv=10 the factor is ×2.00, matching a fully upgraded (Lv5) enclosure at zero
   additional slot benefit. This unboundedness is both a design gap and an exploit risk.

> ⚠️ **Investment recommendation for players at equal gold**: At low-count, low-level
> enclosures, prefer enclosure upgrades first (they unlock buy-more slots, which
> multiply total appeal more than enrichment can). Once the enclosure is at cap level
> for the target count, enrichment becomes the optimal incremental investment. This
> ordering aligns with the intended depth layer: Fe2 is the infrastructure, Fe3 is
> the polish.

---

## 5. Edge Cases

### EC-1: No Enrichment Level Cap (Implementation Gap)

**Trigger**: Player taps the enrichment button when `enrLv[k]` is at any level —
including levels beyond any design intent.

**Current behavior (code)**: `addEnrichment(k)` does **not** guard against any
maximum enrichment level. The only checks are the Gold balance check and the
species/meter existence checks. The enrichment level can grow to any positive integer.

**Impact**: At `enrLv = 10`, `enrichFactor = 2.00`, doubling the species' appeal
contribution for a cumulative cost of:
`round(3000 × 40 × (1+2+3+…+10)) + 200×10 = round(3000 × 40 × 55) + 2,000 = 6,602,000 🪙`
(Dolphin example). This is extremely expensive but not impossible at late game.
At `enrLv = 90`, `enrichFactor = 10.00` — an order-of-magnitude appeal amplifier
per species. This would break the appeal economy if players discovered the strategy.

**Required fix (design intent)**: A cap should be added to `addEnrichment`:
```js
if (lv >= MAX_ENRICH_LEVEL) { flash('Max enrichment reached'); return; }
```
The button in `EnclosureScreen` should visually dim and become non-interactive at max
level. See Open Questions OQ-1 for the recommended cap value.

This is analogous to the Fe2 Habitat System EC-1 (missing `encLv >= 5` guard), which
is also unimplemented.

---

### EC-2: Insufficient Gold — Enrichment Blocked

**Trigger**: Player taps the enrichment button when `gold < enrichCost`.

**Behavior**: `addEnrichment(k)` checks `gold < cost` before calling `pay()`. If
insufficient, shows flash "Need X 🪙" and returns without modifying `enrich`, `meters`,
or `gold`. State is unchanged. Matches F2 EC-1 (insufficient funds — purchase blocked).

The button displays `opacity: 0.6` when `gold < ecost` (computed in the button render),
providing a visual hint before the tap. However, the button is still tappable — it is
not disabled. The handler is the authoritative guard.

---

### EC-3: Happiness and Trust Clamped at 100

**Trigger**: `adjust(k, { happy: 18, trust: 8 })` is called when `happy` or `trust`
is already at or near 100.

**Behavior**: The `clamp(n) = max(0, min(100, round(n)))` helper caps both stats at 100.
Any excess is discarded — there is no overflow carry-forward or "happiness bank."

- If `happy = 90` before enrichment: `happy → 100` (gains 10 of the full 18).
- If `happy = 100` before enrichment: `happy → 100` (no happiness benefit).
- If `trust = 96` before enrichment: `trust → 100` (gains 4 of the full 8).

The enrichment purchase still deducts Gold and increments `enrLv` even if both stats
are already at 100. The appeal payoff (F-1) is still delivered. The player receives
the appeal upgrade regardless of whether the stat bonuses are fully absorbed.

---

### EC-4: Enrichment at enrLv = 0 (First Purchase)

**Trigger**: First enrichment purchase for a species.

**Behavior**: `enrLvOf(k)` returns `enrich[k] || 0 = 0`. Cost is
`round(appeal × 40 × (0 + 1)) + 200 = round(appeal × 40) + 200`. After purchase,
`enrich[k] = 1`. `appealOf(k)` now applies `enrichFactor = 1.10`.

The button displays the species' toy name without a level tag ("`(Lv N)`" suffix only
appears when `enrLv > 0`). After purchase, the button reads "Enrichment · Tunnel maze
(Lv 1)", providing confirmation.

---

### EC-5: Enrichment Before Animal Is Adopted

**Trigger**: Can `addEnrichment(k)` be called for a species not in `owned`?

**Behavior**: `addEnrichment` reads `AA[k].appeal` (safe — reads the static ANIMALS
lookup). It calls `adjust(k, { happy:18, trust:8 })`, which calls
`setMeters(m => ({ ...m, [k]: { ...m[k], ... } }))`. If `meters[k]` does not exist
(not yet adopted), `m[k]` is `undefined` and the spread `{ ...undefined }` produces
`{}` — resulting in `meters[k] = { happy: 18, trust: 8 }` with no other stats.

**Impact**: A partial, invalid meter object would exist for an unadopted animal. In
practice, the enrichment button only appears inside `EnclosureScreen`, which is
opened by selecting an owned species from the enclosure view. It is not reachable for
unadopted species from the normal navigation flow. However, no explicit guard in
`addEnrichment` prevents this call from succeeding if triggered programmatically.

**Risk**: Low (UI navigation prevents this). Mitigation: add a guard
`if (!owned.includes(k)) return;` to `addEnrichment` for robustness.

---

### EC-6: Enrichment Display Cost vs. Deduction Match

**Trigger**: Race condition between the cost shown on the button and the cost deducted.

**Behavior**: The button in `EnclosureScreen` computes `ecost = Math.round((a.appeal||1)×40×(enrLv+1))+200`
at render time using the `enrLv` prop passed from `prototype.jsx` (`enrLvOf(selEnc)`).
`addEnrichment` recomputes the same expression from the same `enrLvOf(k)` state
source. Both read the same React state snapshot in the same render cycle — the
displayed cost and the deducted cost are always equal. This matches Fe2 EC-6.

---

### EC-7: Enrichment ROI with Capacity Constraint (Demand > Capacity)

**Trigger**: The zoo's `demand > capacity` (HUD visitor pill is amber).

**Behavior**: When the zoo is capacity-constrained, additional appeal does not
translate to additional visitors (`visitors = min(demand, capacity)`). Enrichment
still raises `appealOf(k)` and therefore `demand`, but the extra demand is capped by
capacity and produces no additional Gold until capacity is expanded.

**Impact**: In a capacity-constrained zoo, the payback period for enrichment is
effectively infinite — the appeal gain is real but yields zero income gain until
the player builds an attraction or upgrades enclosures (both of which expand
capacity). The enrichment is not "wasted" — it raises the appeal potential that will
become income once capacity catches up — but the ROI analysis in F-4 does not hold
under this constraint.

**Design implication**: Players in capacity-constrained zoos should prioritize
enclosure upgrades (which raise both appeal AND `seatsOf` capacity) or attraction
builds over enrichment. The amber HUD pill is the signal to prioritize capacity
investments.

---

## 6. Dependencies

### Upstream (Fe3 reads these)

| System | GDD | Dependency nature |
|--------|-----|-------------------|
| **F1 Animal Database** | `design/gdd/animal-database.md` | Reads `ANIMALS[k].appeal` (baseAppeal) as the scaling input to `enrichCost`; reads `ANIMALS[k].key` and `ANIMALS[k].species` for state key and flash message |
| **F2 Currency System** | `design/gdd/currency-system.md` | Gold is the spend currency; `pay(cost)` interface; `ENRICH_COST_MULT = 40` and `ENRICH_COST_FLOOR = 200` are registered in F2 §D as tuning knobs; the ⚠️ balance gap (same calibration issue as Fe2/Fe1) is documented in F2 OQ-1 |
| **C1 Animal Care** | `design/gdd/animal-care.md` | Provides the `meters[k]` state structure; enrichment's `adjust(k, {happy:18, trust:8})` writes into C1-owned meter state; the `+18 happy` tuning knob is documented in C1 §7 |
| **C4 Taming** | `design/gdd/taming.md` | Trust is a C4-owned accumulator; `trust + 8` per enrichment level is the largest single-action trust gain; registered in `entities.yaml` as `trust_gain_per_action: enrichment_level:+8` |

### Downstream (these depend on Fe3)

| System | GDD | What they consume from Fe3 |
|--------|-----|---------------------------|
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` | Reads `enrLvOf(k)` via `appealOf(k)` to compute total zoo appeal → visitors → gold/sec; the `+10%/level` enrichment bonus is canonical in the C2 appeal formula |
| **F2 Currency System** | `design/gdd/currency-system.md` | Fe3 is listed as a Gold sink in F2 §Interactions; the `enrichCost` formula is reproduced in F2 §D as the authoritative reference |
| **F3 Save/Load** | `design/gdd/save-load.md` | Must persist the `enrich` state object (per-species enrichment levels); enrichment upgrades are permanent; current implementation has no persistence (F3 unimplemented) |
| **P1 HUD** | `design/gdd/hud.md` | Should display enrichment level badge on enclosure card and the enrichment appeal contribution in the appeal breakdown panel |

### Integration contracts

**This system provides to others:**
- `enrLvOf(k): number` — current enrichment level per species (0, 1, 2, …), consumed
  by C2 via `appealOf(k)`
- `enrichFactor(k): number` — `1 + 0.10 × enrLv[k]`, the appeal multiplier, implicitly
  provided as part of `appealOf(k)`

**This system requires from others:**
- `appeal[k]: number` — from F1 Animal Database (static; read-only)
- `gold: number` — from F2 Currency System (read for gate, mutated via `pay()`)
- `meters[k]: object` — from C1 Animal Care (the `happy` and `trust` fields are mutated
  by `adjust()`)

---

## 7. Tuning Knobs

All values below are currently inline in `act/proto-screens.jsx` and `act/prototype.jsx`
as magic numbers. They should be extracted to named constants in `act/data.jsx` under
a `TUNING` or `ENRICHMENT` section before production.

| Knob | Current value | Category | Safe range | Gameplay effect |
|------|:---:|:---:|:---:|:---|
| `ENRICH_COST_MULT` | 40 | Curve | 20–80 | Scales all enrichment costs linearly. ⚠️ 40 is ~2× intended ceiling at max appeal 3000 — recommend 20 pending a balance pass. Higher = slower enrichment investment; lower = faster Gold sink throughput |
| `ENRICH_COST_FLOOR` | 200 🪙 | Curve | 50–500 | Flat addend on every enrichment purchase; ensures very-low-appeal species still cost something. Lowering below 200 makes Rabbit enrichment nearly free at high levels (cost formula approaches 0 × mult + floor) |
| `ENRICH_APPEAL_BONUS_PER_LEVEL` | 0.10 | Curve | 0.05–0.25 | Per-level appeal multiplier increment (+10% at default). Raising brings enrichment closer to upgrade payoff (+25%) making Fe3 more attractive vs. Fe2; lowering makes enrichment a minor polishing action. Must be consistent between `prototype.jsx appealOf` and `zoo-economy.md §4` |
| `ENRICH_HAPPY_BONUS` | +18 | Feel | +5–+30 | Happiness boost applied per enrichment level purchase. Too high risks trivializing the care loop (a player who enriches frequently may rarely need to Play). Registered in `animal-care.md` §7 as "Enrichment happiness bonus" |
| `ENRICH_TRUST_BONUS` | +8 | Feel | +2–+15 | Trust boost applied per enrichment level purchase. Currently the largest single-action trust gain (Play: +4, Heal: +2). Raising this shortens the taming timeline for hard species; lowering it forces more Play/Heal actions before Petting Area and Performance gates are reachable. Registered in `entities.yaml: trust_gain_per_action` |
| `MAX_ENRICH_LEVEL` | **NOT IMPLEMENTED** | Gate | 3–10 | Maximum enrichment depth per species. Currently unbounded — see EC-1 and OQ-1. Design recommendation: 5 (symmetrical with MAX_ENCLOSURE_LEVEL = 5). Implementing this requires a cap guard in `addEnrichment` and a visual disable on the enrichment button at max level |

### ⚠️ Pending balance pass

`ENRICH_COST_MULT = 40` produces endgame costs (Dolphin Lv0→1: 120,200 🪙) approximately
2× the intended ceiling due to the same appeal-max calibration gap documented in
`currency-system.md` OQ-1. The correction target is:
- If `ENRICH_COST_MULT` is reduced to 20: Dolphin Lv0→1 = `round(3000×20×1)+200 = 60,200 🪙` (roughly
  matching the ~60k that would have resulted from the original ~1500 max appeal at mult=40).
- The cost floor (200) is unaffected by appeal magnitude and needs no change.

---

## 8. Acceptance Criteria

### AC-Fe3-1: Enrichment deducts correct Gold

**GIVEN** a player with Gold ≥ `enrichCost[k]` for species `k` at enrichment level `N`
**WHEN** they tap the enrichment button
**THEN** Gold decreases by exactly `round(appeal[k] × 40 × (N + 1)) + 200` and
`enrich[k]` becomes `N + 1`.

---

### AC-Fe3-2: Enrichment is blocked when Gold is insufficient

**GIVEN** a player with Gold < `enrichCost[k]`
**WHEN** they tap the enrichment button
**THEN** Gold balance is unchanged, `enrich[k]` is unchanged, `meters[k].happy`
and `meters[k].trust` are unchanged, and the flash "Need X 🪙" appears.

---

### AC-Fe3-3: Happiness and Trust increase after enrichment

**GIVEN** a species `k` with `meters[k].happy = 50, meters[k].trust = 30` and
Gold ≥ enrichCost
**WHEN** the enrichment button is tapped
**THEN** `meters[k].happy = min(100, 50 + 18) = 68` and
`meters[k].trust = min(100, 30 + 8) = 38`.

---

### AC-Fe3-4: Appeal increases after enrichment

**GIVEN** species `k` at `encLv = 2, count = 1, enrLv = 0` contributing
`appealOf = appeal[k] × 1 × 1.25 × 1.00` to total zoo appeal
**WHEN** enrichment Lv 0 → 1 completes
**THEN** on the next gold income tick, `appealOf(k) = appeal[k] × 1 × 1.25 × 1.10`
— a +10% increase relative to the previous enriched appeal value. The total zoo
appeal and gold/sec both increase by a corresponding positive delta.

---

### AC-Fe3-5: Enrichment button displays cost matching actual deduction

**GIVEN** a player viewing `EnclosureScreen` for species `k` at enrichment level `N`
**WHEN** the enrichment button is rendered
**THEN** the displayed cost equals `round(appeal[k] × 40 × (N + 1)) + 200` and the
deduction on tap is identical.

---

### AC-Fe3-6: Enrichment level persists across the session (in-memory)

**GIVEN** a player who has purchased enrichment Lv 1 for species `k`
**WHEN** they navigate away from the Enclosure screen and return
**THEN** the enrichment button shows "(Lv 1)" and the next cost reflects `enrLv = 1`
(i.e., `round(appeal[k] × 40 × 2) + 200`).

---

### AC-Fe3-7: Enrichment cost is linear per level

**GIVEN** species `k` with `appeal = 330` (Wolf)
**WHEN** enrichment is purchased at levels 0, 1, and 2
**THEN** the costs are:
- Lv 0 → 1: `round(330 × 40 × 1) + 200 = 13,400 🪙`
- Lv 1 → 2: `round(330 × 40 × 2) + 200 = 26,600 🪙`
- Lv 2 → 3: `round(330 × 40 × 3) + 200 = 39,800 🪙`

Each step costs exactly `appeal × 40` more than the previous step (plus the constant
floor), confirming the linear scaling.

---

### AC-Fe3-8: Happiness clamped at 100 when enrichment bonus overflows

**GIVEN** species `k` with `meters[k].happy = 90` and Gold ≥ enrichCost
**WHEN** enrichment is purchased
**THEN** `meters[k].happy = 100` (not 108 — clamped). Gold is still deducted and
`enrLv[k]` is still incremented. The appeal payoff is delivered regardless of clamp.

---

### AC-Fe3-9: Enrichment does not grant Zoo XP

**GIVEN** a player at any XP value before purchasing enrichment
**WHEN** enrichment is purchased successfully
**THEN** the accumulated XP value is unchanged. No XP notification appears.

---

### AC-Fe3-10: Enrichment does not unlock animal slots (capacity unchanged)

**GIVEN** species `k` at `encLv = 2` (capOf = 3) and `enrLv = 0`
**WHEN** enrichment Lv 0 → 1 completes
**THEN** `capOf(k)` remains 3 (unchanged). The "Buy More" slot limit is not affected.
Only enclosure upgrades (Fe2) change `capOf`.

---

## Open Questions

**OQ-1 — No enrichment level cap implemented** *(Critical / Implementation Bug)*

`addEnrichment` does not enforce a maximum enrichment level. The enrichment level
can grow indefinitely, producing unbounded appeal gains at escalating (but finite)
cost per level. The design intent is for enrichment to be a depth layer (3–5 levels
per species), not an infinite sink.

Recommended fix: add `if (lv >= MAX_ENRICH_LEVEL) { flash('Max enrichment reached'); return; }`.
Recommended `MAX_ENRICH_LEVEL = 5` — symmetrical with the Fe2 `MAX_ENCLOSURE_LEVEL = 5`,
giving players a clear mental model ("both systems go to Lv 5"). At Lv 5 the
enrichment factor is `1 + 0.10 × 5 = 1.50` — a 50% appeal boost, which stacks
cleanly with the enclosure Lv5 factor of ×2.00 for a combined ×3.00 on the unenriched
base (or ×6.00 with max count of 6 at encLv 5).

The Upgrade button in `EnclosureScreen` should be hidden or disabled when `enrLv >= MAX_ENRICH_LEVEL`.

*Owner: gameplay-programmer. Blocking: AC-Fe3 balance validation, economy integrity.*

---

**OQ-2 — ENRICH_COST_MULT balance pass** *(High priority — same gap as OQ-1 in currency-system.md)*

`ENRICH_COST_MULT = 40` was calibrated when max appeal was ~1,500. Current max
(Dolphin: 3,000) makes endgame enrichment costs ~2× too high. This is registered as
part of the broader `currency-system.md` OQ-1 balance-pass action item that covers
all three cost multipliers. The enrichment GDD's cost ladder (§4 worked examples)
provides the input data needed for that balance pass.

Candidate correction: `ENRICH_COST_MULT = 20`. This would bring Dolphin Lv0→1 from
120,200 🪙 to ~60,200 🪙 and the Dolphin Lv0→5 total ladder from
`round(3000×40×(1+2+3+4+5)) + 200×5 = 1,801,000 🪙` to approximately `~900,500 🪙`.

*Owner: Economy Designer. Blocked by: confirming target gold-per-hour at endgame (C2 balance pass).*

---

**OQ-3 — Should enrichment grant XP?** *(Medium priority — design intent gap)*

Care actions (C1) grant +3 Zoo XP each. Enrichment is a larger, rarer Gold spend that
produces a bigger happiness and trust boost, but grants zero XP. This asymmetry may
be intentional (enrichment is an economy action, not a care ritual) or an oversight.

If enrichment granted XP, the appropriate amount should be proportional to its cost
relative to a typical care action — at ~13,400 🪙 for Wolf Lv0→1, that is roughly
33–40 care actions, suggesting ~100–120 XP per enrichment step at the mid tier.
Alternatively, a flat 10–15 XP per level (regardless of species tier) would make
enrichment feel rewarded without distorting the care-XP economy.

The decision affects C3 Zoo Level progression pacing and should be resolved alongside
C1 OQ-3 (decay rate calibration) and C3 anchor point tuning.

*Owner: game-designer. Coordination with C3 Zoo Level GDD author.*

---

**OQ-4 — Enrichment is not persisted (F3 Save/Load gap)** *(High priority for production)*

The `enrich` state object in `prototype.jsx` is in-memory only. When the player
refreshes the browser or closes the tab, all enrichment levels are lost. This is the
same persistence gap that affects `encLv`, `pops`, and `meters` — all are F3
Save/Load's responsibility.

Until F3 is implemented, enrichment is cosmetically durable (within a session) but
does not survive a session boundary. Players who purchased costly enrichment tiers
for endgame species would lose those levels on reload — a significant retention risk
for a game in the "months-long progression" design target.

*Owner: F3 Save/Load GDD author. Blocking: any enrichment economy tuning that assumes
  permanent investment (the ROI analysis in §4 assumes persistence).*

---

**OQ-5 — Enrichment ROI vs. capacity constraint interaction** *(Medium priority — balance)*

Section 4 (F-4) and Edge Case EC-7 document that enrichment produces zero incremental
gold when the zoo is capacity-constrained. This means a player who follows the
"enrich first, upgrade later" strategy is making a suboptimal choice in a capacity-
constrained context. The HUD amber pill is the only signal.

Should the UI surface this more explicitly? For example: a tooltip on the enrichment
button reading "Capacity constrained — appeal not converting to visitors" when
`demand > capacity`, redirecting the player toward enclosure upgrades or attractions.

*Owner: UX Designer. Coordination with C2 Zoo Economy and Fe2 Habitat System.*
