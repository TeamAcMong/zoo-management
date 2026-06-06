---
name: project-proto-screens-i18n
description: i18n coverage status for act/proto-screens.jsx — which screens are done, which strings are left in English and why
metadata:
  type: project
---

All player-facing strings in `act/proto-screens.jsx` have been wrapped with `t()` under the namespaces below. The `data.jsx` file is NOT edited (per task constraint).

**Completed namespaces:**
- `scr.anim.*` — AnimalsScreen
- `scr.care.*` — CareScreen remaining bits (stat names, Adult, appeal label, taming chip, can-perform)
- `scr.attr.*` — AttractionsScreen
- `scr.acts.*` — ActivitiesScreen
- `scr.shop.*` — ShopScreen
- `scr.enc.*` — EnclosureScreen including toy names and status labels

**Data-driven display strings — NOW LOCALIZED (2026-06-06 follow-up, data.jsx editable):**
The original task left these in English because data.jsx was out of scope; a later pass
edited data.jsx and added VI maps + display-only helpers there. All resolved:
- `at.name/effect/desc` (ATTRACTIONS) → `ATTR_VI` + `attractionName/attractionEffect/attractionDesc(key)`
- `cat.name` (ENT_CATS) → `ENTCAT_VI` + `entCatName(key)`
- `a.name` (ENTERTAINMENT activity names) → `ENT_VI` + `entName(key)`
- `o.name/contents/tag` (OFFERS) → `OFFERS_VI` + `offerName/offerContents/offerTag(name)`

**Still in English (intentional, do NOT translate):**
- `p.name` (IAP pack names) — NEVER rendered; used only as React `key={p.name}`. No work needed.
- Real-money prices like `$7.99` / `o.price` — currency/legal, kept English
- Random pet name array `['Sunny','Coco',...]` + per-animal proper names (Clover…) — proper nouns
- `views-*.jsx` spec/portfolio pages and EVENTS/seasonal ACTIVITIES (live-ops spec views) — not the game UI

**Why the approach changed:** Rather than `name_vi` fields on each data object, the project
uses parallel VI lookup maps (`SPECIES_VI`, `ATTR_VI`, `ENT_VI`, `OFFERS_VI`…) keyed by the
English id/name, with display-only helpers. English data fields stay canonical for logic.

**Toy key pattern:** TOYS map was refactored from `{rabbit:'Tunnel maze',...}` to `{rabbit:'tunnel',...}` (slug suffixes), resolved via `t('scr.enc.toy.' + slug)`.

**reqDisplay helper added** in ActivitiesScreen to convert English species string (used in logic) to localized display name via `ANIMALS.find(x=>x.species===req)` + `speciesName(key)` — logic calls (`ownedSpecies.has(a.req)`) are untouched.

**live-scene.jsx (act/live-scene.jsx) — completed 2026-06-06:**
- Namespace `live.*` — all player-facing strings wrapped: appeal tooltip, visitors tooltip (capped/normal), zoom out/in tooltips, map title subtitle, per-plot species+count label (`live.plot_label` with `{species}` + `{n}` vars), locked tooltip, "Locked" label, gate welcome sign, VIP tag, drag hint, VIP arrival banner.
- `title={a.species}` on owned plots changed to `title={speciesName(k)}` — uses the global helper.
- `{a.species} ×{cnt(k)}` in zm-sign replaced with `t('live.plot_label', { species: speciesName(k), n: cnt(k) })` — species name is always via helper, count passed as var.
- "Animal World Zoo" proper game name kept outside translation (adjacent literal); only "Park map" subtitle is translated.
- Emoji, numbers, speed toggle `{s}×`, clock all left as-is.
- No logic, math, conditions, prop names, or animation classes changed.

**show-stage.jsx — completed (2026-06-06):**
- Namespace `show.*` — title, skip, combo, crowd_label, all 5 trick keys, finale_title, finale_stats
- `tKey` field added to each PERF_TRICKS entry; trick callout renders via `t(trick.tKey)`
- `cur.name` (performer name from data) kept outside t() — data-sourced
- Glyph ▶ kept outside translated label in skip button; emoji kept outside in all labels

**activity-stage.jsx — completed (2026-06-06):**
- Namespace `actv.*` — 5 cat labels, 5 cap captions, skip, 4 reward labels, complete, collect
- `ACTV_THEME` cat field changed from display string to category slug key; category label rendered via `t('actv.cat.' + act.cat)`
- Cap lambdas now return `t('actv.cap.<cat>') + ' <emoji>'` — emoji kept outside t()
- `act.name` passed as `{name}` var to `actv.complete`; the data-sourced name is untouched
- `actv.skip` button: glyph ▶ kept outside translated label
- Reward row labels built as `'<emoji> ' + t('actv.reward.<key>')` — emoji outside t()

**How to apply:** When taking on any future localization task for this file, check this memory first to understand what is already done and what the outstanding gaps are (data.jsx data strings).
