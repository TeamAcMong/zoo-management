# Smoke Test: Critical Paths — Animal World Zoo

**Purpose:** Run these checks in under 15 minutes before any QA hand-off.
**Run via:** `/smoke-check` (which reads this file)
**Update:** Add new entries when new core systems are implemented.
**Engine:** Unity 6.3 LTS (`6000.3.17f1`), URP 2D, mobile portrait

---

## Core Stability (always run)

1. Project opens in Unity Editor without compile errors
2. Game builds for Android without errors (`Build Settings → Android → Build`)
3. Play Mode enters without NullReferenceException in the console
4. AppBootstrap initialises all services without error logs

## Foundation Layer (F1, F2, F3)

5. AnimalDatabase ScriptableObject loads 29 species; `AnimalDatabaseSO.Species.Length == 29`
6. TuningConfig ScriptableObject loads without null values
7. New-game defaults seed correctly: `Gold == 50`, `Gems == 10`, `XP == 0`, `Owned == ["rabbit"]`
8. *(F3 implemented)* Save writes `awz_save.json` to `persistentDataPath` on pause
9. *(F3 implemented)* Load restores save state with correct gold/xp/owned on fresh launch

## Core Gameplay (C1, C2, C3)

10. Feeding an animal decrements gold by the correct care cost
11. Feeding an animal grants +3 XP (checked via C3 LevelService)
12. goldPerSec formula: with 100 visitors, 0 attractions → result is 5 (TR-C2-005)
13. Zoo Level increases when XP crosses the LEVEL_XP threshold
14. Care-stat decay ticks at the wall-clock cadence (not frame-count based)

## Economy Chain (C2)

15. Enclosure upgrade cap enforced: `Upgrade()` returns false at encLv == 5 (ADR-0009)
16. Enrichment cap enforced: `AddEnrichment()` returns false at enrLv == 5 (ADR-0009)
17. Attraction level-gate enforced: `Build()` returns false if `level < unlockLevel` (ADR-0009)

## Quest Integrity (Fe6)

18. *(Fe6 implemented)* Claiming a quest twice rewards gold/XP exactly once (idempotency — ADR-0010)
19. *(Fe6 implemented)* Activity counter does NOT increment when activity is started then cancelled

## UI Smoke (P1–P7)

20. HUD top bar displays correct Gold, Gems, XP values
21. Bottom tab bar navigates between all 5 screens without crash
22. Care buttons appear and are tappable on the care screen
23. Species cards display in the Animals tab without null sprite errors

## Performance

24. No frame drops below 30fps over a 30-second session in the Editor Play Mode profiler
25. No continuous memory growth visible in the Memory Profiler over 60 seconds

---

## Updating This File

Add a new entry to the appropriate section when a new system is implemented.
Mark entries with `*(system implemented)*` until the system ships to production,
then remove the qualification — every entry should be runnable at any time.

**Never remove an entry that is passing.** Regression coverage grows; it never shrinks.
