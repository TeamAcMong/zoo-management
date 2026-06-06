# Interaction Pattern Library — Animal World Zoo (Unity 2D)

> **Status:** Seed (2026-06-06) · **Platform:** Unity 6.3 LTS, mobile-first (touch) + WebGL,
> **UI:** UI Toolkit (UXML/USS). Authored by `/ux-design`. Validate with `/ux-review`.
> The React prototype's screens are the *visual reference*; patterns below are the Unity contract.

## 1. Input model

- **Primary input:** single-finger **tap** (and pointer click on WebGL/desktop). No hover-only affordances.
- **Touch targets:** minimum **44×44 pt** (≈ 9 mm); spacing ≥ 8 pt between adjacent targets.
- **No gestures required** for core loop. Optional: vertical scroll for lists; pinch/zoom NOT required.
- **Input routing:** UI Toolkit handles UI element events (`clicked`, `RegisterCallback`). The Input
  System package handles any world-space taps (e.g. tapping an animal sprite on the Zoo Map P2).

## 2. Core interaction patterns

| Pattern | Where | Behaviour | Feedback |
|---|---|---|---|
| **Care tap** | P3 Care, P2 Map | Tap a care button (Feed/Water/Bathe/Play/Heal) | Button press state → meter bar animates → +XP toast micro; disabled state if stat≥98 or gold<cost |
| **Adopt / Buy-more** | P4 Animals | Tap species card → confirm modal → confirm | Cost shown pre-confirm; success toast + new card; gated cards show "Reach Lv N" / "Need X 🪙" |
| **Build / Upgrade / Enrich** | P4/P5 | Tap action → cost check → apply | Cost label = exact deduction; cap-reached & level-gated buttons are visibly disabled, not hidden |
| **Collect gate income** | P1 HUD | Passive accrual; tap "Collect" only for offline modal | Number roll-up animation; never blocks play |
| **Quest claim** | P6 Quests | Tap "Claim" when objective met | One-time; button → claimed state; reward toast (idempotent per ADR-0010) |
| **Tab navigation** | Global | Bottom tab bar switches P1–P6 | Active tab highlighted; preserves per-screen scroll |

## 3. Feedback & state conventions

- **Every tap gives immediate visual feedback** within 100 ms (press state), even if the result is rejection.
- **Affordance states:** default · pressed · disabled · gated (locked w/ reason) · loading. Gated ≠ hidden —
  show the requirement so the player has a goal (supports the "collection" pillar).
- **Toasts:** transient (≈1.7 s), non-blocking, bottom-anchored; used for +XP, level-up, purchase, errors.
- **Modals:** used only for confirm-spend, offline-collect, level-up reveal, and adoption naming. Dismissable
  by backdrop tap except the offline-collect (requires explicit Collect, per `idle-offline.md`).
- **Numbers:** abbreviate large values (1.2K, 3.4M); currency icons always adjacent.

## 4. Navigation map

```
[Bottom Tab Bar]  P1 HUD(overlay) ─ P2 Map ─ P3 Care ─ P4 Animals ─ P5 Attractions ─ P6 Quests
P7 Tutorial = guided overlay on first run, drives focus + spotlight on the relevant control.
```
- Back/Android-back: closes the topmost modal; on a root tab, prompts exit (WebGL: no-op).
- Deep state (e.g. an enclosure) is a push within its tab, not a new tab.

## 5. Timing & motion

- Target 60 fps; transitions 150–250 ms ease-out. Respect "reduce motion" (see accessibility).
- Meter changes animate ≤ 300 ms; income roll-ups ≤ 1 s.
- No animation blocks input — taps are always accepted.

## 6. UI Toolkit implementation notes

- One `UIDocument` + screen controller per view (`AWZ.UI`); shared USS theme for tokens (color/space/type).
- Use USS classes for state (`.is-disabled`, `.is-gated`, `.is-pressed`) — no inline per-element styling.
- Bind to domain via EventBus snapshots (ADR-0003); never read mutable state directly in a callback.
- Lists (species, quests) use reusable item templates; virtualize long lists (`ListView`).

## 7. Open questions (resolve in per-screen `/ux-design` specs)

- QQ-UX-1: Portrait-only or also landscape/tablet? (assume portrait-only for MVP)
- QQ-UX-2: Bottom tab bar vs hamburger for 6 screens on small phones.
- QQ-UX-3: Offline-collect modal copy once Fe7 is real (no more fake numbers).
