---
paths:
  - "Assets/**/*.cs"
---

# Unity Hot-Path Performance Rule

**Purpose.** Catch the recurring class of bugs where an expensive call sits in a
per-frame method and silently bleeds CPU / GC every frame. These don't crash and
rarely show up until you profile on device — by then they're spread across a dozen
renderers. This rule makes the audit mechanical.

**Apply when:**
- Writing or reviewing any MonoBehaviour with `Update` / `LateUpdate` /
  `FixedUpdate` / `OnGUI` / `OnWillRenderObject` / `OnRenderObject`, a coroutine
  `while(true)` loop, or a method called once-per-frame from one of those.
- The user reports low FPS, frame spikes, GC hitches, or asks to "check hot path".
- Before merging a new renderer/controller that runs every frame.

**Hot path = anything reached every frame.** Note that frame-guarded helpers
(`if (_frame == Time.frameCount) return;`) and property getters that call a
per-frame `Recompute()` ARE hot path — trace the call graph, don't trust the
method name.

---

## The catalog — flag every one of these inside a hot path

| Pattern | Cost | Fix |
|---|---|---|
| `Camera.main` | tagged scene scan **+ GC alloc** every call | cache `Camera _cam; if (_cam == null) _cam = Camera.main;` then use `_cam` |
| `GameObject.Find` / `FindObjectOfType` / `FindAnyObjectByType` / `FindObjectsByType` / `transform.Find` | scene/hierarchy scan (some alloc arrays) | resolve once in `Awake`/`Start`, cache the reference |
| `GetComponent*` (esp. `GetComponentsInChildren`) | reflection-ish lookup; the plural form **allocs an array** | cache in `Awake`; for plural cache the array too |
| LINQ (`.Where/.Select/.ToList/.ToArray/.OrderBy/.Any/.First`) | allocates iterators + result collections every frame | hand-write the loop; reuse a preallocated buffer |
| Allocation: `new` class/array/`List`, `$"..."`, `string +`, `.ToString()`, `string.Format` | GC garbage → periodic GC hitch (worse on mobile) | precompute strings once; avoid per-frame `new`; pass `Span`/cached buffers |
| `Material.SetFloat("_X", …)` / `SetColor`/`SetVector`/`SetMatrix` with a **string** key | hashes string→int every call (CPU; **not** GC) | `static readonly int XId = Shader.PropertyToID("_X");` and pass the int |
| `renderer.material` (instance accessor) | **clones** the material → leak + breaks shared refs | use `sharedMaterial`, or a `MaterialPropertyBlock` for per-instance values |
| `TMP_Text.text = …` / `SetText` when the value didn't change | rebuilds the text mesh (expensive) | set once on build; per-frame only change transform/color/alpha, not text |
| `Debug.Log*` | string format + IO every frame | remove, or gate behind `#if UNITY_EDITOR` / a verbose flag |
| boxing (`object`, `struct`→interface, `enum` in `Dictionary` w/o comparer) | hidden GC | use generic APIs / `IEqualityComparer<TEnum>` |

**Reusable audit recipe** (run from the Unity project's `Assets` root):

```bash
# 1. List per-frame entry points
grep -rln --include='*.cs' -E "void (Update|LateUpdate|FixedUpdate|OnGUI)[[:space:]]*\(" .

# 2. Heavy patterns (then confirm each hit is INSIDE a per-frame method/call-graph)
grep -rn --include='*.cs' -E "Camera\.main|FindObjectOfType|FindAnyObjectByType|FindObjectsByType|GameObject\.Find|transform\.Find" .
grep -rn --include='*.cs' -E "using System\.Linq|\.ToList\(|\.ToArray\(|\.Where\(|\.Select\(|\.OrderBy\(|\.Any\(|\.First" .
grep -rn --include='*.cs' -E "Set(Float|Color|Vector|Matrix|Int|Texture)\(\"" .
grep -rn --include='*.cs' -E "\\\$\"|\.ToString\(|Instantiate\(|\.material[^P]|\.SetText\(|\.text[[:space:]]*="
```

A grep hit is **only** a finding if it sits in a hot path. Confirm by reading the
enclosing method (or its callers). One-time `Start`/`Awake`/build-loop hits are fine —
do not "fix" them.

---

## Worked example (the bug this rule was written for — SkyView, 2026-06)

Profiler: `CPU main 32.7ms / render 2.3ms / GPU 7.4ms`, Batches 58, SetPass 38.
CPU Hierarchy showed `PlayerLoop` = **1.6%** with `FindMainCamera` + `GC.Alloc 4.1KB`
under `SolarSystemRenderer`. `Camera.main` in `Update()` was called every frame by
**8 different renderers** (SolarSystem, ConstellationLabels, BrightStarLabels,
Cardinal, ConstellationLines, ConstellationArt, plus frame-guarded ConstellationFocus
& ZoomLevelState). Each = a tagged scene scan + array alloc.

Fix applied uniformly:
```csharp
Camera _cam;                                  // field
...
if (_cam == null) _cam = Camera.main;          // hot path: resolve once, survives null
var cam = _cam;
```

**Two lessons bigger than "Camera.main is slow":**
1. **Inconsistency is the real bug.** The canonical cached pattern already existed in
   `BelowHorizonRevealController` — it just wasn't applied everywhere. When a repo has
   a correct pattern/helper, every call-site must follow it. Grep for the anti-pattern
   across the WHOLE repo, not just the file you're touching.
2. **String shader setters are CPU, not GC — don't conflate.** `SetFloat("_X")` hashes
   a string (cheap-ish CPU); `Camera.main` allocates (GC). The Profiler's GC Alloc
   column is the arbiter, not intuition. Fix the GC source first.

---

## Calibration — severity & when NOT to worry

- **[major]** per-frame GC allocation (Camera.main, LINQ, `new`, `$""`, `.material`
  clone, per-frame `SetText`) → compounds into GC hitches, worst on mobile.
- **[minor]** per-frame string→ID shader-setter hashing, redundant transform math.
- **Not a finding:** a heavy call gated behind a flag that's off in production
  (`if (isRuntimeUpdate) PushAllUniforms()`), or a frame-cached compute that runs once.

**Frame budget context matters.** If the project caps FPS for battery
(`Application.targetFrameRate`), the headline "CPU main ≈ frame time" is mostly
`WaitForTargetFPS` **idle**, not work — see the project's render-frequency controller.
Optimize the *busy* time (real work minus the wait) and the *spikes*, not the baseline.
A capped, idle-bound frame is not a performance bug.

**Always confirm with the Profiler, not by eye:** open CPU → Hierarchy, sort by
**Self ms** and check the **GC Alloc** column on a representative + a spike frame.
Editor numbers are inflated (Editor loop, no IL2CPP, Deep Profile) — measure on device
for absolute figures.

---

## Cross-references

- `~/.claude/rules/unity-system-design.md` — lifecycle/init-order rules (subscriptions,
  async init); this file is the per-frame-cost companion.
- `~/.claude/rules/code-review-strictness.md` — severity tags + 4-field issue format
  to use when reporting hot-path findings.
