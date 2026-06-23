# Stuck Fix Plan — Animal World Zoo (shipping GameApp path)

> Created 2026-06-23. Source analysis: live C# read of the auto-booting `GameApp` path.
> Companion: `design/gdd/gdd-cross-review-2026-06-11.xls` (GDD review, verdict FAIL).
> Scope: **progression/design "stuck"** points, grounded in the running build.

## Headline finding

The game has **two parallel, disconnected implementations**:

- **Path A — "proper" architecture (NOT rendering / not the play path):**
  `AppBootstrap` (composition root, ExecOrder -100) → loads `SaveService`, builds services
  from `AnimalDatabase` (29-species SO) + `TuningConfig`, runs `IdleService.ComputeOffline`
  + `CollectPending`, wires `GameController`, inits `IGameScreen` screens.
  Blockers on this path: requires scene-wired serialized refs; `GameController.Apply` is an
  empty `TODO`; the `IGameScreen` UI screens are stubs.
- **Path B — playable UI (the actual play path):** `GameAppBootstrap`
  `[RuntimeInitializeOnLoadMethod]` auto-spawns `GameApp`, which **builds its own domain
  inline** (`GameApp.BuildDomain`), hardcodes a fresh 1-rabbit state every launch, uses the
  **`DefaultAnimalData` 12-species dev stub**, and never touches `SaveService`, `IdleService`,
  `AnimalDatabase`, or `GameController`.

**Consequence:** the persistence, offline, and full-content systems already exist and work —
they are simply not wired into the path that renders. Most of Phase 0–1 below is **wiring /
consolidation, not new code.**

### Architecture decision (must pick before Phase 0)
- **Option 1 (RECOMMENDED, small blast radius):** wire the existing `SaveService` +
  `IdleService` into `GameApp`; keep GameApp's inline domain. Fast, unblocks play.
- **Option 2 (correct long-term, large):** make GameApp render through `AppBootstrap`/
  `GameController`, finish `GameController.Apply`, adopt `AnimalDatabase`. Pays off the
  dual-path debt but is a multi-session refactor.
- Plan below assumes **Option 1 now**, Option 2 tracked as a separate architecture task.

---

## Stuck inventory (severity)

| ID | Stuck | Severity | Root |
|----|-------|----------|------|
| S-0 | No persistence in GameApp — every launch resets to 1 rabbit | CRITICAL | wiring |
| S-1 | Only XP faucet is care-tap (+3); Lv92 ≈ 7.6M taps | CRITICAL | design + wiring |
| S-2 | No idle/offline in GameApp (IdleService never called) | CRITICAL | wiring |
| S-3 | Care disconnected from economy (no happy_mult in GoldPerSec) | MAJOR | code |
| S-4 | Gold is a progression dead-end (unlock free + level-gated) | MAJOR | design |
| S-5 | Adopt grants 0 XP (Unlock never AddXp; XpPerAdopt dead) | MAJOR | code |
| S-6 | Quests unwired (QuestService unused by GameApp) | MODERATE | wiring |
| S-7 | Tuning hardcoded as const; GameApp uses 12-species stub → content ceiling at Lv18 | MODERATE | wiring + content |
| S-8 | FullRefresh() on every care-tap → the one progression action is janky | UX | code |

Tap-to-level math (LevelService linear anchors, +3 XP/tap):
Lv7 = 1,734 taps · Lv18 = 14,000 · Lv30 = 70,000 · Lv45 = 326,667 · Lv92 ≈ 7,600,000.

> ⚠️ Latent trap: care `DoAction` grants XP even on a full meter (no reject). This is the only
> thing making the grind survivable. Do NOT add a "reject when full" gate before S-1 is fixed,
> or the game becomes literally impossible.

---

## Phases

### Phase 0 — S-0 Persistence (BLOCKING-first · effort S–M)
Pieces exist; this is wiring + one serialization gap.
1. `GameApp.Awake`: add a `SaveService` component (`AddComponent<SaveService>()`); replace the
   hardcoded `BuildDomain` seed with `state = save.Load()`; if `state.OwnedSpecies` empty →
   seed new-game (rabbit, Gold 200, Gems 10).
2. After every mutating action (care/buy/upgrade/enrich/build/adopt/claim) call `save.Save(_state)`
   (its 300 ms debounce absorbs spam). On quit → `save.Flush(_state, UtcNow)`.
   (SaveService already auto-flushes on pause/focus-loss once `_pendingState` is set.)
3. **Close the meters gap:** extend `SaveBlob` to serialize `AnimalMeters`
   (hunger/thirst/clean/happy[/trust later]) — currently rebuilt from defaults
   ([SaveService.cs:143](../Assets/Scripts/Runtime/SaveService.cs#L143)). Bump schema or keep v1 +
   tolerant load.
4. **Test/AC:** EditMode round-trip (state→Save→Load equal, incl. meters). Manual: reach Lv3,
   close, reopen → still Lv3.

### Phase 1 — S-2 idle + S-5/S-6 faucet wiring (effort M)
1. **S-2:** instantiate `IdleService` in `BuildDomain`; after Load → `ComputeOffline(UtcNow)` →
   "while away" modal → `CollectPending`. (Logic already written.)
2. **S-5:** on adopt ([GameApp:1512](../Assets/Scripts/UI/GameApp.cs#L1512)) grant
   `_level.AddXp(XpPerAdopt)`; pull `XpPerAdopt` from `TuningConfig` instead of leaving it dead.
3. **S-6:** wire `QuestService.Bump` into care/adopt/build and `Claim` into QuestsScreen — or give
   the existing "Activities" XP, not gold only.
4. **Test/AC:** offline 1h ⇒ `floor(3600·R·0.6)` gold; adopt ⇒ +40 XP; claim ⇒ XP+gold.

### Phase 2 — S-1 structural faucet (effort M · GATE: decide xp-pacing-redesign)
1. Accept/adapt `design/gdd/xp-pacing-redesign-2026-06-08.md`. Core: **Education XP =
   visitors × XP_PER_VISITOR** added each tick (next to the gold income tick,
   [GameApp:147](../Assets/Scripts/UI/GameApp.cs#L147)).
2. Move `XpPerCareAction` + anchors + mults into `TuningConfig` (S-7; currently `const`, violates
   the no-hardcoded-gameplay rule).
3. Validate via `tools/sim/xp_pacing.js` → engaged player Lv92 ≈ 180 days; Lv7 by Day 5–7.

### Phase 3 — S-3 happy_mult + S-4/S-7 sink & content (effort M–L · GATE: economy-redesign + content)
1. **S-3 (no gate, do early):** add `clamp(0.4 + avgWelfare/100, 0.5, 1.4)` to
   `EconomyService.GoldPerSec` ([:74](../Assets/Scripts/Domain/Core/EconomyService.cs#L74));
   `avgWelfare` = mean of (hunger+thirst+clean+happy)/4 over owned (add `CareService.AvgWelfare`,
   inject into EconomyService). Makes all 4 care actions matter.
2. **S-7 content:** switch GameApp from `DefaultAnimalData` (12, ceiling Lv18) to `AnimalDatabase`
   (29) — requires authoring AnimalDef SO assets + a load path for the auto-booted GameApp.
3. **S-4 sink:** per economy-redesign — adopt costs gold (`unlock_gold_cost`) and/or an infinite
   comfort sink so gold always has somewhere to flow.

### Cleanup (parallel, lower)
- **S-8:** replace `FullRefresh()` per care-tap with targeted label/meter updates.
- **S-7 tuning:** route all gameplay consts through `TuningConfig`.

## Dependency gates
| Phase | Gated by |
|-------|----------|
| 0 Persistence | none — start now |
| 1 idle + faucet wiring | Phase 0 |
| 2 structural XP | **xp-pacing decision (pending)** |
| 3 happy_mult / sink / content | happy_mult: none · sink: **economy-redesign (pending)** · content: author AnimalDef assets |

**Minimum to clear "hard stuck":** Phase 0 + 1 + S-3. Phases 2–3 bring pacing/economy to the
6-month vision.
