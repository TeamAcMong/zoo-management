---
description: Avoid fallback patterns - log errors instead
paths:
  - "Assets/**/*.cs"
---

# No Fallback Pattern Rule

## Principle
**Never use fallback patterns when errors occur. Always log errors explicitly instead.**

## Guidelines

### DO NOT:
- Return default/null values silently when something fails
- Use fallback logic that hides errors
- Continue execution with alternative paths when the primary path fails
- Return empty collections/arrays as fallbacks
- Use default configs when the requested config is missing

### DO:
- Log explicit error messages using `Debug.LogError()` when operations fail
- Return `null` only if explicitly documented, and always log why
- Throw exceptions for critical failures if appropriate
- Make errors visible and traceable
- Fail fast rather than silently degrade

## Examples

### Bad - Silent Fallback:
```csharp
public CharacterDataConfig GetConfigByName(string name)
{
    foreach (var config in configs)
    {
        if (config.name == name) return config;
    }
    return configs[0]; // Silent fallback - hides the error
}
```

### Good - Explicit Error:
```csharp
public CharacterDataConfig GetConfigByName(string name)
{
    foreach (var config in configs)
    {
        if (config.name == name) return config;
    }
    Debug.LogError($"[CharacterConfigDatabase] Config '{name}' not found.");
    return null; // Explicit null with error logged
}
```

### Bad - Fallback with Alternative:
```csharp
public HazardEntity GetHazard(HazardDataConfig config)
{
    if (!_hazardPools.TryGetValue(config, out var pool))
    {
        return _hazardPools.Values.First(); // Fallback to first available
    }
    return pool.Get();
}
```

### Good - Explicit Error:
```csharp
public HazardEntity GetHazard(HazardDataConfig config)
{
    if (!_hazardPools.TryGetValue(config, out var pool))
    {
        Debug.LogError($"[LevelObjectPoolManager] No pool found for hazard config '{config.name}'. Make sure the config is in the HazardConfigDatabase.");
        return null; // Explicit error logged
    }
    return pool.Get();
}
```

## When to Use This Rule
- All error handling code
- Config retrieval methods
- Pool management methods
- Database query methods
- Factory creation methods
- Any method that might fail

## Exception
Only use fallbacks when:
- The fallback is explicitly documented as intended behavior
- The fallback is part of the business logic (not error handling)
- The code is in a try-catch block that handles the error appropriately
