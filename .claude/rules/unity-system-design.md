---
paths:
  - "Assets/**/*.cs"
---

# Unity System Design Rule

**Purpose.** Prevent the recurring class of bugs that appear when AI implements a
full Unity system + wires it via MCP: race conditions between async init and UI
lifecycle, "system exists but not ready" confusion, silent failures in Refresh,
mis-paired subscriptions, and test-mode leakage.

**Scope.** Apply to any class that owns runtime state and is consumed by UI or
other systems — typically `*Manager`, `*Controller`, `*Service`, singletons, or
classes with `Init`/`InitializeAsync`/`async UniTask` setup.

**Prerequisites this rule assumes** (project-typical Unity 6 stack — adapt names
if your stack differs):
- `UniTask` for async (`Cysharp.Threading.Tasks`)
- A struct-based event bus (e.g. `EventBus.Publish<T>` where `T : struct`)
- A singleton base (e.g. `SingletonMonoBehaviour<T>`) that exposes `Instance`,
  `HasInstance`, and an internal `IsSingletonInitialized` flag

If a project uses different names, substitute — the rule logic still applies.

---

## Worked example (the bug this rule prevents)

```
T0  Scene loads.
T0  BoosterButtonView.OnEnable runs → calls BoosterManager.Instance.CanActivateBooster(...)
    → BoosterManager._isInitialized = false → returns false
    → button.interactable = false   ← SILENTLY DISABLED
T1  GameManager.Awake (async void) → await Init() → GameInitializer.InitializeOnceAsync
T2  BoosterManager.Init(...) finishes → _isInitialized = true
T?  Nothing tells the button to refresh. Button is stuck disabled.
```

The bug had three independent failures, each addressed by a rule below:
- **No lifecycle state** — Rule 1: `HasInstance` doesn't mean ready.
- **Async init had no completion signal** — Rule 2: must publish `XxxReadyEvent`.
- **UI conflated NotReady with Disabled** — Rule 4: 3-state view requirement.

---

## Rule 1 — Explicit Lifecycle State

A bool flag `_isInitialized` is not enough. Every system must expose **observable**
state, and the singleton's "exists" check must NOT be confused with "ready".

```csharp
public enum SystemState { NotReady, Initializing, Ready, ShuttingDown, Disposed }

public class XxxManager : SingletonMonoBehaviour<XxxManager>
{
    public SystemState State { get; private set; } = SystemState.NotReady;
    public bool IsReady => State == SystemState.Ready;
}
```

**Required:**
- Every public method that depends on init MUST guard with `IsReady`, NOT
  `_isInitialized` and NOT `HasInstance`.
- Guard log MUST include the actual `State` so post-mortem debugging works:
  ```csharp
  if (!IsReady) {
      Debug.LogWarning($"{LogTag} {nameof(MethodName)} rejected: state={State}");
      return false;
  }
  ```
- The base `SingletonMonoBehaviour<T>.IsSingletonInitialized` is a different
  concept — it tracks whether `base.Init()` ran. Do not conflate. Either:
  - (a) make your `Ready` state align with `IsSingletonInitialized` by calling
    `await base.Init()` and setting `State = Ready` in `OnInited()`, OR
  - (b) keep `Ready` independent and document why.

**Why this matters.** `BoosterManager.Init(...)` in this project is a separate
method that does NOT call `base.Init()`. So `IsSingletonInitialized` is false
forever, and the manager invented its own `_isInitialized` bool. Two parallel
init concepts in the same class is a smell. Pick one and stick to it.

---

## Rule 2 — Async Init Must Have a Completion Signal

If `Init()` does any `await`, it has an async lifetime. UI lifecycle is sync per
frame. They WILL race. The system must broadcast completion so UI can react.

**Three ways, pick at least one:**

```csharp
// (A) Event-bus broadcast — required if any UI consumer exists
public struct XxxReadyEvent { }   // events must be struct for the project's EventBus

// At end of Init() / InitializeAsync()
State = SystemState.Ready;
EventBus.Publish(new XxxReadyEvent());
```

```csharp
// (B) UniTask awaiter — required if any code path needs to "wait until ready"
private UniTaskCompletionSource _readyTcs;

public UniTask WaitForReadyAsync()
{
    if (IsReady) return UniTask.CompletedTask;
    _readyTcs ??= new UniTaskCompletionSource();
    return _readyTcs.Task;
}

// At end of Init():
State = SystemState.Ready;
_readyTcs?.TrySetResult();
```

```csharp
// (C) Re-broadcast existing state events — required regardless
// When initial data is loaded, fire the same events that subsequent state changes fire.
foreach (var item in _inventory)
{
    EventBus.Publish(new InventoryChangedEvent { Type = item.Key, Count = item.Value });
}
```

**Required combination:** (A) + (C) at minimum. (B) added when an `await` API is needed.

**Why this matters.** `BoosterInventoryData.Load()` populates inventory but
fires zero events. Buttons subscribed to `BoosterInventoryChangedEvent` get no
notification. (C) — re-broadcast on initial load — is non-negotiable.

---

## Rule 3 — Push/Pull Symmetry

If UI **pulls** any state via a method (`CanActivate`, `GetCount`, `IsUnlocked`,
`State`, etc.), the system MUST **push** an event for every change to that
state — including the initial NotReady → Ready transition.

**Mental model.**
> Every `public` getter or query method has a corresponding `xxxChanged` event.
> Initial-state-availability is the most common forgotten event.

**Audit method.** For each `public` query method on a system, ask:
1. What internal state does it read?
2. Where is that state assigned?
3. Does an event fire at every assignment site?
4. Including the initial assignment in `Init()`?

If any answer is "no" → add event publish at that assignment site.

---

## Rule 4 — UI Must Have Three Visual States

UI views consuming a system MUST distinguish three states explicitly. Never
collapse `NotReady` and `Disabled` into a single `interactable = false`.

| State | When | Visual | Interactable |
|---|---|---|---|
| **NotReady** | system loading / not yet init | Hidden, or loading spinner, or skeleton | No |
| **Disabled** | system ready but action blocked | Visible + reason overlay (locked, no inventory) | No |
| **Enabled** | system ready and action available | Visible + active style | Yes |

**Anti-pattern (this project's BoosterButtonView, line 119):**
```csharp
button.interactable = canActivate;   // collapses NotReady ↔ Disabled
```

**Correct:**
```csharp
if (!BoosterManager.HasInstance || !BoosterManager.Instance.IsReady)
{
    SetVisualState(ButtonVisualState.NotReady);   // hide or loading
    return;
}
SetVisualState(canActivate ? ButtonVisualState.Enabled : ButtonVisualState.Disabled);
```

**Why this matters.** "Button mysteriously not clickable" is one of the most
expensive QA bugs because it has no log signature. A loading spinner or hidden
state during NotReady gives QA a visible signal.

---

## Rule 5 — Event Subscription Symmetry

Subscriptions MUST be paired with the same-lifecycle counterpart. Mismatch
causes ghost handlers after disable/re-enable cycles.

| Subscribe in | Unsubscribe in | Use when |
|---|---|---|
| `OnEnable` | `OnDisable` | UI views, anything that may toggle |
| `Awake` | `OnDestroy` | Permanent runtime systems |
| `Start` | ❌ never use Start to subscribe — Start has no symmetric pair |

**Required:**
- `async void` event handlers are FORBIDDEN. Exceptions in `async void` are
  swallowed and crash silently.
  ```csharp
  // Wrong
  private async void OnClick() { await DoWork(); }

  // Right
  private void OnClick() => OnClickAsync().Forget();
  private async UniTaskVoid OnClickAsync()
  {
      try { await DoWork(); }
      catch (Exception e) { Debug.LogException(e); }
  }
  ```
- Subscribing during a publish is allowed (this project's EventBus defers
  subscribe/unsubscribe inside the publish loop) — but still pair it.
- This project's `EventBus.Subscribe<T>` already deduplicates via `Contains`.
  Don't rely on that — pair explicitly anyway.

---

## Rule 6 — `async void` on MonoBehaviour Lifecycle Methods

`async void Awake / Start / OnEnable / OnDisable / OnDestroy` is a hidden source
of race conditions because Unity treats these as fire-and-forget.

**This project currently has `async void Awake` on `GameManager`.** It's the root
cause of the BoosterButtonView race: `Awake` returns control to Unity before its
`await Init()` chain completes; other GameObjects' `OnEnable` then run with the
manager half-initialized.

**Required pattern:**

```csharp
// ❌ Don't
protected override async void Awake()
{
    base.Awake();
    await DoSlowInit();   // Awake returns to Unity here; everything else runs
}

// ✅ Do
public UniTask BootstrapTask { get; private set; }

protected override void Awake()
{
    base.Awake();
    BootstrapTask = BootstrapAsync();   // expose a handle consumers can await
}

private async UniTask BootstrapAsync()
{
    try
    {
        await DoSlowInit();
        State = SystemState.Ready;
        EventBus.Publish(new XxxReadyEvent());
    }
    catch (Exception e)
    {
        Debug.LogException(e);
        State = SystemState.NotReady;   // explicit failure state
    }
}
```

**Required:** any consumer that needs the manager during init must `await`
`BootstrapTask` or subscribe to `XxxReadyEvent`. Document this in CLAUDE.md.

---

## Rule 7 — Diagnostic Logging on Every Guard

Every guard / early-return / reject path MUST log a specific reason with
interpolated values. Silent `return false` is forbidden in any system code.

```csharp
// Wrong
if (!_isReady || !_isGameActive) return false;

// Right
if (!_isReady || !_isGameActive)
{
    Debug.LogWarning($"{LogTag} {nameof(CanActivate)} rejected: ready={_isReady}, active={_isGameActive}");
    return false;
}
```

**Required log format:**
- Prefix with `[SystemName]` — define `private const string LogTag = "[Xxx]"`.
- Include each field's name AND value.
- Severity: `LogWarning` for guard rejections (recoverable), `LogError` for
  invariant violations, `Log` for normal flow milestones (Init complete, etc.).

**Removable-debug logs.** Verbose logs added during diagnostics (like the ones
added to `CanActivateBooster` while debugging) MUST be either:
- Removed once the bug is fixed, OR
- Wrapped in `#if UNITY_EDITOR` if useful as a permanent dev aid.

Don't ship Console-spam to production.

---

## Rule 8 — Test Mode Hygiene

Test mode flags (e.g., `testMode = true` granting infinite resources) are
production hazards.

**Required:**
- `LogWarning` on every Init when test mode is true:
  ```csharp
  if (testMode)
      Debug.LogWarning($"{LogTag} TEST MODE — bypassing inventory checks. Disable before shipping.");
  ```
- Inspector header makes it obvious:
  ```csharp
  [Header("Debug — DISABLE BEFORE SHIPPING")]
  [SerializeField] private bool testMode;
  ```
- Add to project's pre-build checklist: grep all `testMode = true` /
  `cheatEnabled = true` flags.
- For hard cheats (give resource, skip level), wrap in `#if UNITY_EDITOR` so
  the binary can never have them.

---

## Rule 9 — MCP Wiring Validation

When AI uses MCP (Unity MCP tool) to wire `[SerializeField]` references,
GameObject references, or scene setup, AI MUST produce a **Wiring Report** as
part of the response. Without this, regressions sneak in invisibly.

**Wiring Report template:**

```
Wiring Report — XxxManager (Game.unity)
Serialized fields set:
  - boosterConfigs: [Assets/.../BoosterConfig_AutoSort.asset, ...]
  - testMode: false
  - button: BoosterPanel/AutoSortButton
Singleton accesses introduced:
  - BoosterManager.Instance accessed by: BoosterButtonView, GameInitializer
Event subscriptions added:
  - BoosterButtonView.OnEnable: subscribes BoosterInventoryChangedEvent, BoosterUnlockedEvent, BoosterActivatedEvent
  - All paired with OnDisable.
Init order touched:
  - GameManager.Awake → GameInitializer.InitializeOnceAsync → BoosterManager.Init(...)
```

**Required smoke test after wiring:**
1. Enter Play mode (read-only verification — do not commit).
2. Read Console for first 60 frames or until first user interaction.
3. Check for: `NullReferenceException`, "Not initialized" warnings, "is required"
   exceptions, missing component logs.
4. If any found → wiring is incomplete; do not declare done.

---

## Rule 10 — Init Order Must Be Documented

When ≥2 systems have init dependencies, document the order in project
`CLAUDE.md` under "Architecture invariants". Without this, AI re-wiring later
re-introduces race conditions.

**Required form:**

```markdown
## Init order (Game scene)
1. GameManager.Awake (sync part) — creates singleton, validates serialized refs
2. GameManager BootstrapTask (async) — runs in background:
   2a. SingletonMonoBehaviour.Init() — base ready flag
   2b. GameInitializer.InitializeOnceAsync():
       - InGameFactoryController.Init
       - LevelManager.InitializeAsync (Addressables)
       - BoosterManager.Init(gm, grill, tray, order) ← Ready signal here
   2c. Level data load
3. UI panels OnEnable — MUST subscribe to *ReadyEvents, not pull state directly
   until Ready
```

When changing init order, update this section in the same commit.

---

## Rule 11 — Pre-Implementation Checklist (BLOCKING)

Before writing any new system, AI MUST answer these 7 questions in the response.
This is not optional. Skipping it is what produces the silent race condition
bugs that this rule exists to prevent.

```
1. Lifecycle: What states does this system have? (NotReady → Initializing → Ready → ...)
2. Init kind: sync or async? If async, what does it await?
3. Ready signal: which XxxReadyEvent fires at completion?
   Which UI/systems subscribe to it?
4. State changes during runtime: which state fields are queryable from outside?
   For each, name the corresponding XxxChangedEvent.
5. Subscribers: who subscribes to which events? In which lifecycle method
   (OnEnable / Awake)? Where do they unsubscribe?
6. Failure modes: what guard rejections exist?
   What does each LogWarning include (state values, ids)?
7. MCP wiring impact: which prefabs / scene objects need [SerializeField] set?
   Which singletons does this system depend on at runtime (.Instance access)?
```

If AI cannot answer all 7 confidently, AI MUST ask the user before coding.

---

## Lifecycle Diagram

```
                ┌──────────────────────────┐
                │  Awake (sync portion)    │  base.Awake(); singleton claim
                │  CheckInstance(); refs ok│  ValidateRequiredReferences()
                └────────────┬─────────────┘
                             │
                             │ Awake completes — Unity runs other Awakes & OnEnables
                             ▼
                     ┌───────────────┐
                     │   NotReady    │   ← HasInstance=true, IsReady=false
                     └───────┬───────┘
                             │ BootstrapAsync starts
                             ▼
                  ┌──────────────────────┐
                  │    Initializing      │   ← await Addressables, await Init...
                  └──────────┬───────────┘
                             │ all awaits resolved
                             ▼
                     ┌───────────────┐    ▶  Publish XxxReadyEvent
                     │     Ready     │    ▶  TrySetResult on _readyTcs
                     └───────┬───────┘    ▶  Publish initial XxxChangedEvent for each state field
                             │
                             │ runtime state changes → publish XxxChangedEvent each time
                             │
                             ▼ OnDestroy or scene unload
                     ┌───────────────┐
                     │ ShuttingDown  │
                     └───────┬───────┘
                             ▼
                     ┌───────────────┐
                     │   Disposed    │
                     └───────────────┘
```

**UI consumer decision tree (any state-pull call):**

```
HasInstance == false       → not yet awoken; show NotReady visual
IsReady == false           → not yet initialized; show NotReady visual + subscribe ReadyEvent
IsReady == true            → pull value
  └─ value ok              → Enabled
  └─ value blocked         → Disabled with reason overlay
State == ShuttingDown/Disposed → unsubscribe and unbind
```

---

## Anti-Pattern Quick Reference

| Anti-pattern | Why bad | Fix |
|---|---|---|
| `bool _isInitialized;` only | No state visibility, no signal | `SystemState State` enum + `XxxReadyEvent` |
| `if (!_isInitialized) return false;` (silent) | No diagnostic on QA report | Log the field values |
| `button.interactable = canActivate;` (binary) | NotReady invisible to QA | 3-state visual (Rule 4) |
| `async void Awake` | Awake returns before init done | Expose `BootstrapTask` UniTask |
| `async void OnClick` | Exceptions swallowed | `OnClickAsync().Forget()` with try/catch |
| `Subscribe` in `Start` | No symmetric `OnStop` | Move to `OnEnable`/`OnDisable` |
| `Init()` re-defined alongside `base.Init()` | Two ready flags | Pick one — call `await base.Init()` or document divergence |
| `_inventory.Load()` without re-broadcast | UI never sees initial state | Publish `XxxChangedEvent` per item after load |
| `testMode = true` shipped | Production bypass | LogWarning + header + grep before build |
| MCP wires refs but no smoke test | Null refs at Play | Wiring Report + 60-frame Console scan |

---

## Summary cheat-sheet

| Rule | One-liner |
|---|---|
| 1  | Explicit `SystemState` enum + `IsReady`; never trust just `HasInstance` |
| 2  | Async init MUST publish `XxxReadyEvent` AND re-broadcast initial state |
| 3  | Every queryable state has a `XxxChangedEvent`, including init-done |
| 4  | UI distinguishes NotReady / Disabled / Enabled visually |
| 5  | Subscribe/unsubscribe paired same-lifecycle; no `async void` handlers |
| 6  | No `async void Awake/Start` — expose `BootstrapTask` UniTask handle |
| 7  | Every guard logs specific reason with field values (no silent `return false`) |
| 8  | Test mode warns loudly + inspector header + pre-build grep |
| 9  | MCP wiring produces a Wiring Report + 60-frame Play-mode smoke test |
| 10 | Init order documented in project CLAUDE.md, updated when changed |
| 11 | Answer 7 pre-implementation questions before coding any new system |

---

## Cross-references

- Project CLAUDE.md — section "Architecture invariants" should embed the Init
  order from Rule 10.
- Project commit-convention.md — log/diagnostic changes use scope `gameplay` or
  the system-specific scope (e.g. `boosters`).
- This rule file — review on every major refactor; add anti-patterns as they
  occur, with the bug they caused, in the Anti-Pattern table.
