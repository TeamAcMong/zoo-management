---
status: reverse-documented
source: act/data.jsx, act/prototype.jsx, act/tutorial.jsx
date: 2026-06-06
verified-by: Genji240696
---

# Animal World Zoo — Game Concept

> **Note**: Reverse-documented from the existing implementation.
> Captures current design intent, scope, and pillars.

## Summary

**Animal World Zoo** is a mobile-first browser idle zoo-builder in which players
grow a park from a single meadow with a rabbit into a multi-biome zoo housing 29
species — from farm animals to marine mammals. It is a quiet, deliberate game
about *collection, care, and patience*: animals are never bought with hard
currency, progression is months-long by design, and the player's relationship with
their animals is expressed through daily care rituals rather than combat.

- **Engine**: None — React 18.3.1 + @babel/standalone 7.29.0 (browser-native)
- **Platform**: Mobile web (primary) + Desktop web
- **Genre**: Idle / Management / Collector
- **Target audience**: Casual players 16–35, animal lovers, low-stress mobile gamers
- **Session length**: ~5–10 min × 2–3 sessions/day
- **Monetisation model**: Cosmetic-led; gems (IAP); VIP subscription; no pay-to-win

---

## Game Pillars

1. **"I'm building a zoo people want to visit."**
   Every design decision flows through visitor experience, not raw numbers. Animals
   make the zoo *attractive*; caring for them makes it *lively*; building attractions
   makes guests *stay and spend*. The feedback loop is emotional, not just numerical.

2. **Collection, not combat.**
   Progression is unlocking new species by reaching zoo levels, not by defeating
   enemies. The thrill is the reveal of a new animal and the moment it moves into
   its habitat.

3. **Daily care as ritual.**
   The game rewards players who return regularly with small, satisfying tap actions
   (feed, clean, play). Miss a session and happiness drops, appeal softens, and
   revenue slips — but nothing is lost permanently. Kindness is the mechanic.

4. **Slow and intentional.**
   Numbers are tuned for months-long progression. A new biome is a milestone, not
   a check-box. The player should still have goals at Day 90.

---

## Core Loop

```
30-second loop:
  Tap animal → care action (feed / clean / play / heal) → happiness rises

5-minute loop:
  Collect gate income → run attraction activity → check quest progress

Session loop (5–10 min):
  Animal care across habitats → build queue → daily missions → idle reward collect

Long-term loop (days/weeks):
  Accumulate gold → unlock new species / upgrade habitat / build attraction
  → Zoo Level rises → new biome unlocks → repeat
```

### Economy chain
```
Σ animal appeal × happiness multiplier
      ↓
Zoo Appeal (total)
      ↓ × VISITORS_PER_APPEAL
Zoo demand (visitors wanted)
      ↓ min(demand, capacity)
Actual visitors
      ↓ × SPEND_PER_VISITOR × attractions multiplier
Gold / second
```

---

## Content Scope

### Animals (29 species, 8 habitats, 7 tiers)

| Tier | Biome | Animals | Appeal range | Unlock span |
|------|-------|---------|-------------|-------------|
| 0 | Meadow | Rabbit, Chicken, Duck, Dog | 3–30 | Start |
| 1 | Meadow / Pasture | Cat, Goat, Sheep | 50–85 | Lv5–8 |
| 2 | Pasture | Horse, Donkey, Alpaca, Cow | 130–190 | Lv11–17 |
| 3 | Woodland | Fox, Monkey, Raccoon, Wolf | 230–330 | Lv20–28 |
| 4 | Savanna | Zebra, Giraffe, Rhino, Hippo, Lion, Elephant | 400–850 | Lv32–54 |
| 5 | Polar Peaks | Brown Bear, Polar Bear | 1000–1150 | Lv60–66 |
| 6 | Reptile House | Turtle, Python, Crocodile | 1350–1800 | Lv70–80 |
| 7 | Marine Cove | Seal, Sea Lion, Dolphin | 2100–3000 | Lv84–92 |

**Max Zoo Level: 92** (aligns with final unlock: Dolphin at Lv92)

### Attractions (5, gate by Zoo Level)

| Attraction | Unlock | Cost | Effect |
|-----------|--------|------|--------|
| Petting Area | Lv7 | 500🪙 | +12% visitors |
| Feeding Zone | Lv18 | 2,500🪙 | +15% revenue |
| Educational Shows | Lv26 | 16,000🪙 | +18% reputation |
| Animal Rides | Lv30 | 9,000🪙 | +20% revenue |
| Performance Arena | Lv45 | 45,000🪙 | +25% revenue |

### Habitats (5-level upgrades)

Each habitat upgrades from 2 → 6 animal slots. Costs: 2.5k → 14k → 68k → 320k Gold.

### Progression gates
- **Zoo Level 1→92** via Zoo XP (earned from care actions + quests)
- **Taming**: Trust meter (0–100) per animal; gates attractions + performance
- **Enrichment**: Per-animal enrichment level; raises appeal

---

## Care System

5 stats per animal: **Hunger** (−6/hr) · **Thirst** (−8/hr) · **Cleanliness** ·
**Happiness** · **Trust**.

5 care actions: **Feed** (40🪙) · **Water** (10🪙) · **Bathe** (20🪙) ·
**Play** (free) · **Health** (30🪙).

Happiness is an *outcome* of all needs + decor.
Happiness feeds back into the economy via `happyMult` (0.5–1.4×).

---

## Monetisation

- **Gold** (soft): earned via gate income + attractions; spent on care, upgrades, unlocks
- **Gems** (hard): IAP or ~5–15/day from missions; spent on speed-ups, cosmetics, VIP
- **VIP Subscription**: $7.99/mo — 24h idle cap, 2× daily gems, no ads
- **Conservation Tokens**: event currency (seasonal animals, decor)
- **Reputation**: meter only — multiplies visitor count, never spent

**Philosophy**: Animals are never bought with Gems. Hard currency is for convenience
and cosmetics. No pay-to-win.

---

## Retention & LiveOps

### Engagement cadence
- **Daily**: Login bonus + 5 missions + shop deal
- **Weekly**: 4 weekly missions + weekend 2× idle
- **Monthly**: Seasonal event + feature animal
- **Quarterly**: New tier/biome + balance pass

### Live events (4 × /year)
1. Spring Hatchlings (Mar–Apr) — egg-hatch mechanic
2. Safari Summer (Jun–Jul) — expedition map + Cheetah
3. Spooky Night Zoo (Oct) — after-dark mode
4. Winter Conservation (Dec–Jan) — co-op donation drive + Red Panda

### Target retention
D1 42% · D7 22% · D30 12% · D90 6%

---

## 90-Day Player Journey

| Day range | Zoo Level | Milestone |
|-----------|----------|-----------|
| D1 | Lv1–4 | FTUE complete; first idle reward |
| D2–7 | Lv5–10 | First attraction (Petting Area); daily mission habit |
| D8–30 | Lv11–22 | Pasture & Woodland; Feeding Zone; first event |
| D31–60 | Lv23–38 | Savanna opens; Rides + Shows; trust grinding |
| D61–90 | Lv39–50 | Performance Arena; reputation push; Lion tamed |

---

## 12-Month Roadmap

| Quarter | Title | Key content |
|---------|-------|-------------|
| Launch | Gates Open | Biomes 0–4 · Tiers 0–4 · Petting/Feeding/Rides/Shows |
| Q1 | Conservation | Performance Arena · Reputation · Photo mode |
| Q2 | Go Wild | Polar Peaks + Tier 5 · Friends & gifting |
| Q3 | Cold-Blooded | Reptile House + Tier 6 · Leaderboards |
| Q4 | Into the Deep | Marine Cove + Tier 7 · Endgame prestige (Zoo Tour) |

---

## MVP Definition

The Launch build requires:
- **Animal care system** (all 5 stats, all 5 actions)
- **Economy chain** (appeal → visitors → gold/sec)
- **Zoo Level progression** (1–50, Lv1–Lv45 content gated)
- **Animal collection** (Tiers 0–4, 20 species)
- **Habitat system** (Meadow → Savanna, upgrades 1–5)
- **4 of 5 Attractions** (Petting, Feeding, Rides, Shows — Performance Arena is Q1)
- **Taming system** (Trust gates Petting Area)
- **Tutorial / FTUE** (9 guided steps)
- **Quests** (daily + weekly missions)
- **Idle / offline earnings** (8h cap)
- **Monetisation shell** (Gold/Gems UI, VIP subscription hook, IAP stubs)

Post-launch / post-MVP:
- Performance Arena + trained animals (Q1)
- Reputation star system (Q1)
- Polar + Reptile + Marine biomes (Q2–Q4)
- Live events (Q1+)
- Friends / gifting / co-op (Q2+)
- Photo mode (Q1)
