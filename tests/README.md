# Test Infrastructure — Animal World Zoo

**Engine**: Unity 6.3 LTS (`6000.3.17f1`)
**Test Framework**: Unity Test Framework (NUnit) — `com.unity.test-framework` in `Packages/manifest.json`
**CI**: `.github/workflows/tests.yml`
**Setup date**: 2026-06-06

> ⚠️ **IMPORTANT — where Unity test code lives.** Unity only compiles and discovers
> scripts under **`Assets/`**. The runnable test assemblies therefore live at:
> - `Assets/Tests/EditMode/` — Edit Mode tests (what CI runs; what Unity Test Runner finds)
> - `Assets/Tests/PlayMode/` — Play Mode tests (add when integration tests are needed)
>
> This `tests/` directory at the repo root is the **studio-workflow** home: smoke-test
> checklist, manual evidence, and docs read by `/smoke-check`, `/qa-plan`, and `/gate-check`.
> The `.asmdef` templates here reference `AWZ.Domain`/`AWZ.Data` (not yet created) and are
> **copied into `Assets/Tests/` once those assemblies exist** — they are NOT compiled while
> outside `Assets/`.

## Directory Layout

```
tests/
  EditMode/       # Edit Mode unit tests — pure C# logic, no scene required
  PlayMode/       # Play Mode integration tests — require a game scene
  unit/           # Logical grouping docs / non-Unity test helpers
  integration/    # Integration test docs / cross-system specs
  smoke/          # Critical path test list for /smoke-check gate
  evidence/       # Screenshot logs and manual test sign-off records
```

## Running Tests (Unity Editor)

1. **Window → General → Test Runner**
2. Select **EditMode** tab → Run All (or Run Selected)
3. Select **PlayMode** tab → Run All (or Run Selected)

## Running Tests (Headless / CI)

```bash
# Edit Mode (headless, no graphics)
unity -batchmode -projectPath . -runTests -testPlatform editmode -testResults results-editmode.xml

# Play Mode (requires display or Xvfb on Linux)
unity -batchmode -projectPath . -runTests -testPlatform playmode -testResults results-playmode.xml
```

See `.github/workflows/tests.yml` for the full CI invocation via `game-ci/unity-test-runner@v4`.

## Test Naming Convention

```
Files:    [system]_[feature]_test.cs
Classes:  [System][Feature]Tests
Methods:  Test_[Scenario]_[ExpectedResult]
Example:  economy_goldpersec_test.cs → EconomyGoldPerSecTests → Test_VisitorsAtCap_GoldPerSecIsMax()
```

## Assembly Definitions

- `tests/EditMode/EditModeTests.asmdef` — references `AWZ.Domain`, `AWZ.Data`; Editor + Test platforms only
- `tests/PlayMode/PlayModeTests.asmdef` — references `AWZ.Runtime`; Test platforms + Player only

**Critical:** The `AWZ.Domain` assembly must have **no `UnityEngine` reference** (per ADR-0002).
Edit Mode tests for `AWZ.Domain` therefore compile without any engine dependency — true headless testing.

## Story Type → Test Evidence

| Story Type | Required Evidence | Location | Gate Level |
|---|---|---|---|
| **Logic** (formulas, state machines, services) | Automated unit test — must pass | `tests/EditMode/[system]/` | BLOCKING |
| **Integration** (multi-system, save/load) | Integration test OR documented playtest | `tests/PlayMode/[system]/` | BLOCKING |
| **Visual/Feel** (animation, VFX, feel) | Screenshot + lead sign-off | `tests/evidence/` | ADVISORY |
| **UI** (menus, HUD, screens) | Manual walkthrough doc OR interaction test | `tests/evidence/` | ADVISORY |
| **Config/Data** (balance tuning) | Smoke check pass | `production/qa/smoke-*.md` | ADVISORY |

## CI

Tests run automatically on every push to `main` and on every pull request.
A failed test suite blocks merging (enforced via branch protection).

**First-time CI setup:**
1. Obtain a Unity license (Personal, Pro, or Enterprise)
2. Add `UNITY_LICENSE`, `UNITY_EMAIL`, `UNITY_PASSWORD` as GitHub repository secrets
   (Settings → Secrets and variables → Actions)
3. Push to `main` — CI will trigger automatically
