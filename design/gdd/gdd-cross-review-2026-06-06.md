# Cross-GDD Review Report

**Date:** 2026-06-06
**GDDs Reviewed:** 13 system GDDs
**Systems Covered:** animal-care, animal-collection, animal-database, attractions,
currency-system, enrichment, habitat-system, idle-offline, quests-missions,
save-load, taming, zoo-economy, zoo-level
**Companion:** `/consistency-check` (registry↔GDD values) — PASSED, see
`docs/consistency-report-2026-06-06.md`

> **Reading note.** This game already has a working code prototype, so many GDDs are
> *reverse-documented*. The project tracks ~25 **code-vs-design** gaps in
> `production/implementation-gaps.md`. This review draws a hard line:
> - **Gating items** = genuine *GDD-vs-GDD* contradictions, stranded ownership, or
>   missing docs that would poison architecture. These are NEW and listed first.
> - **Design-health items** = balance/implementation gaps the GDDs *correctly and
>   consistently* document. They are real and important, but they are inputs to
>   architecture (e.g. "design persistence", "add caps"), not GDD defects. They are
>   already triaged in `implementation-gaps.md`; re-listed here only for holistic context.

---

## Consistency Issues (GDD-vs-GDD relationships)

### 🔴 Blocking
None at the rule/formula level. Formula chains compose cleanly end-to-end
(appeal→visitors→gold; XP→level; offline reuses goldPerSec — all verified with
identical constants across every referencing GDD). No rule contradictions, no
acceptance-criteria contradictions, no genuine dual-ownership of tuning knobs.

### ⚠️ Warnings (reference hygiene — should fix before architecture traceability runs)
- **C-W1 — Stranded formula ownership (show economy).** The show-reward economy
  (`show_reward = round(Σ appeal×6 × crowd_mult)`, `show_rep`, `show_xp`, crowd-mult
  tiers 50/70) is *documented inside* `taming.md` but *attributed to* an unwritten
  **Fe5 Performance GDD** (`educational-shows.md`), which does not exist. `attractions.md`
  also punts show detail to Fe5. Net: a real formula that feeds C2/C3 is owned by no
  document. Assign an owner (taming.md or a new Fe5) before those numbers feed the economy.
- **C-W2 — Dead/placeholder GDD path references.** `zoo-level.md` cites
  `design/gdd/quests.md` (file is `quests-missions.md`); `quests-missions.md` points its
  "P6 Quests Screen" dependency at `hud.md`. Both 404 for traceability tools.
- **C-W3 — Mass-stale "(not yet authored)" tags.** `currency-system.md`, `save-load.md`,
  `animal-care.md`, `taming.md`, `quests-missions.md`, `idle-offline.md` still annotate
  now-existing sibling GDDs as unwritten. Misleads `/propagate-design-change` and
  `/architecture-review`. (Technical dependency content is correct — only the status tag is stale.)
- **C-W4 — References to genuinely-missing GDDs (Fe5 Performance, P1 HUD).** Six GDDs
  depend on these two unwritten docs. Acceptable for *this* MVP-13 set, but the
  dependencies can't reciprocate until they're authored.
- **C-W5 — Asymmetric dependencies.** Fe6 Quests lists Fe5 as upstream (activity→quest
  counters) with no reciprocation; `animal-collection.md`↔`zoo-economy.md` reciprocation
  is only partial (C2 doesn't name Fe1 as a gold-rate consumer).

---

## Game Design Issues (holism)

### 🔴 Blocking — design health (pre-existing, tracked; architecture must address)
These came back as "blocking" from a game-design-health lens. All are
**code/balance gaps the GDDs already document consistently** — they do not block
*authoring* the architecture, but architecture and the balance pass must resolve them.
- **D-B1 — Care decay 100–1000× too fast** drains every stat in 2.5–6.7 min of *active*
  session while offline has *no* decay — inverts the idle model and brushes the
  "nothing lost permanently / slow & intentional" pillars. (animal-care §3.2/OQ-3;
  idle-offline Rule 10/OQ-4.) Recalibrate to a ~daily, wall-clock-based cadence.
- **D-B2 — Persistence (F3) absent** — zero localStorage calls; every "months-long"
  system (trust, enrichment, enclosure, quests, currencies) resets on refresh. This is
  the **keystone**: it gates the decay fix, offline accrual, the gem faucet, and taming.
  Architecture should treat F3 as the first module.
- **D-B3 — Gem faucet = 0** — daily missions (the only free gem source) are unimplemented,
  so VIP "2× gems" multiplies zero and the F2 free-economy model is unvalidatable.
- **D-B4 — Enrichment is an uncapped, strictly-dominant appeal source** — no
  `MAX_ENRICH_LEVEL` guard (appeal `1+0.10×enrLv` grows without bound) AND shorter payback
  than the "primary" enclosure sink for every species. Collapses the four-way investment
  choice. Add the cap (registry already proposes 5) and re-derive ROI in the balance pass.

### ⚠️ Warnings
- **D-W1 — Progression-loop ownership drift.** Five GDDs each call themselves "the
  heart/core/primary." The real spine is **care→XP→Zoo Level→unlock** (XP never comes
  from gold), with gold as a parallel sink economy — but no doc states this hierarchy.
  Add a loop-hierarchy statement to `game-concept.md` and soften subordinate claims.
- **D-W2 — Attention budget borderline (5–6 concurrent active systems);** risk flips to
  *too passive* after the decay fix. Surface a single "next best action" and stagger cooldowns.
- **D-W3 — Two of five currencies inert.** Reputation is produced (shows) but read by no
  formula (`REP_VISITOR_MULTIPLIER` TBD); Conservation Tokens have a sink but no source
  (events are post-MVP). Either wire reputation now or defer + relabel the dishonest
  "+18% reputation" attraction label.
- **D-W4 — Attractions mechanically identical** (all feed one `|built|` counter; labels
  are cosmetic) → no real build choice; plus Rides (Lv30, 9k) cheaper than Shows (Lv26, 16k).
- **D-W5 — Cost multipliers ~2× high** (buy 22 / upgrade 160 / enrich 40, calibrated at old
  appeal max 1500). Consistent across GDDs; must precede re-deriving D-B4's ROI.
- **D-W6 — XP pacing unvalidated vs the 90-day journey** (Lv7 in 5–7 days implies ~1,130
  care taps → 7–9 sessions/day, vs the casual 2–3/day model). Build the pacing sim after
  the decay rate is chosen.
- **D-W7 — Taming difficulty is flavour only** (all species reach trust 100 in 18 plays;
  "Master = 3+ weeks" copy is false). Use per-rank trust *thresholds*.
- **D-W8 — Trust content-gates are data-only** (Petting/Performer gate on species string/flag,
  never live trust) — caring for an animal has no gating payoff.

---

## Cross-System Scenario Issues

Scenarios walked: **5** — S1 adopt species · S2 single care action · S3 level-up mid-session ·
S4 return-after-away · S5 run a show/activity.

### 🔴 Blockers
- **S-B1 — Level gate enforced for animals but NOT attractions.** `zoo-level.md` core
  rule #6 ("content locks if level < required") is contradicted by `attractions.md`
  (`buildAttraction()` checks gold only, OQ-1). A gold-rich Lv1 player can build the Lv45
  Arena and satisfy quests out of order. *(Both GDDs document the code accurately, so
  it's a code gap — but the two docs present the gate's authority differently. Reconcile
  the doc framing + flag the enforcement fix.)*
- **S-B2 — Offline "Collect" reward is contradictorily specified.** `idle-offline.md`
  says the offline modal is unreachable and its values ("+820 XP") are hardcoded/faked,
  but `zoo-level.md` §XP Sources lists "+820 XP" as a **live** faucet via the Collect
  button. Two GDDs disagree on whether a player-facing reward exists. **This is a genuine
  GDD-vs-GDD contradiction** — reconcile before architecture.
- **S-B3 — Undefined happiness basis at the resume frame.** Offline income uses pre-close
  `happyMult` (up to 1.4×) for the whole window; on resume the active loop recomputes from
  the same pre-close meters then crashes them in minutes (no offline decay). No gold
  double-count (time domains don't overlap), but which happiness basis is canonical at the
  resume frame is undefined across idle-offline vs zoo-economy.
- **S-B4 — Quest claims lack an idempotency key.** Once F3 persists, if a migration ever
  resets `chapterIdx` independently of `counts`, chapters re-complete and re-claim
  (12,900🪙 / 9,800 XP double-dip). Define a claim↔cursor idempotency key in the save schema.

### ⚠️ Warnings
- **S-W1 — One-frame care fan-out** (Feed → pay + XP + quest counter + happyMult recompute,
  then level-up `useEffect`) is *effectively* safe via React batching but is **never stated
  as an invariant**. Multi-level crossings announce only the final level. Becomes a blocker
  if any consumer ever caches `level`.
- **S-W2 — Incentive contradiction:** quests reward Feed/Water/Bathe (the quest counters),
  but only Play/Heal/Enrichment raise happiness — and happiness *is* the economy. Optimal
  play is "spam free Play, feed only for quests."
- **S-W3 — Activity quest credit fires on START not completion** + show/activity cooldowns
  not persisted → start-cancel-restart farms quest progress; tab reload resets cooldowns →
  unbounded show gold/XP farming (Dolphin 3★ = 27,000🪙 + 120 XP/run).
- **S-W4 — Shows consume live trust (1.5× >70) but trust isn't persisted and the gate isn't
  enforced**; missing meter defaults to trust=50 → instant 1.2× with zero investment.
- **S-W5 — Endgame spend spike ~2×** stacks across buy-more + upgrade + enrich simultaneously
  (all scale off un-rebalanced appeal max 3000) against income that wasn't doubled.
- **S-W6 — Three uncapped multiplier inputs** (enrichment level, enclosure level, attraction
  `|built|`) all feed the same appeal→economy→offline chain — structural runaway enabler once F3/Fe7 are real.

### ℹ️ Info
Multi-level-up announces only final level (I1) · ENC_COUNTS preview exceeds Lv1 cap (I2) ·
Play "+5" copy vs +4 code; "complete the collection" satisfied by 10 of one species (I3) ·
"+18% reputation" label unwired; Rides<Shows cost inversion (I4) · alert-ring threshold drift
clean<35 vs <40; decay runs during tutorial (I5).

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority |
|-----|--------|------|----------|
| zoo-level.md | Dead path `quests.md`; offline "+820 XP" listed as live (contradicts idle-offline) | Consistency | **Blocking** |
| idle-offline.md | Offline Collect reward spec contradicts zoo-level.md | Consistency | **Blocking** |
| taming.md | Show-reward formula has no owning GDD (Fe5 missing); stale tags | Consistency | Warning |
| attractions.md | Level-gate framing vs zoo-level rule #6; Fe5 dep missing; add Fe6 dependent | Consistency | Warning |
| currency-system.md | Stale "(not yet authored)" tags on 8 authored deps | Consistency | Warning |
| save-load.md | Stale "(not yet authored)" tags on C1–Fe7 | Consistency | Warning |
| animal-care.md | Stale tags (C4, Fe6) | Consistency | Warning |
| quests-missions.md | Fe5 upstream + P6→hud.md mislabel | Consistency | Warning |
| animal-collection.md | P1/Fe5 dep references missing; tighten C2 reciprocation | Consistency | Warning |
| zoo-economy.md | §6 prose-only deps; add Fe1 as named dependent | Consistency | Warning |

---

## Verdict: ⚠️ CONCERNS

The 13 GDDs are **internally coherent** — registry values agree, formula chains compose,
and there are no rule/AC contradictions. Architecture *can* be authored from this set.
But three things should be reconciled first, and a cluster of design-health gaps must be
carried explicitly into architecture and the balance pass:

**Reconcile before architecture (small, genuine doc defects):**
1. **S-B2 / flagged** — the offline "Collect" reward contradiction between `zoo-level.md`
   and `idle-offline.md` (does it grant XP or not?).
2. **C-W1** — assign an owner for the stranded show-reward economy formula (Fe5 vs taming.md).
3. **C-W2** — fix the dead `quests.md` path and the P6→`hud.md` mislabel.

**Carry into architecture (do NOT block this gate — they are architecture/balance inputs,
already tracked in `implementation-gaps.md`):**
- F3 persistence as the keystone module (D-B2) → unblocks decay fix, offline, gem faucet, taming.
- Wall-clock care-decay model (D-B1); enrichment/enclosure/attraction caps (D-B4, S-W6);
  attraction-gate enforcement (S-B1); quest claim idempotency (S-B4).
- A single `/balance-check` pass (3 cost mults + ROI re-derive + Rides/Shows inversion, D-W5/D-W4).

**Suggested sequence (for the producer):** reconcile the 3 doc items → `/create-architecture`
(design F3 + caps + gate enforcement + idempotency in) → `/balance-check` → pacing sim.
