# Accessibility Requirements — Animal World Zoo (Unity 2D)

> **Status:** Seed (2026-06-06) · Authored by `/ux-design`. Baseline targets WCAG 2.1 AA where
> applicable to a mobile game. Platform: Unity 6.3 LTS, UI Toolkit, touch-first + WebGL.

## 1. Visual

- **Contrast:** text & essential icons ≥ **4.5:1** against background (≥ 3:1 for ≥ 24 pt / bold).
- **Color independence:** never convey state by color alone. Meter status, gated/disabled, and
  currency types must also use icon + text/shape (supports colorblind users). ⚠️ Audit the prototype's
  red/green meter rings against this.
- **Text scaling:** support at least **100–150%** UI text scale without clipping (UI Toolkit USS uses
  flexible layouts; avoid fixed-height text containers).
- **Minimum font size:** body ≥ 14 pt; never below 11 pt for any readable text.
- **Colorblind modes:** provide deuteranopia/protanopia-safe palette option (post-MVP acceptable; design
  tokens must not hardcode hue-only meaning so it can be added).

## 2. Touch & motor

- **Touch targets ≥ 44×44 pt**, spacing ≥ 8 pt (mirrors interaction-patterns §1).
- **No timed-only actions** in the core loop — care/idle is forgiving; nothing is lost permanently
  (aligns with the "nothing lost permanently" pillar).
- **No required multi-touch or precision gestures.** All core actions are single taps.
- **Forgiving hit areas:** small icons get an expanded invisible touch padding.

## 3. Motion & sensory

- **Reduce-motion option:** honour OS "reduce motion"; when on, replace slides/scale with instant or
  crossfade, disable parallax/idle ambient motion. No essential info conveyed only by motion.
- **No flashing** > 3 Hz (seizure safety).
- **Audio is non-essential:** all audio cues have a visual equivalent; game fully playable muted
  (sound toggle persisted in save — `soundOn`).

## 4. Cognitive

- **Single "next best action"** surfacing (quests/tutorial) to reduce overload — the review flagged
  5–6 concurrent active systems (D-W2); UX must not demand simultaneous attention.
- **Consistent placement** of currencies (HUD top), tabs (bottom), primary action (bottom-right).
- **Gated content shows the requirement** ("Reach Lv N"), giving clear goals rather than dead ends.
- **Tutorial (P7)** is skippable and re-openable; uses plain language.

## 5. Platform / assistive tech

- **WebGL:** ensure keyboard focus order is logical for pointer/keyboard users; visible focus ring.
- **Screen reader:** UI Toolkit supports accessibility nodes — label interactive elements
  (`name`/accessibility label) for the most critical controls (currencies, primary actions, tab bar).
  Full screen-reader support is **post-MVP**, but labels must be authored as controls are built so it
  is not a costly retrofit.
- **Localization-ready:** no text baked into sprites; all strings externalized (supports future i18n + RTL).

## 6. Acceptance checklist (per screen `/ux-review`)

- [ ] All text ≥ 4.5:1 contrast; no color-only state.
- [ ] All touch targets ≥ 44×44 pt with ≥ 8 pt spacing.
- [ ] Playable fully muted; audio cues have visual equivalents.
- [ ] Reduce-motion honoured; no flashing > 3 Hz.
- [ ] Gated/disabled controls show reason, not just greyed out.
- [ ] Critical controls have accessibility labels.

## 7. Deferred (tracked, post-MVP)

- Colorblind palette toggle · full screen-reader pass · dynamic text-scale slider in settings ·
  RTL layout validation. Design tokens & externalized strings must be authored now so these are additive.
