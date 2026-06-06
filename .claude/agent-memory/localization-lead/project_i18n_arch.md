---
name: project-i18n-arch
description: AWZ i18n architecture — I18N object in data.jsx, t() helper, language switching, and which files own which namespaces
metadata:
  type: project
---

The project uses a hand-rolled i18n system defined in `act/data.jsx`.

- `const I18N = { en: {...}, vi: {...} }` — single flat key map per locale, loaded first so all modules can use `t()`.
- `t(key, vars?)` — global helper; reads `window.__lang`, falls back en → raw key. Placeholders use `{varName}` syntax.
- `window.__lang` is set from `localStorage` (key `awz_settings`) on startup.
- Supporting helpers: `speciesName(k)`, `tamingName(label)`, `habitatName(key)`, `tierName(tier)` — display-only localized data names defined in `act/data.jsx`. NEVER use these for logic.
- Additional locale data in `data.jsx`: `SPECIES_VI`, `TAMING_VI`, `HABITAT_VI`.

**File ownership (namespaces added so far):**
- `act/data.jsx` — owns all existing keys: `tab.*`, `cur.*`, `xp.*`, `set.*`, `start.*`, `off.*`, `care.*`, `tut.*`
- `act/quest-admin.jsx` — owns: `quest.*`, `svc.*`, `admin.*` (keys added 2026-06-06)

**Key convention:** flat dot-notation, loaded into the single I18N object (no per-file locale files in this prototype — all in data.jsx).

**Languages supported:** English (`en`) and Vietnamese (`vi`).

**Why:** This is a React/Babel reference prototype (not the Unity shipping build). i18n architecture is intentionally lightweight — single I18N object, no ICU library.

**How to apply:** Any new player-facing string in `act/*.jsx` must use `t('ns.key', {vars})`. New keys must be added to both `en` and `vi` entries in `I18N` in `act/data.jsx`.
