---
paths:
  - "Assets/**/*.cs"
---

# No Resources API Rule

## Principle
**DO NOT use Resources.Load/LoadAll/LoadAsync in game runtime code. Use ScriptableObject databases assigned in Inspector instead.**

## Guidelines

### DO NOT:
- Use `Resources.Load<T>("path")` in runtime code
- Use `Resources.LoadAll<T>("folder")` in game logic
- Use `Resources.LoadAsync<T>("path")` 
- Put assets in `Resources/` folder for runtime loading
- Use Resources API as a lazy way to avoid wiring dependencies

### DO:
- Create ScriptableObject databases (e.g., `ToyDatabase`, `EnemyDatabase`)
- Assign databases in Inspector via `[SerializeField]`
- Load all data into databases at edit-time or startup once
- Use database lookup methods (e.g., `GetToyById(string id)`)

## Why This Rule Exists

**Performance:**
- Resources.Load is slow (disk I/O every call)
- No control over when assets load
- Increases build size (everything in Resources/ is included)

**Maintainability:**
- Hard to track what assets are actually used
- No compile-time validation
- Difficult to refactor asset paths
- Can't see dependencies in Inspector

**Best Practice:**
- Database pattern is Unity's recommended approach
- Better for asset bundles and addressables later
- Clear dependency graph
- Type-safe with proper database methods

## Examples

### Bad - Resources.Load:
```csharp
public class EnemySpawner : MonoBehaviour
{
    void SpawnEnemy(string enemyId)
    {
        // BAD: Loads from disk every time
        EnemyData data = Resources.Load<EnemyData>($"Enemies/{enemyId}");
        Instantiate(data.prefab);
    }
}
```

### Good - Database Pattern:
```csharp
public class EnemySpawner : MonoBehaviour
{
    [SerializeField] private EnemyDatabase enemyDatabase; // Wired in Inspector
    
    void SpawnEnemy(string enemyId)
    {
        // GOOD: Fast lookup from pre-loaded database
        EnemyData data = enemyDatabase.GetEnemyById(enemyId);
        if (data != null) Instantiate(data.prefab);
    }
}
```

### Database Implementation:
```csharp
[CreateAssetMenu(fileName = "EnemyDatabase", menuName = "Game/Databases/Enemy Database")]
public class EnemyDatabase : ScriptableObject
{
    public EnemyData[] allEnemies; // Assigned in Inspector
    
    public EnemyData GetEnemyById(string enemyId)
    {
        foreach (var enemy in allEnemies)
        {
            if (enemy.enemyId == enemyId) return enemy;
        }
        Debug.LogError($"[EnemyDatabase] Enemy '{enemyId}' not found.");
        return null;
    }
}
```

## Exception

Only use Resources API when:
- Writing Editor tools/scripts (not runtime code)
- Loading Unity built-in resources (e.g., default materials)
- Prototyping (must be replaced before production)

## Migration Path

If you find `Resources.Load` in existing code:

1. Create a ScriptableObject database
2. Populate database array in Inspector
3. Wire database to the manager/spawner
4. Replace `Resources.Load` with `database.GetById()`
5. Move assets out of `Resources/` folder
