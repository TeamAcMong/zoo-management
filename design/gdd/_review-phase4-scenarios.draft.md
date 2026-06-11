# Phase 4 Cross-System Scenario Walkthrough — Animal World Zoo
## Review: GDD Holistic Review Phase 4a–4c

> **Status**: DRAFT — Phase 4 Scenario Walkthrough (2026-06-11)
> **Reviewer**: Claude Code (claude-sonnet-4-6)
> **GDD set reviewed**: game-concept, systems-index, animal-care (C1), zoo-economy (C2),
>   zoo-level (C3), taming (C4), animal-collection (Fe1), habitat-system (Fe2),
>   enrichment (Fe3), attractions (Fe4), quests-missions (Fe6), idle-offline (Fe7),
>   save-load (F3), currency-system (F2), animal-database (F1),
>   economy-redesign.md (PROPOSAL — not live), xp-pacing-redesign-2026-06-08.md (PROPOSAL — not live),
>   entities.yaml (authoritative constants + 2026-06-07 C# audit notes)
> **Scenarios walked**: 5

---

## Summary Table

| Category | Count |
|---|---|
| BLOCKER | 9 |
| WARNING | 7 |
| INFO | 4 |
| **Total findings** | **20** |

Top 3 cross-scenario issues:
1. **Offline resume order is undefined** — the GDDs do not specify whether `goldPerSec`
   is reconstructed before or after care-decay is applied, meaning offline gold can be
   computed with pre-decay welfare OR post-decay welfare; the answer changes player income
   by up to 2.8× at the extremes (B1).
2. **double level-up same tick** — claiming a quest chapter reward at exactly the right
   XP level can push the player through two level thresholds, unlock new species/attractions
   automatically, and never announce the intermediate unlocks (B4/B5).
3. **Trust is NEVER persisted in C#** — the entities.yaml 2026-06-07 audit confirms
   `trust` exists in `AnimalMeters` but is never written or read; Scenario 5 (attraction
   gated by Trust) is fully broken in the shipping codebase (B9).

> **PROPOSALS NOTE**: Several findings below are partially addressed by
> `economy-redesign.md` (role-differentiated sinks) and `xp-pacing-redesign-2026-06-08.md`
> (scaling XP faucets). These are UNACCEPTED PROPOSALS. Where a proposal addresses a
> finding it is noted inline as "→ Proposal X addresses this."

---

## Scenario 1 — Returning After Offline (Fe7 + C1 + C2 + F3)

### Trigger
Player closes game. Returns after 4+ hours. Session resumes.

### Designed Activation Order (from GDDs)
1. F3 reads `closedAt` timestamp from save blob
2. Fe7 computes `elapsed = now − closedAt`
3. Fe7 reconstructs `goldPerSec` from saved meters/state using C2 formula
4. Fe7 applies `offlineGold = floor(min(elapsed, cap) × goldPerSec × 0.60)`
5. "While you were away" modal shown
6. Player taps Collect → gold credited
7. Active session begins; C1 decay timer fires in-session

### Data Flow Analysis

Step 3 consumes `meters[k].happy` (or the composite welfare formula per entities.yaml
revision) from **saved** state. This is the state at moment of closure.

Step 7's decay applies only to active-session time, not offline.

### Findings

---

#### B1 — BLOCKER: Offline goldPerSec uses pre-decay welfare but GDD implies welfare should reflect return-state

**Systems**: Fe7, C1, C2, F3

**What**: Fe7 §"goldPerSec reconstruction" explicitly states "Because no offline care decay occurs,
`avgHappy` is the same value the player had when they left." However, entities.yaml revised the
`happy_mult` formula on 2026-06-06 to use a **welfare composite** `(hunger+thirst+clean+happy)/4`
not just happiness alone. C1 §OQ-1 and Fe7 §OQ-4 both leave "offline care decay" as an open
design question. The GDDs do NOT specify which meter values are used for welfare reconstruction
when the player returns: the meters in the save blob are the at-close values.

**Failure mode**: If the player closed with all meters at 100 (just cared for every animal), the
offline gold is computed at `happyMult ≈ 1.4`. If care had decayed to floor values (0), the
same formula would give `happyMult = 0.5` — a 2.8× difference in the offline reward. The GDD
says "intentional player-friendly simplification" (pre-decay values), but no GDD document
specifies this as the canonical rule for the composite welfare formula. C1's OQ-1 says decay is
"effectively zero (no decay while app is closed)" but C1 was documented before the welfare
composite was added to entities.yaml. The two documents now conflict.

**Fix**: Fe7 §"goldPerSec reconstruction" must explicitly state which formula version is used
(old `happy` only, or new composite welfare) and declare "offline gold uses meter values at
session-close, no decay projection" as a formal rule in both Fe7 and C1. Then add it to entities.yaml
as a canon decision, not an OQ.

**GDD text cited**:
> Fe7: "Because no offline care decay occurs (see Rule 10), `avgHappy` is the same value the player
> had when they left. This slightly overestimates the real offline rate … but it is an intentional
> player-friendly simplification."
> entities.yaml happy_mult note: "REVISED 2026-06-06 — was clamp(0.4 + avgHappiness/100,…) using
> meters[k].happy ALONE. Now a WELFARE COMPOSITE of all four needs…"

---

#### B2 — BLOCKER: Fe7 GoldPerSec reconstruction formula is undefined when AnimalMeters is not in the save blob

**Systems**: Fe7, F3, C1

**What**: Fe7 §"goldPerSec reconstruction" requires `meters[k].happy` (or welfare composite) to
be read from the save blob. F3 systems-index note (2026-06-07 C# audit) states:
> "per-animal `AnimalMeters` (hunger/thirst/clean/happy/trust) are NOT serialized in v1
> (`SaveService.cs:143`) — trust/meters reset to defaults on reload"

If meters are not in the save blob, Fe7 has no valid welfare data for reconstruction. The GDD
does not define a fallback: "default 60 if empty" applies to `owned = []` (no animals), not to
the case where animals are owned but meters were not serialized.

**Failure mode**: If meters are absent from the blob (current C# state), Fe7 reconstructs
`goldPerSec` using `avgHappy = default = 60 → happyMult = 1.0`. This silently under- or
over-represents the player's actual zoo state. A player who had all animals at max welfare
(happyMult 1.4) receives offline gold at happyMult 1.0 — a 28% penalty they cannot explain.
Conversely a neglected zoo gets a 100% windfall.

**Fix**: F3 must serialize `AnimalMeters` before Fe7 can be correctly implemented. This is
already listed as a gap (F3 SaveService.cs:143) but is not flagged in the Fe7 GDD itself as a
BLOCKER for Fe7 correctness (only for trust-gated features).

**GDD text cited**:
> systems-index.md: "(1) per-animal `AnimalMeters` (hunger/thirst/clean/happy/trust) are NOT
> serialized in v1 (`SaveService.cs:143`) — trust/meters reset to defaults on reload"
> Fe7: "goldPerSec reconstruction follows C2 Zoo Economy GDD §4 exactly:
> `avgHappy = mean of meters[k].happy across owned[] (default 60 if empty)`"

---

#### W1 — WARNING: No offline care decay creates an exploitable "always optimal" offline state

**Systems**: Fe7, C1, C2

**What**: Fe7 Rule 10 states no care decay occurs offline. Combined with the at-close welfare
snapshot for gold computation, a player who cares for all animals right before closing the game
will always return to: (a) maximum offline gold (best welfare at close), AND (b) all meters at
exactly their at-close values (typically low or zero after any active session). This means the
optimal strategy is: care for all animals → close immediately. The "daily care ritual" pillar
is circumvented — the player does NOT need to engage in active care; they just need to care
before the tab close.

**Failure mode**: The idle loop's emotional contract ("come back to care for animals") is
replaced with "close after caring." Care becomes a pre-close ritual, not a return engagement.
This undermines D7 retention motivation.

**Fix**: The design needs to decide OQ-4 (offline decay, Fe7): option 2 (partial offline decay)
would restore the "animals need you" return hook. → `economy-redesign.md` does not address this.

**GDD text cited**:
> Fe7: "No offline care decay. Need meters (hunger, thirst, cleanliness, happiness) do NOT
> degrade during offline periods in the current design."

---

#### W2 — WARNING: "While you were away" modal shows before Collect, blocking normal UI, but offline gold is not reserved if player closes again

**Systems**: Fe7, F3

**What**: Fe7 EC-8 describes the double-claim risk and notes an "additional safeguard" of
overwriting `closedAt` with `-1` or `null` when presenting the modal. However, this safeguard
is marked "recommended," not required. If the player dismisses the app during the modal (without
tapping Collect), `closedAt` still holds the original timestamp. On the next resume, the SAME
offline reward is re-presented. Fe7 EC-8 calls this a recommendation but does not mandate it in
the Acceptance Criteria.

**Failure mode**: Player double-earns offline gold by closing during the modal.

**GDD text cited**:
> Fe7 EC-8: "Additional safeguard (recommended): After computing and presenting offline gold,
> overwrite `closedAt` with a sentinel value…"

---

#### I1 — INFO: Fe7 offline modal threshold (60s) silently credits gold with no player feedback

**Systems**: Fe7

**What**: Fe7 EC-4: if elapsed < 60s, offline formula still runs but the modal is suppressed.
Gold is silently credited. This is player-friendly for accidental tab-close, but the Acceptance
Criteria (AC-2) says "silently credited" or "accrual is skipped" — leaving the implementation
choice ambiguous. If gold is silently credited, a player refreshing rapidly can earn up to
`floor(60 × goldPerSec × 0.60)` gold per refresh cycle with no feedback.

**GDD text cited**:
> Fe7 EC-4: "gold is credited, but the modal is suppressed"
> Fe7 AC-2: "(or accrual is skipped if the threshold is the minimum-accrue gate — implementation detail)"

---

## Scenario 2 — Adopting a New Species (Fe1 + Fe2 + C3 + C4 + C2)

### Trigger
Player taps "Buy · X 🪙" for a newly-unlocked species (level gate met, gold sufficient).

### Designed Activation Order (from GDDs)
1. `unlockAnimal(k)` validates level gate and gold
2. Naming modal opens
3. Player confirms → `confirmBuy()` runs:
   a. `pay(u.gold)` → gold deducted (F2)
   b. `k` appended to `owned` (Fe1)
   c. `+40 Zoo XP` granted (C3)
   d. `pops[k] = 1` set (Fe1)
   e. Meters seeded: `{hunger:60, thirst:58, clean:64, happy:66, trust:30}` (C1)
   f. Custom name saved (Fe1)
4. C2 `appealOf` / `happyMult` recomputed next tick (economy chain updated)
5. C3 `levelFromXp` recomputed (possible level-up)

### Data Flow Analysis

Step 3c grants +40 XP. If this crosses a level threshold, the new level takes effect
immediately in the same render (C3 §"Level Derivation" — derived on every render).

The new animal's meters are seeded with `happy:66` at step 3e. This animal immediately
contributes to `avgHappiness` in the C2 formula. A fully-neglected zoo (all animals at
happy=0) gains a partial improvement from this new adoption.

### Findings

---

#### B3 — BLOCKER: confirmBuy() does not enforce the enclosure capacity gate before adoption

**Systems**: Fe1, Fe2

**What**: `confirmBuy()` in Fe1 §3.3 steps a–f does NOT include a capacity check. The capacity
check (`cntOf(k) >= capOf(k)`) exists only in `buyMoreAnimal()` (buy-more flow), NOT in the
first-adoption flow. The first-adoption flow sets `pops[k] = 1` unconditionally. However, an
enclosure at level 1 has a capacity of 2 (`capOf = 2 + (encLv - 1) = 2`). If the player is
adopting a species where a previous admin unlock set `pops[k] = 2` already, the first-adoption
path could theoretically add the animal to an already-at-capacity enclosure.

More critically: when the player adopts a species and `pops[k] = 1` is set, the buy-more
button on the Enclosure screen shows the next copy cost immediately. If the player then taps
"Buy More" from there, `buyMoreAnimal` checks `cntOf(k) >= capOf(k)`. But the appeal formula
already counted `count = pops[k]` — which at adoption-time is 1. This is consistent and safe
in the normal path.

**However**, the **open question from Fe2 §OQ**: the GDD for Fe2 does not specify what happens
when a species is adopted but its enclosure biome is not yet unlocked. Example: a player at
Lv5 adopts Cat (Lv5), but Cat lives in the Meadow habitat — fine. But a player at Lv32 adopts
Zebra (Savanna biome, unlocks at Lv32). The Savanna biome itself also unlocks at Lv32. Is it
guaranteed that the biome unlock fires before the adopt? The `confirmBuy` steps in Fe1 make no
reference to biome availability, and the biome unlock is a UI state derived from Zoo Level —
no explicit activation event is documented. If the biome tile is still "locked" in the UI when
the adoption completes, the newly-adopted Zebra has no visual enclosure to live in until the
next render.

**Failure mode**: Player taps "Adopt Zebra" at exactly Lv32 (same tick as biome unlock). The
animal exists in `owned[]` and in `pops{}`, its meters tick, it contributes to economy — but
if the UI shows the biome as locked (from the previous render), the Zebra appears in "owned"
without a visible enclosure. This is a rendering/state-transition gap, not a data corruption,
but it can produce contradictory messaging: "Zebra adopted! (Welcome flash)" alongside a
locked Savanna biome tile.

**Fix**: Fe1 §confirmBuy and Fe2 §biome-unlock should specify that when a species' unlock
level equals the biome's unlock level, both unlock in the same render cycle. Document the
order explicitly: biome tile becomes interactive as soon as `level >= habitat.unlock`; the
adopt flow does not need to trigger a biome unlock event independently.

**GDD text cited**:
> Fe1 §3.3: steps a–f — no capacity check or biome-unlock step listed
> Fe2 §3.1 biome table: "Savanna — Lv 32" matches Zebra's unlock level
> C3 §content-unlock: "if `level < required_level`, the content is locked"

---

#### W3 — WARNING: +40 XP from adoption may cross a level threshold, triggering an unlock announcement of a DIFFERENT species/habitat in the same tap

**Systems**: Fe1, C3

**What**: `confirmBuy()` calls `setXp(x => x + 40)` (step 3c). If the player's current XP
is very close to the next level threshold, this 40 XP grant can push them over a level and
immediately unlock new content (another species or a new biome). The level-up `useEffect` in
C3 fires once and announces only the final level reached. The player's UX is:
- "Welcome, Zebra!" (adoption flash)
- "⬆️ Lv 33" (level-up toast)
- But if Lv33 unlocks Giraffe: a second species silently becomes unlockable with no announcement

The player sees two toasts at once (adopt + level-up) and may not realize a third unlock
(Giraffe at some level) silently occurred. C3 §EC-2 documents this "silent intermediate level"
behavior but treats it as advisory.

**Failure mode**: For a species unlock that aligns exactly with an already-near threshold,
the player misses the unlock announcement and only discovers the new species later.
This degrades the "door opening" emotional beat that the C3 player fantasy promises.

**GDD text cited**:
> C3 §EC-2: "Intermediate levels are crossed silently — no individual toasts for each skipped level."
> Fe1 §3.3 step 3c: "Grants `+40 Zoo XP` via `setXp(x => x + 40)`"

---

#### I2 — INFO: Adoption initial meters (happy:66) immediately nudge happyMult before the player has cared for the new animal

**Systems**: Fe1, C1, C2

**What**: A newly adopted animal starts with `happy:66`, which is above the C1 neutral
threshold (happyMult = 1.0 at avgHappiness=60). When a player with a struggling zoo
(avgHappiness=30, happyMult=0.70) adopts a new animal at happy=66, the new animal pulls
the average up. The economy immediately improves slightly without any care action.

This is not a bug — the GDD confirms this is the seeded default — but it means care
engagement is not the only way to recover a struggling economy: adopting animals also helps.
This creates a non-obvious incentive structure.

**GDD text cited**:
> C1 §3.1: "Initial stat values on adoption: happy = 66"
> C2 §4: "happyMult = clamp(0.4 + avgHappiness/100, 0.5…1.4)"

---

## Scenario 3 — Completing a Care Action (C1 + C2 + C3 + C4 + Fe6 + F2)

### Trigger
Player opens care screen for an animal with low `happy` stat. Taps "Play" (free action).

### Designed Activation Order (from GDDs)
1. `doAction('play')` validates `happy < 98` (stat-full gate)
2. `adjust(sel, {happy:+100, trust:+4})` — sets happy to 100, trust += 4
3. `setXp(x => x + 3)` — +3 XP granted (C3 faucet)
4. No gold deduction (Play is free)
5. `bump2('feed')` NOT called (only Feed increments counts.feed; Play increments nothing)
6. `happyMult` recomputed next render (C2 welfare composite)
7. Level-up check via `useEffect` in C3

### Key variant: "Spam Free Play" concern

C1 OQ-2 documents the concern that since Play (+100 happy, +4 trust) is free and restores
the most-impactful stat, players can spam Play on all animals, ignoring Feed/Water/Bathe.
This was addressed in entities.yaml revision of `happy_mult` to be a WELFARE COMPOSITE
(hunger+thirst+clean+happy)/4, meaning that ignoring Feed/Water/Bathe still reduces the
composite welfare and thus happyMult.

HOWEVER: entities.yaml note confirms "2026-06-07 C# AUDIT: NOT IMPLEMENTED —
EconomyService.GoldPerSec applies NO welfare/happiness multiplier." The welfare composite
redesign exists in entities.yaml and prototype.jsx but is NOT in the shipping C# codebase.

### Findings

---

#### B4 — BLOCKER: The welfare composite fix for "spam free Play" is in entities.yaml but NOT in C# — the core incentive problem remains in the shipping codebase

**Systems**: C1, C2, entities.yaml, C# codebase

**What**: The GDD review trail shows the problem was identified (C1 OQ-2) and a fix was
designed (welfare composite in entities.yaml §happy_mult, revised 2026-06-06). But the
2026-06-07 C# audit found `EconomyService.GoldPerSec` applies NO welfare multiplier at all —
not the old happiness-only version and not the new composite version. The C1→C2 care-to-income
link is completely absent in C#.

**Failure mode**: In the shipping game:
- Caring for animals has NO effect on gold income.
- The "spam free Play" degeneracy is irrelevant because care has zero economy impact.
- The core game loop thesis ("animals create appeal → care makes them happy → happy animals
  earn more") is broken at its central connection.
- The entire care pillar ("daily care as ritual") has no mechanical reinforcement in income.

**Fix**: Implement `happyMult` (or the welfare composite) in `EconomyService.GoldPerSec`.
This is already marked `C-2` in `production/implementation-gaps.md`. This is the highest-
priority implementation gap for the core loop.

**GDD text cited**:
> C2 §4: "happyMult = clamp(0.4 + avgHappiness/100, 0.5…1.4)" and "happiness feeds back into
> the economy via `happyMult`"
> entities.yaml happy_mult notes: "2026-06-07 C# AUDIT: NOT IMPLEMENTED —
> EconomyService.GoldPerSec (EconomyService.cs:74,88) applies no welfare/happiness multiplier"

---

#### B5 — BLOCKER: +3 XP from a care action can cross a level threshold mid-session and trigger immediate attraction/species unlock during active care loop — no UI handoff defined

**Systems**: C1, C3, Fe1, Fe4, Fe6

**What**: The care action grants +3 XP via `setXp`. If the player's XP is exactly 3 below
the next threshold (e.g., they need 5,200 XP for Lv7 and currently have 5,197), a single
care tap pushes them to Lv7. In the same render cycle:
- Petting Area (Lv7) becomes buildable in the Attractions tab
- Cat (Lv5) and Goat (Lv6, if not yet at those levels) become adoptable
- Quest chapters with `{t:'level', n:7}` objectives now satisfy that objective

The C3 `useEffect` fires the level-up toast. The care screen is still open (player is in the
middle of a care session). The level-up toast + care screen + potentially "Quest ready to
claim" dot appear simultaneously.

**Failure mode**: No GDD specifies what happens to the care screen UI when a level-up fires
during an active care action. The flash from the care action ("Fed · −40 🪙") conflicts with
the level-up toast ("⬆️ Lv 7"). More critically: if a Quest chapter is now ready to claim
(because the level objective was the last unmet objective), the Quest FAB dot appears but the
player may not see it — they are looking at the care screen.

**Specific degenerate case**: If claiming the now-available quest chapter would grant XP that
crosses ANOTHER level threshold (C3 §EC-2 multi-level crossing), the player can in theory:
tap care → Lv7 achieved → quest becomes claimable → player claims → +300 XP → also crosses
Lv8 threshold in same session. Two level-up events in sequence, partially from a care tap.

**No GDD defines the handoff sequence**: care screen → level-up notification → quest notification.

**Fix**: Define a notification priority queue: (1) care action feedback flash, (2) level-up
toast, (3) quest completion dot. Document this ordering in the C3 GDD EC-6 section and
link from C1 §3.6 "interactions."

**GDD text cited**:
> C3 §EC-6: "A care action grants XP at the exact render cycle when the level-up toast is
> showing (1700ms window)... A second level crossing during the 1700ms toast window will
> re-trigger the useEffect... (no visual overlap is prevented)"
> C3 §"Level is derived from XP, not tracked independently": "every render, `level = levelFromXp(xp)`"

---

#### W4 — WARNING: Quest counts.feed is incremented per action tap, not per successful care completion — "Feed 2 times" can be gamed with gold-insufficient feeds

**Systems**: C1, Fe6

**What**: Fe6 §3.4 documents that `counts.feed` is incremented inside `doAction('feed')` via
`bump2('feed')`. C1 §3.3 shows that a feed action is blocked by `gold < actualCost` BEFORE
the stat change occurs — no stat change, no XP. However, Fe6 does not document whether
`bump2('feed')` fires before or after the gold-sufficiency check.

If `bump2('feed')` fires before the `gold < actualCost` guard, a player with 0 gold can tap
"Feed" repeatedly to advance quest objectives for "Feed N animals" without actually feeding
anything. The code location documented in Fe6 §3.4 is `if (key==='feed') bump2('feed')` inside
`doAction` — the exact position relative to the cost check is not specified in the GDD.

**Failure mode**: Quest "Feed 2 animals" can be satisfied without spending any gold.
This undermines the quest's intent (to encourage resource expenditure on care).

**GDD text cited**:
> Fe6 §3.4: "counts.feed: When incremented: Player taps Feed care action (`doAction('feed')`)"
> C1 §3.3: "Cost insufficiency: if `gold < cost`, the action is blocked… No stat change or XP grant occurs."
> Fe6 OQ-2 covers activity counts on start vs. completion — but does NOT cover care-action counts vs. gold check.

---

#### W5 — WARNING: "Spam free Play" degeneracy not fully addressed — Heal (+40 happiness) vs Play (+100 happiness) creates a dominant strategy

**Systems**: C1, C4

**What**: Even with the welfare composite (once implemented), the Play action sets `happy` to
100 (full restore) while Heal only restores +40. Heal costs 30 × tier_mult gold. Both grant
+3 XP. Play also grants +4 trust; Heal grants +2 trust. The only scenario where Heal is ever
preferred over Play is if `happy ≥ 98` (Play is blocked). Otherwise: Play strictly dominates
Heal on every metric (happiness restore, trust gain, gold cost). A player who only uses Play
will always have max happiness for the economy chain and will accumulate trust faster per gold
spent.

**Failure mode**: Heal is a dominated strategy. It exists in the ACTIONS array and has
tutorial/quest visibility but provides no scenario where it is the optimal choice.

**GDD text cited**:
> C1 §3.3: "Play: happy +100, trust +4, free. Heal: happy +40, trust +2, cost 30 × tier_mult"
> C1 Tuning Knobs: "Heal happiness restore should be less than Play's 100 to maintain Play's free value"
> (Note: this explains the design intent but doesn't make Heal non-dominated)

---

## Scenario 4 — Hitting a Zoo Level Milestone Mid-Session (C3 + Fe1 + Fe4 + Fe6 + C1)

### Trigger
Player is at XP = N (close to a level threshold). They claim a completed quest chapter.
Quest claim grants large XP reward (e.g., Chapter 3 = +850 XP). This crosses two level
thresholds simultaneously.

### Designed Activation Order (from GDDs)
1. `claimQuest(q)` executes:
   a. `setGold(g => g + q.rw.gold)` — gold credited
   b. `setXp(x => x + q.rw.xp)` — XP credited (e.g., +850)
   c. `setChapterIdx(i => i + 1)` — chapter advanced, next chapter now active
   d. Flash: "🏅 Chapter N done! +X 🪙"
2. React re-renders; `levelFromXp(xp)` returns new level (possibly +2 levels)
3. `useEffect` fires, comparing `level` to `prevLvlRef.current`:
   - Announces only the FINAL level reached ("⬆️ Lv N")
   - Intermediate levels crossed silently
4. All content gated at intermediate levels now available (derived live from `level` value)
5. NEW chapter is now active (chapterIdx advanced in step 1c)

### Findings

---

#### B6 — BLOCKER: Double-level-up from quest claim + immediate next-chapter auto-completion creates a chain of instant rewards that the GDD does not describe or cap

**Systems**: C3, Fe6

**What**: Fe6 §3.7 notes: "The cursor advancing removes the current chapter from the view
immediately — the newly active chapter (chapterIdx+1) may already be complete if the player's
counts exceed both thresholds. This is not blocked — the player can immediately claim the
next chapter if they qualify."

Scenario: Player at XP = 41,990 (just below Lv18 = 42,000). They claim Chapter 3 (+850 XP).
Result: XP = 42,840 → Lv18 (Feeding Zone now buildable). Lv18 was just crossed. Chapter 4
is now active. If the player's `counts.activity >= 2` and `counts.feeding >= 2` and
`counts.vip >= 1` (all from prior session), Chapter 4 is IMMEDIATELY claimable.
Claiming Chapter 4 grants +1,200 XP → XP = 44,040 → still Lv18 (no second level-up).
But the Gold flood (200+400+1200+600 = 2,400 🪙) arrives in rapid succession via rapid taps.

The degenerate case: if cumulative `counts` are high enough to satisfy multiple chapters
simultaneously (possible because counts are lifetime-cumulative and never reset per Fe6 §3.4),
the player can chain-claim all remaining available chapters in one session.

**Failure mode**: No GDD specifies a claim-rate limit or a debounce between chapter claims.
The combination of lifetime-cumulative counts + immediate cursor advance means a returning
player who already met all objectives for multiple chapters can claim 3+ chapters in <5 seconds,
receiving thousands of XP and gold. This breaks the pacing intent of the chapter system.

C3 §EC-2 only notes this for single XP grants; it does not discuss the compound scenario where
multiple chapter claims chain together.

**Fix**: Either (a) add a per-chapter completion timestamp to prevent instant chain-claiming,
or (b) document explicitly that chain-claiming is an intended "catch-up" mechanic for returning
players who met objectives while away.

→ `xp-pacing-redesign-2026-06-08.md` does not address this — it modifies faucet scaling but
leaves the quest-claim chain behavior untouched.

**GDD text cited**:
> Fe6 §3.7: "the player can immediately claim the next chapter if they qualify"
> Fe6 §3.4: "Counts are never reset… Chapter 2's 'Feed 2 times' counts from the game's total
> feed count, not from when Chapter 2 became active"

---

#### B7 — BLOCKER: Intermediate level unlocks from quest XP grant are never announced — player may have new species/attractions available without knowing

**Systems**: C3, Fe1, Fe4, Fe6

**What**: C3 §EC-2 documents that when multiple levels are crossed in one XP grant, only the
final level is announced. All content unlocked at intermediate levels becomes available
"immediately (the UI reads `level` live and gates based on the current value)" but no
notification fires for those intermediate unlocks.

Example: Player at Lv16 claims Chapter 3 (+850 XP), crossing Lv17 (Cow unlocks) and Lv18
(Feeding Zone attraction, Cow species) simultaneously. Toast shows "⬆️ Lv 18." Lv17 Cow
unlock fires silently. The player does not know Cow is now adoptable unless they check the
Animals screen themselves.

**Failure mode**: The "door opening" emotional beat for intermediate unlocks is lost.
For species unlocks this is advisory-level, but for attraction unlocks (Petting Area at Lv7,
Feeding Zone at Lv18) which require gold expenditure and have visible UI cards, the silent
unlock means the player may have a buildable attraction and not notice it for days.

The C3 GDD labels this advisory ("A future improvement could queue individual unlock toasts")
but given the frequency at which this can occur for players who claim large quest rewards,
it should be elevated to WARNING or BLOCKER for the attractions case.

**Fix**: Queue a separate "unlock" notification for each level crossed that contains a named
content unlock (species, habitat, attraction). This is distinct from the level-number toast.

**GDD text cited**:
> C3 §EC-2: "The `useEffect` fires once, announcing only the final level reached… Intermediate
> levels are crossed silently — no individual toasts for each skipped level."
> C3 §AC-10: "both Cat (Lv5) and Goat (Lv6) appear as unlockable in the Animals screen
> without requiring a further XP gain" — but no announcement is mandated

---

#### W6 — WARNING: Quest XP reward (Chapter 7 = +3,000 XP) can be significantly larger than the XP gap between multiple consecutive level thresholds, creating unpredictable multi-level jumps

**Systems**: C3, Fe6

**What**: Chapter 7 rewards +3,000 XP. At mid-game level bands (Lv11–Lv18), the XP delta
per level is approximately 2,000–6,000 XP (from the curve). But at the early anchor band
(Lv7–Lv18), Chapter 3 (+850 XP) and Chapter 4 (+1,200 XP) are claimable while the player
is in the Lv7–10 range, where the per-level XP delta is ~2,000–4,000 XP. A single chapter
claim could not cross multiple levels here. However, at Lv1–Lv7 (per-level delta ~90–2,400
XP), Chapter 1 (+300 XP) alone can cross 3+ levels simultaneously for a new player.

**Failure mode**: Tutorial new player at Lv2 (XP ~90) claims Chapter 1 (+300 XP). In the
Lv1–Lv7 band, levels 2–5 have thresholds ~90, 300, 720, 1,470 XP. +300 XP from Lv2
would cross to Lv3 (threshold 300) and potentially Lv4 (threshold 720) — not quite, but
depending on rounding, 2–3 level jumps at tutorial stage are plausible. The tutorial experience
(P7) does not account for this: it assumes sequential single-level progression.

**GDD text cited**:
> C3 §"Key values computed from algorithm": Lv2 ~90, Lv3 ~300, Lv4 ~720 (per-level delta
> for early game is very small)
> Fe6 §3.2: "Chapter 1 reward: +300 XP"

---

#### I3 — INFO: Quest reward gold (Chapter 7 = 6,000 🪙) is credited before Gold is checked for the new chapter's unlock costs — no ordering issue but the simultaneity is undocumented

**Systems**: Fe6, C3, Fe1

**What**: In `claimQuest`, gold is credited first (step a), then XP (step b), then cursor
advances (step c). The new chapter shown after claiming has its own level/count prerequisites.
The gold credit and XP/level-up in the same atomic function call means the player's updated
gold balance is available for any purchase that becomes unlocked by the new level. This is
the correct and expected order, but no GDD explicitly documents the ordering guarantees
of `setGold → setXp → setChapterIdx` within a single React event handler.

---

## Scenario 5 — Building/Upgrading Toward a Trust-Gated Attraction (Fe4 + C4 + F3 + Fe1)

### Trigger
Player reaches Lv7. Petting Area description says "Needs Trust ≥ 40." Player builds the
Petting Area (500 🪙) hoping their Dog (trust=30 at adoption) will appear as a participant.
Dog has taming = "Very Easy" — should qualify for Petting Area by taming filter.

### Designed Activation Order (from GDDs)
1. `buildAttraction('petting')` validates `gold >= 500` → deducts gold
2. `built = ['petting']` array updated
3. C2 capacity and goldPerSec formulas gain `|built|=1` multiplier
4. Attractions screen renders participant panel for Petting Area
5. Participant filter: `['Very Easy', 'Easy'].includes(a.taming)` → Dog qualifies
6. Trust gate (proposed ≥ 40) — NOT enforced in code, only in description text

### Data Flow Analysis

Step 4 explicitly does NOT check `meters[k].trust`. The ATTRACTIONS entry says "Needs Trust ≥ 40"
but C4 §OQ-3 (HIGH priority) and Fe4 §OQ-5 (HIGH priority) both document this as data-only.

Additionally: trust is in `meters[k].trust`. Per F3 systems-index (2026-06-07 C# audit):
meters are NOT serialized in C# v1 SaveService. Trust resets to default (30) on every reload.

### Findings

---

#### B8 — BLOCKER: "Needs Trust ≥ 40" is data-description text only — trust gate for Petting Area is not enforced in any code path (JSX or C#)

**Systems**: Fe4, C4, F3

**What**: The Petting Area data entry in `ATTRACTIONS` includes description: "Needs Trust ≥ 40."
The participant filter uses `ANIMALS[k].taming` string check only. No code in `proto-screens.jsx`
reads `meters[k].trust`. Fe4 §OQ-5 is marked HIGH priority. C4 §OQ-3 is marked HIGH priority.

The description tells the player that trust matters for the Petting Area. The code does not
enforce it. Players can run Petting Area activities with animals at trust=30 (adoption default).
The actual "gate" is the species-level taming category, which is determined at species
definition — a player cannot change it.

**Failure mode (compounding with F3)**:
Even if the trust gate were implemented, `meters[k].trust` is not persisted in the C# save
blob (F3 SaveService.cs:143 confirmed gap). Every game reload resets all animal trust to 30
(the adoption default). This means:
- Trust built up over weeks of play is erased on reload.
- The Petting Area trust gate (when implemented) would arbitrarily exclude animals the player
  has been playing with for weeks.
- The core taming system value proposition ("long-term investment") is non-functional.

This is a compound blocker: (a) trust gate not enforced → misleading UI text, AND (b)
trust not persisted → taming system entirely non-functional in shipping C#.

**Fix**:
1. F3: Add `AnimalMeters` (including trust) to the v1 save blob — already tracked as gap.
2. Fe4/C4: Implement trust gate in `participants('petting')` once F3 is fixed.
3. Until both are fixed, update ATTRACTIONS description to remove "Needs Trust ≥ 40" or
   mark it as "coming soon."

**GDD text cited**:
> Fe4 §3.1: "Needs Trust ≥ 40. (This threshold is data-only description; the code does not enforce it)"
> C4 §OQ-3: "Trust threshold gates are data descriptions, not code enforcement (HIGH — blocking Fe4/Fe5 design)"
> systems-index.md 2026-06-07 audit: "trust_initial_on_adopt / trust_gain_per_action / trust_thresholds
> (Trust field exists in AnimalMeters but is NEVER written or read — taming absent)"

---

#### B9 — BLOCKER: Trust is NEVER written or read in the C# codebase — the entire Taming system is a design ghost in shipping code

**Systems**: C4, F3, Fe4, Fe5

**What**: The 2026-06-07 C# audit in entities.yaml reports:
> "❌ NOT FOUND in C# (designed here, no implementation — DESIGN-vs-CODE GAP):
> trust_initial_on_adopt / trust_gain_per_action / trust_thresholds (Trust field exists
> in AnimalMeters but is NEVER written or read — taming absent)"

`AnimalMeters` struct has a `trust` field but no C# service writes to it (not during adoption,
not during care actions) and no service reads it (not for attraction participation, not for
show bonuses). The entire taming arc — described across 5 GDD documents (C4, Fe4, Fe5, C1, F3)
as a key mid-to-late-game system — has zero implementation in the shipping codebase.

**Failure mode (cascading)**:
- C4 taming milestones: non-functional
- Fe4 trust gate for Petting Area: non-functional
- Fe4 trust gate for Performance Arena: non-functional
- Fe5 show crowd bonus (trust-multiplied reward): non-functional
- Weekly mission "Raise 1 animal to max trust": non-functional (also undefined — C4 §OQ-6)
- The GDD's "Thriving" status label (trust ≥ 68): non-functional for displayed UI
- C1's trust-building care actions (Play +4, Heal +2): execute but their output is discarded

**Fix**: Implement trust accumulation in `CareService.cs` (or equivalent care action handler)
and trust persistence in `SaveService.cs` as the minimum viable implementation. This is a
prerequisite for any trust-gated content.

**GDD text cited**:
> entities.yaml C# audit: "trust_initial_on_adopt / trust_gain_per_action / trust_thresholds…
> NEVER written or read — taming absent"
> C4 §1: "Trust serves as the primary gate for deeper player-animal interactions"

---

#### W7 — WARNING: Performance Arena trust gate (PROPOSED ≥ 80) is at odds with initial trust of 30 and the existing 18-tap-to-100 arc being species-difficulty-flat

**Systems**: C4, Fe4, Fe5

**What**: C4 §4.2 proposes that taming difficulty should create variable trust thresholds
(Very Easy: ~20, Master: 100) to make the difficulty label mechanically meaningful. But this
is PROPOSED — not implemented. In the current (and shipping) design, all species gain trust
at the same rate (+4/play, starting at 30). The Performance Arena PROPOSED gate of trust ≥ 80
means ANY `perform:true` species requires only 13 Play actions from adoption (30 → 80 = 50 pts
/ 4 pts per play = 12.5 → 13 taps). A Lion (Expert difficulty, `perform:true`) can be
"Performance Arena ready" in 13 Play taps — same as a Dog (Very Easy).

The player fantasy ("this takes weeks") from C4 §2 is contradicted by the flat-rate math.

**Failure mode**: Expert/Master species tame in the same session as Very Easy species.
The "earned bond" emotional arc collapses into "do 13 Play taps." The difficulty labels
in the TAMING table are design fiction unless OQ-2 (variable rate or threshold) is resolved.

**GDD text cited**:
> C4 §3.3: "At the current rate (70 points needed from trust=30 to trust=100, at +4/play)
> any species requires ~18 Play taps, regardless of difficulty tier."
> C4 §2: "A Dolphin whose trust meter sits at 95 after months of daily play sessions feels
> genuinely different"

---

#### I4 — INFO: Very Easy species "tames on adopt" intent conflicts with trust=30 initialization for all species

**Systems**: C4, Fe4

**What**: C4 §3.3 TAMING table lists Very Easy species as `time: 'instant'`, `note: 'Tames on adopt.'`
But `confirmBuy()` seeds all species at trust=30. Very Easy species (Rabbit, Dog, etc.)
do NOT auto-tame at adoption. C4 §EC-5 flags this as a gap and OQ-4 asks "should Very Easy
species auto-tame on adoption?"

No GDD currently specifies what happens when a player builds the Petting Area and their Rabbit
(Very Easy, trust=30) still needs 3 more Play actions to hit the PROPOSED trust=40 gate.
The description "Needs Trust ≥ 40" would initially exclude the STARTER RABBIT from the
Petting Area — creating a confusing player experience at the very first attraction.

**GDD text cited**:
> C4 §EC-5: "There is no code that auto-sets trust to 100 on adoption of a Very Easy species.
> The 'instant' description is design intent, not implementation."

---

## Cross-Scenario Summary — Systems Without Any Cross-Reference Documentation

These ordering gaps exist across all 5 scenarios and are not documented in any GDD:

### XS1 — BLOCKER: No canonical "session resume order" document exists

The sequence: F3 load → Fe7 offline compute → C1 decay-not-applied → C2 welfare recompute →
"while you were away" modal → normal gameplay — is described piecemeal across four GDDs
(F3, Fe7, C1, C2) but never as a single ordered boot sequence. Each GDD describes its own
step in isolation. The boot sequence is UNDEFINED at the system integration level.

**Failure mode**: Implementers will make contradictory assumptions about ordering. The
entities.yaml 2026-06-07 audit reveals the dual-bootstrap problem (`AppBootstrap` vs `GameApp`
paths) as direct evidence that this gap already caused an architectural split:
> "The path that actually runs [GameApp] does not save or accrue offline." (systems-index C-1)

**Fix**: A single "session lifecycle" section in either F3 GDD or a new Session-Lifecycle.md
should define the canonical ordered steps for both session-open and session-close.

### XS2 — WARNING: No GDD specifies notification priority when multiple events fire in one render

Level-up toast (C3), care feedback flash (C1), quest completion dot (Fe6), adoption
welcome (Fe1), attraction-built flash (Fe4) — all can fire in the same render cycle and all use
the same flash/toast mechanism. No GDD defines priority or mutual exclusion. This will produce
visual noise in the most rewarding moments.

---

## Appendix: Proposal Relevance Notes

| Finding | Does economy-redesign.md address it? | Does xp-pacing-redesign address it? |
|---------|--------------------------------------|--------------------------------------|
| B1 offline welfare formula conflict | Partially (welfare composite is in the redesign) | No |
| B4 happy_mult not in C# | Yes (welfare composite would still need C# impl) | No |
| B6 quest chain-claiming | No | Partially (scaling XP reduces incentive to chain, but doesn't block it) |
| W1 offline optimal strategy | Yes (day/night rhythm adds engagement reason to stay online) | No |
| W6 early level jumps | No | No (leaves curve anchors unchanged) |
| W7 flat taming rate | No | No |

---

*End of Phase 4 Scenario Walkthrough Draft*
*Total findings: 20 (9 BLOCKER, 7 WARNING, 4 INFO)*
*Scenarios walked: 5*
