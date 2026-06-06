# ADR-0004: Save/Load Format, Location & Migration

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, economy-designer (advisory)

## Summary
Persist the full game state as a **versioned JSON blob** written to a file under
`Application.persistentDataPath`, with a forward-only migration chain keyed on a schema
`version` field and a `closedAt` UTC timestamp. This implements F3 (the unbuilt "keystone"
system) and unblocks offline accrual.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Core / Persistence |
| **Knowledge Risk** | MEDIUM — `persistentDataPath` semantics differ on WebGL (IndexedDB) |
| **References Consulted** | `docs/engine-reference/unity/VERSION.md`; Unity persistence docs |
| **Post-Cutoff APIs Used** | None core; WebGL IndexedDB sync behavior must be verified |
| **Verification Required** | WebGL flush-on-close writes durably (QQ-05); quota/corrupt handling |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002, ADR-0003 |
| **Enables** | ADR-0005 (offline needs closedAt); Fe7, taming persistence, quest persistence |
| **Blocks** | Any retention/alpha testing |
| **Ordering Note** | F3 is the keystone — implement before decay/offline/taming go live. |

## Context
### Problem Statement
The review (D-B2) found F3 has **zero persistence code** — every "months-long" system resets on
restart and offline earnings are faked. Persistence must exist before any retention loop is real.

### Current State
Prototype kept all state in React hooks; nothing written to `localStorage`. Designed schema
exists in `save-load.md` but is unimplemented.

### Constraints
- WebGL: `persistentDataPath` is backed by IndexedDB; writes flush asynchronously.
- Mobile: app can be backgrounded/killed without `OnApplicationQuit` → must flush on pause.
- Save blob is small (~6 KB worst case) → no need for binary/Addressables.

### Requirements
- Single save slot; load-on-boot with no flash of defaults; debounced save on change + flush on close.
- Schema versioning + migration; corrupt/missing/quota/private-mode fallbacks (never crash).
- Persist `closedAt` (UTC) so Fe7 can compute elapsed offline time.

## Decision
- **Format:** JSON. **Location:** `Path.Combine(Application.persistentDataPath, "awz_save.json")`.
- **Schema:** top-level `version` int; fields = full GameState (gold, gems, tokens, reputation, xp,
  owned[], meters{}, pops{}, encLv{}, enrLv{}, built[], chapterIdx, serviceIdx, counts{}, claimed[],
  tutStep, vip, soundOn, **closedAt**).
- **Save trigger:** debounce 300 ms on `StateChanged`; **flush immediately** on `OnApplicationPause(true)`,
  focus loss, and `OnApplicationQuit`, stamping `closedAt = DateTime.UtcNow`.
- **Load trigger:** once in `AppBootstrap` before first frame → `GameState` (or defaults).
- **Migration:** `while (blob.version < CURRENT) blob = MIGRATIONS[blob.version](blob)`; each migration a pure function.
- **Fallbacks:** parse error/`version > CURRENT` → back up bad file, start fresh + toast; quota/`IOException`/private-mode → memory-only mode + one-time banner.
- Serializer: Unity `JsonUtility` if sufficient, else Newtonsoft.Json (added to Allowed Libraries when integrated).

### Key Interfaces
```csharp
public interface ISaveService {
    GameState Load();                              // defaults on missing/corrupt; never throws to caller
    void Save(GameState s);                        // debounced by caller
    void Flush(GameState s, DateTime closedAtUtc); // synchronous best-effort on close
    void Wipe();
    int SchemaVersion { get; }                     // CURRENT = 1
}
delegate JObject Migration(JObject blob);          // MIGRATIONS[v]: v → v+1
```

### Implementation Guidelines
- Never read defaults into UI then overwrite — load fully before activating screens (no flash).
- On WebGL, after writing call `JS_FileSystem_Sync` (Unity auto-syncs on file close; verify in spike).
- Keep migrations append-only; bump `CURRENT` and write `v(N)→v(N+1)` whenever the shape changes.

## Alternatives Considered
### Alternative 1: PlayerPrefs
- **Pros:** trivial.
- **Cons:** key-value, not a structured blob; size/format limits; poor for nested state.
- **Rejection Reason:** wrong tool for a 16+ field structured save.
### Alternative 2: Binary serialization
- **Pros:** compact.
- **Cons:** opaque, harder to migrate/debug; needless at ~6 KB.
- **Rejection Reason:** JSON is debuggable and migration-friendly at negligible size cost.

## Consequences
### Positive
- Real persistence → enables retention, offline, taming, quests; debuggable, migratable.
### Negative
- WebGL durability needs a verification spike; must handle flush-on-pause carefully.
### Neutral
- One save slot for MVP (multi-slot/cloud deferred).

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| WebGL write not flushed before tab close | Medium | High | flush on pause/visibilitychange; spike validation |
| Save corruption | Low | High | backup-bad-file + fresh start + toast |

## Validation Criteria
- [ ] State survives quit/relaunch on Android and WebGL with no flash of defaults.
- [ ] Corrupt file → fresh start + toast, no crash. Migration v0→v1 unit-tested.
- [ ] `closedAt` is present and correct after a close.

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/save-load.md` | F3 | versioned JSON, single slot, migration, fallbacks | JSON @ persistentDataPath + migration chain + fallbacks |
| `design/gdd/idle-offline.md` | Fe7 | needs `closedAt` to compute elapsed | `closedAt` stamped on flush |
| `design/gdd/taming.md` | C4 | per-animal trust must persist | trust in `meters{}` persisted |

## Related
- ADR-0003 (save on StateChanged), ADR-0005 (offline uses closedAt), architecture QQ-05.
