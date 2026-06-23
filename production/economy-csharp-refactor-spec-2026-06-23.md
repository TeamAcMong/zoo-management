# C# Economy Refactor Spec — 4-Axis Redesign (2026-06-23)

> **Apply when Unity is open** (this env can't compile). Prototype reference (verified by play):
> `awz-play.html`. Design SSoT: `design/gdd/economy-redesign.md` (FINALIZED section).
> Goal: replace the count-driven appeal with role-differentiated 4-axis economy so late-game
> doesn't depend on buying duplicate animals.

## Locked decisions
1. **Happiness → APPEAL only.** Remove any `happy_mult` from the revenue formula.
2. **`rarity` = separate field, default 1.0.** Tier (baseAppeal) carries the main weight; flag rares (>1.0) per species.
3. **Buy More → CAPACITY only.** `count` adds seats (throughput), NOT appeal.

## Target formulas (one place = TuningConfig)
```
welfare(k)      = mean(hunger,thirst,clean,happy)            // 0..100, per species
happyFactor(k)  = clamp(0.4 + welfare(k)/100, 0.5, 1.4)
qualityOf(k)    = 1 + ENR_QUAL*enrLv + HAB_QUAL*(encLv-1)    // ADDITIVE in-axis (anti multiplier-soup)
appealOf(k)     = tier(k) * rarity(k) * qualityOf(k) * happyFactor(k)   // NO *count
totalAppeal     = (1 + DIVERSITY_STEP*(distinctOwned-1)) * Σ appealOf(k)
seatsOf(k)      = count(k) * SEAT_BASE * (1 + SEAT_ENC*(encLv-1))
capacity        = round((BASE_CAP + Σ seatsOf) * (1 + ATTR_CAP*built))
visitors        = min(round(totalAppeal * VISITORS_PER_APPEAL), capacity)
returnBonus     = 1 + min(reputation, REP_CAP)/REP_CAP * RETURN_MAX
goldPerSec      = max(1, round(visitors * SPEND_PER_VISITOR * returnBonus * (1 + ATTR_SPEND*built)))
```
Default knob values (validated in prototype): ENR_QUAL 0.08 · HAB_QUAL 0.15 · SEAT_BASE 2 · SEAT_ENC 0.5 ·
BASE_CAP 10 · DIVERSITY_STEP 0.05 · VISITORS_PER_APPEAL 1.0 · SPEND_PER_VISITOR 0.5 · ATTR_SPEND 0.12 ·
ATTR_CAP 0.15 · RETURN_MAX 0.5 · REP_CAP 1000. (Re-validate vs gold pacing before lock.)

---

## Per-file changes

### `Assets/Scripts/Domain/Core/EconomyService.cs`  — REWRITE core
- `AppealOf(key)`: `tier*rarity*qualityOf*happyFactor`, **drop `* count`**. Needs new deps:
  - tier + rarity from Data (replace `_getBaseAppeal` with `_getTier` + `_getRarity`, or keep BaseAppeal as tier + add `_getRarity`).
  - welfare from care → **inject `ICareService`** (new ctor param) and call `_care.Welfare(key)`.
- Add `TotalAppeal()` = diversity × Σ AppealOf.
- `Capacity()`: `(BASE_CAP + Σ seatsOf)*(1+ATTR_CAP*built)`; `seatsOf = count*SEAT_BASE*(1+SEAT_ENC*(enc-1))`. (count lives here now.)
- `GoldPerSec()`: `max(1, round(visitors*SPEND*returnBonus*(1+ATTR_SPEND*built)))`. **No happy term.** Add `ReturnBonus()` from `_state.Reputation`.
- Pull all constants from `TuningConfig` (inject), not literals.

### `Assets/Scripts/Domain/Core/CareService.cs` + `ICareService`
- Add `float Welfare(string key)` = mean of the 4 meters (0 if unowned). EconomyService consumes it.
  (Already has `AvgHappiness`; add per-species `Welfare`.)

### `Assets/Scripts/Data/AnimalDef.cs` (+ `DefaultAnimalData.cs` dev stub)
- Add `Rarity` (float, default 1f). Keep `BaseAppeal` as the tier weight (rename to `Tier` optional).
- DefaultAnimalData: add rarity column (penguin/giraffe 1.2, lion 1.5, elephant 1.3 per prototype).

### `Assets/Scripts/Data/TuningConfig.cs`
- Add knobs above. Keep `AttractionRevenueMult`/`AttractionCapacityMult`. Remove nothing tied to count (count still used for capacity).

### `Assets/Scripts/Domain/Feature/CollectionService.cs`
- **No appeal change needed** (appeal no longer reads count — handled in EconomyService).
- `BuyMore` stays as the capacity sink. `Unlock` already grants +40 XP (Phase 1 ✓).

### `Assets/Scripts/UI/GameApp.cs`
- `BuildDomain`: pass new deps to `EconomyService` (care service, getTier, getRarity); reputation already in GameState.
- **Wire reputation faucet:** activity "Do" handler → `_state.Reputation += REP_PER_ACTIVITY` (currently rep never grows). (Mirror prototype: +2/activity.)
- Update displays: animal card shows new appeal + seats + happy×; HUD shows reputation + visitors/capacity; relabel "Buy More" → "+ sức chứa"; "Upgrade Enc" → "Habitat (+appeal & ghế)".
- Optional: show "bottleneck" hint (demand vs capacity) like the prototype.

---

## Delete (dead code — safe)
- `Assets/Scripts/Runtime/DevHarness.cs` and `Assets/Scripts/Runtime/DevPlayBootstrap.cs` — the neutralised IMGUI dev path (GameAppBootstrap replaced it). Confirm no scene references first.
- `AttractionService.Build()` stub (`return false`) — either implement the level-gate+cost here and call it from GameApp (preferred) or delete the method; today GameApp builds in UI against a hardcoded table.

## Do NOT delete without a separate decision
- `AppBootstrap.cs` / `GameController.cs` — the "proper" composition path (dual-bootstrap debt). Consolidation is a separate task; don't delete blindly (it holds the only Save/Idle/AnimalDatabase wiring intent).

## Verify after applying (in Unity)
1. Compile clean (Console 0 errors).
2. New game: care an animal → its Appeal rises (happyFactor); HUD gold/s reacts.
3. Adopt a new species → totalAppeal jumps (diversity), not from buying duplicates.
4. Buy More → capacity rises, appeal unchanged.
5. Do activity → reputation rises → gold/s rises (returnBonus).
6. EditMode unit tests for AppealOf / Capacity / GoldPerSec with known inputs (gate F3/economy per coding-standards).
