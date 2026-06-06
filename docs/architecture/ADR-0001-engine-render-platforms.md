# ADR-0001: Engine, Render Pipeline & Target Platforms

## Status
Accepted

## Date
2026-06-06

## Last Verified
2026-06-06

## Decision Makers
technical-director, project owner

## Summary
Animal World Zoo ships as a **Unity 6.3 LTS (`6000.3.17f1`) 2D** app using **URP 2D**,
targeting **Mobile (iOS/Android) primary + WebGL**. This supersedes the React/Babel/DOM
prototype, which is retained only as a feel/rules reference.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Unity 6.3 LTS (`6000.3.17f1`) |
| **Domain** | Core / Rendering / Scripting |
| **Knowledge Risk** | HIGH — Unity 6 line is post-LLM-cutoff (May 2025) |
| **References Consulted** | `docs/engine-reference/unity/VERSION.md`, `current-best-practices.md`, `modules/rendering.md` |
| **Post-Cutoff APIs Used** | URP 2D Renderer (Unity 6); no RenderGraph custom passes |
| **Verification Required** | WebGL build size + load time on target; URP 2D lighting on low-end mobile |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007, ADR-0008 |
| **Blocks** | All implementation epics |
| **Ordering Note** | First ADR — every other decision assumes this engine/platform target. |

## Context
### Problem Statement
The project must commit to a single shipping engine/platform before any code is written.
A React/DOM prototype exists, but the owner has chosen Unity 2D as the shipping target.
Not deciding leaves all downstream ADRs (UI, save, time model) unanchored.

### Current State
Playable React 18 + Babel-standalone prototype in `act/*.jsx` (DOM/CSS). Unity scaffolding
(`Packages/`, `ProjectSettings/`) already committed at 6.3 LTS, no `Assets/` yet.

### Constraints
- Mobile-first (touch, portrait, low-end devices) → rules out heavy 3D pipelines.
- Single-player, ~29 species, idle/management → no need for DOTS, Netcode, large-scale rendering.
- Unity 6 is post-cutoff → all API choices must be checked against the engine reference.

### Requirements
- 2D rendering, UI-heavy, 60 fps on mid-tier mobile.
- Cross-platform deploy (mobile stores + WebGL build for reach).
- Use production-ready Unity 6 defaults, avoid deprecated subsystems.

## Decision
Target **Unity 6.3 LTS `6000.3.17f1`, 2D**, with:
- **Render pipeline:** Universal Render Pipeline (URP) **2D Renderer** (Built-in is deprecated; HDRP is overkill).
- **Platforms:** iOS + Android primary; WebGL secondary (reuses the prototype's web reach).
- **No** DOTS/ECS, Netcode, VFX Graph, Cinemachine — none are needed at this scale.
- `ProjectSettings/ProjectVersion.txt` pinned to `6000.3.17f1 (cf0352b38e81)`.

### Architecture
```
Unity 6.3 LTS (6000.3.17f1)
  └─ URP 2D Renderer ── Sprites + UI Toolkit
       └─ Player targets: Android · iOS · WebGL
```

### Implementation Guidelines
- Create the project with the 2D (URP) template. Keep a single URP asset tuned for mobile.
- Do not add DOTS/Netcode packages. Add Input System + (built-in) UI Toolkit only.
- WebGL: enable compression, watch heap size; validate `persistentDataPath` (see ADR-0004 / QQ-05).

## Alternatives Considered
### Alternative 1: Stay on React/web
- **Pros:** prototype already works; instant web deploy.
- **Cons:** owner wants native mobile store presence, Unity tooling, C# ecosystem.
- **Rejection Reason:** explicit owner decision to ship on Unity 2D.

### Alternative 2: Godot 4 (2D)
- **Pros:** lighter, best-in-class 2D, free.
- **Cons:** owner has committed to Unity; Unity scaffolding + engine-reference already in repo.
- **Rejection Reason:** owner choice; Unity reference library already maintained.

## Consequences
### Positive
- Native mobile + WebGL from one codebase; mature C# tooling; data-driven via ScriptableObjects.
### Negative
- Unity 6 is post-cutoff → ongoing need to verify APIs against the reference library.
- Full reimplementation of prototype mechanics in C#.
### Neutral
- React prototype becomes reference-only.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| WebGL persistence quirks (IndexedDB) | Medium | Medium | spike in ADR-0004; memory-only fallback |
| Post-cutoff API drift | Medium | Low | engine-reference checks per ADR |

## Validation Criteria
- [ ] Empty 2D URP project opens in `6000.3.17f1` and builds for Android + WebGL.
- [ ] 60 fps on a mid-tier reference device with a representative UI screen.

## GDD Requirements Addressed
Foundational — no single GDD requirement. Enables every system: all 13 GDDs assume a 2D,
touch-first, single-player client with local persistence, which this engine/platform choice provides.

## Related
- `docs/architecture/architecture.md` (Engine Knowledge Gap Summary, QQ-01/QQ-05)
