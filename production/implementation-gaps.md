# Implementation Gaps & Pre-Production Backlog

> **Created**: 2026-06-06 (autonomous GDD-authoring session)
> **Source**: Discovered while reverse-documenting the 10 remaining MVP system GDDs.
> Every item below is a discrepancy between the **design intent** (now captured in
> `design/gdd/*.md`) and the **actual code** in `act/*.jsx`. Each links to the GDD
> Open Question that documents it in full.

This file is the single consolidated worklist. The individual GDDs hold the detail;
this is the triage view. Severity reflects impact on shipping a playable MVP.

---

## ✅ Resolved in the 2026-06-06 code pass (`act/*.jsx`)

> All fixes landed in the React prototype (the only place game logic exists — `Assets/Scripts/` is empty).
> Balance values marked ⚠️ are **provisional starting points** pending a proper `/balance-check` simulation.

| # | Was | Now |
|---|-----|-----|
| **1** | No save/load — reset every reload | **Versioned `localStorage` save** (`awz_save`, v1); writes on every state change, loads on mount; `adminReset` clears it |
| **2** | Offline earnings hardcoded/unreachable | **Real accrual on resume**: `floor(min(elapsed,8h) × savedRate × 0.60)`, modal shows real numbers (gold only) |
| **4** | No offline decay (idle inverted) | **Gentle offline decay** on resume toward a 35–40 floor (a soft "tend me" nudge, not punishing) |
| **5** | Attractions buildable at any level | **Level gate enforced** in `buildAttraction()` + Build button shows "🔒 Reach Lv X" |
| **6** | Trust gates were data-only | **Enforced**: Petting needs trust ≥ 40, Performance needs ≥ 80 (`participants()`) |
| **7** | Quest credit on activity START (farmable) | **Credited on COMPLETION** in `finishActivity()` |
| **8** | Enclosure/enrichment uncapped (∞ appeal) | **Capped at Lv5** (guards + disabled buttons); appeal now bounded |
| **9** | Happiness standalone → "spam Play" dominant | **Welfare composite**: `happyMult` now averages hunger+thirst+clean+happy, so all care matters |
| **D-B1** | Decay −6/12s (drained in 2–7 min) | **−6/−8/−6/−4 per HOUR** (30-min tick) — matches the documented "−6/hr" intent ⚠️ |
| **D-W5** | Cost mults 2× high (22/160/40) | **Halved → 11/80/20** (display + charge synced) ⚠️ |
| **3 / I4** | Rides(9k)<Shows(16k); offline "+820 XP" contradiction; dead ride species | **Costs de-inverted** (shows 8k < rides 16k); **offline is gold-only** (no XP); **Camel/Ostrich/Pony removed** from rides filter |

**Still open (not done this pass):** daily missions / gem faucet (Fe6), reputation wiring (Fe8), activity-cooldown persistence (reload still resets cooldowns), the XP-curve pacing reshape & the 90-day-journey reality gap (needs `/balance-check` + sim), collection-completion reward, endgame/prestige design, and the Unity C# port. See the severity tables below.

---

## 🔴 CRITICAL — blocks any retention / alpha test

| # | Gap | Evidence | GDD | Fix sketch |
|---|-----|----------|-----|-----------|
| 1 | **Save/Load does not exist.** Zero `localStorage` calls in any `act/*.jsx`. Every session starts from hardcoded defaults — animals, currency, levels, trust, enrichment, attractions, quests all reset on reload. The idle-zoo retention loop is non-functional. | `prototype.jsx` (no `localStorage`/`setItem`) | [save-load.md](../design/gdd/save-load.md) OQ-1 | Implement the versioned JSON save defined in the F3 GDD: serialize on change (debounced) + on `beforeunload`, key `awz_save`, `save_format_version: 1`, migration layer. |
| 2 | **Offline earnings are entirely faked.** The "while you were away" modal shows hardcoded strings (`8h 04m`, `+5,240`, `+820 XP`) and Collect grants a flat `+6340`. No `closedAt` timestamp is ever saved; the `offline` flag is never set true. | `prototype.jsx` offline modal (~L337–343) | [idle-offline.md](../design/gdd/idle-offline.md) OQ-1/2 | Depends on #1. Save `closedAt` in the blob; on resume compute `offlineGold = floor(min(elapsed,cap) × goldPerSec × 0.60)`. |

---

## 🟠 HIGH — balance integrity & correctness (fix before MVP balance lock)

| # | Gap | Evidence | GDD | Fix sketch |
|---|-----|----------|-----|-----------|
| 3 | **Cost multipliers ~2× too high.** `BUY_COST_MULT=22`, `UPGRADE_COST_MULT=160`, `ENRICH_COST_MULT=40` were calibrated when max appeal was ~1500; the income→appeal redesign raised max to 3000, so elite-species costs are roughly double the intended ceiling. | `prototype.jsx`, `proto-screens.jsx` | [currency-system.md](../design/gdd/currency-system.md) OQ-1; mirrored in Fe1/Fe2/Fe3 | Run `/balance-check economy`. Candidate targets: BUY≈11, UPGRADE≈80, ENRICH≈20 (≈half), pending the C2 endgame gold/hour target. |
| 4 | **Care decay ~100–1000× too fast.** A full stat drains in ~2–7 min of *active* session; an idle game built on daily check-ins needs hours-long decay. | `prototype.jsx` decay `useEffect` (`care_decay_per_tick`, `decay_tick_interval=12000ms`) | [animal-care.md](../design/gdd/animal-care.md) OQ-3 | Slow decay by ~2–3 orders of magnitude; tie to real elapsed time, not tick count. |
| 5 | **No enclosure level cap.** `upgradeEnc()` has no `encLv >= 5` guard — players can upgrade into Lv6+ silently. | `prototype.jsx`/`proto-screens.jsx` `upgradeEnc` | [habitat-system.md](../design/gdd/habitat-system.md) OQ-1 | One-line guard: block/disable at `encLv >= 5` (`max_enclosure_level`). |
| 6 | **No enrichment level cap.** `addEnrichment()` is unbounded — appeal can grow without limit. | `prototype.jsx` `addEnrichment` | [enrichment.md](../design/gdd/enrichment.md) OQ-1 | Cap at `MAX_ENRICH_LEVEL=5` (symmetric with #5). |
| 7 | **Attraction level gates not enforced.** `buildAttraction()` skips the Zoo Level check that animals and habitats enforce — any player with gold can build past the gate. | `proto-screens.jsx` `buildAttraction` | [attractions.md](../design/gdd/attractions.md) OQ-1 | Add `level >= unlockLevel` guard. |
| 8 | **Trust gates not enforced.** Petting Area filters by taming *string* (`Very Easy`/`Easy`), not `trust >= 40`; Performance Arena filters by the `perform` *flag*, not `trust >= 80`. Both thresholds are promised in data copy + registry (`trust_thresholds`) but never checked. | `proto-screens.jsx` `participants()` | [taming.md](../design/gdd/taming.md) OQ-3; [attractions.md](../design/gdd/attractions.md) OQ-2 | Confirm threshold values, then add `meters[k].trust >=` checks to the participant filters. |
| 9 | **Taming difficulty is purely cosmetic.** Rabbit and Crocodile both reach max trust in 18 plays; the "Master = 3+ weeks" copy is false. | `data.jsx` ACTIONS / TAMING; `prototype.jsx` trust deltas | [taming.md](../design/gdd/taming.md) OQ-2 | Make trust gain rate (or threshold) scale with the TAMING difficulty rank. |
| 10 | **Per-attraction effect labels are lies.** Data labels (`+12% visitors`, `+15% revenue`, `+18% reputation`…) imply differentiated effects, but *all* attractions contribute identically through the `|built|` counter. | `data.jsx` ATTRACTIONS vs `prototype.jsx` ~L101 | [attractions.md](../design/gdd/attractions.md) OQ-2 | Decide: (a) unify to honest `|built|` labelling, or (b) build real per-attraction differentiation (ties into Fe8 Reputation). |

---

## 🟡 MEDIUM — correctness / data hygiene

| # | Gap | GDD |
|---|-----|-----|
| 11 | **HAB_UPGRADE income table diverges from runtime.** Display table shows ×3.0 at Lv5; runtime `multOf` produces ×2.0 (the canonical `enc_appeal_bonus_per_level=0.25`). | [habitat-system.md](../design/gdd/habitat-system.md) OQ-4 |
| 12 | **SINKS table attraction costs ~20× too high.** `data.jsx SINKS` says 40k–900k 🪙; actual build costs are 500–45,000 🪙. Stale stub. | [attractions.md](../design/gdd/attractions.md) #4 |
| 13 | **Attraction cost inversion.** Animal Rides (Lv30, 9,000) is cheaper than Educational Shows (Lv26, 16,000) — a later unlock costs less. | [attractions.md](../design/gdd/attractions.md) #5 |
| 14 | **Happiness is a standalone meter, not a welfare composite.** A player can hold happiness at 100 (via Play) while hunger/thirst/cleanliness sit at 0 — contradicting the `data.jsx STATS` copy. | [animal-care.md](../design/gdd/animal-care.md) OQ-2 |
| 15 | **Only `feed`/`clean` increment quest counts.** Water/Play/Heal don't touch `counts`, so no daily mission can gate on them. | [quests-missions.md](../design/gdd/quests-missions.md) #2 |
| 16 | **Tutorial awards 0 XP.** All 9 `TUT_STEPS` lack an `rw.xp` field — an early-XP gap vs the Day 1–7 pacing target (Lv7 by end of week 1 looks aggressive at 3 XP/action). | [zoo-level.md](../design/gdd/zoo-level.md) (pacing OQ) |
| 17 | **Unnamed magic numbers.** `UPGRADE_COST_FLOOR=300` and `ENRICH_COST_FLOOR=200` are inline literals, not named `data.jsx` constants. | habitat-system.md OQ-5 / enrichment.md #3 |
| 18 | **Activity cooldowns not persisted.** 4-hour premium activity cooldowns live in component state — a reload bypasses them. | [save-load.md](../design/gdd/save-load.md) OQ-3 |

---

## 🟢 LOW — polish / cleanup

| # | Gap | GDD |
|---|-----|-----|
| 19 | `'owned'` quest objective ambiguity — total animal count vs unique species. | quests-missions.md OQ-1 |
| 20 | Rides participant filter references `Camel`/`Ostrich`/`Pony` — species not in the ANIMALS roster (dead entries). | attractions.md #6 |
| 21 | `views-train.jsx` copy says Play `+5` trust; code is `+4` (doc bug — code is canonical). | taming.md OQ-1 |
| 22 | Multi-level-skip on a large XP grant announces only the final level; intermediate unlocks crossed silently. | zoo-level.md (EC) |
| 23 | No collection-completion reward/acknowledgement at all 29 species (the long-term goal). | animal-collection.md OQ-1 |
| 24 | `satis` prop in `LiveZoo` is unused after the economy redesign (cosmetic cleanup). | — (pre-existing) |
| 25 | `rep` (Reputation) currency is defined in data but not wired into the live economy chain (Fe8 Alpha). | currency-system.md OQ-2 |

---

## Recommended sequencing

1. **Implement F3 Save/Load (#1)** — unblocks #2, #18, and makes every other system's progress persist. Nothing else can be playtested for retention until this lands.
2. **Add the four missing guards (#5, #6, #7, #8)** — small, high-value correctness fixes.
3. **Run `/balance-check economy` (#3, #4, #11, #12, #13)** — one coordinated economy pass; the GDDs now contain the worked cost/ROI tables this needs.
4. **Resolve the honesty gaps (#9, #10, #14)** — these are design decisions (creative-director / game-designer), not just code fixes.
5. Sweep the MEDIUM/LOW backlog opportunistically.

> All 25 items trace to a GDD Open Question. When an item is fixed, update both the
> code and the corresponding GDD's status, and (if it touched a registered value)
> `design/registry/entities.yaml`.
