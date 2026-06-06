# Idle / Offline Earnings System (Fe7)

> **Status**: In Design
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — the zoo earns while you sleep, so
> there is always something to come back to

---

> ⚠️ **IMPLEMENTATION STATUS: FAKED STUB — NOT WIRED**
>
> The offline modal in `act/prototype.jsx` (lines 332–346) currently displays
> **hardcoded fictional values**: "8h 04m", "+5,240 gold", "+820 XP", "+1,100 show
> revenue". There is **no real elapsed-time computation, no `closedAt` timestamp is
> saved, and F3 Save/Load itself has zero `localStorage` calls** (confirmed
> 2026-06-06 audit). Offline accrual does not function at all.
>
> This GDD documents the **designed system** — how it must work when implemented.
> Every section that describes computed behaviour is aspirational until the two
> blockers in Open Questions OQ-1 and OQ-2 are resolved.

---

## Overview

Fe7 Idle / Offline Earnings is the core retention hook of Animal World Zoo. When the
player closes the browser tab, the zoo conceptually continues to operate: visitors
walk the grounds and spend money at the gate. On the next session, Fe7 computes how
much time elapsed while the player was away, projects the zoo's Gold rate (from the
C2 Zoo Economy formula) forward over that duration, and presents an accrued Gold
reward in a "While you were away" modal. The offline rate is deliberately reduced to
60% of the active rate — idle earnings are modest, not a substitute for engaged play.
Free players accrue for up to 8 hours (28,800 seconds); VIP subscribers receive a
24-hour (86,400-second) cap. Offline Zoo XP and care-decay during offline absence
are intentionally minimal (see Open Questions OQ-3 and OQ-4). Fe7 depends entirely
on F3 Save/Load recording a session-close timestamp (`closedAt`) and on C2 Zoo
Economy providing the `goldPerSec` rate — neither is currently implemented.

---

## Player Fantasy

The player opens the game after sleeping, riding the bus, or surviving a workday.
The moment they tap the icon the zoo swings open and a cheerful modal appears:
"While you were away — your zoo welcomed visitors for 6h 12m — +3,100 gold!" They
tap Collect, the gold counter jumps, and they already have a reason to make a
purchase. The idle fantasy is not about getting rich offline; it is about the zoo
being *alive* even when the player is not there. Every return feels like unlocking a
door to a place that missed them. The 8-hour free cap is precisely enough to reward
a full night's sleep and a morning session — no more — so returning daily feels
complete rather than wasteful.

---

## Detailed Design

### Core Rules

1. **Offline accrual begins at session close.** When the player closes the browser
   tab (or navigates away), the `beforeunload` handler (owned by F3) writes
   `closedAt = Date.now()` to the save blob. This is the epoch from which elapsed
   time is measured.

2. **Offline accrual ends at session resume.** When the game next loads, F3 reads
   the save blob and provides `closedAt` to the Fe7 initialisation logic. The current
   wall-clock time at load is `resumedAt = Date.now()`. Elapsed seconds are
   `elapsed = (resumedAt - closedAt) / 1000`.

3. **The offline rate is 60% of the active zoo rate.** The active `goldPerSec`
   (from C2) is multiplied by `OFFLINE_RATE_FACTOR = 0.60`. This discount exists
   for two reasons: (a) it preserves the feel that active play is more rewarding
   than passive waiting; (b) it limits the inflation risk of a player maximising a
   high-rate zoo and never returning for days.

4. **Free players accrue for up to 8 hours (28,800 seconds).** Elapsed time is
   clamped at `OFFLINE_CAP_FREE_SEC = 28,800` before the formula is applied. A
   player away for 12 hours receives the same gold as one away for 8 hours.

5. **VIP subscribers accrue for up to 24 hours (86,400 seconds).** If the save
   blob indicates `vip = true`, the clamp is `OFFLINE_CAP_VIP_SEC = 86,400`. VIP
   membership is purchased via M2 Monetisation Shell with Gems at $7.99/mo.

6. **`goldPerSec` used for offline accrual is recomputed from saved state.** On
   load, Fe7 reconstructs `goldPerSec` from the persisted `owned`, `pops`, `encLv`,
   `enrich`, `built`, and meter data using the same C2 formula. It does NOT use a
   stored rate — recomputing from state ensures consistency and prevents a stale
   rate from inflating or deflating rewards.

7. **Offline accrual triggers the "While you were away" modal.** The modal is shown
   only if:
   - `closedAt` is present in the save blob (not first run), AND
   - `elapsed > OFFLINE_MODAL_THRESHOLD_SEC` (default: 60 seconds — avoids showing
     the modal for accidental tab refreshes).
   The modal displays elapsed time, accrued Gold, any accrued XP (if offline XP is
   enabled — see OQ-3), and a single Collect button that credits the reward.

8. **The modal must be dismissed before normal gameplay resumes.** The reward is
   held in a transient state variable (`pendingOfflineGold`). Gold is NOT credited
   automatically — the player must tap Collect. This preserves the emotional moment
   of the reward and prevents silent background credits.

9. **Offline accrual applies only to gate income.** The 60% rate applies to the
   `goldPerSec` passive income stream (visitors × spend-per-head). It does NOT
   apply to entertainment activity cooldown rewards — those activities are paused
   during offline periods (cooldowns tick but rewards are not issued). This is
   consistent with `data.jsx` IDLE table which notes attraction revenue runs at
   "full" but that refers to the rate multiplier from built attractions being
   included in `goldPerSec`, not separately yielded.

   > Note: The `data.jsx` IDLE entry reads `Attraction rev: full` — this means
   > the attraction income multiplier (`1 + 0.12 × built.length` in C2) IS baked
   > into the `goldPerSec` that offline accrual uses. Attraction-based multipliers
   > are "full" in the sense that they contribute to the rate; discrete activity
   > rewards (feeding session gold, ride gold) are not issued offline.

10. **No offline care decay.** Need meters (hunger, thirst, cleanliness, happiness)
    do NOT degrade during offline periods in the current design. The care decay loop
    in `prototype.jsx` is a `setInterval` that only runs during an active session.
    Offline care decay is a separate design decision flagged in OQ-4.

---

### "While You Were Away" Modal

The modal presents a summary of offline accrual. Designed content:

| Row | Display label | Value source |
|-----|--------------|--------------|
| Elapsed time | "Your zoo welcomed visitors for [Xh Ym]" | `min(elapsed, cap)` formatted as hours and minutes |
| Gold accrued | "+[N] Gold" | `offlineGold` (see Formulas) |
| XP (if enabled) | "+[N] Zoo XP" | `offlineXP` (see OQ-3 — currently not designed) |
| Collect button | "Collect rewards" | Credits `pendingOfflineGold` to `gold` state; clears modal |

The current hardcoded version also shows "+1,100 Show revenue". This line must be
**removed** in the real implementation — discrete show/activity rewards are not
issued offline (see Rule 9 above). The hardcoded display is a prototype fiction.

---

### States and Transitions

```
SESSION_CLOSE
    |
    | beforeunload → closedAt = Date.now() written to save blob (F3)
    |
    v
OFFLINE_ACCRUING (conceptually — no process is running; time passes)

SESSION_RESUME
    |
    | F3 reads closedAt from save blob; elapsed = (Date.now() - closedAt) / 1000
    |
    | [closedAt absent OR elapsed <= OFFLINE_MODAL_THRESHOLD_SEC]
    |     → NO_MODAL: skip Fe7, proceed to normal load
    |
    | [elapsed > threshold]
    |     → MODAL_PENDING: compute offlineGold, set pendingOfflineGold
    |
    v
MODAL_SHOWN (player sees "While you were away")
    |
    | [player taps Collect]
    |     → gold += pendingOfflineGold; modal dismissed
    |
    v
PLAYING (normal session)
```

---

## Formulas

### Primary offline earnings formula

```
offlineGold = floor( min(elapsed, cap) × goldPerSec × OFFLINE_RATE_FACTOR )
```

**Variable table**

| Symbol | Type | Range | Description |
|--------|------|-------|-------------|
| `elapsed` | float | 0 – unbounded (seconds) | Wall-clock seconds since `closedAt`. If `elapsed ≤ 0` (clock moved back), treat as 0 and accrue nothing (see EC-1). |
| `cap` | integer | 28800 or 86400 (seconds) | Accrual cap. `OFFLINE_CAP_FREE_SEC = 28800` for free players; `OFFLINE_CAP_VIP_SEC = 86400` for VIP. |
| `goldPerSec` | float | 1 – ~7,500 | Zoo's active gold/sec rate, recomputed from saved state using the C2 formula: `max(1, round(visitors × SPEND_PER_VISITOR × (1 + 0.12 × built.length)))`. See C2 Zoo Economy GDD §4. |
| `OFFLINE_RATE_FACTOR` | float | 0.60 (fixed) | Offline earning rate as a fraction of active rate. Currently 0.60 — tuning knob (see Tuning Knobs). |
| `offlineGold` | integer | 0 – ~540,000,000 | Gold accrued during offline period. Floored to integer (no fractional gold). Theoretical max = 86400 × 7500 × 0.60 = 388,800,000 at max VIP late-game. Practical max for a D1–D30 player is far lower. |

**Output range**: Unbounded above, minimum 0. There is no ceiling on `offlineGold`
beyond the physical cap on elapsed time × rate. A late-game VIP player could
theoretically receive hundreds of millions of gold for 24 hours at max appeal — this
is by design, as it rewards sustained collection and is bounded by the 24h cap.
Balance review is recommended when endgame rates are finalised.

**Worked examples**

*Example 1: Free player, 1-hour absence, early game (3 animals, 7 gold/sec)*

```
elapsed          = 3600 s
cap              = 28800 s   (free player)
goldPerSec       = 7
OFFLINE_RATE_FACTOR = 0.60
offlineGold      = floor( min(3600, 28800) × 7 × 0.60 )
                 = floor( 3600 × 7 × 0.60 )
                 = floor( 15,120 )
                 = 15,120 gold
```

*Example 2: Free player, exactly at cap, mid game (30 gold/sec)*

```
elapsed          = 28800 s   (8 hours — exactly at cap)
cap              = 28800 s
goldPerSec       = 30
OFFLINE_RATE_FACTOR = 0.60
offlineGold      = floor( min(28800, 28800) × 30 × 0.60 )
                 = floor( 28800 × 18 )
                 = floor( 518,400 )
                 = 518,400 gold
```

*Example 3: Free player, over cap (12 hours away, 30 gold/sec)*

```
elapsed          = 43200 s   (12 hours — 4 hours beyond free cap)
cap              = 28800 s   (clamps to 8 hours)
goldPerSec       = 30
OFFLINE_RATE_FACTOR = 0.60
offlineGold      = floor( min(43200, 28800) × 30 × 0.60 )
                 = floor( 28800 × 18 )
                 = 518,400 gold   (same as Example 2 — cap was hit)
```

*Example 4: VIP player, 24-hour absence, mid-late game (150 gold/sec)*

```
elapsed          = 86400 s   (24 hours — exactly at VIP cap)
cap              = 86400 s   (VIP)
goldPerSec       = 150
OFFLINE_RATE_FACTOR = 0.60
offlineGold      = floor( 86400 × 150 × 0.60 )
                 = floor( 7,776,000 )
                 = 7,776,000 gold
```

---

### `goldPerSec` reconstruction (from saved state)

On session resume, Fe7 must reconstruct `goldPerSec` before applying the offline
formula. The reconstruction follows C2 Zoo Economy GDD §4 exactly:

```
appealOf(k) = baseAppeal[k] × count[k] × (1 + 0.25 × (encLv[k] − 1)) × (1 + 0.10 × enr[k])
avgHappy    = mean of meters[k].happy across owned[]  (default 60 if empty)
happyMult   = clamp(0.4 + avgHappy / 100, 0.5, 1.4)
appeal      = round( Σ appealOf(k) × happyMult )
demand      = round( appeal × VISITORS_PER_APPEAL )    // = 1.0
seatsOf(k)  = baseAppeal[k] × count[k] × (0.6 + 0.5 × (encLv[k] − 1))
capacity    = round( (5 + Σ seatsOf(k)) × (1 + 0.15 × |built|) )
visitors    = min(demand, capacity)
goldPerSec  = max(1, round( visitors × SPEND_PER_VISITOR × (1 + 0.12 × |built|) ))
```

Where `SPEND_PER_VISITOR = 0.05` and `VISITORS_PER_APPEAL = 1.0` (from C2 tuning
knobs, validated against `act/prototype.jsx` lines 88–101).

**Note on happiness during offline**: Meters are read from the saved state at the
moment of close. Because no offline care decay occurs (see Rule 10), `avgHappy` is
the same value the player had when they left. This slightly overestimates the real
offline rate (the zoo would get slightly less appealing over time if care decayed),
but it is an intentional player-friendly simplification.

---

### Elapsed-time display formula

The modal header displays elapsed time in human-readable form:

```
elapsedCapped  = min(elapsed, cap)
hours          = floor(elapsedCapped / 3600)
minutes        = floor((elapsedCapped mod 3600) / 60)
display        = "{hours}h {minutes}m"
```

If `hours = 0`, display only minutes: "{minutes}m". If `minutes = 0`, display only
hours: "{hours}h". Both never simultaneously zero (threshold prevents sub-1-minute
display).

---

## Edge Cases

### EC-1: Elapsed time is zero or negative (clock moved back)

**Trigger**: `Date.now()` at resume is less than or equal to `closedAt` in the save
blob. This can occur if the device clock was adjusted (daylight saving, manual
correction, or NTP sync) between sessions.

**Behaviour**: If `elapsed ≤ 0`, set `elapsed = 0`. The offline formula yields
`offlineGold = 0`. Do not show the modal (nothing to collect). Do not log an error —
this is a known benign case. Proceed to normal load.

This is the behaviour specified in F2 Currency System EC-8: negative time deltas
must accrue 0 gold, not negative gold. Fe7 implements that guard here at the source.

---

### EC-2: Elapsed time exceeds cap (player was away too long)

**Trigger**: `elapsed > cap` (e.g. free player away 3 days; VIP player away 48 hours).

**Behaviour**: Apply `min(elapsed, cap)` in the formula. The modal displays the
capped elapsed time (e.g. "8h 00m" even if the player was away 72 hours), not the
true elapsed time. A note may optionally be shown: "Maximum idle time reached — come
back sooner for full earnings!" This is intentional: the cap is a retention tool.
Do not display the uncapped elapsed time.

---

### EC-3: First run — no `closedAt` in save blob

**Trigger**: `closedAt` is absent from the save blob (new game, or F3 not yet
implemented, or save migrated from a pre-Fe7 schema version).

**Behaviour**: Skip Fe7 entirely. Do not show the modal. Do not attempt to compute
offline accrual. This is the normal path for new players and for the current
prototype state (since F3 is unimplemented).

In the save schema migration context: the v1 → v2 migration (when Fe7 is added to
the schema) should add `closedAt: null` as the default. `null` signals "no prior
close timestamp" and is treated identically to absent.

---

### EC-4: `closedAt` is present but elapsed time is below threshold

**Trigger**: Player closes and reopens the tab within `OFFLINE_MODAL_THRESHOLD_SEC`
seconds (default: 60 s) — e.g. an accidental tab close, a hard refresh, or a very
brief session break.

**Behaviour**: The offline formula is still applied and gold is credited, but the
modal is suppressed. Silently credit `offlineGold` to the balance without a modal.
This prevents the "While you were away" modal from appearing for a 30-second absence
(which would be jarring and feel like a bug). The threshold is a tuning knob.

---

### EC-5: VIP status check

**Trigger**: Computing which cap to apply.

**Behaviour**: The save blob must include a `vip` boolean field (owned by M2
Monetisation Shell). If `vip = true`, use `OFFLINE_CAP_VIP_SEC`. If absent or
`false`, use `OFFLINE_CAP_FREE_SEC`. VIP status is validated against the save blob —
there is no server call at this stage (client-authoritative offline model, consistent
with TECH entry in `data.jsx`). The VIP field must be added to the F3 save schema;
see OQ-5.

---

### EC-6: `goldPerSec` reconstructs to 0 or 1 (empty/new zoo)

**Trigger**: The player has not yet tapped "Let's go" (`started = false`), or owns
only the starter rabbit with 0 appeal multipliers — resulting in a very low computed
rate.

**Behaviour**: `goldPerSec` is floored at `max(1, ...)` by the C2 formula (inherited
by Fe7's reconstruction). The floor of 1 gold/sec is always applied. A new player
away for 8 hours therefore earns `floor(28800 × 1 × 0.60) = 17,280 gold`, which
is a meaningful onboarding reward for D1 retention. The `started = false` gate on
active income does NOT apply to offline accrual — offline gold accrues regardless
of whether the player has tapped "Let's go", since the session-close timestamp is
written on any close after the first session.

**Open sub-question**: Should a player who has never tapped "Let's go" (never opened
the gates) receive offline earnings? The current design says yes (earnings floor at 1
gold/sec). If the design intent is that the zoo is only "open" after "Let's go", the
offline formula should check `started` and accrue 0 if false. Flagged in OQ-6.

---

### EC-7: Save blob corrupt or `closedAt` is not a valid timestamp

**Trigger**: `closedAt` is present in the save blob but is not a valid `Date.now()`
integer (e.g. `NaN`, a string, `null` from a failed save, or a value more than 10
years in the past or future).

**Behaviour**: Validate `closedAt`:
- If `typeof closedAt !== 'number'` or `isNaN(closedAt)`: treat as EC-3 (no
  timestamp).
- If `closedAt < (Date.now() - 365 × 24 × 3600 × 1000)` (more than 1 year ago):
  treat as EC-3 (implausibly old — discard).
- If `closedAt > Date.now()` (in the future): treat as EC-1 (elapsed ≤ 0 → accrue 0).

Do not crash. Log a console warning for any of these conditions.

---

### EC-8: Player collects reward, then closes tab immediately (double-claim risk)

**Trigger**: Player taps "Collect", `gold` increases, modal closes. Player closes tab
before the debounced save (300 ms) fires. On next load, `closedAt` has not been
reset yet — wait, actually the collect action triggers a React state change which
immediately queues the save effect. The debounce is the only gap.

**Behaviour**: The `beforeunload` handler flushes the save synchronously (F3 design).
Therefore, by the time the tab closes, the updated `gold` balance is written to
`localStorage`. On next load, `closedAt` from the immediately-prior close (just after
collect) would represent only a few seconds of elapsed time — below
`OFFLINE_MODAL_THRESHOLD_SEC`, so no modal appears. This is safe: the reward was
credited and saved; no double-claim occurs.

**Additional safeguard** (recommended): After computing and presenting offline gold,
overwrite `closedAt` with a sentinel value (`-1` or `null`) in the same state update
that sets `pendingOfflineGold`. This ensures that even if "Collect" is never tapped
(player closes again), the same offline reward is not double-presented on the next
reload. The sentinel is replaced with a fresh `closedAt` on the next close.

---

## Dependencies

### Upstream (Fe7 depends on these)

| System | GDD | Nature of dependency |
|--------|-----|----------------------|
| **F3 Save / Load** | `design/gdd/save-load.md` | CRITICAL BLOCKER. F3 must (a) save `closedAt = Date.now()` in the `beforeunload` handler; (b) save `vip` boolean; (c) provide all persisted state fields to Fe7 on load for `goldPerSec` reconstruction. None of this is implemented. See F3 OQ-2. |
| **C2 Zoo Economy** | `design/gdd/zoo-economy.md` | Fe7 uses the C2 `goldPerSec` formula identically. Any change to C2's constants (`VISITORS_PER_APPEAL`, `SPEND_PER_VISITOR`, attraction multiplier) must be reflected in Fe7's reconstruction. |
| **F2 Currency System** | `design/gdd/currency-system.md` | Fe7 credits Gold via `setGold(g => g + offlineGold)`. EC-8 in F2 mandates that negative time deltas must yield 0 gold. Fe7 implements this guard at EC-1 above. |
| **M2 Monetisation Shell** | *(not yet authored)* | VIP status (`vip` boolean in save blob) is managed by M2. Fe7 reads it to select the correct cap. |

### Downstream (these systems are affected by Fe7)

| System | GDD | How Fe7 affects them |
|--------|-----|----------------------|
| **F3 Save / Load** | `design/gdd/save-load.md` | Fe7 requires two new fields in the save schema: `closedAt` (number) and `vip` (boolean). F3 schema v1 does not include them. A v1 → v2 migration is needed. |
| **F2 Currency System** | `design/gdd/currency-system.md` | Fe7 is a Gold source (offline accrual). F2's interactions table lists Fe7 as a downstream system that produces Gold on session resume. |
| **P1 HUD** | *(not yet authored)* | HUD must accommodate the offline modal overlaying the main screen on load. The modal's claim button is part of the Fe7 UX, not HUD, but HUD must not render over it. |
| **C1 Animal Care** | `design/gdd/animal-care.md` | OQ-4 (offline care decay) is a cross-system question. If C1 decides to implement offline decay, the rates in `care_decay_per_tick` registry constant would be projected over offline time during Fe7's load-phase computation. |

---

## Tuning Knobs

All constants below must be declared as named constants in `act/prototype.jsx` (or
`act/data.jsx` for data-table values). They must never be magic numbers inline.

| Knob | Constant name | Current value | Safe range | Gameplay effect |
|------|--------------|---------------|-----------|-----------------|
| Free player offline cap | `OFFLINE_CAP_FREE_SEC` | `28800` (8 h) | 3600–86400 s | How long a free player's zoo earns after close. 8h = one full night's sleep reward. Lowering increases daily-return pressure; raising reduces it. Must be ≤ VIP cap. |
| VIP offline cap | `OFFLINE_CAP_VIP_SEC` | `86400` (24 h) | 14400–172800 s | VIP differentiation lever. 24h = full day's earnings for VIP. Raising this makes the VIP subscription significantly more valuable for hard-core players. Must be ≥ free cap. |
| Offline rate factor | `OFFLINE_RATE_FACTOR` | `0.60` | 0.30–0.90 | Fraction of active `goldPerSec` earned offline. 0.60 = 60% of active rate. Raising it toward 1.0 reduces the advantage of active play; lowering it toward 0.0 makes offline almost worthless and could hurt D7 retention. |
| Modal display threshold | `OFFLINE_MODAL_THRESHOLD_SEC` | `60` (1 min) | 30–300 s | Minimum elapsed time before the "While you were away" modal appears. Below this, gold is silently credited. Prevents nuisance modals on rapid tab-reopen. |
| Weekly idle speed boost | *(CADENCE note in data.jsx)* | 2× on weekends | — | `data.jsx` CADENCE lists "weekend 2× idle" as a planned LiveOps event. When implemented, this would temporarily set `OFFLINE_RATE_FACTOR = 1.20` (or a separate event multiplier) for Friday–Sunday. Not yet designed at the formula level. |

---

## Acceptance Criteria

### AC-1: No offline modal on first load (no save data)

**GIVEN** a brand-new player with no `"awz_save"` key in localStorage  
**WHEN** the game loads  
**THEN** the "While you were away" modal is NOT shown, and `gold` initialises to 50
(the `gold_start` registry constant).

---

### AC-2: No offline modal for very short absence

**GIVEN** a player who closed the tab less than `OFFLINE_MODAL_THRESHOLD_SEC` seconds
ago (e.g. 30 seconds)  
**WHEN** the game loads  
**THEN** the offline modal is NOT shown; any earned gold for the sub-threshold period
is silently credited to the balance (or accrual is skipped if the threshold is the
minimum-accrue gate — implementation detail for the programmer).

---

### AC-3: Offline gold formula applies correctly for a sub-cap absence

**GIVEN** a free player whose zoo earns 10 `goldPerSec` (recomputed from saved state)
who was away for exactly 3,600 seconds (1 hour)  
**WHEN** the game loads  
**THEN** `offlineGold = floor(3600 × 10 × 0.60) = 21,600` gold is shown in the
modal and credited to the balance upon collection.

---

### AC-4: Free cap clamps at 8 hours (28,800 seconds)

**GIVEN** a free player whose zoo earns 10 `goldPerSec` who was away for 14 hours
(50,400 seconds)  
**WHEN** the game loads  
**THEN** the modal shows "8h 00m" (capped display, not "14h 00m") and
`offlineGold = floor(28800 × 10 × 0.60) = 172,800` — the same value as if they
were away exactly 8 hours.

---

### AC-5: VIP player uses the 24-hour cap

**GIVEN** a VIP player (`vip = true` in save blob) whose zoo earns 10 `goldPerSec`
who was away for 20 hours (72,000 seconds)  
**WHEN** the game loads  
**THEN** the full 20 hours of earnings are applied: `offlineGold = floor(72000 × 10 × 0.60) = 432,000` gold, and the modal shows "20h 00m" (not capped, since 72,000 < 86,400).

---

### AC-6: Negative elapsed time accrues zero gold

**GIVEN** a player whose device clock was moved backwards between session close and
resume (resulting in `elapsed ≤ 0`)  
**WHEN** the game loads  
**THEN** `offlineGold = 0`, the modal is NOT shown, and the gold balance is unchanged.
No error is thrown.

---

### AC-7: Collect button credits gold and dismisses modal

**GIVEN** the offline modal is showing with `offlineGold = 15,120`  
**WHEN** the player taps "Collect rewards"  
**THEN** the gold balance increases by exactly 15,120, the modal closes, and a flash
toast confirms the amount (e.g. "Collected! +15,120 🪙").

---

### AC-8: `goldPerSec` is recomputed from saved state (not stored)

**GIVEN** a player who upgraded their zoo between sessions (added two animals) — the
new `goldPerSec` is higher than the rate saved in any stale cache  
**WHEN** the game loads and Fe7 computes `offlineGold`  
**THEN** the rate used in the formula matches the result of applying the C2 formula
to the current saved `owned`, `pops`, `encLv`, `enrich`, `built`, and `meters` data
— not a stored `zooRate` field.

---

### AC-9: Modal does not show when `closedAt` is absent from save blob

**GIVEN** a save blob that has all standard fields but no `closedAt` key (e.g. a save
from before Fe7 was implemented, migrated to the new schema version with
`closedAt: null`)  
**WHEN** the game loads  
**THEN** the offline modal is NOT shown; no gold is credited for offline earnings; the
game loads normally.

---

### AC-10: Hardcoded modal values are removed

**GIVEN** the real Fe7 implementation is deployed  
**WHEN** the offline modal is shown  
**THEN** the displayed elapsed time, gold amount, and XP amount are computed values
(from the formula), NOT the hardcoded strings "8h 04m", "+5,240", "+820". The line
"Show revenue +1,100" does not appear (activity rewards are not granted offline).

---

## Open Questions

### OQ-1 — F3 Save/Load is entirely unimplemented (CRITICAL BLOCKER) ⚠️

**Risk**: CRITICAL  
**Description**: Fe7 depends 100% on F3 writing a `closedAt` timestamp in the
`beforeunload` handler. F3 itself has zero `localStorage` calls anywhere in
`act/*.jsx` (confirmed audit 2026-06-06). The offline modal in `prototype.jsx`
(lines 332–346) displays hardcoded values ("8h 04m", "+5,240 gold", "+820 XP") and
is controlled by a React state variable `offline` that is never set to `true` in any
reachable code path — the modal cannot even be triggered in the current prototype
except via direct state manipulation.

**Fe7 cannot be implemented until F3 is implemented.**

**Owner**: gameplay-programmer (F3 implementation) + systems-designer (Fe7 GDD, complete)  
**Blocked by**: F3 Save/Load implementation (F3 OQ-1 in `save-load.md`).  
**Action**: Implement F3 first; add `closedAt` and `vip` fields to the save schema;
then implement Fe7 offline accrual logic on top of F3.

---

### OQ-2 — `closedAt` and `vip` fields not in F3 save schema (HIGH RISK) ⚠️

**Risk**: HIGH  
**Description**: The F3 save schema (v1, in `save-load.md`) does not include
`closedAt` or `vip`. Both are required by Fe7. When F3 is implemented, these fields
must be added to the schema, the save format version bumped to `v2`, and a `v1 → v2`
migration written (adding `closedAt: null`, `vip: false` as defaults). The F3 GDD
notes this as OQ-2 and flags it as HIGH risk.

**Owner**: gameplay-programmer (F3 schema) + systems-designer (Fe7 requirements complete)  
**Action**: Add `closedAt` (number | null) and `vip` (boolean) to the F3 schema as
part of the F3 implementation pass. Cross-reference: `save-load.md` OQ-2.

---

### OQ-3 — Offline Zoo XP design is undefined (MEDIUM RISK)

**Risk**: MEDIUM  
**Description**: The hardcoded offline modal currently shows "+820 Zoo XP". The
`data.jsx` IDLE table mentions "Zoo XP: reduced trickle — Care XP pauses; only
passive milestones bank." What this means in practice is not designed:
- Should XP accrue at all offline? At what rate?
- Does the 60% rate factor apply to XP as well?
- What is the XP "passive trickle" source during offline? There are no passive XP
  sources in the current code — XP comes only from care actions and quest rewards,
  neither of which run offline.

The current design decision in this GDD (Section: Detailed Design, Rule 10) is to
**not** implement offline XP accrual until this is resolved. The modal will not show
an XP row until this question is answered.

**Owner**: game-designer (defines the intent) + systems-designer (formula)  
**Related**: `entities.yaml` `xp_per_care_action` entry notes this gap; C1 OQ-1 also
references it.

---

### OQ-4 — Offline care decay design is undefined (MEDIUM RISK)

**Risk**: MEDIUM  
**Description**: The current design specifies no offline care decay (Rule 10). This
means animals return from an 8-hour absence with the same needs as when the player
left — which is slightly unrealistic but player-friendly. The alternative is to
project `care_decay_per_tick` rates over the offline period, giving the player a
pile of hungry animals to feed on return (which creates engagement but may also
create frustration).

The two design options:
1. **No offline decay** (current design): Simple, player-friendly, matches casual
   idle game conventions. Animals are always "fine" on return.
2. **Partial offline decay** (alternative): Project decay at a reduced rate (e.g.
   50% of active decay per unit time), capped to ensure no stat drops below 10.
   Creates a care hook on return but requires additional formula design.

**Owner**: game-designer (player experience decision) + systems-designer (formula if
option 2)  
**Escalation**: If this creates a pillar conflict (retention vs. friction), escalate
to creative-director.

---

### OQ-5 — VIP membership is not yet designed (LOW RISK, post-MVP)

**Risk**: LOW  
**Description**: The VIP cap (`OFFLINE_CAP_VIP_SEC = 86400`) is specified here and
the VIP subscription is listed in `data.jsx` OFFERS at $7.99/mo with "24h idle cap"
as a benefit. However, M2 Monetisation Shell (which owns VIP purchase flow) is not
yet authored. The `vip` boolean in the save blob is a placeholder. When M2 is
designed, it must define:
- How `vip = true` is set in the save blob after purchase.
- VIP expiry handling (what happens when the subscription lapses mid-session).
- Whether the 24h cap also applies retroactively to time accrued before VIP purchase.

**Owner**: M2 Monetisation Shell GDD author  
**Blocked by**: M2 not yet authored. Fe7 can be implemented with `vip = false`
always until M2 is ready.

---

### OQ-6 — Should offline earnings gate on `started = true`? (LOW RISK)

**Risk**: LOW  
**Description**: The active income loop gates gold accrual behind the `started`
flag (the player must tap "Let's go"). It is unclear whether offline earnings should
respect this gate — i.e., if a player has never tapped "Let's go", should they earn
offline gold?

Current design: offline earnings ignore `started` (gold accrues from first session
close regardless). This is pragmatically correct for D1 retention (a new player
closing after tutorial should get a reward on return) but inconsistent with the
in-session gate.

**Owner**: game-designer (low-stakes UX call)
