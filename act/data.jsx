// ============================================================
// ANIMAL WORLD ZOO — game data (single source of truth)
// A slow, sustainable idle zoo-builder. Numbers tuned for
// deliberate, months-long progression.
// ============================================================

// ---- Care stats (5) ----------------------------------------
const STATS = [
  { key:'hunger', name:'Hunger',      icon:'🍖', color:'#EF4B5C', desc:'Decays −6/hr. Low hunger cuts happiness (→ appeal) & XP gain.' },
  { key:'thirst', name:'Thirst',      icon:'💧', color:'#34B6F0', desc:'Decays −8/hr. Fastest-draining need; cheap to top up.' },
  { key:'clean',  name:'Cleanliness', icon:'🫧', color:'#36C98A', desc:'Habitat hygiene. Dirty pens lower visitor satisfaction.' },
  { key:'happy',  name:'Happiness',   icon:'😊', color:'#FFB22E', desc:'Outcome of all needs + decor. Drives visitor appeal.' },
  { key:'trust',  name:'Trust',       icon:'❤️', color:'#FF7FA8', desc:'Built slowly through daily care. Gates attractions & performance.' },
];

// ---- Care actions (6) --------------------------------------
const ACTIONS = [
  { key:'feed',  name:'Feed',   icon:'🍖', color:'#EF4B5C', cost:40, effect:{hunger:+100}, stat:'hunger', note:'Buy food — price scales with species.' },
  { key:'water', name:'Water',  icon:'💧', color:'#34B6F0', cost:10, effect:{thirst:+100}, stat:'thirst', note:'Refill the water trough.' },
  { key:'clean', name:'Bathe',  icon:'🫧', color:'#36C98A', cost:20, effect:{clean:+100}, stat:'clean', note:'Bathe & clean the habitat.' },
  { key:'play',  name:'Play',   icon:'🎾', color:'#FFB22E', cost:0,  effect:{happy:+100, trust:+4}, stat:'happy', note:'Boosts happiness & a little trust.' },
  { key:'heal',  name:'Health', icon:'➕', color:'#7C5CFF', cost:30, effect:{happy:+40, trust:+2}, stat:'happy', note:'Vet check / vaccinate; clears sickness.' },
];

// ---- Taming difficulty -------------------------------------
const TAMING = {
  'Very Easy': { rank:1, color:'#36C98A', time:'instant',  note:'Tames on adopt.' },
  'Easy':      { rank:2, color:'#7FC241', time:'2–4 h',    note:'Light daily care.' },
  'Medium':    { rank:3, color:'#FFB22E', time:'1–2 days', note:'Sustained trust needed.' },
  'Hard':      { rank:4, color:'#F2960B', time:'3–5 days', note:'Better facilities required.' },
  'Expert':    { rank:5, color:'#EF7B4B', time:'1–2 wks',  note:'High zoo level + specialist habitat.' },
  'Master':    { rank:6, color:'#EF4B5C', time:'3+ wks',   note:'Endgame challenge animals.' },
};

// ---- Animal roster (7 tiers) -------------------------------
// appeal = visitor draw (how attractive this animal makes the zoo). Higher tier = rarer = more
//          appealing. Appeal → visitors → gold/hr (see the ZOO ECONOMY MODEL in prototype.jsx).
//          Values are monotonic with unlock level so a later animal is always at least as appealing.
// perform = eligible for the Performance attraction.
const ANIMALS = [
  // Starter
  { key:'rabbit',  emoji:'🐰', name:'Clover',  species:'Rabbit',       tier:0, habitat:'meadow', taming:'Very Easy', appeal:3,     unlock:'Start',   perform:false, bg:'#FFE0E6' },
  { key:'chicken', emoji:'🐔', name:'Henrietta',species:'Chicken',     tier:0, habitat:'meadow', taming:'Very Easy', appeal:8,     unlock:'Start',   perform:false, bg:'#FFEFC2' },
  { key:'duck',    emoji:'🦆', name:'Puddles', species:'Duck',         tier:0, habitat:'meadow', taming:'Very Easy', appeal:14,    unlock:'Tutorial',perform:false, bg:'#D4ECF5' },
  { key:'dog',     emoji:'🐶', name:'Biscuit', species:'Dog',          tier:0, habitat:'meadow', taming:'Very Easy', appeal:30,    unlock:'Lv3',     perform:true,  bg:'#FFE6C7' },
  // Tier 1
  { key:'cat',     emoji:'🐱', name:'Mittens', species:'Cat',          tier:1, habitat:'meadow', taming:'Easy',   appeal:50,    unlock:'Lv5',     perform:false, bg:'#FFE0CC' },
  { key:'goat',    emoji:'🐐', name:'Pebble',  species:'Goat',         tier:1, habitat:'pasture',taming:'Easy',   appeal:70,    unlock:'Lv6',     perform:false, bg:'#ECE4D6' },
  { key:'sheep',   emoji:'🐑', name:'Cloud',   species:'Sheep',        tier:1, habitat:'pasture',taming:'Easy',   appeal:85,    unlock:'Lv8',     perform:false, bg:'#F0EFEA' },
  // Tier 2
  { key:'horse',   emoji:'🐴', name:'Comet',   species:'Horse',        tier:2, habitat:'pasture',taming:'Easy',   appeal:130,   unlock:'Lv11',    perform:false, bg:'#E8D8C4' },
  { key:'donkey',  emoji:'🫏', name:'Jasper',  species:'Donkey',       tier:2, habitat:'pasture',taming:'Easy',   appeal:150,   unlock:'Lv13',    perform:false, bg:'#E2D6C8' },
  { key:'alpaca',  emoji:'🦙', name:'Tofu',    species:'Alpaca',       tier:2, habitat:'pasture',taming:'Medium', appeal:170,   unlock:'Lv15',    perform:false, bg:'#F2E2D0' },
  { key:'cow',     emoji:'🐄', name:'Daisy',   species:'Cow',          tier:2, habitat:'pasture',taming:'Easy',   appeal:190,   unlock:'Lv17',    perform:false, bg:'#EFEAE2' },
  // Tier 3
  { key:'fox',     emoji:'🦊', name:'Ember',   species:'Fox',          tier:3, habitat:'woodland',taming:'Medium',appeal:230,   unlock:'Lv20',    perform:false, bg:'#FFD9C2' },
  { key:'monkey',  emoji:'🐵', name:'Mango',   species:'Monkey',       tier:3, habitat:'woodland',taming:'Medium',appeal:260,   unlock:'Lv23',    perform:true,  bg:'#FFE0CC' },
  { key:'raccoon', emoji:'🦝', name:'Bandit',  species:'Raccoon',      tier:3, habitat:'woodland',taming:'Medium',appeal:290,   unlock:'Lv25',    perform:false, bg:'#E7E2DA' },
  { key:'wolf',    emoji:'🐺', name:'Shadow',  species:'Wolf',         tier:3, habitat:'woodland',taming:'Hard',  appeal:330,   unlock:'Lv28',    perform:false, bg:'#DDE2E8' },
  // Tier 4
  { key:'zebra',   emoji:'🦓', name:'Pyjama',  species:'Zebra',        tier:4, habitat:'savanna',taming:'Medium', appeal:400,   unlock:'Lv32',    perform:false, bg:'#ECECEC' },
  { key:'giraffe', emoji:'🦒', name:'Stretch', species:'Giraffe',      tier:4, habitat:'savanna',taming:'Hard',   appeal:470,   unlock:'Lv36',    perform:false, bg:'#FFE7B3' },
  { key:'rhino',   emoji:'🦏', name:'Tank',    species:'Rhinoceros',   tier:4, habitat:'savanna',taming:'Hard',   appeal:540,   unlock:'Lv40',    perform:false, bg:'#DEDEE2' },
  { key:'hippo',   emoji:'🦛', name:'Bubbles', species:'Hippopotamus', tier:4, habitat:'savanna',taming:'Hard',   appeal:610,   unlock:'Lv44',    perform:false, bg:'#D8DDE2' },
  { key:'lion',    emoji:'🦁', name:'Leo',     species:'Lion',         tier:4, habitat:'savanna',taming:'Expert', appeal:700,   unlock:'Lv48',    perform:false, bg:'#FFE3B3' },
  // Tier 5
  { key:'elephant',emoji:'🐘', name:'Nellie',  species:'Elephant',     tier:5, habitat:'savanna',taming:'Hard',   appeal:850,   unlock:'Lv54',    perform:true,  bg:'#DDE7F0' },
  { key:'brownbear',emoji:'🐻',name:'Barnaby', species:'Brown Bear',   tier:5, habitat:'polar',  taming:'Expert', appeal:1000,  unlock:'Lv60',    perform:false, bg:'#EADBC8' },
  { key:'polarbear',emoji:'🐻‍❄️',name:'Frost', species:'Polar Bear',   tier:5, habitat:'polar',  taming:'Expert', appeal:1150,  unlock:'Lv66',    perform:false, bg:'#E3EEF7' },
  // Tier 6
  { key:'turtle',  emoji:'🐢', name:'Shelly',  species:'Turtle',       tier:6, habitat:'reptile',taming:'Easy',   appeal:1350,  unlock:'Lv70',    perform:false, bg:'#D7F0E2' },
  { key:'python',  emoji:'🐍', name:'Noodle',  species:'Python',       tier:6, habitat:'reptile',taming:'Expert', appeal:1550,  unlock:'Lv74',    perform:false, bg:'#E0EAD4' },
  { key:'croc',    emoji:'🐊', name:'Snap',    species:'Crocodile',    tier:6, habitat:'reptile',taming:'Master', appeal:1800,  unlock:'Lv80',    perform:false, bg:'#D4E4D0' },
  // Tier 7
  { key:'seal',    emoji:'🦭', name:'Pearl',   species:'Seal',         tier:7, habitat:'marine', taming:'Hard',   appeal:2100,  unlock:'Lv84',    perform:true,  bg:'#D4ECF5' },
  { key:'sealion', emoji:'🦭', name:'Captain', species:'Sea Lion',     tier:7, habitat:'marine', taming:'Expert', appeal:2500,  unlock:'Lv88',    perform:true,  bg:'#CFE6F2' },
  { key:'dolphin', emoji:'🐬', name:'Echo',    species:'Dolphin',      tier:7, habitat:'marine', taming:'Expert', appeal:3000,  unlock:'Lv92',    perform:true,  bg:'#D4ECF5' },
];

const TIERS = [
  { t:0, name:'Starter',  theme:'Local farm corner', span:'Lv1–4' },
  { t:1, name:'Tier 1',   theme:'Friendly companions', span:'Lv5–10' },
  { t:2, name:'Tier 2',   theme:'Farmstead & pasture', span:'Lv11–19' },
  { t:3, name:'Tier 3',   theme:'Woodland natives', span:'Lv20–31' },
  { t:4, name:'Tier 4',   theme:'African savanna', span:'Lv32–53' },
  { t:5, name:'Tier 5',   theme:'Giants & bears', span:'Lv54–69' },
  { t:6, name:'Tier 6',   theme:'Reptile house', span:'Lv70–83' },
  { t:7, name:'Tier 7',   theme:'Marine cove', span:'Lv84–92' },
];

// ---- Habitats ----------------------------------------------
const HABITATS = [
  { key:'meadow',  name:'Meadow',       icon:'🌾', tint:'#E3F2DC', unlock:'Start',  holds:'Rabbit · Chicken · Duck · Dog · Cat' },
  { key:'pasture', name:'Pasture',      icon:'🐎', tint:'#EFEAD8', unlock:'Lv6',    holds:'Goat · Sheep · Horse · Donkey · Alpaca · Cow' },
  { key:'woodland',name:'Woodland',     icon:'🌲', tint:'#DDEAD9', unlock:'Lv20',   holds:'Fox · Monkey · Raccoon · Wolf' },
  { key:'savanna', name:'Savanna',      icon:'🌅', tint:'#FBE6C9', unlock:'Lv32',   holds:'Zebra · Giraffe · Rhino · Hippo · Lion · Elephant' },
  { key:'polar',   name:'Polar Peaks',  icon:'❄️', tint:'#E3EEF7', unlock:'Lv60',   holds:'Brown Bear · Polar Bear' },
  { key:'reptile', name:'Reptile House',icon:'🦎', tint:'#E0EAD4', unlock:'Lv70',   holds:'Turtle · Python · Crocodile' },
  { key:'marine',  name:'Marine Cove',  icon:'🌊', tint:'#D4ECF5', unlock:'Lv84',   holds:'Seal · Sea Lion · Dolphin' },
];
// habitat upgrade ladder (per habitat)
const HAB_UPGRADE = [
  { lv:1, slots:2, income:'×1.0', cost:'—' },
  { lv:2, slots:3, income:'×1.3', cost:'2,500 🪙' },
  { lv:3, slots:4, income:'×1.7', cost:'14,000 🪙' },
  { lv:4, slots:5, income:'×2.2', cost:'68,000 🪙' },
  { lv:5, slots:6, income:'×3.0', cost:'320,000 🪙' },
];

// ---- Attractions -------------------------------------------
const ATTRACTIONS = [
  { key:'petting',  name:'Petting Area',     icon:'🤲', unlock:'Lv7',  cost:500,   effect:'+12% visitors', desc:'Visitors interact with Very Easy / Easy animals. Needs Trust ≥ 40.' },
  { key:'feeding',  name:'Feeding Zone',     icon:'🥕', unlock:'Lv18', cost:2500,  effect:'+15% revenue',  desc:'Visitors buy food to feed selected animals — a steady gold tap.' },
  { key:'shows',    name:'Educational Shows',icon:'🎤', unlock:'Lv26', cost:16000, effect:'+18% reputation',desc:'Animals demonstrate natural behaviours on a timed schedule.' },
  { key:'rides',    name:'Animal Rides',     icon:'🐎', unlock:'Lv30', cost:9000,  effect:'+20% revenue',  desc:'Horse · camel · ostrich · elephant rides. Premium ticket.' },
  { key:'perform',  name:'Performance Arena',icon:'🎪', unlock:'Lv45', cost:45000, effect:'+25% revenue',  desc:'Trained, high-trust animals perform routines. The marquee attraction.' },
];

// ---- Performance (late-game) -------------------------------
const PERF_SKILLS = ['Ball balancing','Dancing','Jumping','Fetching','Team routines'];
const PERFORMERS = ['Dog','Monkey','Elephant','Seal','Sea Lion','Dolphin']; // matches every ANIMALS entry with perform:true

// ---- Currencies --------------------------------------------
const CURRENCIES = [
  { key:'gold', name:'Gold',          icon:'🪙', type:'Soft',    bg:'#FFEFC2', use:'Care, habitat & facility upgrades, animal unlocks' },
  { key:'gems', name:'Gems',          icon:'💎', type:'Hard',    bg:'#D4ECF5', use:'Speed-ups, cosmetics, VIP, decor themes (never animals)' },
  { key:'xp',   name:'Zoo XP',        icon:'⭐', type:'Level',   bg:'#E8E0FF', use:'Raises global Zoo Level — gates all content' },
  { key:'tokens',name:'Conservation', icon:'🌿', type:'Event',   bg:'#D7F0E2', use:'Event shop · seasonal animals & decor' },
  { key:'rep',  name:'Reputation',    icon:'🏅', type:'Meter',   bg:'#FFE3B3', use:'Star rating — multiplies visitor count (not spent)' },
];

// ---- Economy: sources & sinks ------------------------------
const SOURCES = [
  { src:'Visitor gate income',  cur:'Gold', rate:'passive / sec',   note:'Σ animal appeal → visitors × spend/head × attractions.' },
  { src:'Idle / offline',       cur:'Gold', rate:'~60% active rate',note:'Cap 8h free · 24h VIP. Deliberately modest.' },
  { src:'Attraction revenue',   cur:'Gold', rate:'per attraction',  note:'Feeding, rides & shows stack multipliers.' },
  { src:'Care & objectives',    cur:'Zoo XP',rate:'steady',         note:'Every feed, clean & milestone grants XP.' },
  { src:'Daily missions',       cur:'Gems', rate:'5–15 / day',      note:'Small, reliable hard-currency trickle.' },
  { src:'Seasonal events',      cur:'Tokens',rate:'event track',    note:'Limited conservation animals & decor.' },
];
const SINKS = [
  { sink:'Animal care',         cur:'Gold', cost:'25–600 / action', note:'Constant low-grade drain; scales with tier.' },
  { sink:'Habitat upgrade',     cur:'Gold', cost:'2.5k–320k',       note:'Primary long-term sink — slots & income.' },
  { sink:'Facility upgrade',    cur:'Gold', cost:'5k–500k',         note:'Food, water, vet, ticket office.' },
  { sink:'Animal unlock',       cur:'Gold', cost:'0.5k–250k',       note:'Gated by Zoo Level — earned, never sold.' },
  { sink:'Attraction build',    cur:'Gold', cost:'40k–900k',        note:'Big milestone purchases.' },
  { sink:'Speed-up / cosmetic', cur:'Gems', cost:'5–600',           note:'Convenience & decor only.' },
];

// ---- Zoo Level milestones ----------------------------------
const LEVELS = [
  { lv:1,  xp:0,       unlock:'Meadow habitat · Rabbit · ticket gate' },
  { lv:7,  xp:5200,    unlock:'Petting Area · Cat · daily missions' },
  { lv:18, xp:42000,   unlock:'Feeding Zone · Pasture full · Tier 2' },
  { lv:30, xp:210000,  unlock:'Animal Rides · Woodland · Tier 3' },
  { lv:45, xp:980000,  unlock:'Performance Arena · Lion · Tier 4' },
  { lv:60, xp:3600000, unlock:'Polar Peaks · bears · Tier 5' },
  { lv:84, xp:18000000,unlock:'Marine Cove · Tier 7 · endgame loop' },
];

// ---- Idle --------------------------------------------------
const IDLE = [
  { k:'Gold',          v:'~60% of active', note:'Visitor gate keeps earning while away.' },
  { k:'Zoo XP',        v:'reduced trickle',note:'Care XP pauses; only passive milestones bank.' },
  { k:'Attraction rev',v:'full',           note:'Attractions run autonomously offline.' },
  { k:'Cap',           v:'8h free / 24h VIP',note:'Modest cap nudges a daily return.' },
];

// ---- Retention ---------------------------------------------
const FUNNEL = [ { d:'D1', pct:42 }, { d:'D7', pct:22 }, { d:'D30', pct:12 }, { d:'D90', pct:6 } ];
const ACTIVITIES = {
  daily:  ['Collect gate income','Feed & water all animals','Clean 3 habitats','Complete 1 show','Claim daily login'],
  weekly: ['Earn 2M gold','Raise 1 animal to max trust','Upgrade a habitat','Finish weekly mission set'],
  monthly:['Seasonal event clear','Unlock the month\u2019s feature animal','Conservation milestone','Photo-mode contest'],
};

// ---- LiveOps events ----------------------------------------
const EVENTS = [
  { name:'Spring Hatchlings', icon:'🌸', when:'Mar–Apr', len:'14 days', reward:'Baby-animal decor + Peacock', mechanic:'Hatch eggs by completing care streaks' },
  { name:'Safari Summer',     icon:'🌞', when:'Jun–Jul', len:'18 days', reward:'Cheetah (conservation)',      mechanic:'Expedition map; tokens from savanna shows' },
  { name:'Spooky Night Zoo',  icon:'🎃', when:'Oct',     len:'10 days', reward:'Bat habitat theme',           mechanic:'After-dark visitor mode, candy goals' },
  { name:'Winter Conservation',icon:'❄️',when:'Dec–Jan', len:'21 days', reward:'Red Panda + snow decor',      mechanic:'Co-op donation drive, advent gifts' },
];
const CADENCE = [
  { cad:'Daily',    items:'Login · 5 missions · shop deal · rewarded-ad gold boost' },
  { cad:'Weekly',   items:'4 weekly missions · weekend 2× idle · featured habitat' },
  { cad:'Monthly',  items:'Seasonal event · feature animal · conservation milestone' },
  { cad:'Quarterly',items:'New tier or biome · balance pass · endgame content drop' },
];

// ---- Monetization ------------------------------------------
const IAP = [
  { name:'Pouch of Gems',  gems:80,    price:'$0.99',  best:false },
  { name:'Bag',            gems:500,   price:'$4.99',  best:false },
  { name:'Keeper\u2019s Chest', gems:1200, price:'$9.99', best:true },
  { name:'Director Vault', gems:2600,  price:'$19.99', best:false },
  { name:'Patron Crate',   gems:7000,  price:'$49.99', best:false },
  { name:'Founder Hoard',  gems:16000, price:'$99.99', best:false },
];
const OFFERS = [
  { name:'Starter Decor Bundle', price:'$2.99',   contents:'Premium meadow theme + 400💎', tag:'One-time · 1st week' },
  { name:'Event Pass',           price:'$4.99',   contents:'Premium event track + cosmetic animal skin', tag:'Per event' },
  { name:'VIP Membership',       price:'$7.99/mo',contents:'24h idle cap, 2× daily gems, no ads, VIP decor', tag:'Subscription' },
  { name:'Habitat Theme Pack',   price:'$5.99',   contents:'Exclusive biome reskin (cosmetic)', tag:'Cosmetic' },
];
const KPI = [
  { label:'Target ARPDAU',   value:'$0.09',  delta:'blended (cosmetic-led)' },
  { label:'Payer conversion',value:'2.6%',   delta:'D30 cohort' },
  { label:'D1 / D7 / D30',   value:'42/22/12',unit:'%', delta:'retention' },
  { label:'Avg session',     value:'5.4',    unit:'min', delta:'2.8 sessions/day' },
];

// ---- Tutorial (7 steps, from brief) ------------------------
const TUTORIAL = [
  { t:'Welcome',          d:'Intro the zoo & the first Meadow habitat.', reward:'1 Rabbit' },
  { t:'Feed the rabbit',  d:'Guided tap on the hunger meter → Feed.',    reward:'Gold' },
  { t:'Clean the habitat',d:'Guided tap → Clean the Meadow.',            reward:'Zoo XP' },
  { t:'Collect income',   d:'Tap the floating gold at the gate.',        reward:'Unlock Duck' },
  { t:'Upgrade Habitat A',d:'Spend gold to add an animal slot.',         reward:'+1 slot' },
  { t:'Visitor happiness', d:'Explain how needs → satisfaction → income.',reward:'Starter decoration' },
  { t:'Zoo level',        d:'Introduce global level progression.',       reward:'Unlock Daily Missions' },
];

// ---- 90-day journey ----------------------------------------
const PLAN90 = [
  { day:'D1',     lv:'Lv1–4',   focus:'FTUE, first 4 starter animals, first habitat upgrade', goal:'Finish tutorial, collect first idle reward' },
  { day:'D2–7',   lv:'Lv5–10',  focus:'Petting Area, Tier 1, daily mission habit',            goal:'D7 return; first attraction live' },
  { day:'D8–30',  lv:'Lv11–22', focus:'Pasture & Woodland, Feeding Zone, first event',        goal:'First Tier 3 animal; event participation' },
  { day:'D31–60', lv:'Lv23–38', focus:'Savanna opens, Rides + Shows, trust grinding',         goal:'First Tier 4 (zebra→lion path)' },
  { day:'D61–90', lv:'Lv39–50', focus:'Performance Arena, reputation push, collection chase', goal:'Lion tamed; arena performing' },
];

// ---- 12-month roadmap --------------------------------------
const ROADMAP = [
  { q:'Launch', title:'Gates open',     items:['Meadow→Savanna (4 biomes)','Tiers 0–4 roster','Petting/Feeding/Rides/Shows','Daily & weekly missions'] },
  { q:'Q1',     title:'Conservation',   items:['Spring Hatchlings event','Performance Arena','Reputation star system','Photo mode'] },
  { q:'Q2',     title:'Go wild',        items:['Polar Peaks + Tier 5','Safari Summer event','Friends & gifting','Decor cosmetics v2'] },
  { q:'Q3',     title:'Cold-blooded',   items:['Reptile House + Tier 6','Spooky Night Zoo','Daily challenge zoo','Leaderboards'] },
  { q:'Q4',     title:'Into the deep',  items:['Marine Cove + Tier 7','Winter Conservation','Endgame prestige (Zoo Tour)','Guild conservation drives'] },
];

// ---- Endgame -----------------------------------------------
const ENDGAME = [
  ['🌍 Sister Zoos','Open themed satellite parks that share staff & feed a meta-currency.'],
  ['♻️ Prestige (Zoo Tour)','Soft-reset for permanent income & XP multipliers; keeps collection.'],
  ['🏅 Reputation tiers','Bronze→Diamond zoo ranking with cosmetic frames & visitor caps.'],
  ['🧬 Breeding & lineage','Pair high-trust animals for rare colour-morph offspring.'],
  ['🤝 Conservation guilds','Co-op donation drives unlocking shared endangered species.'],
  ['📒 Master collection','Complete every tier + morph for a Master Curator badge.'],
];

// ---- Technical architecture --------------------------------
const TECH = [
  ['Engine','Unity (URP) for stylised-3D animals; addressable asset bundles per biome to keep install small.'],
  ['Client state','Local authoritative sim with deterministic idle accrual; protobuf save blob.'],
  ['Backend','Managed serverless (player profile, inventory, IAP receipts, events) + cloud save.'],
  ['Idle math','Server timestamp on app-close; offline gold = rate × min(Δt, cap). No client trust for currency.'],
  ['LiveOps','Remote-config event calendar, balance tables & feature flags — no client update to ship events.'],
  ['Economy data','All tables (animals/habitats/attractions) are remote-config JSON, hot-swappable.'],
  ['Analytics','Funnel, sink/source ledger, per-animal engagement; A/B on pacing & offers.'],
  ['Monetization','Store SDK + receipt validation; rewarded-ad mediation (opt-in only).'],
];

// ---- MVP scope ---------------------------------------------
const MVP = {
  in: ['Meadow + Pasture habitats','Tiers 0–2 (11 animals)','Care loop (5 needs, 6 actions)','Visitor gate income + idle','Habitat upgrades','Petting Area + Feeding Zone','Zoo Level 1–20','7-step tutorial','Daily missions + login','Cloud save + IAP gem packs'],
  out:['Performance Arena','Tiers 4–7 & their biomes','Breeding/lineage','Guilds & co-op','Prestige','Seasonal events (post-launch)'],
  why:'Proves the core loop — care → satisfaction → income → upgrade → unlock — and the idle hook, with enough collection runway (11 animals) to validate D7/D30 before investing in late-game biomes.',
};

// ---- Data tables (samples) ---------------------------------
const DT_ANIMALS = ANIMALS;
const DT_HAB = HAB_UPGRADE;

// ---- Animals per enclosure (consistent count per species) --
const ENC_COUNTS = {
  rabbit:3, chicken:3, duck:2, dog:1, cat:2, goat:2, sheep:3, horse:1, donkey:1, alpaca:2,
  cow:2, fox:1, monkey:2, raccoon:2, wolf:2, zebra:2, giraffe:1, rhino:1, hippo:1, lion:2,
  elephant:1, brownbear:1, polarbear:1, turtle:2, python:1, croc:1, seal:2, sealion:1, dolphin:2,
};

const MAX_LEVEL = 92;
// round to friendly increments so generated values read like hand-authored ones
const roundNice = (x)=> x>=10000 ? Math.round(x/500)*500 : x>=1000 ? Math.round(x/100)*100 : Math.round(x/10)*10;

// ---- Zoo Level XP curve (cumulative XP to reach each level) -
// Single source of truth: the LEVELS milestones above ARE the pacing anchors.
// LEVEL_XP is generated from them — one cumulative-XP entry per level, Lv1..MAX_LEVEL
// — so the per-level curve and the milestone table can never disagree, and the curve
// no longer caps the game at Lv15. Tune pacing by editing the LEVELS xp values.
const LEVEL_XP = (()=>{
  const anchors = LEVELS.map(l=>({ lv:l.lv, xp:l.xp }));
  const arr = new Array(MAX_LEVEL);
  arr[0] = 0;
  for (let s=0; s<anchors.length-1; s++){
    const a = anchors[s], b = anchors[s+1];
    for (let lv=a.lv+1; lv<=b.lv; lv++){
      const f = (lv - a.lv) / (b.lv - a.lv);
      // geometric interpolation between anchors; first segment ramps up from 0
      const x = a.xp > 0 ? a.xp * Math.pow(b.xp / a.xp, f) : b.xp * Math.pow(f, 2.2);
      arr[lv-1] = roundNice(x);
    }
  }
  // Extend past the last milestone using that segment's per-level growth ratio.
  const last = anchors[anchors.length-1], prev = anchors[anchors.length-2];
  const perLv = Math.pow(last.xp / prev.xp, 1 / (last.lv - prev.lv));
  for (let lv=last.lv+1; lv<=MAX_LEVEL; lv++) arr[lv-1] = roundNice(arr[lv-2] * perLv);
  return arr;
})();

// ---- Unlock order: derived from ANIMALS (rabbit is the free starter) ---------
// Single source of truth = ANIMALS[].unlock. This projection gives the prototype
// the level gate (lv) + gold cost it needs to gate/buy each animal, so UNLOCKS and
// ANIMALS can never drift apart. Gold scales geometrically with the unlock level.
const UNLOCKS = ANIMALS
  .filter(a => a.key !== 'rabbit')
  .map(a => {
    const lv = (a.unlock === 'Start' || a.unlock === 'Tutorial')
      ? 1
      : (parseInt(String(a.unlock).replace(/\D/g,''), 10) || 1);
    return { key:a.key, lv, gold: roundNice(500 * Math.pow(1.06, lv - 1)) };
  })
  .sort((x,y) => x.lv - y.lv || x.gold - y.gold);

// ---- New Player Quests (7 chapters; obj types map to tracked counters) -
const QUESTS = [
  { ch:1, title:'Welcome to the Zoo', purpose:'Introduce the basic gameplay loop.',
    obj:[ {t:'feed',n:1,label:'Feed an animal'}, {t:'owned',n:2,label:'Adopt a 2nd animal'}, {t:'clean',n:1,label:'Clean a habitat'} ],
    rw:{ gold:200, xp:300 } },
  { ch:2, title:'Growing the Zoo', purpose:'Teach animal care systems.',
    obj:[ {t:'owned',n:2,label:'Own 2 animals'}, {t:'feed',n:2,label:'Feed animals 2 times'}, {t:'clean',n:2,label:'Clean habitats 2 times'} ],
    rw:{ gold:400, xp:550 } },
  { ch:3, title:'First Expansion', purpose:'Introduce zoo expansion.',
    obj:[ {t:'owned',n:5,label:'Own 5 animals'}, {t:'level',n:3,label:'Reach Zoo Level 3'} ],
    rw:{ gold:1200, xp:850 } },
  { ch:4, title:'Happy Visitors', purpose:'Introduce entertainment activities.',
    obj:[ {t:'photo',n:2,label:'Complete 2 Photo activities'}, {t:'feeding',n:2,label:'Complete 2 Feeding activities'}, {t:'vip',n:1,label:'Serve 1 VIP visitor'} ],
    rw:{ gold:600, xp:1200 } },
  { ch:5, title:'New Attractions', purpose:'Introduce attraction gameplay.',
    obj:[ {t:'ride',n:1,label:'Run an Animal Ride'}, {t:'activity',n:2,label:'Complete 2 activities'}, {t:'level',n:5,label:'Reach Zoo Level 5'} ],
    rw:{ gold:1500, xp:1600 } },
  { ch:6, title:'Building a Real Zoo', purpose:'Prepare for mid-game progression.',
    obj:[ {t:'owned',n:10,label:'Own 10 species'}, {t:'level',n:8,label:'Reach Zoo Level 8'} ],
    rw:{ gold:3000, xp:2300 } },
  { ch:7, title:'Future Zoo Manager', purpose:'Transition into normal gameplay.',
    obj:[ {t:'level',n:10,label:'Reach Zoo Level 10'}, {t:'owned',n:10,label:'Complete the collection'} ],
    rw:{ gold:6000, xp:3000 } },
];

// ---- VIP service side-quests (separate from new-player quests) -
const VIP_SERVICES = [
  { id:1, title:'Serve a VIP guest',  obj:[{t:'vip',n:1,label:'Serve 1 VIP guest'}],   rw:{ gold:300 } },
  { id:2, title:'VIP Host',           obj:[{t:'vip',n:3,label:'Serve 3 VIP guests'}],  rw:{ gold:700 } },
  { id:3, title:'Five-Star Service',  obj:[{t:'vip',n:6,label:'Serve 6 VIP guests'}],  rw:{ gold:1500 } },
  { id:4, title:'VIP Concierge',      obj:[{t:'vip',n:10,label:'Serve 10 VIP guests'}], rw:{ gold:3000 } },
];

// ---- Entertainment activities (cooldown-based) -------------
// reqSpecies must be owned to run; demo = accelerated cooldown
// (seconds) used in the prototype so timers are observable.
const ENT_CATS = [
  { key:'photo',   name:'Photo Experience',  icon:'📸', cd:'15 min', attr:'petting', lv:1, blurb:'Visitors take photos with friendly animals.' },
  { key:'feeding', name:'Feeding Experience', icon:'🥕', cd:'30 min', attr:'feeding', lv:2, blurb:'Visitors feed animals under supervision.' },
  { key:'riding',  name:'Riding Experience',  icon:'🐎', cd:'1 hr',   attr:'rides',   lv:6, blurb:'Visitors ride suitable animals.' },
  { key:'edu',     name:'Educational',        icon:'🎓', cd:'2 hr',   attr:'shows',   lv:7, blurb:'Animals demonstrate natural behaviours.' },
  { key:'premium', name:'Premium Experience', icon:'⭐', cd:'4 hr',   attr:'perform', lv:8, blurb:'Marquee late-game encounters.' },
];
const ENTERTAINMENT = [
  // Photo · short
  { key:'photo_rabbit', cat:'photo',   name:'Rabbit Photo Session', req:'Rabbit',   gold:120,  rep:3, xp:20, demo:600,  cd:'15 min' },
  { key:'photo_pony',   cat:'photo',   name:'Pony Photo Session',   req:'Horse',    gold:180,  rep:4, xp:24, demo:600,  cd:'15 min' },
  { key:'photo_monkey', cat:'photo',   name:'Monkey Photo Session', req:'Monkey',   gold:240,  rep:5, xp:30, demo:600,  cd:'15 min' },
  // 'Panda Photo Session' (req:'Panda') removed — no Panda in ANIMALS roster (add Panda to restore)
  // Feeding · short
  { key:'feed_rabbit',  cat:'feeding', name:'Rabbit Feeding',       req:'Rabbit',   gold:90,   rep:2, happy:6, demo:1800, cd:'30 min' },
  { key:'feed_goat',    cat:'feeding', name:'Goat Feeding',         req:'Goat',     gold:160,  rep:3, happy:6, demo:1800, cd:'30 min' },
  { key:'feed_giraffe', cat:'feeding', name:'Giraffe Feeding',      req:'Giraffe',  gold:520,  rep:7, happy:8, demo:1800, cd:'30 min' },
  { key:'feed_elephant',cat:'feeding', name:'Elephant Feeding',     req:'Elephant', gold:760,  rep:9, happy:8, demo:1800, cd:'30 min' },
  // Riding · medium
  { key:'ride_horse',   cat:'riding',  name:'Horse Riding',         req:'Horse',    gold:360,  rep:7,  demo:3600, cd:'1 hr' },
  { key:'ride_donkey',  cat:'riding',  name:'Donkey Riding',        req:'Donkey',   gold:300,  rep:6,  demo:3600, cd:'1 hr' },
  { key:'ride_elephant',cat:'riding',  name:'Elephant Riding',      req:'Elephant', gold:980,  rep:12, demo:3600, cd:'1 hr' },
  // Educational · medium · watchable
  { key:'edu_monkey',   cat:'edu',     name:'Monkey Intelligence Demo', req:'Monkey',  rep:10, xp:120, gold:300, demo:7200, cd:'2 hr', watch:true },
  { key:'edu_elephant', cat:'edu',     name:'Elephant Memory Session',  req:'Elephant',rep:14, xp:180, gold:520, demo:7200, cd:'2 hr', watch:true },
  { key:'edu_dolphin',  cat:'edu',     name:'Dolphin Learning Session', req:'Dolphin', rep:18, xp:240, gold:800, demo:7200, cd:'2 hr', watch:true },
  // Premium · long · watchable
  { key:'prem_dolphin', cat:'premium', name:'Dolphin Encounter',    req:'Dolphin',  gold:2200, rep:25, demo:14400, cd:'4 hr', watch:true },
  { key:'prem_sealion', cat:'premium', name:'Sea Lion Interaction', req:'Sea Lion', gold:1800, rep:22, demo:14400, cd:'4 hr', watch:true },
  { key:'prem_safari',  cat:'premium', name:'VIP Safari Tour',      req:'Lion',     gold:2600, rep:30, demo:14400, cd:'4 hr', watch:true },
];

Object.assign(window, {
  STATS, ACTIONS, TAMING, ANIMALS, TIERS, HABITATS, HAB_UPGRADE, ATTRACTIONS, PERF_SKILLS, PERFORMERS,
  CURRENCIES, SOURCES, SINKS, LEVELS, IDLE, FUNNEL, ACTIVITIES, EVENTS, CADENCE, IAP, OFFERS, KPI,
  TUTORIAL, PLAN90, ROADMAP, ENDGAME, TECH, MVP, DT_ANIMALS, DT_HAB, ENT_CATS, ENTERTAINMENT, ENC_COUNTS, MAX_LEVEL, LEVEL_XP, UNLOCKS, QUESTS, VIP_SERVICES,
});
