# Systems Index: Animal World Zoo

> **Status**: Approved
> **Created**: 2026-06-06
> **Last Updated**: 2026-06-06
> **Source Concept**: design/gdd/game-concept.md

---

## Overview

Animal World Zoo is a mobile-first browser idle zoo-builder structured around one
causal chain: animals create appeal → appeal draws visitors (capped by capacity) →
visitors spend gold at the gate. Its systems split into four clusters: **care** (the
daily ritual that keeps animals happy and appealing), **economy** (the appeal→gold
pipeline), **progression** (ZooLevel gates that pace content over months), and
**presentation** (the screen stack that wraps every gameplay system).

The game has no combat, no physics, and no procedural generation — it is a DOM +
CSS React app with deliberate idle-game pacing. All 26 systems are implemented or
partially implemented; this index formalises their design status and orders the GDD
authoring backlog.

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| F1 | Animal Database | Core | MVP | Designed | [design/gdd/animal-database.md](animal-database.md) | — |
| F2 | Currency System | Core | MVP | Implemented | — | — |
| F3 | Save / Load System | Persistence | MVP | **NOT Implemented** ⚠️ | [design/gdd/save-load.md](save-load.md) | — |
| C1 | Animal Care System | Gameplay | MVP | Implemented ⚠️ | [design/gdd/animal-care.md](animal-care.md) | F1, F2, F3 |
| C2 | Zoo Economy | Economy | MVP | Implemented | [design/gdd/zoo-economy.md](zoo-economy.md) | F1, F2, C1 |
| C3 | Zoo Level Progression | Progression | MVP | Implemented | [design/gdd/zoo-level.md](zoo-level.md) | F1, F3 |
| C4 | Taming System | Gameplay | MVP | Partial ⚠️ | [design/gdd/taming.md](taming.md) | F1, F3, C1 |
| Fe1 | Animal Collection | Gameplay | MVP | Implemented | [design/gdd/animal-collection.md](animal-collection.md) | C3, F1, F2, F3 |
| Fe2 | Habitat System | Gameplay | MVP | Implemented ⚠️ | [design/gdd/habitat-system.md](habitat-system.md) | Fe1, F2, F3, C3 |
| Fe3 | Enrichment System (inferred) | Gameplay | Vertical Slice | Implemented ⚠️ | [design/gdd/enrichment.md](enrichment.md) | Fe2, F2, Fe1 |
| Fe4 | Attractions System | Gameplay | MVP | Implemented ⚠️ | [design/gdd/attractions.md](attractions.md) | C3, F2, F3, C4 |
| Fe5 | Performance System | Gameplay | Alpha | Partial | — | Fe4, C4, F1, Fe1 |
| Fe6 | Quests / Missions | Progression | MVP | Partial ⚠️ | [design/gdd/quests-missions.md](quests-missions.md) | C1, C3, F3 |
| Fe7 | Idle / Offline Earnings | Economy | MVP | **Faked stub** ⚠️ | [design/gdd/idle-offline.md](idle-offline.md) | C2, F3, F2 |
| Fe8 | Reputation System (inferred) | Progression | Alpha | Data only | — | Fe4 |
| P1 | HUD / Live View | UI | MVP | Implemented | — | C2, F2, C3 |
| P2 | Zoo Map / Live Scene | UI | MVP | Implemented | — | Fe1, Fe2, C1 |
| P3 | Care Screen | UI | MVP | Implemented | — | C1, Fe1, C4 |
| P4 | Animals Screen | UI | MVP | Implemented | — | Fe1, Fe2, Fe3 |
| P5 | Attractions Screen | UI | MVP | Implemented | — | Fe4, Fe5, C4 |
| P6 | Quests Screen | UI | MVP | Implemented | — | Fe6 |
| P7 | Tutorial / FTUE | Meta | MVP | Implemented | — | C1, C2, C3, Fe1 |
| M2 | Monetization Shell | Economy | Alpha | Partial | — | F2, F3 |
| M1 | Live Events | Meta | Full Vision | Not Started | — | F2, C3, Fe6 |
| M3 | Photo Mode | Meta | Full Vision | Not Started | — | P2 |
| M4 | Friends / Gifting | Meta | Full Vision | Not Started | — | F2, F3 |

---

## Categories

| Category | Description | Systems in this game |
|----------|-------------|----------------------|
| **Core** | Foundation systems everything depends on | F1, F2 |
| **Persistence** | Save state and continuity | F3 |
| **Gameplay** | Systems that make the game fun | C1, C4, Fe1, Fe2, Fe3, Fe4, Fe5 |
| **Economy** | Resource creation and consumption | C2, Fe7, M2 |
| **Progression** | How the player grows over time | C3, Fe6, Fe8 |
| **UI** | Player-facing information displays | P1, P2, P3, P4, P5, P6 |
| **Meta** | Onboarding, events, social | P7, M1, M3, M4 |

---

## Priority Tiers

| Tier | Definition | Target Milestone |
|------|------------|-----------------|
| **MVP** | Required for the core loop to be playable | Launch — Biomes 0–4, Tiers 0–4 |
| **Vertical Slice** | Required for one complete, polished play session | Pre-launch QA |
| **Alpha** | Full mechanical scope, rough-but-present | Q1 post-launch |
| **Full Vision** | Content-complete features, seasonal systems | Q1–Q4 roadmap |

---

## Dependency Map

### Foundation Layer (no dependencies)

1. **F1 Animal Database** — single source of truth for all species data; cannot design any mechanic without knowing what an animal "is"
2. **F2 Currency System** — every action costs or earns a currency; must be defined before any care/build action can reference a cost
3. **F3 Save / Load System** — idle only works if state persists between sessions; technically foundational even though it has no upstream design deps

### Core Layer (depends on Foundation)

1. **C1 Animal Care System** ← F1, F2, F3 — stats, decay rates, actions; happiness is the output that feeds all downstream appeal
2. **C3 Zoo Level Progression** ← F1, F3 — XP accumulation and 92 level milestones; gates all content

### Core Layer — interactions

3. **C2 Zoo Economy** ← F1, F2, C1 — the appeal→visitors→gold chain; `happyMult` comes from C1; `baseAppeal` from F1
4. **C4 Taming System** ← F1, F3, C1 — trust meter per animal built through care; gates Petting Area and Performance Arena

### Feature Layer (depends on Core)

1. **Fe1 Animal Collection** ← C3, F1, F2, F3 — unlocking and adopting species; Zoo Level is the key gate
2. **Fe6 Quests / Missions** ← C1, C3, F3 — daily + weekly missions triggered by care actions and level milestones
3. **Fe7 Idle / Offline Earnings** ← C2, F3, F2 — projects the C2 rate forward over elapsed offline time

### Feature Layer — build systems

4. **Fe2 Habitat System** ← Fe1, F2, F3, C3 — biomes + enclosure upgrades (1→5 levels); the primary gold sink
5. **Fe4 Attractions System** ← C3, F2, F3, C4 — 5 attraction types; capacity and revenue multipliers
6. **Fe8 Reputation System** ← Fe4 — rep generated by shows/events; intended to multiply visitor count

### Feature Layer — depth systems

7. **Fe3 Enrichment System** ← Fe2, F2, Fe1 — per-animal enrichment level; +10%/level appeal bonus
8. **Fe5 Performance System** ← Fe4, C4, F1, Fe1 — trained performer animals; arena shows with cooldowns

### Presentation Layer (depends on Features)

1. **P1 HUD / Live View** ← C2, F2, C3
2. **P2 Zoo Map / Live Scene** ← Fe1, Fe2, C1
3. **P3 Care Screen** ← C1, Fe1, C4
4. **P4 Animals Screen** ← Fe1, Fe2, Fe3
5. **P5 Attractions Screen** ← Fe4, Fe5, C4
6. **P6 Quests Screen** ← Fe6
7. **P7 Tutorial / FTUE** ← C1, C2, C3, Fe1

### Polish / Meta Layer

1. **M2 Monetization Shell** ← F2, F3
2. **M1 Live Events** ← F2, C3, Fe6
3. **M3 Photo Mode** ← P2
4. **M4 Friends / Gifting** ← F2, F3

---

## Recommended Design Order

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|-------|--------|----------|-------|----------|-------------|
| 1 | F1 Animal Database | MVP | Foundation | systems-designer | S |
| 2 | F2 Currency System | MVP | Foundation | economy-designer | S |
| 3 | F3 Save / Load System | MVP | Foundation | gameplay-programmer | M |
| 4 | C1 Animal Care System | MVP | Core | game-designer + systems-designer | M |
| 5 | C3 Zoo Level Progression | MVP | Core | game-designer + economy-designer | M |
| 6 | **C2 Zoo Economy** ✅ | MVP | Core | economy-designer | *done* |
| 7 | C4 Taming System | MVP | Core | game-designer | S |
| 8 | Fe1 Animal Collection | MVP | Feature | game-designer | S |
| 9 | Fe2 Habitat System | MVP | Feature | game-designer + economy-designer | M |
| 10 | Fe3 Enrichment System | VS | Feature | game-designer | S |
| 11 | Fe4 Attractions System | MVP | Feature | game-designer + economy-designer | M |
| 12 | Fe6 Quests / Missions | MVP | Feature | game-designer | M |
| 13 | Fe7 Idle / Offline | MVP | Feature | systems-designer | S |
| 14 | Fe8 Reputation System | Alpha | Feature | economy-designer | S |
| 15 | Fe5 Performance System | Alpha | Feature | game-designer | L |
| 16 | P1 HUD / Live View | MVP | Presentation | ux-designer + ui-programmer | S |
| 17 | P2 Zoo Map / Live Scene | MVP | Presentation | ux-designer | S |
| 18 | P3 Care Screen | MVP | Presentation | ux-designer + ui-programmer | S |
| 19 | P4 Animals Screen | MVP | Presentation | ux-designer + ui-programmer | S |
| 20 | P5 Attractions Screen | MVP | Presentation | ux-designer + ui-programmer | S |
| 21 | P6 Quests Screen | MVP | Presentation | ux-designer | S |
| 22 | P7 Tutorial / FTUE | MVP | Presentation | ux-designer + game-designer | M |
| 23 | M2 Monetization Shell | Alpha | Meta | economy-designer | M |
| 24 | M1 Live Events | Full Vision | Meta | live-ops-designer + game-designer | L |
| 25 | M3 Photo Mode | Full Vision | Meta | ux-designer | S |
| 26 | M4 Friends / Gifting | Full Vision | Meta | game-designer | L |

*Effort: S = 1 session · M = 2–3 sessions · L = 4+ sessions*

---

## Circular Dependencies

**None found.** The only potential cycle is:

- C1 (care costs gold from C2) ↔ C2 (happiness from C1 feeds appeal)

This is a **runtime game loop**, not a design dependency. C1's happiness formula
only needs stat values (hunger, thirst, clean, happy) — it does not require C2
to be calculated first. C2's formula uses C1's happiness output as an input
multiplier. They can be designed and tested independently.

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| **F3 Save / Load** | Technical + **NOT BUILT** | ⚠️ **Discovered during F3 GDD authoring: F3 is NOT implemented — there are ZERO `localStorage` calls in `act/*.jsx`. Every session starts from hardcoded defaults; nothing persists.** The idle-zoo retention loop is therefore non-functional. Separately, the 5 MB cap is a future risk as content grows. The offline-earnings modal shows hardcoded fake numbers (no `closedAt` timestamp is saved). | **Implement F3 before any retention/alpha testing** using the versioned JSON format defined in `design/gdd/save-load.md`. Add a session-close timestamp so Fe7 Idle/Offline can be built. Write a migration layer keyed on `save_format_version`. |
| **Fe5 Performance System** | Design + Scope | Trained animal show mechanics (cooldowns, skill progression, audience engagement) are feature-rich and partially implemented. Risk of underspecifying and shipping a weak experience. | Write a full GDD before implementation resumes; limit scope to 2–3 show types at Alpha, expand post-launch. |
| **Fe8 Reputation System** | Design | `rep` currency is defined in data but the intent (star rating × visitors, or a separate visible meter, or hidden multiplier?) is unresolved. Wiring it incorrectly into C2 could break balance. | Resolve intent in GDD before wiring; run a balance simulation vs. the zoo-economy.md formulas. |
| **M1 Live Events** | Scope | Seasonal events require: an event scheduler, a separate token economy, event-specific mechanics (egg hatching, expedition maps, donation drives), and event shop. Building all four at once is high-risk. | Scope a minimal event framework first (single mechanic + token track), then extend. Do NOT build all four event types simultaneously. |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 26 |
| Design docs written | 13 |
| Design docs formally `/design-review`'d | 0 |
| Design docs user-approved | 13 (batch-approved 2026-06-06) |
| **MVP mechanical systems designed** | **12 / 12** ✅ (all Foundation / Core / Feature gameplay+economy+progression) |
| MVP Presentation systems designed | 0 / 7 (P1–P7 — UX specs, use `/ux-design`) |
| Vertical Slice systems designed | 1 / 1 ✅ (Fe3 Enrichment) |
| Alpha systems designed | 0 / 4 (Fe5, Fe8, M2, + ) |
| Full Vision systems designed | 0 / 3 (M1, M3, M4) |

**GDDs written**: F1, F2, F3, C1, C2, C3, C4, Fe1, Fe2, Fe3, Fe4, Fe6, Fe7.

> **⚠️ Reverse-documentation discovered ~25 code-vs-design gaps** across these
> systems (F3 unimplemented, offline faked, cost multipliers 2× high, missing
> level/enrichment/trust gate guards, etc.). They are consolidated and triaged in
> [`production/implementation-gaps.md`](../../production/implementation-gaps.md).
> Most "Implemented" statuses above carry a ⚠️ because the system runs but has a
> documented correctness or balance gap.

---

## Next Steps

- [x] Systems enumeration approved — 26 systems identified
- [x] Dependency map approved — no circular dependencies
- [x] Priority tiers approved
- [x] This systems index written
- [ ] Design **F1 Animal Database** GDD next (`/design-system F1`)
- [ ] Design **C1 Animal Care System** GDD (`/design-system C1`)
- [ ] Design **C3 Zoo Level Progression** GDD (`/design-system C3`)
- [ ] Run `/design-review design/gdd/zoo-economy.md` to formally validate C2
- [ ] Run `/gate-check systems-design` when all MVP GDDs are authored
