# Save / Load System

> **Status**: In Design
> **Author**: Genji240696 + Claude Code agents
> **Last Updated**: 2026-06-06
> **Implements Pillar**: Collection, not combat — the zoo is still here when you come back

---

## Overview

The Save / Load System (F3) is the persistence layer for Animal World Zoo. It
serialises the complete runtime state of the `Phone` component — every currency
balance, every owned species, every animal need meter, every enclosure level,
attraction, quest index, name, and enrichment tier — into a single JSON blob and
writes it to browser `localStorage` under a fixed key. On each page load, the saved
blob is read back and used to hydrate React `useState` hooks before the first render,
so the zoo appears exactly as the player left it. From the player's perspective,
the system is invisible: they simply experience that their zoo is still there, the
zebra they named "Zigzag" is still called Zigzag, and the gold they earned before
closing the tab is still in their pocket. F3 has no UI of its own — it is pure
infrastructure that underlies the entire idle-game retention loop; without it, every
session would start from scratch and the idle-zoo fantasy would collapse.

> **CRITICAL GAP — As of 2026-06-06**: No `localStorage` read, write, or hydration
> code exists anywhere in `act/*.jsx`. All game state lives exclusively in React
> `useState` hooks inside `Phone` (`act/prototype.jsx`) and is **lost on every page
> refresh**. F3 is classified as "Implemented" in `design/gdd/systems-index.md`, but
> that classification is **incorrect**. This GDD documents the required design for
> F3 so that implementation can proceed.

---

## Player Fantasy

Players don't think about saving. They think "my zoo is always here." The idle
loop's entire emotional contract — earn gold while you sleep, come back to see the
Elephant fed and the new enclosure half-funded — depends entirely on state surviving
the browser being closed. The moment a player loses progress to a page refresh, trust
in the game is broken permanently. F3's value is measured in the absence of that
moment: the save indicator should be invisible, automatic, and reliable enough that
the player never thinks about it.

---

## Detailed Design

### Core Rules

**What gets saved**

The save blob captures the complete, restorable state of one play session. The
following table is the canonical save schema derived from the `useState` hooks in
`act/prototype.jsx`:

| Field | Type | Default (new game) | Description |
|---|---|---|---|
| `v` | integer | `1` | Save format version — used by migration logic |
| `gold` | number | `50` | Gold balance (soft currency) |
| `gems` | number | `10` | Gem balance (hard currency) |
| `xp` | number | `0` | Accumulated Zoo XP (never negative) |
| `owned` | string[] | `["rabbit"]` | Ordered array of owned animal keys |
| `meters` | object | `{ rabbit: { hunger:42, thirst:36, clean:64, happy:70, trust:30 } }` | Per-animal need meters (5 stats per key: hunger, thirst, clean, happy, trust) |
| `pops` | object | `{}` | Per-species count of additional animals beyond the first (e.g. `{ "dog": 2 }` means 3 dogs total) |
| `encLv` | object | `{}` | Per-species enclosure level (integer ≥ 1; absent = 1) |
| `enrich` | object | `{}` | Per-species enrichment level (integer ≥ 0; absent = 0) |
| `names` | object | `{}` | Player-assigned custom names per species key (e.g. `{ "rabbit": "Clover" }`) |
| `built` | string[] | `[]` | Array of attraction keys that have been built |
| `chapterIdx` | integer | `0` | Index into QUESTS array — the current new-player quest chapter |
| `serviceIdx` | integer | `0` | Index into VIP_SERVICES array — the current VIP service quest |
| `counts` | object | `{ feed:0, clean:0, activity:0, photo:0, feeding:0, ride:0, vip:0 }` | Cumulative action counters used by quest objectives |
| `started` | boolean | `false` | Whether the player has tapped "Let's go" (income gate) |
| `tutStep` | integer or null | `null` | Current tutorial step index (`null` = tutorial complete) |
| `gameSpeed` | number | `1` | Game speed multiplier (1x, 2x, etc.) |
| `soundOn` | boolean | `true` | Sound preference |

**What is NOT saved**

| State | Reason |
|---|---|
| `tab`, `sel`, `selEnc` | UI navigation state — intentionally reset to `'live'` / `'rabbit'` on load |
| `toast`, `goldFx`, `lvlUp`, `viral`, `show`, `offline`, `performing`, `playAct` | Transient visual effects and overlay states — meaningless across sessions |
| `buyTarget`, `renameKey`, `nameInput`, `adminOpen` | Modal state — always closed on load |
| `bump`, `bump2` | Animation trigger counters — resynchronised from saved meters |
| Activity cooldowns (`cd` in `ActivitiesScreen`) | Managed locally in `ActivitiesScreen` component; not yet persisted (see Open Questions OQ-3) |

**Storage key**

```
localStorage key: "awz_save"
```

All reads and writes use this single key. No version suffix in the key — the version
number lives inside the JSON blob (`v` field) so that migration can happen in-process
after reading.

**Serialisation approach**

The save blob is a single `JSON.stringify` call over a plain object constructed from
all the fields in the schema table above. The blob is a flat JSON string stored at
the single key `"awz_save"`. No binary encoding, no compression, no protobuf at this
stage (see Open Questions OQ-1 re: blob size).

**When saves are triggered**

Saves must be triggered on every meaningful state change. The recommended
implementation uses a `useEffect` in `Phone` that watches all persisted state
variables and writes to `localStorage` on any change, with a short debounce (300 ms)
to coalesce rapid sequential updates (e.g. rapid feed taps) into a single write:

```
useEffect(() => {
  const id = setTimeout(() => {
    localStorage.setItem("awz_save", JSON.stringify(saveBlob));
  }, SAVE_DEBOUNCE_MS);           // SAVE_DEBOUNCE_MS = 300
  return () => clearTimeout(id);
}, [gold, gems, xp, owned, meters, pops, encLv, enrich, names,
    built, chapterIdx, serviceIdx, counts, started, tutStep,
    gameSpeed, soundOn]);
```

Additionally, a `beforeunload` event handler must write immediately (bypassing the
debounce) to catch unsaved changes when the tab is closed:

```
useEffect(() => {
  const flush = () => localStorage.setItem("awz_save", JSON.stringify(saveBlob));
  window.addEventListener("beforeunload", flush);
  return () => window.removeEventListener("beforeunload", flush);
}, [saveBlob]);
```

**When loads are triggered**

Load happens once, at component mount, before the first render. The pattern is a
`useState` initialiser function (lazy initial state) — React calls the function
synchronously before the first render, so no "flash of default state" occurs:

```javascript
// Example initialiser pattern — reads once at mount
const [gold, setGold] = useState(() => loadedSave?.gold ?? 50);
```

Alternatively, a single `loadSave()` call at the top of `Phone` returns a parsed
state object, and each `useState` hook uses the relevant field as its initial value.

---

### States and Transitions

```
NO_SAVE (first run, no key in localStorage)
    |
    | [game loads — key absent] → use DEFAULTS (gold=50, gems=10, ...)
    |
    v
PLAYING (state lives in React, auto-saved on change)
    |
    | [state change + debounce elapsed] → write blob to localStorage
    |
    v
SAVED (blob in localStorage, React state unchanged)
    |
    | [page reload / new tab] → read blob from localStorage
    |
    v
LOADING (JSON.parse; validate schema version)
    |   |
    |   | [parse error / corrupt JSON] → discard, use DEFAULTS, show warning
    |   |
    |   | [v < CURRENT_VERSION] → run MIGRATION (v→v+1 transforms)
    |   |
    |   | [v === CURRENT_VERSION] → hydrate useState hooks
    |
    v
PLAYING (state restored)
    |
    | [user triggers "Reset game" in AdminPanel]
    v
NO_SAVE (key deleted from localStorage; defaults applied)
```

**State descriptions**

| State | Description |
|---|---|
| `NO_SAVE` | No `"awz_save"` key exists. Fresh start. All state initialised to code defaults. |
| `PLAYING` | Normal session. React owns state. Save effect is active. |
| `SAVED` | Blob written to `localStorage`. State in React and blob are in sync (within debounce window). |
| `LOADING` | Post-reload. Blob is being parsed and validated. React not yet mounted. |
| `MIGRATED` | Blob was an old version; migration transforms applied; now functionally equivalent to `SAVED`. |

---

### Interactions with Other Systems

Every system whose runtime state is serialised has an implicit dependency on F3.
The table below lists each system and the specific save-blob fields it contributes:

| System | GDD | Save fields used | Direction |
|---|---|---|---|
| **F2 Currency System** | `currency-system.md` | `gold`, `gems`, `xp` | F2 produces; F3 persists |
| **C1 Animal Care System** | *(not yet authored)* | `meters` (all 5 stats per species) | C1 produces; F3 persists |
| **C3 Zoo Level Progression** | *(not yet authored)* | `xp` (level is derived, not stored) | C3 derives level from `xp`; F3 persists `xp` |
| **C4 Taming System** | *(not yet authored)* | `meters[k].trust` (trust is inside the meters object) | C4 produces trust; F3 persists via `meters` |
| **Fe1 Animal Collection** | *(not yet authored)* | `owned`, `pops`, `names` | Fe1 produces; F3 persists |
| **Fe2 Habitat System** | *(not yet authored)* | `encLv` | Fe2 produces; F3 persists |
| **Fe3 Enrichment System** | *(not yet authored)* | `enrich` | Fe3 produces; F3 persists |
| **Fe4 Attractions System** | *(not yet authored)* | `built` | Fe4 produces; F3 persists |
| **Fe6 Quests / Missions** | *(not yet authored)* | `chapterIdx`, `serviceIdx`, `counts` | Fe6 produces; F3 persists |
| **P7 Tutorial / FTUE** | *(not yet authored)* | `tutStep`, `started` | P7 produces; F3 persists |
| **M2 Monetisation Shell** | *(not yet authored)* | `gems` (IAP-credited gems are in the gems balance) | M2 credits via setGems; F3 persists `gems` |

**Systems whose state is NOT currently persisted (gaps)**

| System | Unpersisted state | Risk |
|---|---|---|
| **Fe5 Performance System** | Activity cooldowns (`cd` in `ActivitiesScreen`) | LOW — cooldowns reset on reload, player retaps Run |
| **Fe7 Idle / Offline Earnings** | Session-close timestamp | HIGH — without a saved timestamp, offline gold accrual cannot be computed on resume. Offline earnings are aspirational in the current code (the `offline` modal is hardcoded, not computed). |
| **Fe8 Reputation System** | `rep` balance | MEDIUM — rep is defined in `CURRENCIES` and the `counts` object does not track reputation. Rep state is not a `useState` hook in the current code; no persist path exists yet. |

---

## Formulas

### Save blob size estimation

The blob is a JSON-serialised flat object. Current schema (29 species max):

| Field | Estimated bytes (worst case) |
|---|---|
| `v`, `gold`, `gems`, `xp`, `started`, `tutStep`, `gameSpeed`, `soundOn` | ~80 bytes |
| `owned` (29 species keys, avg 8 chars) | ~320 bytes |
| `meters` (29 species × 5 stats × avg 4 digits) | ~2,320 bytes |
| `pops` (29 entries) | ~580 bytes |
| `encLv` (29 entries) | ~580 bytes |
| `enrich` (29 entries) | ~580 bytes |
| `names` (29 entries × 14 chars max) | ~870 bytes |
| `built` (5 attraction keys × 10 chars) | ~90 bytes |
| `chapterIdx`, `serviceIdx` | ~40 bytes |
| `counts` (7 counters) | ~100 bytes |
| JSON structure overhead (braces, quotes, commas) | ~500 bytes |
| **Total estimated (all 29 species owned, all maxed)** | **~6,060 bytes (~6 KB)** |

### localStorage capacity headroom

```
localStorage cap      = 5,242,880 bytes  (5 MB, browser standard)
awz_save worst case   = ~6,060 bytes
Headroom              = ~5,236,820 bytes (~99.9% free)
```

At current content scope (29 species, one save slot), the blob is **approximately
0.12% of the localStorage cap**. This is not a risk at the current content scale.
The risk noted in `systems-index.md` is forward-looking: if the game expands to
hundreds of species, LiveOps event state, per-player photo album data, or multiple
save slots, the blob could grow. At current scope, the cap is not a concern.

**Blob size warning threshold (tuning knob)**: alert in the developer console when
the blob exceeds `SAVE_SIZE_WARN_BYTES = 512,000` (512 KB — 10% of cap). This gives
ample warning before any real risk is approached.

### Versioning scheme

The `v` field in the blob is an integer starting at `1`. The current version is `1`.
The version is a constant defined in `act/prototype.jsx`:

```
SAVE_FORMAT_VERSION = 1
```

On load, if `parsed.v < SAVE_FORMAT_VERSION`, the migration chain runs:

```
migrateSave(blob):
  while blob.v < SAVE_FORMAT_VERSION:
    blob = MIGRATIONS[blob.v](blob)   // MIGRATIONS is an array of transform functions
    blob.v += 1
  return blob
```

Each migration function receives the old blob and returns a new one with the
additional/renamed/removed fields for that version step. Example:

```javascript
// v1 → v2 migration (hypothetical): adds the `enrich` field if absent
MIGRATIONS[1] = (blob) => ({ ...blob, enrich: blob.enrich ?? {} });
```

---

## Edge Cases

### EC-1: First run — no save data

**Trigger**: `localStorage.getItem("awz_save")` returns `null`.
**Behaviour**: All `useState` hooks initialise to their coded defaults (gold=50,
gems=10, xp=0, owned=["rabbit"], etc. — matching the `gold_start` and `gems_start`
registry constants). The "Let's go" welcome modal is shown (`started = false`).
No error is shown to the player; this is the normal new-game path.

---

### EC-2: Corrupt JSON in localStorage

**Trigger**: `JSON.parse` throws (e.g. blob was truncated by a quota-exceeded error
during a previous write, or manually edited in DevTools).
**Behaviour**: Catch the parse error, log a warning to the console, delete the
corrupt key (`localStorage.removeItem("awz_save")`), and fall through to EC-1
(default state). Show a toast: "Save data could not be loaded — starting fresh."
Do NOT crash or show a blank screen. Player loses progress but can play normally.

---

### EC-3: Version mismatch — old save format

**Trigger**: `parsed.v` is present but less than `SAVE_FORMAT_VERSION`.
**Behaviour**: Run the migration chain (see Formulas — Versioning scheme). After
migration, hydrate state normally. Log to the console: "Save migrated from v[old] to
v[new]." No player-visible indication unless the migration added meaningful new
content (e.g. a new animal tier).

---

### EC-4: Version mismatch — future save format

**Trigger**: `parsed.v > SAVE_FORMAT_VERSION` (save written by a newer client loaded
into an older client — unlikely in single-tab web but possible if a user has two
tabs on different cached versions).
**Behaviour**: Treat as EC-2 (corrupt/unreadable). Log a warning: "Save version [v]
is newer than this client supports. Starting fresh." Delete the key and use defaults.
Do NOT attempt to load a forward-incompatible blob — partial reads lead to silent
data corruption.

---

### EC-5: localStorage unavailable (private browsing / disabled)

**Trigger**: `localStorage.setItem` or `localStorage.getItem` throws a
`SecurityError` or `DOMException` (e.g. Safari private mode, Firefox with cookies
blocked, or `localStorage` explicitly disabled by the user/browser policy).
**Behaviour**: Wrap all `localStorage` calls in a try-catch. If unavailable, the game
runs in memory-only mode: all gameplay works normally for the session, but state is
not persisted across page loads. Show a one-time info banner: "Saving is unavailable
in this browser mode — your progress won't persist." Do NOT prevent gameplay.

---

### EC-6: localStorage quota exceeded during write

**Trigger**: `localStorage.setItem` throws a `QuotaExceededError` (the 5 MB cap
has been reached, most likely by other origins sharing the same origin's storage
quota rather than by `awz_save` itself — the blob is ~6 KB).
**Behaviour**: Catch the error. Attempt to clear only `"awz_save"` and retry once.
If the retry also fails, fall through to EC-5 behaviour (memory-only mode). Log the
error. Show the banner from EC-5. Do NOT silently discard the write without alerting
the player.

---

### EC-7: Reset game (AdminPanel)

**Trigger**: Player taps "Reset" in the `AdminPanel` (currently accessible after
tutorial completes; see `adminReset` function in `prototype.jsx`).
**Behaviour**: Call `localStorage.removeItem("awz_save")` before or immediately
after resetting all `useState` hooks to defaults. This ensures that if the page is
refreshed after the reset, the game also starts fresh (not from the pre-reset save).
The `adminReset` function must always include the `localStorage.removeItem` call.

---

### EC-8: Multi-tab conflict

**Trigger**: The player has Animal World Zoo open in two browser tabs simultaneously.
Both tabs are writing to the same `"awz_save"` key. Tab A saves; Tab B then saves
over Tab A's data; Tab A reloads and finds Tab B's state.
**Behaviour**: At current scope (single-player, browser-only, no server sync), the
last-write-wins behaviour of `localStorage` is acceptable. This is a known limitation
documented here. If the game adds cloud save (see MVP notes in `data.jsx`), the
conflict-resolution strategy (higher Zoo Level wins) must be defined in the cloud-
save subsystem. For now: inform players in the FAQ not to run two tabs simultaneously.
The `storage` event (`window.addEventListener("storage", ...)`) can be used to detect
cross-tab writes and show a warning toast.

---

### EC-9: Partial save during idle income tick

**Trigger**: The 1-second gold income `setInterval` fires at the exact millisecond
that the debounced save write executes. The save captures the gold value
mid-tick.
**Behaviour**: React state updates are synchronous within a render cycle; the save
`useEffect` always runs after the render with the post-update state. There is no
window where the save can capture a "mid-tick" partial state. This is safe by React's
batching model.

---

### EC-10: Save during tutorial

**Trigger**: Player saves mid-tutorial (e.g. closes the tab at tutorial step 3).
**Behaviour**: `tutStep` (the current tutorial step index, e.g. `3`) is persisted as
part of the save blob. On reload, the tutorial resumes at step 3. If the player had
already earned tutorial rewards (gold, XP) for completed steps, those balances are
already baked into `gold` and `xp` — the rewards are not re-granted on resume.

---

## Dependencies

### Upstream (this GDD depends on these)

| Dependency | Nature |
|---|---|
| **Browser `localStorage` API** | The sole persistence mechanism. F3 has no server, no database. The API is browser-native; no library is required. |
| **React `useState` (React 18.3.1)** | All game state lives in `useState` hooks inside `Phone`. F3 reads from these hooks to construct the save blob and hydrates them on load via lazy initial state. |

F3 has no upstream design dependencies — it is a Foundation layer system.

---

### Downstream (these systems require F3 to persist their state)

| System | GDD | State that must survive reloads |
|---|---|---|
| **F2 Currency System** | `currency-system.md` | gold, gems, xp |
| **C1 Animal Care System** | *(not yet authored)* | meters (hunger, thirst, clean, happy, trust per species) |
| **C3 Zoo Level Progression** | *(not yet authored)* | xp (level is derived; only xp is stored) |
| **C4 Taming System** | *(not yet authored)* | meters[k].trust |
| **Fe1 Animal Collection** | *(not yet authored)* | owned[], pops{}, names{} |
| **Fe2 Habitat System** | *(not yet authored)* | encLv{} |
| **Fe3 Enrichment System** | *(not yet authored)* | enrich{} |
| **Fe4 Attractions System** | *(not yet authored)* | built[] |
| **Fe6 Quests / Missions** | *(not yet authored)* | chapterIdx, serviceIdx, counts{} |
| **Fe7 Idle / Offline Earnings** | *(not yet authored)* | session-close timestamp (NOT YET IN SCHEMA — see OQ-2) |
| **M2 Monetisation Shell** | *(not yet authored)* | gems (IAP-credited balance) |
| **P7 Tutorial / FTUE** | *(not yet authored)* | tutStep, started |

---

## Tuning Knobs

All values below should be declared as named constants in `act/prototype.jsx`. They
must never be magic numbers inline.

| Knob | Constant name | Current value | Safe range | Effect |
|---|---|---|---|---|
| Storage key | `SAVE_KEY` | `"awz_save"` | Fixed — changing invalidates all existing saves | The `localStorage` key used for the save blob. Changing this is a breaking migration. |
| Save format version | `SAVE_FORMAT_VERSION` | `1` | Integer, incremented on every schema change | Used by migration logic to detect old saves. Increment when adding/removing/renaming any field. |
| Save debounce delay | `SAVE_DEBOUNCE_MS` | `300` ms | 100–2000 ms | Coalesces rapid state changes into one write. Too low = unnecessary writes; too high = data loss window on abrupt close. |
| Blob size warning threshold | `SAVE_SIZE_WARN_BYTES` | `524288` (512 KB) | 100 KB – 4 MB | Console warning threshold. Set at 10% of the 5 MB cap for early detection of growth. |
| Offline accrual cap (free) | `OFFLINE_CAP_FREE_SEC` | `28800` (8 h) | 3600–86400 s | Maximum seconds of offline gold accrual for free players. Referenced by Fe7 when computing offline earnings. |
| Offline accrual cap (VIP) | `OFFLINE_CAP_VIP_SEC` | `86400` (24 h) | 14400–172800 s | Maximum seconds for VIP players. Must be ≥ `OFFLINE_CAP_FREE_SEC`. |

---

## Acceptance Criteria

### AC-1: New-game initialisation

**GIVEN** a browser with no `"awz_save"` key in localStorage  
**WHEN** the game loads  
**THEN** gold = 50, gems = 10, xp = 0, owned = ["rabbit"], the "Let's go" modal is
shown, and no error message appears.

---

### AC-2: State persists across page reload

**GIVEN** a player has played for 5 minutes (gold = 1,234, two animals owned, one
enclosure upgraded to Lv 2)  
**WHEN** they reload the page  
**THEN** gold = 1,234 (±1 for rounding), both animals appear in `owned`, the
enclosure is still Lv 2, and the zoo resumes without the "Let's go" modal.

---

### AC-3: Save triggers automatically — no manual save required

**GIVEN** the player is in an active session  
**WHEN** they close the browser tab or navigate away  
**THEN** the `"awz_save"` key in localStorage reflects the player's state as of at
most `SAVE_DEBOUNCE_MS` before the close event (the `beforeunload` handler flushes
any pending debounced write).

---

### AC-4: Corrupt save falls back to defaults

**GIVEN** the `"awz_save"` key contains malformed JSON (e.g. `"{{broken"`)  
**WHEN** the game loads  
**THEN** the game starts from defaults (gold = 50, gems = 10), a toast or banner
explains that the save could not be loaded, and no JavaScript exception propagates
to the player.

---

### AC-5: Private / restricted localStorage falls back gracefully

**GIVEN** `localStorage` is unavailable (private browsing mode)  
**WHEN** the game loads and the player plays normally  
**THEN** all gameplay works for the session; a one-time banner informs the player
that saving is unavailable; no crash or blank screen occurs.

---

### AC-6: Reset game clears localStorage

**GIVEN** a player with saved progress triggers "Reset" in the AdminPanel  
**WHEN** the reset completes  
**THEN** `localStorage.getItem("awz_save")` returns `null`, and if the page is
immediately reloaded, the game starts as a new player (AC-1 conditions hold).

---

### AC-7: Schema migration — old save is correctly upgraded

**GIVEN** a save blob with `v: 1` is in localStorage AND the current client expects
`v: 2` (a field was added)  
**WHEN** the game loads  
**THEN** the blob is migrated to v2 (the new field receives its default value), the
game loads without error, and the player's existing progress (gold, animals, etc.)
is fully preserved.

---

### AC-8: Tutorial state persists mid-tutorial

**GIVEN** a player who has completed tutorial steps 0–2 (tutStep = 3) and closes the
browser  
**WHEN** they return and reload  
**THEN** the tutorial resumes at step 3 (the step-3 coach prompt is shown), and the
gold/XP rewards from steps 0–2 are already present in the player's balances (not
re-granted).

---

### AC-9: Sound preference persists

**GIVEN** a player who has toggled sound off (`soundOn = false`)  
**WHEN** they reload the page  
**THEN** the sound toggle is still off and no sounds play on load.

---

### AC-10: New-game starting balances match registry constants

**GIVEN** a brand-new player (no save)  
**WHEN** the game initialises  
**THEN** gold = `gold_start` (50 per entities.yaml) and gems = `gems_start` (10 per
entities.yaml). Any change to these registry constants must also update the save
default initialisers — they must stay in sync.

---

## Open Questions

### OQ-1 — F3 IS NOT IMPLEMENTED (CRITICAL BLOCKER)

**Risk**: HIGH  
The `systems-index.md` lists F3 as "Implemented" — this is incorrect. A full audit
of `act/*.jsx` on 2026-06-06 found **zero** calls to `localStorage.getItem`,
`localStorage.setItem`, `JSON.stringify`, `JSON.parse`, or any `useEffect`-based
persistence. All game state (`gold`, `gems`, `xp`, `owned`, `meters`, etc.) is
lost on every page refresh. The idle-zoo retention loop — the game's core value
proposition — is non-functional as a result.

**Owner**: gameplay-programmer  
**Action required**: Implement the save/load logic described in this GDD as the
next coding task. Priority: BLOCKING for any user-retention or idle-earnings testing.
Update `systems-index.md` to `"In Progress"` and then `"Implemented"` when done.

---

### OQ-2 — Offline earnings timestamp not in save schema (HIGH RISK)

**Risk**: HIGH  
The game design (and `data.jsx` TECH / IDLE arrays) describes offline gold accrual:
the zoo earns ~60% of active rate while the app is closed, capped at 8h (24h VIP).
This requires saving the session-close timestamp (`Date.now()` at unload) so that
on the next load, the elapsed time can be computed and gold can be accrued.

The current save schema does not include a `closedAt` (or `lastSaved`) timestamp
field. The `offline` modal in `prototype.jsx` is currently hardcoded with fictional
values ("8h 04m", "+5,240 gold") — it is not wired to any real computation.

**Required addition to schema**:
```
closedAt: number   // Date.now() written in the beforeunload handler
```

On load, if `closedAt` is present and elapsed time > 0, compute:
```
offlineGold = zooRate × min(elapsed, OFFLINE_CAP_FREE_SEC) × OFFLINE_RATE_FACTOR
```
where `OFFLINE_RATE_FACTOR = 0.60` (free) and `zooRate` is recomputed from the
saved state.

**Owner**: gameplay-programmer + systems-designer (Fe7 Idle/Offline Earnings GDD)  
**Blocked by**: Fe7 GDD not yet authored.

---

### OQ-3 — Activity cooldowns are not persisted (MEDIUM RISK)

**Risk**: MEDIUM  
The `cd` state in `ActivitiesScreen` (a `{ [activityKey]: secondsRemaining }` map)
is local component state, not lifted to `Phone`, and therefore not saved. On reload,
all activity cooldowns reset to 0 (all activities immediately available again). For
casual short sessions this is harmless, but for long-cooldown premium activities
(4-hour Dolphin Encounter, etc.) it is a meaningful imbalance — players can exploit
reloads to bypass cooldowns.

**Options**:
1. **Store cooldown as an expiry timestamp** (not remaining seconds): save
   `{ [key]: expiresAt }` where `expiresAt = Date.now() + cooldownMs`. Recompute
   remaining on load. Requires `closedAt` (OQ-2) to be solved first.
2. **Accept the exploit at prototype stage** and note it as a known gap until
   the game approaches production.

**Owner**: gameplay-programmer  
**Recommendation**: Option 2 is acceptable for prototype/alpha; Option 1 is required
before public beta.
