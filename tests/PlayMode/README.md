# Play Mode Tests

Play Mode tests run inside the Unity player with a full game scene loaded.
Use for cross-system interactions that require MonoBehaviour lifecycle,
coroutines, or the EventBus wiring between services.

**Use for:** Save/load round-trips, GameController command pipeline ordering,
offline accrual integration (Fe7 + F3), care-action→XP→level-up sequence (ADR-0003).

**Assembly:** `PlayModeTests.asmdef` (references `AWZ.Runtime`; Test platforms + Player only)

## Directory Structure

```
tests/PlayMode/
  PlayModeTests.asmdef
  integration/              ← cross-system tests (C1+C3, F3+Fe7, etc.)
```

## Writing a Play Mode Test

```csharp
using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using AWZ.Runtime;

[TestFixture]
public class SaveLoadRoundTrip_Test {
    [UnityTest]
    public IEnumerator Test_SaveThenLoad_GoldIsPreserved() {
        // Arrange: build a GameState with known gold
        var state = new GameState { Gold = 1234 };
        // Act: save then load
        var saveService = new SaveService();
        saveService.Save(state);
        yield return null;  // wait one frame
        var loaded = saveService.Load();
        // Assert
        Assert.AreEqual(1234, loaded.Gold);
    }
}
```

## Rules

- Play Mode tests are slower — reserve them for integration scenarios that truly
  need the full runtime (coroutines, `OnApplicationPause`, EventBus wiring)
- Each test should build its own scene state via code — do not depend on a specific
  scene file existing in the project
- Target: Play Mode test suite completes in under 60 seconds (fast feedback loop)
