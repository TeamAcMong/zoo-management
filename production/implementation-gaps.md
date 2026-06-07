# Implementation Gaps & Pre-Production Backlog

> **Created**: 2026-06-06 (autonomous GDD-authoring session)
> **Updated**: 2026-06-07 — Unity C# audit (see the dedicated section below)
> **Source**: Discovered while reverse-documenting the MVP system GDDs (2026-06-06,
> against `act/*.jsx`), then re-audited against the **Unity C# codebase** (2026-06-07).
>
> ⚠️ **Codebase note (corrects an earlier claim in this file):** the **shipping codebase
> is now Unity C# under `Assets/Scripts/**`** — it is NOT empty. The `act/*.jsx` React
> build is the **reference prototype only** (per `CLAUDE.md`). The 2026-06-06 "Resolved"
> table below describes fixes made in the JSX prototype; whether each one also exists in
> the C# code is tracked in the **2026-06-07 Unity C# audit** section.

This file is the single consolidated worklist. The individual GDDs hold the detail;
this is the triage view. Severity reflects impact on shipping a playable MVP.

---

## ✅ Resolved in the 2026-06-06 code pass (`act/*.jsx` prototype)

> These fixes landed in the **React reference prototype**. The Unity C# port has since
> reproduced MOST of them but NOT all — the "in C#?" column records that. Balance values
> marked ⚠️ are **provisional starting points** pending a proper `/balance-check` simulation.

| # | Was | Now (JSX prototype) | In C#? |
|---|-----|---------------------|--------|
| **1** | No save/load | Versioned save | ✅ `SaveService.cs` (JSON @persistentDataPath) — but **only wired in `AppBootstrap`, NOT in the `GameApp` path that actually runs**, and meters/trust not serialized |
| **2** | Offline faked | Real accrual | ✅ `IdleService.cs` (gold-only, 8h) — same caveat: not called by the running `GameApp` path |
| **4** | No offline decay | Gentle decay | 🟡 decay rates in `CareService.cs`; offline-on-resume decay tied to the unwired path |
| **5** | Attractions any level | Level gate | 🟡 gate logic in UI `GameApp.cs`; `AttractionService.Build()` is a stub |
| **6** | Trust gates data-only | Enforced | ❌ **Trust is never written/read in C#** — taming absent |
| **7** | Quest credit on start | On completion | 🟡 `QuestService` has idempotent Claim; no daily missions |
| **8** | Enc/enrich uncapped | Capped Lv5 | ✅ `HabitatService.cs`/`EnrichmentService.cs` (cap 5 enforced) |
| **9** | "spam Play" dominant | Welfare composite | ❌ **`happy_mult` NOT in C#** — `EconomyService.GoldPerSec` applies no welfare multiplier |
| **D-B1** | Decay too fast | −6/−8/−6/−4 per hour | ✅ `CareService.cs` (3/4/3/2 over 1800s) |
| **D-W5** | Cost mults 2× high | Halved | ✅ C# uses 50/80/20 (`CollectionService`/`HabitatService`/`EnrichmentService`) |

<details><summary>Original 2026-06-06 JSX "Was → Now" detail (historical)</summary>

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

</details>

**Still open (not in C#):** the dual-path save wiring (game currently runs without saving),
`happy_mult` welfare→economy link, taming/trust, daily missions / gem faucet (Fe6), reputation
wiring (Fe8), unlock-cost gold, content authoring (29 species SO assets), `TuningConfig` wiring,
attraction-build via service, test coverage. See the **2026-06-07 Unity C# audit** below.

---

## 2026-06-07 — Unity C# audit (code-vs-design, authoritative)

Audit of `Assets/Scripts/**` vs the GDDs + `entities.yaml`. This supersedes the JSX-based
triage below for the shipping target. Evidence is `File.cs:line`.

### 🔴 CRITICAL (C#)

| # | Gap | Evidence | Fix sketch |
|---|-----|----------|-----------|
| C-1 | **Dual bootstrap path — the running game does not save.** Two paths exist: `AppBootstrap`→`GameController` (wires SaveService + IdleService, but its `P1–P7` screens are empty stubs and `GameController.Apply()` is a TODO → renders nothing) and `GameApp.cs` (auto-spawned via `GameAppBootstrap` `[RuntimeInitializeOnLoadMethod]`, renders all 5 tabs, **builds its own domain and never calls SaveService/IdleService**). The path that actually runs has **no save and no offline**. | `GameAppBootstrap.cs:16`, `GameApp.cs:132` (`BuildDomain`), `GameApp.cs:109` (own `Update`); `AppBootstrap.cs:54` (Idle wired but path inert) | Decide one path. Either: GameApp calls `SaveService`/`IdleService`, or migrate GameApp's screens into the `GameController` pipeline and finish `Apply()`. |
| C-2 | **`happy_mult` not implemented — care does not affect income.** `EconomyService.GoldPerSec` applies no welfare/happiness multiplier; the C1→C2 link (the soul of an idle care game) is absent. | `EconomyService.cs:74,88`; `CareService.AvgHappiness:109` exists but is unused by economy | Multiply `goldPerSec` (or appeal) by the welfare composite `clamp(0.4 + avgWelfare/100, 0.5, 1.4)` per `happy_mult`. |

### 🟠 HIGH (C#)

| # | Gap | Evidence |
|---|-----|----------|
| C-3 | **Taming/trust absent.** `AnimalMeters.Trust` is declared but never written or read; no thresholds/gains. C4 is design-only in code. | `AnimalMeters.cs:10` (Trust=0, unused) |
| C-4 | **Species unlock is free.** `CollectionService.Unlock` is level-gated only; no `unlock_gold_cost` (500×1.06^lv). | `CollectionService.cs:40` |
| C-5 | **`gold_start` mismatch.** C# seeds 200 gold; registry/GDD say 50. | `GameApp.cs:136`, `DevHarness.cs:41` |
| C-6 | **XP curve is piecewise-linear, not geometric.** Endpoints align (Lv92) but the curve shape differs from `level_xp_curve`. | `LevelService.cs:23` |
| C-7 | **Care actions are free.** No `care_action_cost_tier_mult` (0.4) gold sink on care. | `CareService.DoAction:68` |
| C-8 | **Attractions service is a stub.** `AttractionService.Build()` returns `false`; building is hardcoded in UI `GameApp.cs`, not the domain service; no `AttractionDef`. | `AttractionService.cs:38` |

### 🟡 MEDIUM (C#)

| # | Gap | Evidence |
|---|-----|----------|
| C-9 | **F3 does not persist per-animal meters/trust.** SaveBlob v1 omits `AnimalMeters`; they rebuild from defaults on load. | `SaveService.cs:143` |
| C-10 | **No authored content.** 12-species dev roster only (appeal 3–230), not the 29-species 3–3000 ladder; **zero `.asset` files** (AnimalDatabase, TuningConfig unauthored). | `DefaultAnimalData.cs:28` |
| C-11 | **`TuningConfig` not wired.** Services use private `const` copies; the SO mirrors values but feeds nothing → not the source of truth. | each service's `const` block |
| C-12 | **No biome system; no VIP offline cap (86400).** Designed, absent in code. | (no references) |
| C-13 | **Test coverage ~nil.** 5 tests cover only `EconomyService.GoldPerSec`; 9/10 services untested. | `Assets/Tests/EditMode/EconomyFormulas_GoldPerSec_Test.cs` |

### Recommended sequencing (C#)
1. **C-1 dual-path** — make the running game save/offline (highest-value; everything else is moot if progress is lost).
2. **C-2 happy_mult** — restore care→income (core loop).
3. **C-10/C-11 content + TuningConfig wiring** — author 29-species DB; wire the SO so balance is data-driven.
4. **Reconcile the mismatches** (C-4/C-5/C-6/C-7) — design decisions: free-unlock vs gold; 50 vs 200; curve shape; care cost.
5. **C-3 trust → C-8 attractions service → daily missions** — implement remaining design-only systems.
6. **C-13** — backfill tests per service.

---

## JSX prototype gaps (2026-06-06 triage — reference prototype only)

> The tables below were logged against `act/*.jsx`. Many are now resolved or moot in C#
> (see the 2026-06-07 audit above). Retained for traceability to each GDD Open Question.

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
