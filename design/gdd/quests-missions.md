# Quests and Missions System (Fe6)

> **Status**: In Design (Reverse-Documented)
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — quests are the structured scaffolding
> that teaches the care loop and rewards the player for inhabiting it daily
> **Source files**: `act/data.jsx` (QUESTS, VIP_SERVICES, ACTIVITIES, CADENCE, SOURCES, LEVELS),
> `act/quest-admin.jsx` (QuestTracker, ServiceQuests, questProgress),
> `act/prototype.jsx` (Phone state, claimQuest, claimService, counts/bump2),
> `act/views-quests.jsx` (Quests design-doc view)

---

## 1. Overview

The Quests and Missions system is Animal World Zoo's structured objective layer. It
comprises two distinct tracks: **New-Player Quests** (7 sequential chapters that
guide the first ~7 days) and **VIP Service Quests** (a separate side chain that
rewards VIP visitor interactions). Both tracks track player actions through a shared
`counts` object, compare progress against a target threshold, and allow the player
to claim a Gold + XP reward when all objectives in a chapter are complete.

The system is the game's primary onboarding scaffold and a key early-game Gold
faucet: quest rewards cover roughly 40–60% of early progression spending. After
the 7-chapter quest chain ends, the designed cadence calls for daily (5 missions)
and weekly (4 missions) refreshing objectives — these are **defined in game data
and design documentation** (`ACTIVITIES`, `CADENCE` in `data.jsx`) but are **not
yet implemented** in the prototype's interactive layer; only the 7-chapter onboarding
chain and the VIP side-chain are live code.

Daily missions unlock at Zoo Level 7 (the Petting Area milestone). The system is
intentionally lightweight at MVP: no server-side timestamp, no persistent claim
state, no refresh timer. The persistent claim-prevention is enforced by advancing
the `chapterIdx` or `serviceIdx` integer — each of which acts as a cursor that can
only advance forward.

---

## 2. Player Fantasy

"I always have one more thing to do."

Quests are the game's conscience — they surface the next best action for players who
do not yet know the care loop by heart, and they make that action feel rewarded
rather than arbitrary. A player checking back after a day of absence sees the quest
pop open: "Feed animals 2 times" — a task they were going to do anyway — and earns
400 Gold for it. The reward feels like the game noticing their effort.

The 7-chapter structure follows the same emotional arc as a tutorial: each chapter
teaches one more layer of the zoo (care, expansion, attractions) while the rewards
accelerate early progression. Completing Chapter 7 ("Future Zoo Manager") should
feel like graduating from student to keeper: the scaffolding falls away and the
player is trusted to run the zoo on their own.

VIP service quests provide a secondary goal for players who have finished all
chapters — a repeatable escalating challenge that keeps the "claim" satisfaction
loop alive in the early-to-mid game.

This aligns with the **Competence** axis of Self-Determination Theory: quests
provide clear, readable goals with explicit progress counters (2/5, 0/2) and
immediate tangible feedback on completion. Players always know *why* they are doing
something and *what they earned* for doing it.

---

## 3. Detailed Design

### 3.1 Mission Types

There are currently **two implemented mission tracks** and **two designed-but-unimplemented
tracks**:

| Track | Count | Gate | Refresh | Status |
|-------|-------|------|---------|--------|
| New-Player Quests (chapters) | 7 chapters | Sequential (must claim ch.N to unlock ch.N+1) | One-time; no refresh | **Implemented** |
| VIP Service Quests | 4 defined + infinite procedural extension | Sequential | One-time per tier | **Implemented** |
| Daily Missions | 5 missions/day | Zoo Level 7 | 24-hour reset (UTC midnight) | **Designed, not yet implemented** |
| Weekly Missions | 4 missions/week | Zoo Level 7 | Weekly reset (Monday UTC) | **Designed, not yet implemented** |

### 3.2 New-Player Quest Structure

**Source**: `QUESTS` array in `act/data.jsx`.

The 7 chapters are sequential and gated: `chapterIdx` in `prototype.jsx` is a React
state integer starting at 0. The `QuestTracker` component always shows `QUESTS[chapterIdx]`.
When the player claims a chapter, `chapterIdx` advances by 1. After chapter 7
(index 6), `chapterIdx` = 7, which is out of bounds — `QUESTS[7]` is `undefined`,
and `QuestTracker` renders "All quests complete!" instead.

**Chapter definitions** (from `act/data.jsx` QUESTS array):

| Ch | Title | Objectives | Gold reward | XP reward |
|----|-------|-----------|-------------|-----------|
| 1 | Welcome to the Zoo | Feed 1 animal; Adopt 2nd animal; Clean 1 habitat | 200 🪙 | 300 |
| 2 | Growing the Zoo | Own 2 animals; Feed 2 times; Clean 2 times | 400 🪙 | 550 |
| 3 | First Expansion | Own 5 animals; Reach Zoo Level 3 | 1,200 🪙 | 850 |
| 4 | Happy Visitors | Complete 2 Photo activities; Complete 2 Feeding activities; Serve 1 VIP visitor | 600 🪙 | 1,200 |
| 5 | New Attractions | Run 1 Animal Ride; Complete 2 activities; Reach Zoo Level 5 | 1,500 🪙 | 1,600 |
| 6 | Building a Real Zoo | Own 10 species; Reach Zoo Level 8 | 3,000 🪙 | 2,300 |
| 7 | Future Zoo Manager | Reach Zoo Level 10; Own 10 species | 6,000 🪙 | 3,000 |
| **Total** | All 7 chapters | | **12,900 🪙** | **9,800 XP** |

**Notes on Chapter 7**: The objective `{t:'owned', n:10, label:'Complete the collection'}` uses
type `'owned'` which resolves to `animals` (total individual animal count across all enclosures),
not unique species. This is documented as an inconsistency — "Complete the collection" implies
unique species but the tracker counts total animals. See Open Questions OQ-1.

### 3.3 VIP Service Quest Structure

**Source**: `VIP_SERVICES` array in `act/data.jsx` + procedural extension in `quest-admin.jsx`.

VIP quests are a Gold-only side chain rewarding repeated VIP interactions. The `serviceIdx`
cursor operates identically to `chapterIdx` — it starts at 0 and advances on each claim.

The first 4 VIP tiers are hand-authored. Beyond index 3, `ServiceQuests` generates a
procedural tier: `n = 10 + (idx−3) × 10` VIP guests, `gold = 3000 + (idx−3) × 1500`.

| Tier | Title | Objective | Gold reward |
|------|-------|-----------|-------------|
| 1 | Serve a VIP guest | Serve 1 VIP | 300 🪙 |
| 2 | VIP Host | Serve 3 VIP | 700 🪙 |
| 3 | Five-Star Service | Serve 6 VIP | 1,500 🪙 |
| 4 | VIP Concierge | Serve 10 VIP | 3,000 🪙 |
| 5+ | (procedural) | Serve 20 / 30 / 40 / … VIP | 4,500 / 6,000 / 7,500 / … 🪙 |

VIP quest rewards are Gold-only — no XP is granted on VIP service quest claim.

### 3.4 The `counts` Object: Objective Tracking

All quest progress is tracked through a single React state object `counts` in
`prototype.jsx`. The `counts` object is initialized on game start:

```javascript
const [counts, setCounts] = useState({
  feed:     0,
  clean:    0,
  activity: 0,
  photo:    0,
  feeding:  0,
  ride:     0,
  vip:      0,
});
```

Each key is incremented by the `bump2(key, n=1)` helper: `setCounts(c => ({ ...c, [key]: (c[key]||0) + n }))`.

**Increment events (from `prototype.jsx`):**

| counts key | When incremented | Code location |
|------------|-----------------|---------------|
| `feed` | Player taps Feed care action (`doAction('feed')`) | `if (key==='feed') bump2('feed')` |
| `clean` | Player taps Bathe care action (`doAction('clean')`) | `if (key==='clean') bump2('clean')` |
| `activity` | Any entertainment activity is started (`runActivity`) | `bump2('activity')` |
| `photo` | A photo-category activity is started | `if(a.cat==='photo') bump2('photo')` |
| `feeding` | A feeding-category activity is started | `if(a.cat==='feeding') bump2('feeding')` |
| `ride` | A riding-category activity is started | `if(a.cat==='riding') bump2('ride')` |
| `vip` | Player taps "Serve VIP" in the Live Zoo view | `bump2('vip')` in `serveVip()` |

**Critical gap**: counts are incremented when activities are **started** (via `runActivity`),
not when they are **completed** (via `finishActivity`). A player can start and cancel an
activity and still get credit. See Open Questions OQ-2.

**Counts are never reset**: The `counts` object accumulates across the entire play session
(and must be persisted by F3 Save/Load for multi-session correctness). There is no
chapter-boundary reset — Chapter 2's "Feed 2 times" counts from the game's total feed
count, not from when Chapter 2 became active. This means a player who fed before
completing Chapter 1 already has progress toward Chapter 2's feed objective. This is
by design (no unfair restart) but means objectives are effectively cumulative lifetime
counters, not per-chapter counters.

### 3.5 Progress Calculation

**Source**: `questProgress` function in `act/quest-admin.jsx`.

```javascript
function questProgress(t, { counts, owned, level, animals }) {
  if (t === 'owned') return (animals != null ? animals : owned.length);
  if (t === 'level') return level;
  return counts[t] || 0;
}
```

**Objective type resolution:**

| Objective type `t` | What it reads | Notes |
|--------------------|--------------|-------|
| `'feed'` | `counts.feed` | Cumulative feed taps across entire game |
| `'clean'` | `counts.clean` | Cumulative clean taps |
| `'photo'` | `counts.photo` | Photo activities started |
| `'feeding'` | `counts.feeding` | Feeding activities started |
| `'ride'` | `counts.ride` | Riding activities started |
| `'activity'` | `counts.activity` | Any entertainment activity started |
| `'vip'` | `counts.vip` | VIP visitors served |
| `'owned'` | `animals` (total animal count across all enclosures, from `owned.reduce`) | **Not unique species** |
| `'level'` | `level` (derived from XP via `levelFromXp`) | Current Zoo Level integer |

**Per-objective completion check** (in `QuestTracker`):

```javascript
const status = q.obj.map(o => ({
  ...o,
  cur: Math.min(questProgress(o.t, { counts, owned, level, animals }), o.n)
}));
const done = status.every(s => s.cur >= s.n);
```

Progress is clamped to `o.n` for display — the tracker never shows over 100%.

### 3.6 Quest State Machine

```
Quest state per chapter:
  IN_PROGRESS   — chapterIdx === ch-1 (this chapter is active, not all objectives met)
  READY_TO_CLAIM — chapterIdx === ch-1 AND all objectives met (done === true)
  CLAIMED        — chapterIdx > ch-1 (this chapter is in the past)
  LOCKED         — chapterIdx < ch-1 (this chapter is not yet active)

QuestTracker shows the chapter at QUESTS[chapterIdx]:
  chapterIdx=0  → Ch.1 (IN_PROGRESS or READY_TO_CLAIM)
  chapterIdx=7  → undefined → "All quests complete!"

VIP ServiceQuests mirror this with serviceIdx.
```

### 3.7 Claim Flow

When the player taps "Claim" in the `QuestTracker` popup (only enabled when `done === true`):

```javascript
function claimQuest(q) {
  setGold(g => g + q.rw.gold);    // award Gold
  setXp(x => x + q.rw.xp);       // award XP
  setChapterIdx(i => i + 1);      // advance cursor (prevents reclaim)
  flash(`🏅 Chapter ${q.ch} done! +${q.rw.gold.toLocaleString()} 🪙`);
}
```

For VIP service quests:

```javascript
function claimService(q) {
  setGold(g => g + q.rw.gold);    // award Gold only (no XP)
  setServiceIdx(i => i + 1);      // advance cursor
  flash(`🛎️ ${q.title} ✓ +${q.rw.gold.toLocaleString()} 🪙`);
}
```

The cursor advancing is the double-claim prevention mechanism. Advancing `chapterIdx`
removes the current chapter from the view immediately — the newly active chapter
(chapterIdx+1) may already be complete if the player's counts exceed both thresholds.
This is not blocked — the player can immediately claim the next chapter if they qualify.

### 3.8 QuestTracker Placement and Trigger

`QuestTracker` renders on the Zoo (Live) tab only, and only after the tutorial is
complete (`tutStep === null`). It is a floating action button (FAB) labelled 📋
with a dot indicator when `done === true`.

`ServiceQuests` similarly renders only on the Live tab after tutorial completion.

Navigation shortcuts: the "go" button (›) on each incomplete objective directs the
player to the relevant tab using a `TAB_FOR` map:

```javascript
const TAB_FOR = {
  feed: 'animals', clean: 'animals', owned: 'animals',
  photo: 'show', feeding: 'show', ride: 'show', activity: 'show',
  level: 'animals',
};
```

### 3.9 Designed Daily/Weekly System (Unimplemented)

The following data exists in `act/data.jsx` describing the designed future state.
This is design intent, not live code.

**ACTIVITIES** (from `data.jsx`):
```
daily:  ['Collect gate income', 'Feed & water all animals', 'Clean 3 habitats',
          'Complete 1 show', 'Claim daily login']
weekly: ['Earn 2M gold', 'Raise 1 animal to max trust', 'Upgrade a habitat',
          'Finish weekly mission set']
```

**CADENCE** (from `data.jsx`):
```
Daily:    Login · 5 missions · shop deal · rewarded-ad gold boost
Weekly:   4 weekly missions · weekend 2× idle · featured habitat
Monthly:  Seasonal event · feature animal · conservation milestone
```

**SOURCES** (from `data.jsx`): `'Daily missions' → Gems, rate: '5–15 / day'`

**LEVELS** table (from `data.jsx`): `{lv:7, unlock:'Petting Area · Cat · daily missions'}`

The daily mission system is explicitly listed as a launch-day feature in the 12-month
roadmap: "Daily & weekly missions" appear in the "Launch" quarter alongside Tiers 0–4.

---

## 4. Formulas

### Formula 1 — Quest Progress

```
progress(obj) = min( questProgress(obj.t, state), obj.n )
```

Where:
- `obj.t` = objective type string (see §3.5 resolution table)
- `obj.n` = target value for the objective (integer, ≥1)
- `questProgress(t, state)` = the live counter value for type `t` (see §3.5)
- Output range: `[0, obj.n]` — progress is clamped to the target ceiling

**Progress percentage** (for display only):
```
pct = min(100, round(progress(obj) / obj.n × 100))
```

### Formula 2 — Chapter Completion

```
done = ∀ objective o in chapter: progress(o) >= o.n
```

A chapter is complete when ALL objectives have reached or exceeded their target.

### Formula 3 — Quest Gold Reward

Quest Gold rewards are authored constants in `act/data.jsx QUESTS[].rw.gold`.
They do not scale with any formula. The full chapter chain awards:

```
totalQuestGold = Σ QUESTS[i].rw.gold  for i in 0..6
               = 200 + 400 + 1200 + 600 + 1500 + 3000 + 6000
               = 12,900 🪙
```

Range per chapter: 200–6,000 🪙.

### Formula 4 — Quest XP Reward

Quest XP rewards are also authored constants in `act/data.jsx QUESTS[].rw.xp`.
The full chain awards:

```
totalQuestXP = Σ QUESTS[i].rw.xp  for i in 0..6
             = 300 + 550 + 850 + 1200 + 1600 + 2300 + 3000
             = 9,800 Zoo XP
```

At 3 XP per care action, 9,800 XP is equivalent to ~3,267 care taps — a significant
acceleration to early progression. Range per chapter: 300–3,000 XP.

### Formula 5 — VIP Service Quest Procedural Extension

For VIP tiers beyond index 3 (the 4 hand-authored entries):

```
n    = 10 + (idx − 3) × 10        // VIP guests required
gold = 3000 + (idx − 3) × 1500    // Gold reward
```

Where `idx` is the zero-based serviceIdx value (idx=4 → tier 5 → 20 VIP, 4,500 🪙).

**Example (idx=5):**
```
n    = 10 + (5 − 3) × 10 = 30 VIP guests
gold = 3000 + (5 − 3) × 1500 = 6,000 🪙
```

### Formula 6 — Daily Gem Faucet Reconciliation with F2

**F2 Currency System (currency-system.md) states:**
> `dailyGems = missionCount × missionGems`
> Where `missionCount ∈ [1, 5]` and `missionGems ∈ [5, 15]`
> Intended daily free gem gain: **5–75 gems/day**

**data.jsx SOURCES** states: `'Daily missions' → Gems, rate: '5–15 / day'`

**data.jsx CADENCE** states: `Daily: 'Login · 5 missions · …'`

**Reconciliation:**
- `data.jsx SOURCES` (5–15/day) represents the per-mission gem award, not the daily
  total. The SOURCES note "5–15 / day" is misleading shorthand; contextually it
  means "5–15 gems per completed mission."
- F2's formula (5 missions × 5–15 gems = 25–75 gems/day for a fully active player;
  minimum 5 gems for a player who completes only 1 mission) is the authoritative
  interpretation.
- The "5–15/day" in SOURCES should be read as the per-mission gem floor/ceiling,
  not the daily total floor/ceiling.

**Canonical daily gem faucet from daily missions:**
```
dailyGems_min = 1 mission × 5 gems  = 5 gems   (minimum engagement — 1 mission)
dailyGems_max = 5 missions × 15 gems = 75 gems  (maximum engagement — all 5 missions)
```

This is consistent with F2. The SOURCES note is a labeling shorthand; this GDD
establishes the correct per-mission interpretation.

⚠️ **Note**: Daily missions are not yet implemented. These values are design targets
for the implementation sprint.

---

## 5. Edge Cases

### EC-1: Claim attempted on incomplete chapter

**Trigger**: Player taps "Claim" when `done === false`.
**Behavior**: The Claim button is `disabled={!done}` and rendered at `opacity: 0.5`.
Tap events on a disabled HTML button do not fire. No double-guard is coded on the
`claimQuest` function itself — the UI is the only protection.
**Risk**: If the disabled state is bypassed (e.g. programmatic call in admin tooling),
`claimQuest` will award rewards and advance the cursor regardless of completion state.
A guard check (`if (!done) return;`) inside `claimQuest` is recommended.

---

### EC-2: Double-claim prevention

**Trigger**: Player taps "Claim" twice rapidly before the state update completes.
**Behavior**: React state updates are asynchronous but batched within an event handler.
`setChapterIdx(i => i + 1)` uses the functional updater form, so even if two calls
are enqueued, the second call receives `i + 1` (already incremented) from the first
update. The second call advances to `i + 2`, skipping a chapter.
**Risk**: Rapid double-tap on mobile can fire two React events in two separate flushes.
The Claim button should be debounced or the button should be removed/disabled
immediately after the first tap while the state update propagates.

---

### EC-3: Counts overflow / wrap-around

**Trigger**: A player feeds animals thousands of times. `counts.feed` accumulates
indefinitely.
**Behavior**: JavaScript numbers are IEEE 754 doubles — they can safely represent
integers up to 2^53 (~9 quadrillion). No game-length play session will overflow.
No clamping is needed. The `Math.min(progress, o.n)` in the display prevents the
UI from showing values above the target.

---

### EC-4: Quest progress while offline (counts freeze)

**Trigger**: Player closes the app. Care actions and activity launches cannot occur
while offline. `counts` is incremented only by user-interactive events.
**Behavior**: Quest progress does not advance while offline — this is correct and
intended. Counts increment only from player actions, not from passive timers.
There is no "offline quest progress" mechanic and none is planned.

---

### EC-5: Daily reset timing (designed daily missions — not yet implemented)

**Trigger**: Midnight UTC passes while a player has active daily missions.
**Behavior** (design intent): Daily mission progress resets at UTC midnight regardless
of the player's local timezone. In-progress counts for daily missions must be stored
separately from the lifetime `counts` object (which never resets). The refresh
timestamp must be persisted by F3 Save/Load.
**Not yet implemented**: The prototype `counts` object is lifetime-cumulative with no
refresh mechanism. Daily mission infrastructure requires a separate `dailyCounts`
object and a `lastRefreshDate` timestamp in the save blob.

---

### EC-6: Reward when at MAX_LEVEL (XP wasted)

**Trigger**: Player claims any quest chapter after reaching Zoo Level 92.
**Behavior**: `setXp(x => x + q.rw.xp)` increments the raw XP value in state. The
`levelFromXp` function caps at 92 regardless. The XP bar shows "Lv 92 · MAX". The
XP is awarded but has no gameplay effect — it accumulates silently in state. This
is consistent with F2 EC-3 and C3 EC-1. No "XP cap" warning is shown at the claim
point.
**Recommendation**: For Chapter 7 (which is reachable well before Lv92), this
situation is unlikely. However, VIP service quests are open-ended — a player at
Lv92 claiming tier 10+ VIP quests will always waste XP. No change to behavior is
required; the waste is cosmetically invisible and functionally inert.

---

### EC-7: chapterIdx out of sync with save state (future risk)

**Trigger**: F3 Save/Load is implemented and a save from a future version loads a
`chapterIdx` value beyond the current `QUESTS` array length.
**Behavior**: `QUESTS[chapterIdx]` returns `undefined`. `QuestTracker` already handles
this: `const q = QUESTS[chapterIdx]` → the `!q` branch renders "All quests complete!"
This is safe — no crash.

---

### EC-8: 'owned' objective type counts total animals, not unique species

**Trigger**: Chapter 7 objective `{t:'owned', n:10, label:'Complete the collection'}`.
**Behavior**: `questProgress('owned', {...})` returns `animals` which is
`owned.reduce((s,k) => s + cntOf(k), 0)` — the total individual animal count across
all enclosures, not the count of unique species. A player with 4 copies of a Rabbit
and 6 copies of a Chicken satisfies the "Own 10" objective despite owning only 2
unique species.
**Impact**: Low risk at Chapter 7 (requires Zoo Level 10 as a co-objective which
naturally implies meaningful progression), but the label "Complete the collection"
is misleading. See Open Questions OQ-1.

---

### EC-9: Activity counts credited on start, not completion

**Trigger**: Player starts an activity via `runActivity()`, then navigates away
before `finishActivity()` is called.
**Behavior**: `bump2('activity')`, `bump2('photo')`, etc. fire inside `runActivity()`
before the activity plays out. If the player never calls `finishActivity()` (e.g.
they close the app mid-activity), the count is already incremented and the Gold/XP
reward from the activity is lost, but the quest credit is retained.
**Impact**: Minor — quests progress slightly more easily than intended (start counts,
not complete counts). See Open Questions OQ-2.

---

## 6. Dependencies

### Upstream (Fe6 reads these)

| System | GDD | What Fe6 reads |
|--------|-----|----------------|
| **F2 Currency System** | `design/gdd/currency-system.md` | Writes Gold (`setGold`) and Zoo XP (`setXp`) on claim. Reads `counts.vip` for VIP service progress. |
| **C1 Animal Care** | `design/gdd/animal-care.md` | `counts.feed++` from `doAction('feed')`, `counts.clean++` from `doAction('clean')`. Quest progress is a downstream consumer of care actions. |
| **C3 Zoo Level Progression** | `design/gdd/zoo-level.md` | `{t:'level', n:N}` objectives compare against the live `level` value derived from `levelFromXp(xp)`. Quest XP rewards feed back into C3's XP accumulation. |
| **Fe5 Performance / Entertainment** | `design/gdd/educational-shows.md` (not yet authored) | `counts.activity`, `counts.photo`, `counts.feeding`, `counts.ride` are incremented by entertainment activity launches (`runActivity`). Fe6 is a downstream consumer of Fe5 events. |

### Downstream (these depend on Fe6)

| System | GDD | What they consume |
|--------|-----|------------------|
| **C3 Zoo Level Progression** | `design/gdd/zoo-level.md` | Quest chapter claim calls `setXp(x => x + q.rw.xp)` — a faucet into C3's XP pool. This relationship is bidirectional with C3 also gating quest level objectives. |
| **F2 Currency System** | `design/gdd/currency-system.md` | Quest Gold awards are a faucet into the F2 Gold balance. Fe6 is documented in F2 as a Gold faucet (§ Interactions table). Gem faucet role (daily missions, designed) is not yet live. |
| **F3 Save / Load System** | `design/gdd/save-load.md` | `chapterIdx`, `serviceIdx`, and `counts` must be persisted. Without F3, all quest progress resets on session end. ⚠️ F3 is NOT yet implemented — all quest state is currently ephemeral. |
| **P6 Quests Screen** | `design/ux/quests-screen.md` (not yet authored) | The `views-quests.jsx` design-doc view displays the chapter breakdown and reward table. The `QuestTracker` FAB component is the live interactive layer. |
| **M1 Live Events** | — (not yet authored) | Daily and weekly mission infrastructure will be required for seasonal event objectives. Fe6's `counts` object will need to be extended or supplemented with event-scoped counters. |

---

## 7. Tuning Knobs

All authored quest reward values are in `act/data.jsx` QUESTS and VIP_SERVICES arrays.
The daily/weekly gem values are currently design targets only (not yet coded).

| Knob | Current value | Category | Safe range | Gameplay effect |
|------|---------------|----------|-----------|-----------------|
| `QUESTS[0].rw.gold` (Ch.1 Gold) | 200 🪙 | Feel | 100–500 | First impression of quest value; too high trivializes tutorial gold goals |
| `QUESTS[6].rw.gold` (Ch.7 Gold) | 6,000 🪙 | Feel | 3,000–15,000 | Graduation reward; should feel meaningful vs. passive income at Lv10 |
| `QUESTS[i].rw.xp` (per-chapter XP) | 300–3,000 | Curve | ×0.5–×2 scale | Total 9,800 XP from all chapters; must be balanced against care-action XP pacing in C3 |
| `DAILY_MISSION_GEMS_MIN` | 5 💎 | Curve | 1–20 | Per-mission gem floor; minimum daily gem grant for single-mission players |
| `DAILY_MISSION_GEMS_MAX` | 15 💎 | Curve | 5–50 | Per-mission gem ceiling; active daily player gem ceiling per mission |
| `DAILY_MISSION_COUNT` | 5 missions | Gate | 3–10 | Total daily missions available; multiplied by gem range gives faucet total |
| `WEEKLY_MISSION_COUNT` | 4 missions | Gate | 2–7 | Total weekly missions available |
| `DAILY_GEMS_FAUCET_CEILING` | 75 💎/day (5×15) | Curve | 25–150 | Total gem ceiling for a fully active player completing all 5 daily missions |
| `DAILY_GEMS_FAUCET_FLOOR` | 5 💎/day (1×5) | Curve | 1–25 | Total gem floor for a minimally engaged player |
| `VIP_SERVICE_GOLD_BASE` | 300 🪙 (tier 1) | Feel | 150–1,000 | Entry point for VIP side-chain Gold rewards |
| `VIP_PROCEDURAL_GOLD_INCREMENT` | +1,500 🪙/tier | Curve | 500–5,000 | How fast VIP quest rewards scale past the 4 hand-authored tiers |
| Daily mission refresh cadence | 24h (design) | Gate | 20–28h | UTC midnight reset; shorter = more engagement hooks; longer = more casual |
| Daily missions unlock level | Lv7 | Gate | Lv5–Lv10 | When daily mission habit begins; should coincide with first attraction (Petting Area) |

---

## 8. Acceptance Criteria

### AC-Fe6-1: Claim is blocked until all objectives are met

**GIVEN** a player on Chapter 2 with counts.feed = 1 (target = 2)
**WHEN** they open the QuestTracker popup
**THEN** the Claim button is disabled (visual `opacity: 0.5`) and tapping it has no
effect — Gold balance, XP, and chapterIdx are unchanged.

---

### AC-Fe6-2: Claim advances chapter and awards correct rewards

**GIVEN** a player on Chapter 1 with all objectives met (feed ≥ 1, owned ≥ 2, clean ≥ 1)
**WHEN** they tap "Claim" on the QuestTracker
**THEN** Gold increases by exactly 200 🪙, Zoo XP increases by exactly 300,
chapterIdx advances to 1 (showing Chapter 2), and a flash "🏅 Chapter 1 done! +200 🪙"
appears.

---

### AC-Fe6-3: Progress counter is clamped at the objective target

**GIVEN** a player who has fed animals 50 times with a chapter objective of `{t:'feed', n:2}`
**WHEN** the QuestTracker renders the objective
**THEN** the display shows "2/2" (not "50/2") and the tick mark shows completed.

---

### AC-Fe6-4: Level-type objective resolves to current Zoo Level

**GIVEN** a player at Zoo Level 5 with a level objective `{t:'level', n:3}`
**WHEN** `questProgress('level', state)` is called
**THEN** the result is 5 (the current level), which is ≥ 3, so the objective shows
as complete.

---

### AC-Fe6-5: All quests complete state renders correctly

**GIVEN** a player who has claimed all 7 chapters (chapterIdx = 7)
**WHEN** they open the QuestTracker popup
**THEN** the header reads "🏅 All quests complete!" and no objectives or Claim
button are displayed.

---

### AC-Fe6-6: VIP service quest tracks separately from chapter quests

**GIVEN** a player who has claimed Chapter 1 (chapterIdx = 1) and VIP tier 1 (serviceIdx = 1)
**WHEN** they view both FABs
**THEN** QuestTracker shows Chapter 2 objectives, ServiceQuests shows VIP tier 2
("Serve 3 VIP guests") — the two cursors are independent and do not interfere.

---

### AC-Fe6-7: counts.feed increments on Feed action, not other care actions

**GIVEN** a player with counts.feed = 0
**WHEN** they tap Water, Bathe, Play, and Heal (but NOT Feed)
**THEN** counts.feed remains 0. counts.clean is also 0 (only Bathe increments counts.clean).

**GIVEN** they then tap Feed
**THEN** counts.feed becomes 1.

---

### AC-Fe6-8: Quest rewards at MAX_LEVEL do not crash or go negative

**GIVEN** a player at Zoo Level 92 (MAX_LEVEL) claiming Chapter 7
**WHEN** `claimQuest` executes
**THEN** Gold increases by 6,000 🪙, XP increases by 3,000 (accumulated silently,
XP bar shows "MAX"), chapterIdx becomes 7, and no error or crash occurs.

---

### AC-Fe6-9: VIP procedural extension generates correct values

**GIVEN** serviceIdx = 4 (tier 5, one past the 4 hand-authored tiers)
**WHEN** `ServiceQuests` renders
**THEN** the objective shows "Serve 20 VIP guests" (n = 10 + (4-3)×10 = 20)
and the reward shows "+4,500 🪙" (gold = 3000 + (4-3)×1500 = 4500).

---

### AC-Fe6-10: Go button navigates to the correct tab

**GIVEN** a player with an incomplete Chapter 2 objective `{t:'feed', n:2}` (under-threshold)
**WHEN** they tap the "›" go button on that objective
**THEN** the app navigates to the 'animals' tab (TAB_FOR['feed'] = 'animals').

---

## Open Questions

**OQ-1 — 'owned' objective counts total animals vs unique species (High priority)**

Chapter 7's `{t:'owned', n:10, label:'Complete the collection'}` resolves to total
animal count (including duplicates), not unique species. The label "Complete the
collection" implies unique species. A player with 10 copies of a single species
technically satisfies this objective while owning exactly 1 unique species, which
is contrary to the label's intent.

Decision needed: should `'owned'` be split into `'owned_total'` (current behavior) and
`'owned_species'` (unique count, `owned.length`)? If so, all chapter objectives using
`t:'owned'` should be audited for which semantic is intended.

*Owner: Game Designer. Impact: all 6 chapter objectives using t:'owned' may need updating.*

---

**OQ-2 — Activity counts credited on start, not completion (Medium priority)**

`counts.activity`, `counts.photo`, `counts.feeding`, and `counts.ride` are incremented
inside `runActivity()` — before the activity timer plays out. A player who starts and
abandons activities still earns quest credit. This is inconsistent with the
spirit of "Complete 2 Photo activities."

Decision needed: should `bump2` calls move to `finishActivity()`? If so, players who
close the app mid-activity lose both the Gold/XP reward AND the quest credit.

*Owner: Game Designer + Gameplay Programmer.*

---

**OQ-3 — Daily/weekly mission implementation scope (High priority, launch-blocking)**

The daily and weekly mission system is a designed-but-unimplemented launch feature.
The 12-month roadmap lists "Daily & weekly missions" in the Launch quarter. Required
implementation work:

1. A `dailyCounts` object separate from the lifetime `counts` (resets at UTC midnight)
2. A `lastRefreshDate` timestamp in the save blob (requires F3 Save/Load to exist first)
3. A daily mission pool definition (which objective types, what targets, what gem rewards)
4. A weekly mission pool
5. UI for daily/weekly mission display (separate from QuestTracker which is chapter-only)
6. The refresh logic comparing `lastRefreshDate` to current date on session open

**Blocking dependency**: F3 Save/Load must be implemented first (it is currently
NOT implemented — zero localStorage calls in the codebase).

*Owner: Game Designer (pool design) + Gameplay Programmer (implementation).
Blocked by: F3 Save/Load.*

---

**OQ-4 — Gem faucet from daily missions not yet live (High priority)**

The F2 Currency System documents daily missions as the primary free Gem faucet
(5–75 gems/day). This faucet is currently zero — no Gems are awarded by any
implemented quest path. Until daily missions are implemented, Gems are only
available via IAP or the 10-gem starting balance. This gap means:

- Free players have no repeatable Gem income
- VIP membership (2× daily gems) cannot be demonstrated
- The F2 sink/faucet model for Gems is unbalanced during the prototype/alpha phase

*Owner: Economy Designer + Gameplay Programmer. Blocked by: OQ-3 (daily missions).*

---

**OQ-5 — Quest progress persistence (Critical, blocked on F3)**

`chapterIdx`, `serviceIdx`, and `counts` are React state. They are NOT persisted —
the game has zero localStorage calls (F3 is unimplemented). Every session restart
resets all quest progress to zero and all chapter/service cursors to 0.

This means:
- A player who claims Chapter 3 will see Chapter 1 again on next session
- Quest reward gold is earned but the chapter cursor resets, allowing
  re-earning (if the player re-completes objectives)
- All lifetime counts (feed, clean, activity, etc.) reset to 0

Until F3 is implemented, all quest state is effectively a demo. No retention
metric from quests is meaningful.

*Owner: Gameplay Programmer (F3 implementation). Blocking: all quest analytics,
retention hooks, and the daily mission system.*

---

**OQ-6 — No explicit rewards for VIP quests beyond Gold (Low priority)**

VIP service quests award Gold only — no XP, no Gems, no progression signal. A player
at high Zoo Level who completes VIP tiers receives no level progression from them.
Decision needed: should higher-tier VIP quests award Gems to supplement the daily
mission faucet in the short term (pre-daily-mission implementation)?

*Owner: Economy Designer.*
