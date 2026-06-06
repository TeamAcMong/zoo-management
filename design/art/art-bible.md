# Animal World Zoo — Art Bible

> **Status:** Approved (sections 1–9 authored 2026-06-06)
> **Engine:** Unity 6.3 LTS (`6000.3.17f1`), URP 2D
> **Platform:** Mobile (iOS/Android) primary + WebGL
> **References:** Planet Zoo · Stardew Valley
> **AD Sign-Off (AD-ART-BIBLE):** Lean mode — skipped
> **Authored by:** /art-bible skill, 2026-06-06

---

## Section 1: Visual Identity Statement

### North Star Rule

> **Every visual element should feel like looking through a clean window at a living place — warm, unhurried, and worthy of care.**

When any future art decision is ambiguous, ask: "Does this feel observed and genuine, or performed and loud?" Choose the former.

---

### Supporting Visual Principles

#### 1. Naturalistic Warmth

The palette and rendering style draw from real environments — sunlit meadow grass, the amber of a late afternoon savanna, the blue-grey cool of a polar shore — but always pushed toward the warm end of the temperature spectrum to sustain emotional comfort.

**Design test:** When choosing between two background color treatments for a biome, prefer the one whose dominant hue reads "golden hour" or "soft overcast" over one that reads "vivid saturated" or "midday noon." If the palette makes the animal pop against a muted field rather than compete with a bright one, it passes.

**Pillar served:** Pillar 1 — "I'm building a zoo people want to visit." A visitor-worthy zoo feels inviting, not clinical or frantic. The color temperature is the emotional cue that tells the player this is a place worth spending time in.

---

#### 2. Quiet Hierarchy

The animal is always the most visually prominent element in any composition. UI chrome, habitat decoration, and environmental detail exist to frame and support the animal — never to equal or outweigh it. Contrast, size, and saturation are reserved for interactive animal states; idle environments stay visually subdued.

**Design test:** When sizing a new habitat decoration asset or UI overlay, reduce it until removing it further would make the space feel empty, then stop. If the asset competes with the animal silhouette at arm's-length (typical mobile viewing distance), reduce contrast or desaturate until the animal wins clearly.

**Pillar served:** Pillar 2 — Collection, not combat. The reveal of a new species must feel significant. That significance is achieved through visual hierarchy: the animal is the event; everything else is context.

---

#### 3. Tactile Softness

All interactive elements — care buttons, animal tap targets, currency pickups — use rounded forms, soft drop shadows, and a slight scale-up response on press. Hard edges, sharp drop shadows, and mechanical angles are reserved for structural UI (modal frames, habitat boundaries) only. Nothing in the game should feel aggressive to touch.

**Design test:** When designing a new interactive element, apply a 6–8 px border radius as the default starting point. If the element looks visually unclear or structurally weak at that radius, it may be reduced — but only to the minimum that preserves readability. A button with a right-angle corner is a flag for review.

**Pillar served:** Pillar 3 — Daily care as ritual. The physical sensation of the tap loop (feed, clean, play) is the game's primary micro-pleasure. Soft, responsive form language reinforces that caring for animals feels gentle and kind, not mechanical or transactional.

---

## Section 2: Mood & Atmosphere

> This section defines the emotional and visual character of each major game state. All seven states exist within the same gentle, inviting world — the palette never turns cold or threatening. The goal is a spectrum that runs from contemplative stillness to warm celebration, with each state clearly legible at a glance while feeling like a continuous, breathing place.

### Design Principles for Atmosphere

**1. Light tells the story.**
Lighting direction is the primary mood carrier. Color palette and particle density are secondary. When a state's mood is ambiguous, return to the light.

**2. Energy lives in motion, not brightness.**
The cozy-to-celebratory range does not use brightness as an energy dial. A late-night scene can be dim and rich; a celebration can be golden rather than harsh. Motion speed and density carry energy level instead.

**3. Continuity through saturation.**
All seven states share the same base saturation range (mid-to-high, never desaturated to gray) and the same warm-neutral color temperature as the foundation. Mood shifts are achieved through hue rotation and contrast, not by leaving the palette family.

---

### State 1 — Active Zoo View
*Idle running, visitors arriving, animals in habitats*

| Property | Definition |
|---|---|
| **Emotion target** | Gentle pride — "my zoo is alive and I built this" |
| **Lighting character** | Mid-morning sun, 10 o'clock angle; warm amber-white, soft cast shadows; low-to-medium contrast so the entire scene reads as one inviting space |
| **Atmospheric adjectives** | Lively, sunlit, rustling, inhabited, open |
| **Energy level** | Measured — continuous ambient motion (visitor paths, animal idle cycles, leaf sway) but no urgency |
| **Primary mood carrier** | Visitor silhouettes moving along pathways; the zoo is never empty, always in use |

**Lighting notes:** The ambient fill is warm (approximately 5,800 K daylight with a slight golden lean). Habitat interiors are one stop darker than pathways so animals read clearly against their backgrounds. No hard shadows that would fragment the scene — diffuse area light is preferred.

---

### State 2 — Animal Care Interaction
*Tapping to feed, play, clean, or heal*

| Property | Definition |
|---|---|
| **Emotion target** | Intimate tenderness — "this animal knows me and needs me right now" |
| **Lighting character** | Soft close-up light; camera pushes in, ambient light warms slightly (golden-hour temperature shift from State 1); contrast drops to direct the eye to the animal |
| **Atmospheric adjectives** | Close, warm, attentive, gentle, responsive |
| **Energy level** | Contemplative — the world outside the habitat recedes; focus narrows to the single interaction |
| **Primary mood carrier** | A soft, pulsing halo of warm amber that blooms from the animal on a successful care tap, then fades within 1.5 seconds |

**Lighting notes:** The background habitat dims by roughly 30% when a care interaction is active (vignette-style desaturation at the frame edges). The animal itself remains fully lit and slightly rim-lit in warm gold.

---

### State 3 — New Species Reveal / Adoption Moment
*The animal arrives in its habitat for the first time*

| Property | Definition |
|---|---|
| **Emotion target** | Delighted surprise — "I've been waiting for this one" |
| **Lighting character** | Cinematic reveal; starts dim (a held breath), then a rising warm fill from below as the animal is unveiled; high contrast moment that resolves into warm ambient normalcy |
| **Atmospheric adjectives** | Radiant, momentous, lush, wide-eyed, ceremonial |
| **Energy level** | Celebratory — a single contained burst of energy, then warmly settling back to measured |
| **Primary mood carrier** | Particle bloom: soft gold and species-accent-color motes that rise from the ground and drift upward, dissipating over 3 seconds |

**Lighting notes:** The reveal light is a brief, single directional source from the lower-center of screen. Within 2–3 seconds it transitions to the standard State 1 mid-morning ambient. Reserve this contrast spike for this state only.

---

### State 4 — Idle Reward Collect
*Player returns after offline time*

| Property | Definition |
|---|---|
| **Emotion target** | Warm reunion — "the zoo was safe and busy while I was gone" |
| **Lighting character** | Same mid-morning base as State 1 but with a slightly fuller, richer ambient fill; medium contrast |
| **Atmospheric adjectives** | Abundant, welcoming, accumulated, glowing, ready |
| **Energy level** | Measured with anticipation — quieter than the reveal state, but with a forward lean |
| **Primary mood carrier** | Gold numerals ticking upward while soft golden motes drift toward the player's currency display |

---

### State 5 — Late-Night / Quiet Period
*The zoo "after hours"*

| Property | Definition |
|---|---|
| **Emotion target** | Peaceful solitude — "the zoo is mine alone right now; it rests like I do" |
| **Lighting character** | Cool-blue moonlight as key; warm amber from habitat lanterns as fill; low-medium contrast; the darkest state in the game, but never threatening |
| **Atmospheric adjectives** | Still, silvery, breathing, hushed, intimate |
| **Energy level** | Contemplative — the slowest state; animal idle animations shift to drowsy/sleep cycles |
| **Primary mood carrier** | Pathway lanterns: warm amber point-lights pooling softly on the ground through the cool-blue scene |

**Lighting notes:** Moonlight key ~7,500 K; habitat lanterns ~2,800 K. No surface reads as pure black; the floor always has at least the faint blue of moonlight.

---

### State 6 — Achievement / Level-Up
*Zoo level milestone, new habitat unlock*

| Property | Definition |
|---|---|
| **Emotion target** | Proud joy — "I earned this; look what I've built" |
| **Lighting character** | Full warm-white ambient surge; all shadows soften to near-zero; brief duration (2–4 seconds) |
| **Atmospheric adjectives** | Triumphant, golden, expansive, ringing, earned |
| **Energy level** | Celebratory — the highest-energy state; motion density peaks, then falls back |
| **Primary mood carrier** | Radial warm-gold flare from center of achievement panel, illuminating the surrounding HUD |

**Lighting notes:** The ambient surge should feel like the whole world brightening for a moment — achieved by raising the scene's global ambient intensity, not by placing a new light source. Duration cap: 3 seconds.

---

### State 7 — Menus / HUD (Home Tab)
*Bottom navigation, currency display, persistent UI layer*

| Property | Definition |
|---|---|
| **Emotion target** | Calm clarity — "I can see everything I need; nothing is demanding attention" |
| **Lighting character** | Neutral, consistent ambient matching State 1 baseline; HUD uses flat UI lighting (no cast shadows on panels) |
| **Atmospheric adjectives** | Clean, grounded, legible, present, unobtrusive |
| **Energy level** | Measured — the HUD is never animated unless communicating a change |
| **Primary mood carrier** | The bottom tab bar's active-state indicator: a soft warm-amber underline or fill |

---

### Atmospheric Transition Map

| Transition | Duration | Method |
|---|---|---|
| State 1 → State 2 (enter care) | 400 ms | Background vignette dims; animal warms |
| State 2 → State 1 (exit care) | 300 ms | Vignette lifts; ambient returns |
| State 1 → State 3 (reveal) | Held beat + 600 ms rise | Dim hold, then fill rises to reveal peak |
| State 3 → State 1 (settle) | 2,000 ms | Gradual ambient return; particles dissipate |
| State 1 → State 5 (time shift) | Gradual, real-time | Key light slowly cools and descends; lanterns warm up |
| Any → State 6 (achievement) | 200 ms onset / 3,000 ms hold / 800 ms decay | Ambient surge, then smooth return |
| Any → State 7 (open menu) | Instant | HUD is always-on layer |

---

## Section 3: Shape Language

### Guiding Principle

Every shape in Animal World Zoo makes a single argument: this is a place worth caring about. Shapes are warm, legible, and unhurried. They never feel aggressive, mechanical, or clinical. The vocabulary is grounded in organic geometry — forms found in nature, worn smooth by time.

The reference triangle: **Planet Zoo** at the believable end (animal silhouettes rooted in real anatomy) + **Stardew Valley** at the crafted end (chunky, hand-drawn weight, generous outlines) — never crossing into rubber-toy cartoony, never reaching hyperrealism.

---

### 1. Animal Silhouettes — Chunky Realism

Animals are the game's heroes. Their silhouettes must read instantly at the smallest UI size (species card thumbnail, approximately 64×64 dp) and reward closer inspection at full care-screen scale.

**The working rule:** one identifying shape, boldly stated. Each species' silhouette is defined by one anatomical feature that makes it unmistakable — the _signature form_.

| Species group | Signature form | Silhouette weight |
|---|---|---|
| Rabbit, Cat, Dog | Ear proportion (tall/folded/floppy) | Light, rounded |
| Horse, Donkey, Cow | Shoulder mass + leg length | Heavy base, vertical |
| Giraffe | Neck-to-body ratio (extreme vertical) | Graphic, asymmetric |
| Elephant | Trunk arc + ear plane | Very wide, grounded |
| Polar Bear | Shoulder hump + wide paw | Dense, low-slung |
| Crocodile | Horizontal wedge + ridged spine | Flat, textured edge |
| Dolphin, Seal | Fluid arc (no hard corners anywhere) | Flowing, unified |

**Silhouette construction rules:**
- All animals read as clean closed shapes at 64 dp — no fine details needed to identify the species.
- Body proportions use a **1.15–1.25× head-to-body enlargement** relative to naturalistic anatomy — heads read slightly larger, giving each animal a more expressive, relationship-forward quality.
- Limbs are simplified to their essential gesture.
- **No sharp points.** Even crocodile teeth and spines are rounded at tips. Aggression is absent. (Pillar 2 enforced at the silhouette level.)
- **Outline weight:** 2–3 px at 1× density; 3–4 px for very small animals (Rabbit, Turtle).

---

### 2. Environment & Habitat Geometry

**Philosophy: Terrain Reflects Biome Mood**

The earlier the biome (lower Zoo Level), the softer and more domestic its geometry. The later the biome, the more extreme and distinctive. Progression is legible through shape alone.

| Biome | Shape Grammar |
|---|---|
| **Meadow (Lv1)** | Soft continuous hills; low-frequency sine curves; picket-fence or rounded hedge enclosure borders. Most domestic geometry. |
| **Pasture (Lv6)** | Wider, flatter ground; post-and-rail fencing; long horizontals; more agricultural, still entirely soft. |
| **Woodland (Lv20)** | Irregular organic outlines. Tree canopy = cloud-form lobe clusters. Ground has implied root/moss texture. Stone walls, fallen logs — first slight roughness. |
| **Savanna (Lv32)** | Visual pivot. Broad horizontal plane + rock formations (wedge and stacked layers — corners blunted minimum 6px radius). Acacia silhouettes. Sky horizon dominant. Scale increases dramatically. |
| **Polar Peaks (Lv60)** | Sharpest terrain in the game — ice formations with clipped triangular tips, never knife-edge. Snow accumulation creates soft top edges. White ground maximises animal silhouette contrast. |
| **Reptile House (Lv70)** | Only interior biome. Architecture dominates: arched glass ceiling, curved terrace walls, tropical plant silhouettes. Dominant shape = the arch. |
| **Marine Cove (Lv84)** | Water is the terrain. Slow, low-amplitude wave sine curves. Rock formations at water's edge (angular, softened by erosion). Bubbles and ripples = perfect circles. Shape language closes a loop: returns to circular geometry. |

**Cross-biome rule:** Biome boundaries in the zoo map view are terrain elevation changes, not hard-edged walls — the player sees a gradient from one biome to the next.

---

### 3. UI Shape Grammar — Nature-Derived HUD

The UI is not a foreign object imposed on the world. It is grown from the same organic vocabulary — panels, cards, and buttons feel like objects that could exist in the zoo.

**Core shape token:** the **soft rectangle** — every UI panel, button, card, and modal uses a rectangle with **12–16 px corner radius** at standard screen density.

| Component | Shape | Corner Treatment |
|---|---|---|
| Panels / cards | Soft rectangle | 14 px (standard), 10 px (compact list items) |
| Primary CTA (Adopt, Upgrade, Claim) | Pill (full radius) | Height/2 — the most complete, closed shape |
| Secondary actions (Cancel, Info) | Soft rectangle | 14 px, lighter weight / outline |
| Care action buttons | Circle | N/A — single tap target, no directional preference |
| Progress bars / stat meters | Pill track | Fully rounded ends; rounded leading fill edge |
| Modals | Soft rectangle | 20–24 px — softest-shaped UI elements |
| Bottom tab bar active indicator | Soft rectangle | 8 px |

**Disabled states:** shape never changes — only color and opacity change. No layout shift.
**Shadows:** soft drop shadow (4 px blur, 20% opacity, 2 px offset) on all panels. Warm-tinted, not cool-grey.

---

### 4. Hero Shapes vs. Supporting Shapes

**The hierarchy ladder:**

| Level | Elements | Shape Type |
|---|---|---|
| **1 — Absolute Hero** | Animals, primary CTA pill, currency icons (circle) | Full silhouette weight, closed complete shapes |
| **2 — Supporting Hero** | Species/enclosure cards, care buttons, stat meters, modals | Soft rectangles with full fills; animal portrait is the card's focus |
| **3 — Functional** | Secondary buttons, labels, navigation tabs | Outline-only rendering, 60–70% opacity inactive |
| **4 — Receding** | Enclosure ground, habitat borders, background flora | Open forms, bleeding off edges, low-opacity lines |

**Anti-rule:** Background geometry must never be a closed shape at full opacity. Enclosure boundaries are always either low-opacity, desaturated, or open at the top — never a fully-drawn closed rectangle at full strength.

---

### Shape Language Summary Table

| Element | Shape Type | Corner | Hierarchy |
|---|---|---|---|
| Animal silhouette | Closed organic | Rounded everywhere | 1 — Hero |
| Primary CTA button | Pill (full radius) | Maximum radius | 1 — Hero |
| Currency icon | Circle | N/A | 1 — Hero |
| Species / enclosure card | Soft rectangle | 14 px | 2 |
| Care action button | Circle | N/A | 2 |
| Stat meter | Pill track | Fully rounded | 2 |
| Modal panel | Soft rectangle | 20–24 px | 2 |
| Secondary button | Soft rectangle (outline) | 14 px | 3 |
| Navigation tab indicator | Soft rectangle | 8 px | 3 |
| Terrain / ground | Open / textured | N/A | 4 |
| Enclosure border | Open-top line | Low opacity | 4 |
| Background flora | Partial / bleed form | N/A | 4 |

---

## Section 4: Color System

> **References:** Planet Zoo (naturalistic, biome-distinct) · Stardew Valley (warm, muted-vibrant, hand-painted)
> **Pillars served:** Zoo people want to visit · Daily care as ritual · Slow and intentional

### 1. Primary World Palette

| Name | Character | Approx. Value | Role |
|---|---|---|---|
| **Meadow Sage** | Warm grey-green, muted, mid-light | `#7A9E7E` | Default ground. Safe, familiar, domestic. Every new player starts here. |
| **Warm Soil** | Reddish-brown, dark, earthy | `#8B5E3C` | Paths, enclosure borders, habitat dirt floors. Anchors the world as physical. |
| **Sunlit Straw** | Warm yellow-tan, slightly dusty | `#D9B87C` | Hay bales, sandy ground, thatched roofing. The world's primary "light" color. |
| **Canopy Dusk** | Deep forest green, dark, rich | `#2D5A3D` | Tree masses, woodland shadow, background vegetation. The world's primary "dark." |
| **River Stone** | Cool blue-grey, mid-tone | `#6B8FA3` | Water features, marine elements, cooler biome accents. Reserved for the right half of progression. |
| **Dusk Amber** | Warm orange-amber, selective emphasis | `#C47A2B` | Used sparingly for ripe/ready states. Never used for danger. |
| **Aged Linen** | Off-white, slightly warm | `#F2EBD9` | Panel backgrounds, speech bubbles, tooltip surfaces. Never pure white. |

**Palette principle:** Saturate one element at a time. Meadow Sage, Warm Soil, and Canopy Dusk are the unsaturated "bed." Dusk Amber is the single note of warmth that draws the eye.

---

### 2. Semantic / UI Color Vocabulary

| Color | Semantic Meaning | Approx. Value | When Used | Backup (Accessibility) |
|---|---|---|---|---|
| **Gold** | Currency earning / affordability | `#C8992A` | Currency displays, earn animations, cost labels when affordable | Always with coin icon 🪙; bold weight |
| **Green** | Welfare / thriving / available | `#5A9A5F` | Stat bars above threshold, happy-animal state, available actions | Always with icon (filled droplet, satisfied face) + meter position |
| **Red** | Needs attention / blocked | `#B5413A` (brick red) | Stats below 25%, insufficient funds, locked states | Always with icon (drooping stat, padlock) + text "Need X" |
| **Blue** | Progress / XP / passive growth | `#4A7FA5` | XP bar, Zoo Level progress, trust fill, build in-progress | With star icon ⭐; never on cost labels |
| **Purple** | Premium / Gem currency | `#7B5EA7` | Gem counter, Gem-cost labels, VIP indicators, event rewards | Always with diamond icon 💎; exclusive use |
| **White** | **ABSENT** | N/A | Pure `#FFFFFF` is never used anywhere | All surfaces use Aged Linen or tinted variant |

---

### 3. Biome Color Temperature Progression

**The arc:** Start warm, domestic, soft → build to richer warmth (Savanna) → pivot to cool contrast (Polar) → dark texture (Reptile) → luminous complexity (Marine Cove).

**Saturation rule:** 40–50% early biomes → 60–65% at Savanna → 35–45% Polar → 55% Reptile → 65–70% Marine Cove (maximum).

| Biome | Unlock | Color Identity | Temperature | Contrast Feel |
|---|---|---|---|---|
| **Meadow** | Lv1 | Warm pastoral soft | Warm · Low saturation | Low — gentle, welcoming |
| **Pasture** | Lv6 | Golden open farmland | Warm · Slightly fuller | Low-medium — open, airy |
| **Woodland** | Lv20 | Rich shadowed emerald | Warm-neutral · Mid | Medium — depth and dappling |
| **Savanna** | Lv32 | Amber dry heat | Warm · Peak saturation | Medium-high — dramatic open space |
| **Polar Peaks** | Lv60 | Cold crystalline pale | Cool · Low saturation | High — light on light, bright on pale grey |
| **Reptile House** | Lv70 | Dark textured exotic | Neutral-cool · Mid | High — dark backgrounds with sharp highlight |
| **Marine Cove** | Lv84 | Deep luminous aqua | Cool · Full saturation | Highest — deep dark water with luminous fauna color |

---

### 4. UI Palette Divergence

| UI Element | World Color | UI Color Used | Reason |
|---|---|---|---|
| Panel / card backgrounds | Aged Linen `#F2EBD9` | `#F5EFE2` (slightly lighter) | Lifted for legibility over dark biome backgrounds |
| Primary action button (active) | Dusk Amber `#C47A2B` | `#D48B3A` (lifted 10%) | World amber too dark at small button scale |
| Disabled state | — | `#B8B0A2` (warm grey) | Never red for disabled; warm grey + padlock icon |
| HUD background (top bar) | — | `#2B2318` (dark warm brown, ~80% opacity) | Semi-opaque; preserves world view, provides contrast for white currency text |
| Drop shadows | — | `rgba(40, 28, 10, 0.18)` (warm dark brown) | Never cool-grey/black shadows |
| Body text on light panels | — | `#2A2016` (very dark warm brown) | Never pure `#000000` |
| Body text on dark HUD | — | `#EDE8DC` (near-white, warm) | Never pure `#FFFFFF` |

---

### 5. Colorblind Safety

**4 high-risk color pairs and their required backups:**

**Pair 1: Green / Red (stat bars)** — deuteranopia/protanopia risk
- Backup: icon variants (filled vs cracked droplet); bar fill length/proportion; text "Need X" for funds
- Design token: `--color-positive` / `--color-danger`

**Pair 2: Gold / Green (HUD simultaneous)** — tritanopia risk
- Backup: Gold always with coin icon 🪙; distinct bold font weight

**Pair 3: Blue (XP) / Purple (Gem)** — small-scale confusion risk
- Backup: XP = star icon ⭐; Gem = diamond icon 💎; never adjacently placed without separator

**Pair 4: Dusk Amber (ready) / Red (blocked)**
- Backup: Amber states use upward arrow/starburst; Red states use padlock/downward arrow; never on same element simultaneously

**Post-MVP colorblind mode:** Design tokens use semantic names (`--color-positive`, `--color-danger`, `--color-premium`) — not hue names. Toggle = single token remap.

---

### Color Usage Rules

1. No pure `#FFFFFF` or `#000000` anywhere.
2. Saturation caps at 65–70% maximum (Marine Cove only). Early biomes: 40–50%.
3. One emphasis color per composition — never two saturated elements competing in the same region.
4. Red = "needs attention" or "blocked" only. Unavailable content uses warm grey + icon.
5. Purple is exclusively reserved for Gem/premium. No decorative purple in world/habitat art.
6. Every semantic color pair must have icon and/or text label backup.
7. Drop shadows use warm brown, never grey.
8. Biome temperature follows the progression arc exactly. Deviations require Art Director review.

---

## Section 5: Character Design Direction

> **Scope:** Animals (the game's primary characters), visitor NPCs, individual animal identity, and the visual language of the taming/trust arc.
> **Engine constraint:** Unity 6.3 LTS, URP 2D, mobile-first. All specifications are for 2D sprite-based rendering.

### 5.1 Animal Character Direction

#### Philosophy: Chunky Realism Expanded

The register is **observed but distilled.** An artist making a character sheet for the Rabbit should have a reference photograph open, not a cartoon reference. They are asking: what is the essential *gesture* of this animal? That observation, pushed 20% toward warmth and roundness (the 1.15–1.25× head rule from Section 3), is the target. The goal is that a player who has never seen this game but has seen a real rabbit will recognise the species immediately and feel affection — not amusement.

#### Expression and Pose Register by Taming Tier

| Taming Tier | Species | Idle Register | Expression Direction | Pose Quality |
|---|---|---|---|---|
| **Very Easy** | Rabbit, Chicken, Duck, Dog | Openly curious; head tilts, weight shifts, small ambient movements | Soft neutral eyes with subtle uplift at inner corner; slight ear variation | Rounded and loose; weight low and settled |
| **Easy** | Cat, Goat, Sheep, Horse, Donkey, Cow, Turtle | Quietly present; long still holds punctuated by one deliberate movement | Eyes calm and steady; no tension in brow geometry | Confident standing weight; no cowering |
| **Medium** | Alpaca, Fox, Monkey, Raccoon, Zebra | Alert and watchful; occasional rapid movement; subtle scan cycles | Eyes slightly wider; head positioned to keep habitat entrance in peripheral view | Weight distributed evenly; ready without being tense |
| **Hard** | Wolf, Giraffe, Rhino, Hippo, Elephant, Seal | Reserved; dignified; slow and deliberate; long holds | Eyes neutral-to-guarded; no soft inner-corner uplift | Heavier weight bias; movements carry mass |
| **Expert** | Lion, Brown Bear, Polar Bear, Python, Sea Lion, Dolphin | Near-still with slow oscillation (breathing, surface ripple, tail drift); high confidence | Eyes direct and level; no softness at rest | Stillness IS the expression — no fidget cycles |
| **Master** | Crocodile | Near-motionless; eye blink is the only reliable ambient cue | Eyes forward and opaque; no eye-socket softness | Maximum stillness |

**Minimum animation budget (any animal, any trust level):** one breathing cycle (3–4 s period), one blink (random 4–8 s), one idle weight-shift per 12–18 s — overlapping randomly to prevent mechanical repetition.

#### Fur, Feather, and Surface Style for Mobile

| Surface type | Approach | Avoid |
|---|---|---|
| Short fur (Dog, Cat, Fox, Wolf, Lion) | Edge fraying 2–4 px at neck/tail/cheek; interior directional brush pass | Strand simulation; repeating tile |
| Long fur / wool (Sheep, Alpaca, Horse mane) | Chunked lobe clusters (same cloud-form as woodland canopies, §3) | Fine wavy lines that compress at 64 dp |
| Feathers (Chicken, Duck) | 4–7 distinct overlapping wing-edge shapes; smooth body fill | Individual body feathers |
| Reptile scale (Crocodile, Python) | Low-frequency bumped fill ~6–8 px hexagonal impression; Turtle = bold graphic plates | Fine-scale tile that moires |
| Marine smooth (Dolphin, Seal, Sea Lion) | Smooth fill + single wet-surface highlight (~20% body width, cooler lighter variant) | Painted scale or fur |
| Thick hide (Elephant, Rhino, Hippo) | Large-radius fold lines (12–16 px brush width) at major joints | Fine-grained texture |

#### LOD Philosophy

Two primary viewing distances: **Zoo View** (24–48 dp, silhouette + dominant color only) and **Care Screen** (200–320 dp, full surface detail). Design for Care Screen first; verify Zoo View silhouette reads as a clean single-color shape.

**Sprite variants required per animal:**

| Variant | Size | Use |
|---|---|---|
| `_card` | 64×64 dp | Collection grid, species database |
| `_idle` | 128×128 dp | Zoo View habitat tile |
| `_care` | 256×256 dp | Care Screen portrait |
| `_care_large` | 512×512 dp | Species Reveal moment only |

---

### 5.2 Visitor NPC Design

NPCs exist to make the zoo feel inhabited. At zoo-view camera distance they render at ~24×48 dp — every design decision is a silhouette decision.

**Five readable silhouette types:**

| NPC Type | Silhouette signature | Readable at 24×48 dp? |
|---|---|---|
| Adult solo | Standard upright figure, 1:5 head ratio | Yes |
| Adult with child | Taller + smaller offset figure, slight inward lean | Yes — pair reads as unit |
| Child solo | 60% adult height, 1:4 head ratio | Yes |
| Couple | Two matching-height figures, slight proximity | Yes |
| Group cluster | Three or more overlapping silhouettes, ragged outline | Yes |

**What NPC art must NOT attempt:** individual facial features, readable clothing text, hair extending beyond head silhouette, accessories that add silhouette width.

**Color strategy:** All NPC clothing from the same warm-muted world palette. Three color families in rotation: Warm (coral, tan, dusty rose), Neutral (grey-green, slate, muted teal), Cool (soft blue, lavender). No family exceeds 50% of visible crowd. Three warm skin tones used: Sunlit Straw-adjacent (light), Warm Soil mid-tone, Warm Soil dark.

**Minimum animation:** 4-frame walk cycle (arm swing arc > 20% of torso width); standing pause with head angled 30–45° toward habitat; hesitation frame before direction change.

---

### 5.3 Individual Animal Identity

Animals of the same species are visually identical by design. Identity is carried by three layers:

1. **Name** (primary) — displayed on enclosure nameplate, care screen header, all notifications.
2. **Trust Badge** (earned) — the only visual element that differs between same-species animals.
3. **Enclosure Level Number** — tag on habitat tile.

No color morphs, coat pattern variants, or size variants. One full sprite set per species.

---

### 5.4 Trust and Relationship Expression

**Core principle:** the animal's visual relationship with space expresses trust level.

| Trust State | Trust Value | Idle Pose | Eyes | Trust Badge | Habitat Effect |
|---|---|---|---|---|---|
| **Untamed** | 0–39 | Body angled away from center, weight toward perimeter | Level, guarded | None | None |
| **Bonding** | 40–67 | Oriented toward center, weight settling | Slightly softened at inner corners | Warm-amber dot, 8 dp | None |
| **Bonded / Thriving** | 68–79 | Fully centered, body facing camera, at-home posture | Soft inner-corner uplift, slight narrowing | Star outline, `#C8992A`, 10 dp | Faint pulse (30% halo) every 20–30 s |
| **Performer Ready** | 80–100 | Same as Bonded | Steady 3×3 dp warm specular dot in iris | Star filled, `#C8992A`, 10 dp | Pulse every 12–15 s at 40% amplitude |

What does NOT change with trust: base body color, silhouette shape, outline weight. No "glowing outline" — violates Quiet Hierarchy.

**The Thriving vs Content visual distinction:** A Content animal (stats green, trust < 68) has no ambient pulse. A Thriving animal does. The pulse is the visible proof of the bond.

---

## Section 6: Environment Design Language

> **Pillar alignment:** Quiet Hierarchy governs this entire section. The environment is the stage; the animal is the performance.

### 6.1 Architectural Style: Worn Naturalism

The zoo reads as a well-loved mid-twentieth century regional zoo — maintained by people who care deeply but have limited means. Not a modern municipal zoo (clinical steel/glass). Not a fantasy theme park. The feeling is a state nature reserve combined with a small-town botanical garden.

**Architectural vocabulary:**

**Pathways:** Compressed gravel or pale sandstone pavers. 2–3 px dark warm-brown border (Warm Soil `#8B5E3C`). Never poured concrete.

**Enclosure Signage:** Wooden plaques, rounded corners, Aged Linen background, species name in heading typeface. Trim color matches biome accent at 70% saturation — never full biome primary hue.

**Benches:** Slatted wood seat on cast-iron ends, dark green paint. Appear at Level 3+. Hierarchy Level 4 (receding).

**Fencing per biome:**

| Biome | Fence Type |
|---|---|
| Meadow | White picket fence, slightly aged |
| Pasture | Post-and-rail, natural wood |
| Woodland | Low mossy stone wall |
| Savanna | Stacked ochre rock + acacia thorn scrub |
| Polar Peaks | Timber uprights + stacked ice block base |
| Reptile House | Curved glass panel + brass fittings (interior) |
| Marine Cove | Rope-and-post, weathered timber |

Fence height: never exceeds 15% of enclosure vertical screen space. Alpha 85% maximum (open form, Level 4).

**Biome architectural character summary:**
- Meadow: domestic/village; picket fence; someone's backyard grew.
- Pasture: working farm; water troughs; hay-bale corners.
- Woodland: naturalist's field station; stone walls from landscape; carved totem at entrance.
- Savanna: open-range viewing station; low ochre-stone walls; elevated timber viewing platform.
- Polar Peaks: research outpost; timber+ice construction; frosted-glass lanterns.
- Reptile House: interior atrium; arched glass ceiling; brass specimen plaques.
- Marine Cove: maritime research station; porthole motif; anchor-and-chain details.

---

### 6.2 Texture Philosophy: Hand-Painted Stylized

Not PBR. Not flat vector. Surfaces look like rendered by an illustrator who studied real material and simplified it to its most expressive strokes. Why: Pillar alignment (handmade, not engine-asset), mobile legibility, biome distinctness, pipeline cost.

**Texture complexity scale by biome tier:**

| Biome | Complexity | Max Readable Detail at Mobile Zoom |
|---|---|---|
| Meadow | Minimal | Shape read only |
| Pasture | Simple | Shape + major grain direction |
| Woodland | Moderate | Shape + grain + 1–2 surface marks |
| Savanna | Moderate | Shape + grain + strata |
| Polar Peaks | Detailed | Shape + grain + highlight flare |
| Reptile House | Detailed | Shape + grain + structural geometry |
| Marine Cove | Rich | Shape + grain + surface marks + animated layer |

**Minimum detail rule:** No authored detail smaller than 8×8 dp in terrain textures.

**Specular approach — painted, not PBR:**
- Dry matte: flat, no specular.
- Slightly reflective: painted highlight stripe on top-facing surface edge.
- Wet/glossy: dedicated specular pass sprite at 60–80% alpha (animated for water only).
- Metal: painted highlight on left edge (10 o'clock light direction), dark line on right.

---

### 6.3 Prop Density Rules: Earned Richness

| Habitat Level | Slots | Props | Categories |
|---|---|---|---|
| Level 1 | 2 | 1–2 | Essential only (food station, water feature) |
| Level 2 | 3 | 3–4 | Essential + 1 environmental anchor + 1 enrichment hint |
| Level 3 | 4 | 5–6 | Essential + anchor + 2 enrichment + 1 pathway/visitor element |
| Level 4 | 5 | 7–9 | Full set + 1 biome-signature feature |
| Level 5 | 6 | 10–14 | Full set + secondary enrichment + ambient detail props |

**The 30% rule:** At full zoo view, props collectively must not cover more than 30% of enclosure ground area. The remaining 70% is the animal's visual stage.

**Prop grow-in animation:** New props scale from 0 → 100% over 600 ms ease-out.

**Attraction prop footprints:**
- Petting Area (Lv7): 1.5× pathway width
- Feeding Zone (Lv18): Medium
- Educational Shows (Lv26): Large — first theatrical prop set
- Animal Rides (Lv30): Large — dedicated track zone
- Performance Arena (Lv45): X-Large — architectural landmark from full zoom-out

---

### 6.4 Environmental Storytelling

**Care level visual states** — readable without any UI label:

| Element | Well-Cared | Neglected |
|---|---|---|
| Water feature | Clear (light blue-teal tint) | Murky grey-green overlay |
| Ground texture | Full-saturation for biome | Yellowed/dry variant |
| Food stations | Warm amber fill (full) | No fill; shadow implies empty bowl |
| Fences | Upright | 3–5° lean (sprite swap to "worn" variant) |
| Pathway | Clean | Leaf/debris particle scatter (warning signal) |
| Enclosure flowers | Present (conditional sprite) | Absent |
| Animals | Faint ambient glow | No glow |

**Reading order:** water color → ground texture → food station → fence alignment → pathway debris → animal glow (most subtle, reward for attention).

**Seasonal environmental changes:**

| Season | Ground | Particles | Sky tint |
|---|---|---|---|
| Spring | Bright mid-green + flower sprites at enclosure edges | Soft petal float (pink/white) | Warm pale blue |
| Summer | Full mid-green saturation, deepest richness | Dust mote drift | Clear warm amber-white |
| Autumn | Warm amber-ochre overlay | Falling leaf particles (amber, rust; 2–4/sec per enclosure) | Slightly cooled warm amber |
| Winter | Cool grey-white tint; snow on fence tops | Snow flurry | Cool grey-blue |

**Time-of-day changes:** Daytime (6:00–18:00) has visitor NPCs and warm ambient. Dusk (18:00–19:30) warms 15°, lanterns activate. Night (19:30–06:00) removes NPCs, cools to moonlight palette, reduces particles 50%, adds cool-blue overlay to enclosure ground (15% opacity). Dawn (05:30–06:30) reverses dusk.

**Founding moment:** On first placement, each attraction unfolds over 1.5 s scale-and-fade. Educational Shows+ play a banner-raise sprite. Fires once only.

---

## Section 7: UI/HUD Visual Direction

### 7.1 The Two-Layer Model: Screen-Space Frame + In-World Stage

**The rule:** the world is a stage; the HUD is the wings.

**Layer 1 — Screen-Space Interface (persistent):**

*Top HUD bar:* `#2B2318` warm dark brown, 85% opacity; Gold (left), Gems (center-left), XP/Level (center-right); height 52 pt; flush to safe-area top.

*Bottom tab bar:* `#2B2318` at 90% opacity; height 64 pt; active tab = warm-amber soft rectangle swatch (8 px radius, 25% opacity); inactive icons 55% opacity.

*Modals:* warm scrim `rgba(40, 28, 10, 0.55)`; Aged Linen card 20–24 px radius; 88% screen width; centered at 40% vertical — zoo world partially visible at top and bottom.

**Layer 2 — In-World Interface:**

*Care action buttons:* orbit animal in world-space; bloom outward on care-screen activation (250 ms, staggered 40 ms per button); hidden when inactive.

*Floating stat indicators:* compact icon + pill bar above habitat; visible only below 40% stat; below 15% — slow amber pulse.

*Income pop text:* `+NN 🪙` in Gold, floats upward, fades over 900 ms; no background pill.

**Quiet HUD Contract:** HUD occupies only top 52 pt and bottom 64 pt. The middle 80% belongs to the zoo always, except modals, care panels, and toasts.

---

### 7.2 Typography Direction

**Single typeface: Plus Jakarta Sans (already loaded via Google Fonts).**

| Role | Weight | Size |
|---|---|---|
| Animal name (care screen hero) | Bold 700 | 22 pt |
| Screen / panel title | SemiBold 600 | 18 pt |
| Primary CTA label | SemiBold 600 | 16 pt |
| Currency value | Bold 700 | 16 pt |
| Quest title | SemiBold 600 | 15 pt |
| Body / description | Regular 400 | 14 pt |
| Secondary labels / cost labels | Regular 400 | 13 pt |
| Micro captions (stat bar, tooltips) | Regular 400 | 11 pt (floor) |

**Rules:** No ExtraBold (800) anywhere in game UI. No second typeface. Hierarchy through weight/size/color only. All text containers use flex sizing (no fixed pixel widths). Tabular figures (`tnum`) for numeric displays.

---

### 7.3 Iconography Style: Outlined Soft-Fill

**Construction:** 2 pt stroke at 24×24 pt; all corners rounded (min 2 pt inner radius); fill at 30–40% opacity of semantic color. Geometric in construction; warm in execution.

**Currency icons (silhouette-locked):**
- Gold 🪙: Circle with inner coin-rim ring; `#C8992A`
- Gem 💎: Faceted diamond, 4-sided upper + 3-sided lower; `#7B5EA7`
- XP ⭐: Five-pointed star with soft inner-point arcs; `#4A7FA5`

**Care action icons (inside 52×52 pt circle buttons, 24×24 pt icon area):**
Feed = bowl with steam curves; Water = rounded droplet; Bathe = tub with bubbles; Play = bouncing ball with arc; Heal = plus with rounded caps.

**Trust stat icons:** Low trust = yellow-amber (not red — trust is a growth metric, not danger).

**Tab icons:** Zoo Map (folded map), Animals (paw print), Attractions (ferris wheel), Quests (scroll). All rounded terminals.

---

### 7.4 Animation Feel

**Two-speed model:** Interactive feedback 60–180 ms (fast); environmental/emotional 300–1,200 ms (slow).

**Key timings:**

| Interaction | Duration |
|---|---|
| Button press down | 60 ms ease-in |
| Button release | 120 ms ease-out |
| Tab switch | 200 ms ease-in-out |
| Stat bar fill | 280 ms ease-out |
| Care buttons bloom | 250 ms total, 40 ms stagger |
| Amber halo (care tap) | 400 ms expand + 900 ms fade = 1,300 ms |
| Toast enter | 160 ms ease-out |
| Toast hold | 1,700 ms |
| Reward pop-up | 300 ms with slight overshoot |
| Modal enter | 180 ms ease-out |
| Modal exit | 140 ms ease-in |

**Hard cap:** No UI animation > 1,500 ms.

**100 ms feedback contract:** Every tap produces a visible pressed state within one frame. Rejections show pressed state + return; never an error animation. Gated buttons: press-return + horizontal micro-shake (±4 pt, 200 ms).

**Reduce-motion:** Screen transitions → instant crossfade 50 ms; care button bloom → instant appear; amber halo → fade-in-place 400 ms; stat fill → instant; toast → fade only.

---

### 7.5 Design Tokens Reference

Key tokens for UI Toolkit USS:

| Token | Value |
|---|---|
| `--ui-panel-bg` | `#F2EBD9` |
| `--ui-hud-bg` | `rgba(43, 35, 24, 0.85)` |
| `--ui-shadow` | `rgba(40, 28, 10, 0.18)` |
| `--color-positive` | `#5A9A5F` |
| `--color-danger` | `#B5413A` |
| `--color-currency-gold` | `#C8992A` |
| `--color-currency-gem` | `#7B5EA7` |
| `--color-xp` | `#4A7FA5` |
| `--color-cta-primary` | `#D48B3A` |
| `--color-disabled` | `#B8B0A2` |
| `--radius-panel` | `14px` |
| `--radius-modal` | `22px` |
| `--radius-pill` | `9999px` |
| `--font-family-ui` | `Plus Jakarta Sans, sans-serif` |

---

## Section 8: Asset Standards

### 8.1 File Formats

| Asset Category | Format | Notes |
|---|---|---|
| All sprites (characters, environment, UI, props) | PNG-32 (RGBA) | Lossless; transparency required; source for Unity import |
| Habitat background panels | PNG-32 or PNG-24 | Lossless; must seam without artifacts |
| Full-screen illustrated panels | JPG quality 90 | No transparency; large textures |
| Audio SFX (< 2 s) | WAV 44.1 kHz 16-bit | Instant trigger response; no decode latency |
| Audio SFX (≥ 2 s), ambience, vocalisations | OGG Vorbis q5 | Stream from disk |
| Music tracks | OGG Vorbis q5–q7 | Significantly smaller than WAV for looping ambient |

**Never deliver WebP to Unity.** All sources must be PNG or JPG.

---

### 8.2 Naming Convention

Format: `[category]_[name]_[variant]_[descriptor].[ext]`

| Prefix | Category |
|---|---|
| `char_` | Character sprites (animals, visitors, NPCs) |
| `env_` | Environment tiles and decorations |
| `ui_` | UI components (buttons, panels, icons, modals) |
| `vfx_` | Particle sprite sheets and VFX |
| `anim_` | Sprite sheets for frame-by-frame animation |
| `icon_` | Small standalone icons |
| `audio_` | Audio assets |
| `atlas_` | Generated sprite atlases (do not hand-name) |

**Examples:**
- `char_elephant_idle_01.png` · `char_elephant_care_01.png` · `char_elephant_portrait_card.png`
- `env_savanna_rock-formation_large.png` · `env_meadow_grass-tile_a.png`
- `ui_btn-primary_default.png` · `ui_btn-primary_pressed.png`
- `icon_currency-coin_md.png` · `icon_stat-hunger_sm.png` (sizes: `sm`=48px, `md`=96px, `lg`=192px)
- `anim_elephant_idle_sheet.png` · `vfx_care-bloom_loop_sm.png`
- `audio_sfx_btn-tap_01.wav` · `audio_music_meadow-ambient_loop.ogg`

---

### 8.3 Folder Structure

```
Assets/
├── Art/
│   ├── Characters/
│   │   └── [Species]/
│   │       ├── Sprites/          # Individual PNG frames
│   │       ├── AnimSheets/       # Packed sprite sheets
│   │       └── Portraits/        # Card thumbnails
│   ├── Environment/
│   │   ├── Meadow/ Pasture/ Woodland/ Savanna/ PolarPeaks/ ReptileHouse/ MarineCove/
│   │   │   ├── Tiles/ · Props/ · Backgrounds/
│   ├── UI/
│   │   ├── Buttons/ · Panels/ · Modals/
│   │   └── Icons/
│   │       ├── Currency/ · Stats/ · Species/
│   ├── VFX/
│   │   ├── Particles/ · SpriteSheets/
│   └── Atlases/                  # Generated outputs — do not edit
├── Audio/
│   ├── Music/ · SFX/ (UI/ · Animals/ · Ambience/)
├── Animations/
│   └── [Species]/
├── Materials/
│   ├── Sprites/ · Particles/ · Lighting/
└── Prefabs/
    ├── Characters/ · Environment/ · UI/
```

---

### 8.4 Texture Resolution Tiers

| Asset Category | Resolution | Notes |
|---|---|---|
| Hero animal — care screen | 512×512 px | Largest sprite; one per species per state |
| Hero animal — zoo habitat view | 256×256 px | All standard idle/walk frames |
| Hero animal — card thumbnail | 128×128 px | Collection grid, adoption shop |
| Hero animal — notification/badge | 64×64 px | HUD alert; silhouette only |
| Habitat background panel | 1024×512 px | Two panels cover screen width + scroll buffer |
| Habitat midground tile | 256×256 px | Must seam |
| Props — small (flower, stone) | 64×64 to 128×128 px | |
| Props — large (tree, rock) | 256×512 px | Max 2 per visible habitat section |
| UI panel / modal | 9-slice at 64×64 px corners | Corners/edges defined; 1 px centre fill |
| Icons — `sm` / `md` / `lg` | 48 / 96 / 192 px | Delivered at 2× density |
| VFX particle sprite | 64×64 px per frame | |
| VFX sheet (8 frames) | 512×64 px | One-row horizontal strip |

**Swap rule:** 512×512 hero sprite only on entering the care screen. 256×256 is sufficient at all other zoom levels.

**Atlas budget:** Max 2048×2048 px per atlas. Split by function: `atlas_ui_core`, `atlas_icons_all`, `atlas_env_meadow`, etc. Never mix UI and environment in the same atlas. Never pack animation sheets into atlases.

---

### 8.5 Animation Standards

**Required states — all animals:**

| State | Frames | FPS | Notes |
|---|---|---|---|
| `idle` | 8–12 | 12 | Loop seamlessly (first/last frame compatible) |
| `walk-cycle` | 8 | 12 | Loop seamlessly |
| `care-response` | 10–14 | 24 | Returns to `idle` on completion |
| `sleep` | 6–8 | 8 | Night/drowsy state |
| `happy-emote` | 12–16 | 24 | Brief peak expression at full happiness |
| `arrival` | 14–18 | 24 | Single-shot on first habitat placement |

**Sprite sheet layout:** Horizontal single-row strips. `frame_width × frame_count` wide × `frame_height` tall. No padding between frames. Include `[species]_[state]_sheet_meta.txt` sidecar (frame count, width, height, fps).

**Sprite-based vs particle:**
- Care-response halo, care-tap impact: sprite sheet (artist control, precise shape)
- Coin/currency collect, ambient leaf/water, achievement scatter: particle system
- Species reveal bloom: layered (particle motes + sprite centre glow)

---

### 8.6 Material and Rendering Standards

| Sprite Category | Material | Shader |
|---|---|---|
| Characters, environment bg/props | Sprite-Lit-Default | URP/2D/Sprite-Lit-Default |
| All UI elements | Sprite-Unlit-Default | URP/2D/Sprite-Unlit-Default |
| Particle sprites | Particles/Universal Unlit | URP/Particles/Unlit |

**No custom shaders for art-complete milestone.** Custom shaders (outline, dissolve, water ripple) are a post-MVP technical-artist task.

**Outlines are drawn into the source sprite, not applied via shader:**
- Animals in habitat view (256×256): 2–3 px outline, `rgba(40, 28, 10, 0.85)` (warm near-black)
- Small animals at card size (128×128): 3–4 px for legibility
- Animals at care screen (512×512): 2–3 px (slightly lighter to avoid heaviness)
- UI elements: no outline
- Small foreground props: 1 px warm outline where needed

**2D Lights — hard budget per screen:**
- 1 Global Light (always)
- Max 2 Spot Lights (care interactions or featured animals)
- Max 6 Point Lights (lanterns, glows)
- **Total max: 9 active 2D lights**

**Cast shadows:** Object shadows = baked into environment sprite or separate shadow sprite at ~20% opacity. No real-time shadow casting on mobile. Animal shadow = reusable blob sprite (`env_[biome]_animal-shadow_generic.png`) below animal in sort order.

**Particle budget per screen:**

| Context | Max Particles | Max Systems |
|---|---|---|
| Idle zoo view | 150 | 4 |
| Care screen idle | 80 | 2 |
| Care response | 200 peak → 80 | 3 |
| Species reveal | 300 peak → 0 | 3 |
| Achievement / level-up | 250 peak → 0 | 2 |
| Menu / HUD only | 0 | 0 |

On low-end mobile: all counts halved via quality-tier setting.

---

## Section 9: Reference Direction

> These references are a dissection kit, not a mood board. Take the named technique from each source; leave everything else behind. Together they compose into something that resembles none of them individually.

### Approved Reference Sources

#### R-01 — Planet Zoo (Frontier Developments, 2019)
**Domain:** Environment design, habitat realism, biome layering

**Take exactly this:** Frontier's *readable depth through foliage density gradients* — foreground plants are large, high-contrast silhouettes; mid-ground flora drops in saturation and scale ~30%; background vegetation becomes near-flat color fields. Three-plane rule keeps habitats legible at mobile sizes without sacrificing the sense of a deep, inhabited space.

**Do NOT copy:** Hyper-detailed photorealistic fur/skin shading. Grey-blue shadow tones (our shadows stay warm). Complex brushed-metal UI chrome (our UI is matte, organic).

**Informs:** §3 (habitat layering), §4 (biome depth), §6 (environment tiers).

---

#### R-02 — Stardew Valley (ConcernedApe, 2016)
**Domain:** Sprite warmth, seasonal color shifts, economy of detail

**Take exactly this:** The *seasonal tint overlay principle* — ambient color temperature shifts uniformly across all sprites, not per-asset relit. Also the *8-frame minimum idle loop*: even static objects have at least one subtle ambient animation cycle (shadow pulse, leaf micro-sway).

**Do NOT copy:** Pure-black pixel outlines (our geometry uses inner-shadow depth cues, no black outlines). 16×16 px grid density. Saturation spikes on UI (bright-red hearts, vivid yellow gold).

**Informs:** §4 (tint overlays), §5 (idle loops), §7 (palette compliance).

---

#### R-03 — Studio Ghibli Background Paintings
*(Totoro forest interiors and Spirited Away establishing shots — not character design)*

**Domain:** Light quality, texture warmth, the "living place" feeling

**Take exactly this:** The *light-leak as emotional signal* technique — a shaft of warm light or single glowing window always appears in the mid-ground, not as a gameplay signal but as an emotional anchor that tells the player "this place is cared for." Every biome must have one designated warm-light anchor point painted into the background. Also the *"evidence of habitation" rule*: worn paths, stacked crates, a bucket near water — always hand-painted into environment assets.

**Do NOT copy:** Ghibli character design vocabulary (large eyes, rubbery bodies). Blue-grey atmospheric wash (our atmosphere uses Aged Linen + River Stone). Narrative surrealism.

**Informs:** §4 (light anchors), §3 (habitat storytelling details), §5 (ambient light behavior).

---

#### R-04 — Naomi Okubo — Opacity-Layered Pattern Technique
*(Contemporary decorative pattern painting — specifically the repeating organic motif layering)*

**Domain:** Surface texture language, UI panel texture, pattern grammar

**Take exactly this:** The *opacity-layered repeat motif* — the same leaf/pebble/branch silhouette at three opacity levels (100%, 45%, 15%) builds surface texture on flat color fields. Applied to UI panels and habitat floor tiles, this creates warmth without new colors — texture built from existing palette at partial transparency.

**Do NOT copy:** High-density full-surface pattern coverage (we use pattern only as a 15% background whisper). Figurative/portrait motifs.

**Informs:** §6 (UI panel texture), §3 (surface material language).

---

#### R-05 — Alba: A Wildlife Adventure (ustwo games, 2020)
**Domain:** Mobile-scale animal readability, care-action iconography

**Take exactly this:** The *action-first silhouette rule* — every animal's idle pose must have its most emotionally communicative feature (ear droop, tail-up alert) readable as a silhouette at 64×64 px. Also the structural *care-icon urgency-tier color coding* principle: one color family per urgency state (neutral, needs-attention, urgent), color shift is the primary signal.

**Do NOT copy:** Flat cel-shaded animals with no midtone layer (our animals use hand-painted texture). Primary-color brightness of Alba's UI (ours is muted-vibrant). Photographic background compositing.

**Informs:** §6 (animal idle pose requirements), §7 (care-action icon system), §4 (urgency-state color tiers).

---

### Style Prohibitions

The following visual treatments are explicitly forbidden. Flag any asset for immediate revision before integration.

| # | Prohibition | Why |
|---|---|---|
| SP-01 | Outlines wider than 3 px on any character or environment asset | Collapses warmth into cartoon territory; destroys depth illusion |
| SP-02 | Any surface color saturation exceeding 70% (HSL) | Pushes into neon/toy range; violates muted-vibrant contract |
| SP-03 | Pure white (HSL lightness ≥ 97%) as a surface or background | Reads as sterile UI; contradicts Aged Linen as neutral ceiling |
| SP-04 | Pure black (HSL lightness ≤ 4%) in any fill, shadow, or outline | Flattens depth; shadows must use Warm Soil or Canopy Dusk |
| SP-05 | Rubber-toy volumetric shading (highlight top, shadow bottom, no midtone) | Produces plastic-toy read; all shaded objects need at least one midtone band |
| SP-06 | Drop shadows with opacity above 35% or blur radius below 4 px | Hard drop shadows read as legacy mobile-game chrome |
| SP-07 | UI panel corner radius below 8 px or above 50% of the shorter side | Below 8 px = corporate/sharp; above 50% = bubble-gum pill competing with CTAs |
| SP-08 | Gradient fills transitioning across more than two hue steps | Multi-stop gradients read as iridescent/holographic; transitions must be tonal not spectral |
| SP-09 | Flashing or strobing animation above 1 Hz | Accessibility rule (photosensitive players); urgency signals use color shift or scale pulse, not flash |
| SP-10 | Photographic textures composited directly into illustrated assets | Breaks the hand-painted material language |
