---
description: Do not automatically find components in Awake() or Start(). If setup is missing, it should be a bug, not covered by fallback logic. Use OnValidate() for setup validation in Editor.
paths:
  - "Assets/**/*.cs"
---

# No Auto Component Lookup Rule

## Principle
**DO NOT automatically find components in Awake() or Start() using GetComponent(). If setup is missing, it must be a bug, not covered by fallback logic. Use OnValidate() for setup validation in Editor.**

## Guidelines

### DO NOT:
- Automatically find components in Awake()/Start() if field is null
- Use GetComponent() as fallback when field is not assigned
- Cover missing setup with auto-lookup logic
- Put setup validation in Awake() or Start()

### MUST:
- Require components to be assigned in Inspector or via Initialize()
- Log clear errors if component is null (following No Fallback Pattern Rule)
- Fail fast instead of automatically finding
- Put setup validation in OnValidate() for Editor-time checks
- Use Awake()/Start() only for runtime initialization, not validation

## Examples

### Bad - Auto Lookup in Awake:
```csharp
private void Awake()
{
    if (characterEntity == null)
    {
        characterEntity = GetComponent<CharacterEntity>();
    }

    if (characterCollider == null && characterEntity != null)
    {
        characterCollider = characterEntity.Collider2d;
    }

    if (characterCollider == null)
    {
        characterCollider = GetComponent<Collider2D>();
    }
}
```

### Bad - Validation in Awake:
```csharp
private void Awake()
{
    if (characterEntity == null)
    {
        Debug.LogError("[Component] CharacterEntity is not assigned.");
        return;
    }
}
```

### Good - Validation in OnValidate:
```csharp
#if UNITY_EDITOR
private void OnValidate()
{
    if (!Application.isPlaying)
    {
        if (characterEntity == null)
        {
            Debug.LogWarning("[PlatformCollisionHandler] CharacterEntity is not assigned. Please assign it in Inspector or call Initialize() method.");
        }

        if (characterCollider == null && characterEntity != null)
        {
            characterCollider = characterEntity.Collider2d;
        }

        if (characterCollider == null)
        {
            Debug.LogWarning("[PlatformCollisionHandler] CharacterEntity.Collider2d is null. CharacterEntity must have a Collider2D component.");
        }
    }
}
#endif

private void Awake()
{
    // Runtime initialization only - no validation here
    // Components should already be validated in OnValidate() or assigned via Initialize()
    if (characterEntity == null)
    {
        Debug.LogError("[PlatformCollisionHandler] CharacterEntity is not assigned. Please assign it in Inspector or call Initialize() method.");
        return;
    }

    if (characterCollider == null)
    {
        characterCollider = characterEntity.Collider2d;
    }

    if (characterCollider == null)
    {
        Debug.LogError("[PlatformCollisionHandler] CharacterEntity.Collider2d is null. CharacterEntity must have a Collider2D component.");
        return;
    }
}
```

## Rationale
- Auto lookup hides setup errors
- Hard to debug when components are not assigned correctly
- Fail fast helps detect bugs earlier
- Code is clearer about dependencies
- OnValidate() runs in Editor, catching setup errors before Play mode
- OnValidate() helps catch missing references immediately when values change in Inspector

## Exception
Only use GetComponent() when:
- Component is created dynamically (runtime creation)
- Component is optional and has explicit null check with error logging
- There is a clear Initialize() method for setup

## OnValidate() Best Practices
- Use `#if UNITY_EDITOR` to ensure it only runs in Editor
- Check `!Application.isPlaying` to avoid validation during runtime
- Use `Debug.LogWarning()` for Editor-time validation (not errors)
- Use `Debug.LogError()` in Awake()/Start() for runtime validation (fail fast)
