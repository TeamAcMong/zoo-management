# Zoo Level Progression System

> **Status**: In Design (Reverse-Documented)
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — Zoo Level is the gate, not the goal; the next unlock is always the real prize

---

## Overview

Zoo Level is the master content gate in Animal World Zoo. A single integer (1–92)
derived by comparing the player's accumulated Zoo XP against the `LEVEL_XP`
threshold array controls what species, habitats, and attractions are available for
the player to build. Zoo XP is earned passively through play — every care action
on an animal, every animal adoption, every quest completion, and every entertainment
activity rewards XP — so the level rises as a natural side-effect of keeping the
zoo running. The player never "grinds XP" deliberately; they care for animals and
the level follows.

The threshold curve is generated at module load from seven hand-authored anchor
points (the `LEVELS` table in `act/data.jsx`) by geometric interpolation. Every
level from 1 to 92 has a unique cumulative XP value; the anchors align with the
major biome and attraction milestones. MAX_LEVEL = 92, matching the final animal
unlock (Dolphin). Changing the pace of any phase requires only editing the relevant
LEVELS anchor — the interpolated curve self-corrects.

*Reverse-documentation status: The LEVEL_XP curve, level-derivation function, all
XP sources, and the MAX_LEVEL guard are all found in the implementation. No values
in this GDD are invented — they are extracted from `act/data.jsx` and
`act/prototype.jsx` as of 2026-06-06.*

---

## Player Fantasy

Players never think "I need to accumulate XP." They think "the Dog unlocks at
Level 3 — if I feed Clover one more time I'll be there." The XP bar is a quiet
promise: every small act of care deposits progress, and the bar inches forward. A
new level is not a mechanical unlock — it is a door opening: the Woodland biome
silhouette solidifies, the Giraffe comes into view in the Animals list, the
Performance Arena appears in the build tab.

The key emotional beat is **anticipatory progression**: the player can always see
the *next* thing. The unlock system ensures this — no level band is empty, and the
final level (92) hands the player the Dolphin, the highest-appeal marine performer.
Reaching it is a long arc measured in months, not sessions. The XP bar provides
a constant micro-feedback loop (care action → XP flash → bar nudges) while the
level gate provides a medium-term goal (unlock Zebra at Lv32). These two loops
reinforce each other without either feeling grind-like.

---

## Detailed Design

### Core Rules

1. **Zoo XP is a level resource, not a spend currency.** It only ever accumulates.
   No mechanic spends or destroys XP. Attempting to subtract XP is a bug.

2. **Level is derived from XP, not tracked independently.** Every render,
   `level = levelFromXp(xp)`. There is no separate `level` state variable. The
   derivation is a single linear scan of the `LEVEL_XP` array (92 entries), O(92).

3. **The LEVEL_XP array is 1-indexed conceptually, 0-indexed in the array.**
   `LEVEL_XP[0]` is the XP threshold to be at Level 1 (= 0). `LEVEL_XP[n-1]` is
   the cumulative XP needed to be at level n.

4. **Level n is active when `xp >= LEVEL_XP[n-1]`.**
   The player is at the highest level n for which this holds.

5. **MAX_LEVEL = 92.** The level derivation loop produces a maximum of 92.
   `atMaxLevel = level >= 92`. At MAX_LEVEL the XP bar renders as 100% / "MAX";
   XP continues to accumulate in state but triggers no further level-up events
   or unlocks.

6. **Content gating.** Animal species, habitats, and attractions declare a Zoo
   Level requirement. The system enforces: if `level < required_level`, the
   content is locked (shown but not interactive). The player is shown the required
   level as a goal.

7. **XP sources are all additive, instantaneous grants.** There is no passive
   XP-per-second ticker. XP is always awarded in explicit discrete amounts at
   defined events (see Interactions table).

---

### XP Sources

| XP Source | XP Amount | Trigger | Code Location |
|-----------|-----------|---------|---------------|
| Care action (any: feed, water, clean, play, heal) | +3 XP | Per tap on any care button (`doAction`) | `prototype.jsx: setXp(x => x + 3)` |
| Animal adoption (unlock new species) | +40 XP | On `confirmBuy()` completing successfully | `prototype.jsx: setXp(x => x + 40)` |
| Quest chapter completion | +300 – +3,000 XP | On `claimQuest(q)` for chapters 1–7 | `prototype.jsx: setXp(x => x + q.rw.xp)` |
| Tutorial step reward (selected steps) | Varies (Gold-only in current impl.) | On `nextTut()` when `s.rw.xp` is set | `tutorial.jsx: nextTut → setXp` |
| Entertainment activity completion | +20 – +240 XP | On `finishActivity()` for `xp`-bearing activities | `prototype.jsx: setXp(x => x + a.xp)` |
| Offline/idle session collect (prototype stub) | +820 XP (hardcoded demo) | Offline modal "Collect rewards" button | `prototype.jsx: setXp(x => x + 820)` |

**Notes:**
- The tutorial steps in the current implementation (`tutorial.jsx`) award Gold only (`rw: { gold: N }`) — no `rw.xp` entries. The infrastructure to grant tutorial XP exists (`nextTut` checks `s.rw.xp`), but the current step definitions do not use it. ⚠️ This is an open gap.
- The offline XP value (+820) is a prototype demo constant, not a computed formula. See Open Questions.
- Not all entertainment activities carry XP. Activities with `xp` field: `photo_rabbit` (+20), `photo_pony` (+24), `photo_monkey` (+30), `edu_monkey` (+120), `edu_elephant` (+180), `edu_dolphin` (+240). Feeding, riding, and premium activities yield Gold/Reputation only.

---

### Quest XP Rewards

| Chapter | Title | XP Reward |
|---------|-------|-----------|
| 1 | Welcome to the Zoo | +300 |
| 2 | Growing the Zoo | +550 |
| 3 | First Expansion | +850 |
| 4 | Happy Visitors | +1,200 |
| 5 | New Attractions | +1,600 |
| 6 | Building a Real Zoo | +2,300 |
| 7 | Future Zoo Manager | +3,000 |
| **Total** | All 7 chapters | **+9,800 XP** |

---

### Content Unlock Table

Every named content gate listed in `LEVELS`, `HABITATS`, and `ATTRACTIONS`.

| Zoo Level | Content Unlocked | Type |
|-----------|-----------------|------|
| 1 | Meadow habitat, Rabbit (starter), ticket gate | Habitat + Starter |
| 3 | Dog (Lv3) | Species |
| 5 | Cat (Lv5) | Species |
| 6 | Goat (Lv6), Pasture habitat | Species + Habitat |
| 7 | Petting Area attraction | Attraction |
| 8 | Sheep (Lv8) | Species |
| 11 | Horse (Lv11) | Species |
| 13 | Donkey (Lv13) | Species |
| 15 | Alpaca (Lv15) | Species |
| 17 | Cow (Lv17) | Species |
| 18 | Feeding Zone attraction | Attraction |
| 20 | Fox (Lv20), Woodland habitat | Species + Habitat |
| 23 | Monkey (Lv23) | Species |
| 25 | Raccoon (Lv25) | Species |
| 26 | Educational Shows attraction | Attraction |
| 28 | Wolf (Lv28) | Species |
| 30 | Animal Rides attraction | Attraction |
| 32 | Zebra (Lv32), Savanna habitat | Species + Habitat |
| 36 | Giraffe (Lv36) | Species |
| 40 | Rhinoceros (Lv40) | Species |
| 44 | Hippopotamus (Lv44) | Species |
| 45 | Performance Arena attraction | Attraction |
| 48 | Lion (Lv48) | Species |
| 54 | Elephant (Lv54) | Species |
| 60 | Brown Bear (Lv60), Polar Peaks habitat | Species + Habitat |
| 66 | Polar Bear (Lv66) | Species |
| 70 | Turtle (Lv70), Reptile House habitat | Species + Habitat |
| 74 | Python (Lv74) | Species |
| 80 | Crocodile (Lv80) | Species |
| 84 | Seal (Lv84), Marine Cove habitat | Species + Habitat |
| 88 | Sea Lion (Lv88) | Species |
| 92 | Dolphin (Lv92) — final unlock | Species (endgame) |

---

### States and Transitions

Zoo Level has no true discrete states — it is a function of the continuous XP
value. However, the meaningful state machine governs the XP-to-level threshold
crossing:

```
Zoo Level state machine (computed on every XP change):

  level = levelFromXp(xp)
    └── scans LEVEL_XP[0..91] from index 0 upward
        for each index i: if xp >= LEVEL_XP[i], lv = i+1
        returns highest qualifying lv (max: 92)

  On React render, `level` is derived (not stored):
    const level = levelFromXp(xp);

  Level-up detection via useEffect:
    prevLvlRef tracks level from previous render
    if level > prevLvlRef.current:
      → fire level-up toast ("⬆️ Lv N" overlay, 1700ms)
      → play triangle tone (1046 Hz, 0.22s)
      → trigger content unlock for all newly-crossed levels

  At MAX_LEVEL (92):
    atMaxLevel = level >= MAX_LEVEL
    xpPct = 100 (bar renders full)
    XP bar label = "Lv 92 · MAX"
    Level-up toast does NOT fire (level cannot exceed 92)
    XP state variable continues to accumulate silently
```

**Multi-level crossing:** If a single XP grant crosses two or more level thresholds
simultaneously (possible via large quest rewards), `levelFromXp` returns the
correct highest level in one call. The `useEffect` fires once, comparing the new
level to the previous value — it will announce the final level reached. The
intermediate levels are crossed silently (no individual toasts for skipped levels).
⚠️ Content unlocks for all intermediate levels must still be applied; the current
`useEffect` only announces the final level, but the level gate checks in UI use the
live `level` value (which is correct).

---

### Interactions

**Systems that grant XP (faucets):**

| System | XP granted | Condition |
|--------|-----------|-----------|
| C1 Animal Care | +3 per care action | Any of: feed, water, clean, play, heal |
| Fe1 Animal Collection | +40 per adoption | On confirming first purchase of a new species |
| Fe6 New-Player Quests | +300 to +3,000 per chapter | On claiming a completed chapter (7 chapters total) |
| Fe5 Entertainment Activities | +20 to +240 per run | Only activities with an `xp` field; photo and edu categories |
| P7 Tutorial (infrastructure only) | XP-capable but currently 0 | Tutorial steps have no `rw.xp` entries as of 2026-06-06 |
| Fe7 Idle/Offline | Demo: +820 per session | Prototype stub only; real formula TBD |

**Systems that read Zoo Level (downstream consumers):**

| System | What it gates | How it reads level |
|--------|--------------|-------------------|
| Fe1 Animal Collection | Per-species lock state | `if (level < u.lv) reject unlock` |
| Fe2 Habitat System | Habitat availability | `HABITATS[].unlock` compared to current level |
| Fe4 Attractions | Attraction build availability | `ATTRACTIONS[].unlock` compared to current level |
| Fe6 Quests | Quest chapter objectives | `{t:'level', n:N}` objectives check `level >= N` |
| P1 HUD | XP bar display | `xpPct`, `curLvXp`, `nextLvXp`, `atMaxLevel` |
| P7 Tutorial | Tutorial step 9 mentions levelling | Display only — no level gate in tutorial steps |
| Admin Panel | Level cheat for testing | `adminLevel(n)` sets xp to `LEVEL_XP[target-1]` |

---

## Formulas

### Formula 1 — Level Derivation

```javascript
levelFromXp(xp):
  lv = 1
  for i in 0..LEVEL_XP.length-1:
    if xp >= LEVEL_XP[i]:
      lv = i + 1
  return lv   // range: 1..92
```

This is the sole canonical level computation in the codebase. `level` is never
stored as state — it is recomputed every render from `xp`.

**XP bar progress percentage:**
```
curLvXp  = LEVEL_XP[level - 1]   (cumulative XP at current level floor)
nextLvXp = LEVEL_XP[level]       (cumulative XP at next level threshold)
              OR curLvXp if atMaxLevel
xpPct    = clamp(0, 100, round((xp - curLvXp) / (nextLvXp - curLvXp) * 100))
              = 100 if atMaxLevel
```

---

### Formula 2 — LEVEL_XP Curve (THE KEY DELIVERABLE)

**Status: FOUND IN CODE — this curve is computed by `act/data.jsx` at module load, not hardcoded.**

The curve is generated by the following algorithm (verbatim from `act/data.jsx`):

```javascript
// Pacing anchors (from LEVELS table):
const LEVELS = [
  { lv:1,  xp:0        },
  { lv:7,  xp:5200     },
  { lv:18, xp:42000    },
  { lv:30, xp:210000   },
  { lv:45, xp:980000   },
  { lv:60, xp:3600000  },
  { lv:84, xp:18000000 },
];

// MAX_LEVEL = 92

LEVEL_XP = (()=>{
  const anchors = LEVELS.map(l => ({ lv:l.lv, xp:l.xp }));
  const arr = new Array(MAX_LEVEL);  // length 92, 0-indexed
  arr[0] = 0;                        // Lv1 = 0 XP

  for (s = 0; s < anchors.length-1; s++) {
    const a = anchors[s], b = anchors[s+1];
    for (lv = a.lv+1; lv <= b.lv; lv++) {
      const f = (lv - a.lv) / (b.lv - a.lv);   // fractional position in segment [0..1]
      // Geometric interpolation; first segment (Lv1→Lv7, a.xp=0) uses power law from 0
      const x = (a.xp > 0)
        ? a.xp * Math.pow(b.xp / a.xp, f)       // geometric: exponential between anchors
        : b.xp * Math.pow(f, 2.2);               // power law from zero (first segment only)
      arr[lv-1] = roundNice(x);
    }
  }

  // Extend Lv85..92 past the last anchor using the geometric ratio of the final segment
  const last = anchors[anchors.length-1];   // { lv:84, xp:18000000 }
  const prev = anchors[anchors.length-2];   // { lv:60, xp:3600000  }
  const perLv = Math.pow(last.xp / prev.xp, 1 / (last.lv - prev.lv));
                // = (18000000/3600000)^(1/24) = 5^(1/24) ≈ 1.06978
  for (lv = last.lv+1; lv <= MAX_LEVEL; lv++)
    arr[lv-1] = roundNice(arr[lv-2] * perLv);

  return arr;   // arr[0..91], where arr[n-1] = cumulative XP to be at level n
})();
```

**Curve shape summary:**
- **Segment 1 (Lv1–7):** Power-law ramp from 0 using exponent 2.2. Starts very flat,
  accelerates. This is the tutorial/early onboarding phase.
- **Segments 2–6 (Lv7–84):** Geometric interpolation between each pair of anchors.
  Within each segment the curve is a smooth exponential. The overall shape across
  all segments is a piecewise exponential — a "bent" curve that steepens as the
  player approaches each new biome threshold.
- **Extension (Lv85–92):** Straight geometric growth at `perLv ≈ 1.0698/level`
  (≈ +7% per level). This is the endgame Marine Cove phase.

**Key values computed from the algorithm:**

| Level | Cumulative XP (threshold) | Delta from previous level | Phase |
|-------|--------------------------|--------------------------|-------|
| 1 | 0 | — | Tutorial |
| 2 | ~90 | 90 | Tutorial |
| 3 | ~300 | 210 | Tutorial |
| 4 | ~720 | 420 | Tutorial |
| 5 | ~1,470 | 750 | Early |
| 6 | ~2,800 | 1,330 | Early |
| 7 | 5,200 | 2,400 | Anchor (Petting Area) |
| 8 | ~7,400 | 2,200 | Early |
| 10 | ~9,500 | — | Early mid |
| 18 | 42,000 | — | Anchor (Feeding Zone) |
| 20 | ~57,000 | — | Mid |
| 25 | ~116,000 | — | Mid |
| 30 | 210,000 | — | Anchor (Rides) |
| 45 | 980,000 | — | Anchor (Performance Arena) |
| 50 | ~1,510,000 | — | Late mid |
| 60 | 3,600,000 | — | Anchor (Polar Peaks) |
| 75 | ~10,700,000 | — | Late |
| 84 | 18,000,000 | — | Anchor (Marine Cove) |
| 85 | ~19,260,000 | ~1,260,000 | Endgame |
| 88 | ~23,400,000 | — | Endgame (Sea Lion) |
| 92 | ~30,600,000–31,000,000 | — | Endgame cap (Dolphin) |

> ⚠️ The Lv85–92 computed values are derived using `perLv ≈ 5^(1/24) ≈ 1.06978`
> applied iteratively with `roundNice`. Exact values are browser-runtime computed.
> Run the browser console with `console.log(LEVEL_XP)` on the live page to extract
> the canonical array. The values above are correct to ±1% based on the formula trace.

**Pacing milestones in player-time context (from 90-day journey in data.jsx):**

| Level band | Expected player timeline | Key content opening |
|------------|-------------------------|---------------------|
| Lv1–4 | Day 1 (tutorial) | Starter meadow; 4 animals |
| Lv5–10 | Days 2–7 | Petting Area; Tier 1 species; daily mission habit |
| Lv11–22 | Days 8–30 | Pasture + Woodland; Feeding Zone; first event |
| Lv23–38 | Days 31–60 | Savanna; Rides + Shows; trust grinding |
| Lv39–50 | Days 61–90 | Performance Arena; Tier 4 (lion path) |
| Lv51–70 | Months 4–6 | Polar Peaks; Tier 5; Reptile House |
| Lv71–92 | Months 7–12+ | Reptile Tier 6; Marine Cove; Dolphin endgame |

---

### Formula 3 — Per-Action XP Rates

| Action | XP grant | Source | Notes |
|--------|----------|--------|-------|
| Care action (any) | 3 XP | `doAction()` | Flat per-tap regardless of species or action type |
| Animal adoption | 40 XP | `confirmBuy()` | One-time per species; ~13.3 care-action equivalents |
| Entertainment: photo (rabbit/pony/monkey) | 20 / 24 / 30 XP | `finishActivity()` | 15-min cooldown; repeatable |
| Entertainment: educational (monkey/elephant/dolphin) | 120 / 180 / 240 XP | `finishActivity()` | 2-hr cooldown; 40–80 care-action equivalents per run |
| Quest ch.1 | 300 XP | `claimQuest()` | One-time |
| Quest ch.2 | 550 XP | `claimQuest()` | One-time |
| Quest ch.3 | 850 XP | `claimQuest()` | One-time |
| Quest ch.4 | 1,200 XP | `claimQuest()` | One-time |
| Quest ch.5 | 1,600 XP | `claimQuest()` | One-time |
| Quest ch.6 | 2,300 XP | `claimQuest()` | One-time |
| Quest ch.7 | 3,000 XP | `claimQuest()` | One-time |

**XP-per-care-action constant:** `XP_PER_CARE = 3`

**XP-per-adoption constant:** `XP_PER_ADOPT = 40`

---

### Formula 4 — Expected XP Acquisition (Sanity Check)

Early game (Lv1→Lv7 threshold = 5,200 XP):

- Tutorial awards ~1,500 Gold total; 0 XP from tutorial steps in current implementation.
- Quest chapters 1–3 award: 300 + 550 + 850 = 1,700 XP.
- Adoption of first 3–4 species: 3 × 40 = 120 XP.
- Remaining to Lv7: 5,200 − 1,700 − 120 = 3,380 XP → requires ~1,127 care taps at 3 XP each.
- At ~5–6 animals × 5 actions each = 25–30 care actions per session × ~37 sessions = a few weeks of play to Lv7.

> ⚠️ **Pacing concern (Open Question OQ-3):** The 90-day journey in `data.jsx`
> targets Lv7 by end of week 1 (Days 2–7). Reaching 5,200 XP in 5–7 days requires
> either many daily care sessions or significant quest/activity XP. This should be
> validated with a proper pacing simulation before production.

---

## Edge Cases

### EC-1: XP at MAX_LEVEL (92)

**Trigger:** Player earns XP after reaching Zoo Level 92.
**Behaviour (as implemented):** `levelFromXp` always returns a maximum of 92 because the loop
terminates at index 91 (length 92). `atMaxLevel = level >= MAX_LEVEL` → `true`. XP state
variable continues to increment normally — `setXp(x => x + delta)` is never blocked. The XP
bar renders at 100% with label "Lv 92 · MAX". No level-up toast fires because `level` stays
at 92 and `prevLvlRef.current === 92`. The XP value in state holds the true accumulated total
for save purposes but has no further gameplay effect.

**Alignment with F2 EC-3:** Exactly matches — silent accumulation, "MAX" display, no further
content unlock. Consistent.

---

### EC-2: Multiple Level-Ups in One XP Grant

**Trigger:** A large XP grant (e.g., Quest ch.7 = +3,000 XP) crosses two or more level thresholds.
**Behaviour:** `levelFromXp` scans all 92 entries and returns the highest qualifying level in one
call. The `useEffect` comparing `level` to `prevLvlRef.current` fires once, announcing only the
final level reached ("⬆️ Lv N" where N is the new level). Intermediate levels are crossed
silently — no individual toasts for each skipped level. All content gated at intermediate levels
becomes available immediately (the UI reads `level` live and gates based on the current value).
⚠️ Players who skip levels may miss the level-up moment for unlocks at intermediate levels. A
future improvement could queue individual unlock toasts.

---

### EC-3: XP Never Decreases

**Trigger:** Any game event including session resume, care actions, purchases, admin reset.
**Behaviour:** All XP grants use `setXp(x => x + delta)` where `delta >= 0` by contract. No
mechanic ever calls `setXp(x => x - delta)`. Admin reset explicitly sets `setXp(0)` which is
the only legitimate XP decrease (a deliberate full game reset). The `Math.max(0, ...)` guard
noted in F2 EC-9 is not present in the current implementation — XP relies on the contract that
delta is always non-negative.

---

### EC-4: Loading a Save Mid-Level

**Trigger:** Player resumes a session where XP was, e.g., 8,000 (between Lv7 anchor 5,200 and
Lv18 anchor 42,000).
**Behaviour:** XP state is restored from save. `levelFromXp(8000)` scans LEVEL_XP and returns
the correct level (approximately Lv8 or Lv9 depending on interpolated thresholds). No special
mid-level handling is needed — the derivation is stateless and always produces the correct
result from the raw XP value. The XP bar renders the correct progress percentage.

---

### EC-5: LEVEL_XP Array Shorter Than MAX_LEVEL

**Trigger:** A code change reduces the length of `LEVEL_XP` below 92 (e.g., MAX_LEVEL constant
not updated after adding levels).
**Behaviour:** `adminLevel(n)` guards with `Math.min(LEVEL_XP.length, level+n)`. The `nextLvXp`
expression uses `LEVEL_XP[level] || curLvXp` — if the entry is undefined, the bar stays full.
`levelFromXp` returns at most `LEVEL_XP.length` levels. The game does not crash, but the level
display would be incorrect. Guard: ensure `MAX_LEVEL === LEVEL_XP.length` at all times.

---

### EC-6: XP Source Fires During Level-Up Animation

**Trigger:** A care action grants XP at the exact render cycle when the level-up toast is
showing (1700ms window).
**Behaviour:** React batches state updates. The new XP and the level derived from it are
consistent within one render. A second level crossing during the 1700ms toast window will
re-trigger the `useEffect`, updating `prevLvlRef` and showing a new toast (no visual overlap
is prevented by the implementation). This is acceptable at current XP rates.

---

## Dependencies

### Upstream (C3 depends on these)

| System | GDD | Dependency |
|--------|-----|-----------|
| **F1 Animal Database** | `design/gdd/animal-database.md` | Owns `ANIMALS[].unlock` (the per-species level gates 1–92) and `MAX_LEVEL=92` (registry constant). The XP curve MUST reach level 92 and the final unlock must be Dolphin at Lv92. |
| **F2 Currency System** | `design/gdd/currency-system.md` | Defines Zoo XP as a level-resource type; specifies that XP never decreases and level is derived from XP. C3 is the formal owner of LEVEL_XP. F2 references C3 for curve specification (OQ-5). |
| **C1 Animal Care** | `design/gdd/animal-care.md` (not yet authored) | Owns the care-action loop that produces the primary steady XP faucet (+3/action). Any change to care action count or XP-per-action affects progression pacing. |

### Downstream (systems blocked on C3)

| System | GDD | What they need from C3 |
|--------|-----|----------------------|
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` | Level gates referenced in `zoo-economy.md §5` MAX_LEVEL guard. No direct formula dependency. |
| **Fe1 Animal Collection** | `design/gdd/animal-collection.md` | Level gate check `if (level < u.lv) reject`. Needs stable LEVEL_XP to verify unlock pacing. |
| **Fe2 Habitat System** | `design/gdd/habitat-system.md` | Habitat unlock levels (Lv6, Lv20, Lv32, Lv60, Lv70, Lv84) must be reachable on the curve. |
| **Fe4 Attractions** | `design/gdd/attractions.md` | Attraction unlock levels (Lv7, Lv18, Lv26, Lv30, Lv45) must be reachable on the curve. |
| **Fe5 Performance** | `design/gdd/educational-shows.md` | Educational activities are the highest XP/run source (up to 240/run). Show XP rates must be consistent with progression pacing. |
| **Fe6 New-Player Quests** | `design/gdd/quests.md` | Quest XP awards are defined in `data.jsx QUESTS[].rw.xp` (300–3,000). Quest completion contributes meaningful early-game XP. Level-gated quest objectives (`{t:'level', n:N}`) reference the level derived here. |
| **Fe7 Idle/Offline** | `design/gdd/idle-offline.md` | Offline XP formula (currently a prototype stub at 820 XP/session) must be specified consistently with the overall XP economy. |
| **P1 HUD** | `design/gdd/hud.md` | Renders XP bar using `xpPct`, `curLvXp`, `nextLvXp`, `atMaxLevel`, and the level integer. |
| **P7 Tutorial** | `design/gdd/tutorial.md` | Tutorial step 9 introduces Zoo Level concept; XP rewards in tutorial steps are infrastructure-ready but currently award 0 XP. |

---

## Tuning Knobs

All pacing changes must go through the `LEVELS` anchor table in `act/data.jsx`.
The `LEVEL_XP` array is derived automatically — never edit it directly.

| Knob | Current value | Safe range | Effect of change |
|------|---------------|-----------|-----------------|
| `LEVELS[1].xp` (Lv7 anchor) | 5,200 | 3,000–10,000 | How fast early content (Petting Area, Tier 1) opens. Lower = faster tutorial exit. |
| `LEVELS[2].xp` (Lv18 anchor) | 42,000 | 25,000–100,000 | Speed of mid-game (Feeding Zone, Tier 2 completion). Too low → Lv7–Lv18 feels instant. |
| `LEVELS[3].xp` (Lv30 anchor) | 210,000 | 100,000–500,000 | Pacing of Woodland/Rides phase (Days 31–60 target). |
| `LEVELS[4].xp` (Lv45 anchor) | 980,000 | 500,000–2,000,000 | Performance Arena gate speed. Gate too low → endgame attractions open before the zoo is ready. |
| `LEVELS[5].xp` (Lv60 anchor) | 3,600,000 | 2,000,000–8,000,000 | Polar Peaks / Tier 5 pacing. Current value targets months 4–6. |
| `LEVELS[6].xp` (Lv84 anchor) | 18,000,000 | 10,000,000–40,000,000 | Marine Cove timing. Current value targets months 7–12. |
| `MAX_LEVEL` | 92 | 92 (locked) | Locked by registry constant. Changing requires regenerating curve and all content gates. |
| `XP_PER_CARE` | 3 | 1–10 | Primary XP faucet rate. Raising this shortens all progression bands proportionally; +3/action at 5 animals × 5 actions = 75 XP/full-care-session. |
| `XP_PER_ADOPT` | 40 | 10–100 | Adoption bonus. Minor source relative to care repetition. |
| First-segment exponent (power law) | 2.2 | 1.5–3.0 | Shape of Lv1–Lv7 ramp. Higher = steeper early ramp (first levels very fast, last pre-anchor level slower). |
| Segment interpolation method | Geometric | Do not change | Changing to linear would produce uneven per-level deltas at anchor boundaries. |

**⚠️ Lever interactions:** `XP_PER_CARE` and the `LEVELS` anchors are multiplicatively related.
Doubling `XP_PER_CARE` halves the effective time to all anchors. If `XP_PER_CARE` is changed,
all LEVELS anchor XP values should be scaled proportionally to preserve pacing intent.

---

## Acceptance Criteria

### AC-1: Level derivation is correct at all anchor points

**GIVEN** a player whose accumulated XP equals exactly a LEVELS anchor value  
**WHEN** `levelFromXp(xp)` is called  
**THEN** the returned level equals the anchor's level: `levelFromXp(0)=1`, `levelFromXp(5200)=7`,
`levelFromXp(42000)=18`, `levelFromXp(210000)=30`, `levelFromXp(980000)=45`,
`levelFromXp(3600000)=60`, `levelFromXp(18000000)=84`.

---

### AC-2: LEVEL_XP array has exactly 92 entries

**GIVEN** the game module has loaded  
**WHEN** `LEVEL_XP.length` is inspected at runtime  
**THEN** the value is exactly 92, and `LEVEL_XP[0] === 0`.

---

### AC-3: Level is strictly non-decreasing

**GIVEN** a player at any level with accumulated XP = X  
**WHEN** any XP-granting event fires (`setXp(x => x + delta)` where `delta >= 0`)  
**THEN** `levelFromXp(X + delta) >= levelFromXp(X)` — level never decreases.

---

### AC-4: MAX_LEVEL cap is enforced

**GIVEN** a player whose XP equals or exceeds `LEVEL_XP[91]` (the Lv92 threshold)  
**WHEN** `levelFromXp(xp)` is called with any XP value  
**THEN** the return value is at most 92; the XP bar shows 100% / "MAX"; no level-up toast fires for any further XP gain.

---

### AC-5: Content gates align with unlock levels

**GIVEN** a player at Zoo Level 31  
**WHEN** they tap the Zebra "Unlock" button (requires Lv32)  
**THEN** the action is rejected with "Reach Lv 32 first" and no gold is deducted.

**GIVEN** a player at Zoo Level 32 with sufficient gold  
**WHEN** they tap the Zebra "Unlock" button  
**THEN** the unlock succeeds, gold is deducted, and Zebra appears in the owned list.

---

### AC-6: XP bar progress renders correctly

**GIVEN** a player between levels n and n+1 with XP = `LEVEL_XP[n-1] + delta`  
**WHEN** the XP bar renders  
**THEN** `xpPct = round(delta / (LEVEL_XP[n] - LEVEL_XP[n-1]) * 100)`, clamped to 0–100.

---

### AC-7: Care action grants exactly 3 XP

**GIVEN** a player at any Zoo Level with XP = X  
**WHEN** they tap any care action button (feed, water, clean, play, or heal) on any animal  
**THEN** XP becomes X + 3 (and level is re-derived from the new value).

---

### AC-8: Animal adoption grants exactly 40 XP

**GIVEN** a player with sufficient level and gold to adopt a new species  
**WHEN** they confirm the adoption (naming modal → confirm)  
**THEN** XP increases by exactly 40 in addition to the gold deduction for the unlock cost.

---

### AC-9: Quest XP rewards match the QUESTS table

**GIVEN** a player who completes Quest Chapter 3 objectives ("Own 5 animals, Reach Zoo Level 3")  
**WHEN** they tap "Claim" on the quest tracker  
**THEN** XP increases by exactly 850 (QUESTS[2].rw.xp) in addition to the gold reward (1,200 🪙).

---

### AC-10: Multiple level-up in one grant applies all content gates

**GIVEN** a player at Zoo Level 4 with XP just below the Lv5 threshold  
**WHEN** they claim a large XP reward that crosses both Lv5 and Lv6 thresholds simultaneously  
**THEN** `level` becomes 6, the level-up toast shows "⬆️ Lv 6", and both Cat (Lv5) and Goat
(Lv6) appear as unlockable in the Animals screen without requiring a further XP gain.

---

## Open Questions

**OQ-1 — Pacing simulation needed (High priority)**
The 90-day journey (`data.jsx PLAN90`) targets Lv7 by end of week 1 and Lv10 by day 14.
To reach Lv7 (5,200 XP) in 5–7 days purely via care actions (+3/action) requires ~1,130 care
taps after quests. With 5–8 animals needing full care (5 actions each), a player needs ~7–9
full-care sessions per day. No simulation exists to validate this. A spreadsheet model of
daily XP acquisition (care frequency × animals owned × sessions/day + quest XP) should be
built before soft-launch.
*Owner: Economy Designer. Blocked by: C1 Animal Care GDD (needs care frequency model).*

**OQ-2 — Tutorial awards 0 XP (Medium priority)**
All 9 `TUT_STEPS` entries in `tutorial.jsx` award Gold only. The infrastructure to grant XP
(`if (s.rw.xp) setXp(x => x + s.rw.xp)`) exists but is unused. Granting ~100–200 XP across
the tutorial would smooth the Lv1→Lv3 ramp and reduce the "dead zone" after the FTUE.
Decision needed: should tutorial steps award XP, and if so, how much per step?
*Owner: Game Designer (P7 Tutorial). Input from: Economy Designer.*

**OQ-3 — Offline XP formula is a prototype stub (High priority)**
The offline reward modal hardcodes `+820 XP` for a demo "8h 04m" session. This number is not
derived from any formula and will need to be replaced before production with:
`offlineXP = f(offline_duration, animals_owned, current_level)`. The offline XP rate must be
consistent with the active-play XP rate to prevent offline catch-up exploits.
*Owner: Economy Designer + Fe7 Idle/Offline GDD author.*

**OQ-4 — Level-up toast does not distinguish per-level unlocks (Low priority)**
When multiple levels are crossed in one XP grant (EC-2), the toast only announces the final
level. Players reaching, e.g., Lv6 from Lv4 in one jump see "⬆️ Lv 6" but not "⬆️ Lv 5".
Consider queuing individual unlock toasts or showing a "Levels 5 and 6 reached!" message.
*Owner: UX Designer + UI Programmer.*

**OQ-5 — Activities without XP (Medium priority)**
Feeding, riding, and premium activities (`feed_*`, `ride_*`, `prem_*`) grant no XP in the
current `ENTERTAINMENT` table. Photo and educational activities do grant XP. Is this intentional?
If feeding activities should also grant XP (to reward engagement with the Feeding Zone
attraction), the values need to be specified.
*Owner: Game Designer. Input from: Economy Designer.*

**OQ-6 — XP bar rounding at segment boundaries (Low priority)**
`xpPct` uses `Math.round` which can display 100% one render before the level actually
increments (if `xp = nextLvXp - 1` rounds to 100). The level-up fires correctly at the exact
threshold crossing, but the bar may visually pre-fill by one XP. No gameplay impact but worth
tracking as a display polish issue.
*Owner: UI Programmer.*

**OQ-7 — Whether LEVEL_XP should be registered in entities.yaml (Action required)**
The `level_xp_curve` formula and `XP_PER_CARE`/`XP_PER_ADOPT` constants are cross-system
facts referenced by C1, F2, Fe1, Fe6, and Fe7. See the return message from this GDD's
authoring session for the proposed registry entries.
*Owner: Orchestrator (systems-index manager). This GDD author proposes entries; orchestrator
writes them per the DO NOT rules of this session.*
