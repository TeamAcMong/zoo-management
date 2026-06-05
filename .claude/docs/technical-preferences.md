# Technical Preferences

<!-- Populated by /setup-engine. Updated as the user makes decisions throughout development. -->
<!-- All agents reference this file for project-specific standards and conventions. -->

## Engine & Language

<!-- This project uses NO game engine. It is a browser React app. /setup-engine does not apply. -->

- **Engine**: None — vanilla web (browser-native)
- **Framework**: React 18.3.1 + ReactDOM 18.3.1 (UMD from unpkg CDN)
- **Language**: JavaScript / JSX, transpiled in-browser by @babel/standalone 7.29.0
- **Rendering**: DOM + CSS (no canvas/WebGL game loop); React component tree mounted at `#root`
- **Physics**: None (UI/management game — no physics engine)

## Input & Platform

<!-- Read by /ux-design, /ux-review, /test-setup, /team-ui, and /dev-story to scope -->
<!-- interaction specs, test helpers, and implementation to the correct input methods. -->

- **Target Platforms**: Web / Browser — desktop and mobile builds both shipped
- **Input Methods**: Mouse/Pointer + Touch
- **Primary Input**: Touch (mobile build renders a phone frame: `<Phone fullscreen />`); pointer on desktop
- **Gamepad Support**: None
- **Touch Support**: Full (mobile build uses `user-scalable=no`, `viewport-fit=cover`)
- **Platform Notes**: Targets must work with tap and click; no hover-only interactions. Two layouts: desktop (`Animal World Zoo.html`) and mobile (`Animal World Zoo (mobile).html`).

## Naming Conventions

<!-- JavaScript/React conventions for the act/ source. -->

- **Components**: PascalCase React function components (e.g., `LiveScene`, `Phone`)
- **Variables/functions**: camelCase (e.g., `currentQuest`, `handleTap`)
- **Events/handlers**: `handleX` / `onX` (e.g., `handleSelect`, `onClose`)
- **Files**: kebab-case `.jsx` in `act/` (e.g., `live-scene.jsx`, `quest-admin.jsx`)
- **CSS**: kebab-case class names; files grouped by concern (`act.css`, `kit.css`, `colors_and_type.css`)
- **Constants**: UPPER_SNAKE_CASE for module-level constants

## Performance Budgets

- **Target Framerate**: 60 fps (smooth UI animations/transitions)
- **Frame Budget**: 16.6 ms
- **Draw Calls**: N/A (DOM-based; watch DOM node count and re-render churn instead)
- **Memory Ceiling**: [TO BE CONFIGURED — set when a target device is chosen]

## Testing

- **Framework**: [TO BE CONFIGURED]
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## Forbidden Patterns

<!-- Add patterns that should never appear in this project's codebase -->
- [None configured yet — add as architectural decisions are made]

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->
- [None configured yet — add as dependencies are approved]

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- [No ADRs yet — use /architecture-decision to create one]

## Engine Specialists

<!-- No game engine is used. There are no godot/unity/unreal specialists for this project. -->
<!-- Read by /code-review, /architecture-decision, /architecture-review, and team skills. -->

- **Primary**: ui-programmer (React/web is UI-driven)
- **Language/Code Specialist**: gameplay-programmer (game logic in `act/*.jsx`)
- **Shader Specialist**: N/A (no shaders — DOM/CSS rendering)
- **UI Specialist**: ui-programmer + ux-designer
- **Additional Specialists**: technical-artist (CSS/visual polish), economy-designer / systems-designer (zoo management balance)
- **Routing Notes**: This is a vanilla React + Babel-standalone web app — no engine specialist applies. Route `.jsx` game logic to gameplay-programmer, interface/layout work to ui-programmer, and visual/CSS polish to technical-artist. Use ux-designer for flow and interaction specs.

### File Extension Routing

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code / components (`act/*.jsx`) | gameplay-programmer / ui-programmer |
| Styles (`act/*.css`) | technical-artist / ui-programmer |
| HTML shells (`Animal World Zoo*.html`) | ui-programmer |
| Data / config (`data.jsx`) | systems-designer / economy-designer |
| General architecture review | technical-director |
