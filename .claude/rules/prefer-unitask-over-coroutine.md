---
paths:
  - "Assets/**/*.cs"
---

# Prefer UniTask Over Coroutine Rule

## Principle
**Prefer UniTask (`Cysharp.Threading.Tasks`) over Unity Coroutines (`IEnumerator` + `StartCoroutine`) for any new asynchronous game code. Only use Coroutines when an existing system already exposes them or UniTask is genuinely unavailable in the project.**

## Guidelines

### DO NOT:
- Write new async logic with `IEnumerator` + `StartCoroutine` / `StopCoroutine` when UniTask is available
- Use `WaitForSeconds`, `WaitForEndOfFrame`, `WaitUntil`, `WaitWhile` in new code — prefer their `UniTask.Delay`, `UniTask.Yield`, `UniTask.WaitUntil`, `UniTask.WaitWhile` equivalents
- Cache `WaitForSeconds` instances as a perf workaround for new code (use `UniTask.Delay(...)` instead)
- Mix Coroutines and UniTask within the same flow without a clear reason

### DO:
- Use `async UniTaskVoid` for fire-and-forget, `async UniTask` for awaitable work
- Pass a `CancellationToken` (typically `this.GetCancellationTokenOnDestroy()`) and honor it instead of relying on `StopCoroutine`
- Replace coroutine waits with `await UniTask.Delay(TimeSpan.FromSeconds(x), cancellationToken: ct)`, `await UniTask.Yield(PlayerLoopTiming.Update, ct)`, `await UniTask.WaitUntil(() => predicate, cancellationToken: ct)`
- Use `UniTask.WhenAll` / `UniTask.WhenAny` for parallel async work — Coroutines have no clean equivalent
- Use `using Cysharp.Threading.Tasks;` at the top of new files that need async game flow

## Why This Rule Exists

**Performance:**
- Coroutines allocate an `IEnumerator` state machine and box yield values every frame
- `WaitForSeconds` allocates per call unless cached
- UniTask is allocation-free in the common path (struct-based)

**Correctness:**
- Cancellation: UniTask flows through `CancellationToken`. Coroutines rely on `StopCoroutine` / GameObject destruction and silently leak if the owner changes
- Exceptions: thrown inside a Coroutine are swallowed by Unity. UniTask propagates them to the awaiter
- Return values: Coroutines cannot return a value. UniTask can return `T`

**Composability:**
- `await` lets you sequence and parallelize async work cleanly. Coroutines force callback chains or nested coroutines
- UniTask integrates with `async`/`await`, `Task`, and Unity's player loop timings

## Examples

### Bad — Coroutine for new async work:
```csharp
public class EnemySpawner : MonoBehaviour
{
    void Start()
    {
        StartCoroutine(SpawnLoop());
    }

    IEnumerator SpawnLoop()
    {
        while (true)
        {
            SpawnOne();
            yield return new WaitForSeconds(2f); // allocates each call
        }
    }
}
```

### Good — UniTask:
```csharp
using Cysharp.Threading.Tasks;
using System;
using System.Threading;
using UnityEngine;

public class EnemySpawner : MonoBehaviour
{
    void Start()
    {
        SpawnLoop(this.GetCancellationTokenOnDestroy()).Forget();
    }

    async UniTaskVoid SpawnLoop(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            SpawnOne();
            await UniTask.Delay(TimeSpan.FromSeconds(2f), cancellationToken: ct);
        }
    }
}
```

### Bad — Coroutine that needs to return a value:
```csharp
IEnumerator LoadConfig(Action<ConfigData> onLoaded)
{
    var op = Addressables.LoadAssetAsync<ConfigData>("config");
    yield return op;
    onLoaded?.Invoke(op.Result);
}
```

### Good — UniTask with a real return value:
```csharp
async UniTask<ConfigData> LoadConfigAsync(CancellationToken ct)
{
    return await Addressables.LoadAssetAsync<ConfigData>("config").ToUniTask(cancellationToken: ct);
}
```

### Bad — `StopCoroutine` for cancellation:
```csharp
private Coroutine _running;
void Begin() { _running = StartCoroutine(Work()); }
void Stop()  { if (_running != null) StopCoroutine(_running); }
```

### Good — `CancellationTokenSource`:
```csharp
private CancellationTokenSource _cts;

void Begin()
{
    _cts?.Cancel();
    _cts = CancellationTokenSource.CreateLinkedTokenSource(this.GetCancellationTokenOnDestroy());
    Work(_cts.Token).Forget();
}

void Stop()
{
    _cts?.Cancel();
    _cts?.Dispose();
    _cts = null;
}

async UniTaskVoid Work(CancellationToken ct) { /* ... */ }
```

## Exception

Use Coroutines only when:
- The surrounding system already exposes a Coroutine API (e.g., a third-party plugin that takes `IEnumerator`)
- UniTask is genuinely not installed in the project (verify before assuming)
- Inside Editor scripts where UniTask integration is awkward and the code path is throwaway

In those cases, add a one-line comment explaining why a Coroutine was chosen.

## Migration Path

When touching existing Coroutine code:
1. Don't rewrite Coroutines for the sake of it — follow the surgical-changes rule
2. If you're adding a new branch to an existing async flow, write the new branch in UniTask and bridge with `.ToCoroutine()` / `.ToUniTask()` only at the boundary
3. If the file is being substantially rewritten anyway, convert the whole flow to UniTask in the same change