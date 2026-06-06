# Edit Mode Tests

Edit Mode tests run without entering Play Mode — no scene, no MonoBehaviour lifecycle.
They are the fastest and most reliable tests in the project.

**Use for:** Pure domain logic — economy formulas (C2), level curve (C3), care-stat math (C1),
cost gates (Fe2/Fe3/Fe4), quest claim idempotency (Fe6), save/migration (F3).

**Assembly:** `EditModeTests.asmdef` (references `AWZ.Domain`, `AWZ.Data`; Editor + Test platforms only)

## Directory Structure

```
tests/EditMode/
  EditModeTests.asmdef
  SampleTest/
    EconomyFormulas_GoldPerSec_Test.cs    ← working example
  economy/                                ← C2 economy formula tests
  care/                                   ← C1 care/decay tests
  level/                                  ← C3 XP curve tests
  currency/                               ← F2 pay/grant tests
  collection/                             ← Fe1 unlock/buy-more tests
  habitat/                                ← Fe2 enclosure cap tests
  enrichment/                             ← Fe3 enrichment cap tests
  attractions/                            ← Fe4 level-gate tests
  quests/                                 ← Fe6 claim idempotency tests
  save/                                   ← F3 migration tests
```

## Writing a Test

```csharp
using NUnit.Framework;
using AWZ.Domain;  // no UnityEngine reference needed

[TestFixture]
public class MySystemTests {
    [Test]
    public void Test_[Scenario]_[ExpectedResult]() {
        // Arrange
        var service = new MyService(new TuningStub());
        // Act
        var result = service.DoThing(input);
        // Assert
        Assert.AreEqual(expected, result);
    }
}
```

## Rules

- No `UnityEngine` imports (AWZ.Domain has no engine reference per ADR-0002)
- Each test sets up and tears down its own state — no shared mutable state between tests
- No random seeds, no time-dependent assertions — tests must be deterministic
- Use constant files or factory functions for test data; no inline magic numbers
  (exception: boundary value tests where the exact number IS the point)
