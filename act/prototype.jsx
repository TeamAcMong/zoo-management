// ============================================================
// PROTOTYPE SHELL — phone with a LIVE zoo home + care/attractions/show/shop
// Playful palette scoped under .act-* / .live (sanctioned break).
// ============================================================

const AA = Object.fromEntries(ANIMALS.map(a => [a.key, a]));
const ACT = Object.fromEntries(ACTIONS.map(a => [a.key, a]));
const levelFromXp = (xp)=>{ let lv=1; for(let i=0;i<LEVEL_XP.length;i++){ if(xp>=LEVEL_XP[i]) lv=i+1; } return lv; };
const FRESH_METERS = { rabbit:{ hunger:42, thirst:36, clean:64, happy:70, trust:30 } };

function clamp(n){ return Math.max(0, Math.min(100, Math.round(n))); }
function zbeep(freq, dur, type, vol){ const mv=(window.__vol!=null?window.__vol:1); if(!window.__soundOn || mv<=0) return; try{ if(!window.__actx) window.__actx=new (window.AudioContext||window.webkitAudioContext)(); const ctx=window.__actx; const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||'sine'; o.frequency.value=freq; g.gain.value=Math.max(0.0009,(vol||0.12)*mv); o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime+(dur||0.08)); o.stop(ctx.currentTime+(dur||0.08)); }catch(e){} }
window.zbeep = zbeep;   // __soundOn / __vol are initialised from saved settings in data.jsx

// ---- F3 SAVE / LOAD — single localStorage slot, versioned JSON ----
const SAVE_KEY = 'awz_save', SAVE_VERSION = 1;
function loadSave(){
  try { const r = localStorage.getItem(SAVE_KEY); if(!r) return null;
    const s = JSON.parse(r); if(!s || s.v !== SAVE_VERSION) return null;  // (future: migrate on version bump)
    return s;
  } catch(e){ return null; }
}
const OFFLINE_CAP_SEC = 8*3600;      // free idle cap (8h); VIP would be 24h
const OFFLINE_RATE_FACTOR = 0.60;    // offline earns 60% of the active gate rate

function Phone({ fullscreen }) {
  const SAVED = React.useMemo(()=>loadSave(), []);   // load once at mount (null on fresh start)
  const [tab, setTab]   = useState('live');
  const [sel, setSel]   = useState('rabbit');
  const [owned, setOwned] = useState(SAVED?.owned || ['rabbit']);   // fresh start: only a rabbit
  const [gold, setGold] = useState(SAVED?.gold ?? 50);
  const [gems, setGems] = useState(SAVED?.gems ?? 10);
  const [xp, setXp]     = useState(SAVED?.xp ?? 0);
  const [counts, setCounts] = useState(SAVED?.counts || { feed:0, clean:0, activity:0, photo:0, feeding:0, ride:0, vip:0 });
  const [chapterIdx, setChapterIdx] = useState(SAVED?.chapterIdx ?? 0);
  const [serviceIdx, setServiceIdx] = useState(SAVED?.serviceIdx ?? 0);
  const [adminOpen, setAdminOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(window.__soundOn !== false);
  const [vol, setVol]   = useState(window.__vol != null ? window.__vol : 1);   // 0..1 master volume
  const [lang, setLang] = useState(window.__lang || 'en');                     // 'en' | 'vi'
  const [setOpen, setSetOpen] = useState(false);                               // Settings panel open
  const [goldFx, setGoldFx] = useState(null);
  const [lvlUp, setLvlUp] = useState(false);
  const prevGoldRef = useRef(null);
  const prevLvlRef = useRef(null);
  // keep the global audio/lang flags in sync with settings state and persist them
  useEffect(()=>{ window.__soundOn = soundOn; window.__vol = vol; window.__lang = lang; saveSettings({ sound:soundOn, vol, lang }); }, [soundOn, vol, lang]);
  const prevTab = useRef('live');

  const [meters, setMeters] = useState(SAVED?.meters || { ...FRESH_METERS });
  const [built, setBuilt] = useState(SAVED?.built || []);
  const [toast, setToast] = useState(null);
  const [show, setShow]   = useState(null);
  const [offline, setOffline] = useState(false);
  const [offlineReward, setOfflineReward] = useState(null);   // {gold, secs, capped} computed on resume
  const [performing, setPerforming] = useState(null);
  const [bump, setBump]   = useState(0);
  const [tutDone, setTutDone] = useState(SAVED?.tutDone || []);   // paced FTUE — ids of completed coach beats
  const [started, setStarted] = useState(SAVED?.started || false);  // game starts (income accrues) only after "Let's go"
  const [enrich, setEnrich] = useState(SAVED?.enrich || {});        // ✨ enrichment level per species
  const [viral, setViral] = useState(null);        // 📹 viral moment overlay
  const [selEnc, setSelEnc] = useState('rabbit');
  const encFrom = useRef('live');
  const [names, setNames] = useState(SAVED?.names || {});            // custom animal names
  const [pops, setPops]   = useState(SAVED?.pops || {});            // extra animals bought per enclosure
  const [encLv, setEncLv] = useState(SAVED?.encLv || {});            // per-enclosure upgrade level
  const [buyTarget, setBuyTarget] = useState(null);  // animal key being named/bought
  const [renameKey, setRenameKey] = useState(null);  // animal key being renamed
  const [nameInput, setNameInput] = useState('');
  function openRename(k){ setNameInput(nameOf(k)); setRenameKey(k); }
  function saveRename(){ const nm=(nameInput||'').trim(); if(nm) setNames(n=>({ ...n, [renameKey]:nm })); setRenameKey(null); flash(t('fx.renamed')); }
  const nameOf = (k)=> names[k] || (AA[k] ? AA[k].species : k);
  const cntOf  = (k)=> (pops[k]!=null ? pops[k] : 1);
  const lvOf   = (k)=> encLv[k]||1;
  const capOf  = (k)=> 2 + (lvOf(k)-1);                                                  // matches HAB_UPGRADE slots (2,3,4,5,6,…)
  const multOf = (k)=> 1 + 0.25*(lvOf(k)-1);                                             // enclosure upgrade boosts this animal's appeal
  const enrLvOf = (k)=> (enrich[k]||0);
  const appealOf = (k)=> (AA[k]?AA[k].appeal:0) * cntOf(k) * multOf(k) * (1 + 0.10*enrLvOf(k)); // one animal's visitor draw

  // ---- PACED TUTORIAL — condition-gated coach (see tutorial.jsx) ----
  // activeBeat is the single tip to show right now (or null = play freely). It is derived
  // from live game state, so a beat only appears once its trigger fires (e.g. "gold >= 500").
  const tutState = { done: tutDone, gold, level: levelFromXp(xp), ownedCount: owned.length };
  const activeBeat = started ? activeTutBeat(tutState) : null;
  const tutActive  = !!activeBeat;
  const introDone  = tutDone.includes('feed');   // core intro done → show quest trackers / admin
  function completeTut(beat){
    if (!beat || tutDone.includes(beat.id)) return;
    setTutDone(d => d.includes(beat.id) ? d : [...d, beat.id]);
    if (beat.rw){ if(beat.rw.gold) setGold(g=>g+beat.rw.gold); if(beat.rw.xp) setXp(x=>x+beat.rw.xp); }
    flash(`🎁 ${beat.reward || 'Reward'}`);
  }
  // an action handler calls this; it only fires if the active beat is waiting on that action
  function completeTutAction(actionKey){ if (activeBeat && activeBeat.action === actionKey) completeTut(activeBeat); }
  function skipTut(){ setTutDone(TUT_BEATS.map(b=>b.id)); flash(t('fx.tut_skipped')); }
  function replayTut(){ setTutDone([]); setTab('live'); flash(t('fx.tut_replay')); }
  // gently open the relevant screen ONCE when a beat becomes active (then the player is free to roam)
  const tutNavRef = useRef(null);
  useEffect(() => {
    const b = activeBeat;
    if (b && b.goto && tutNavRef.current !== b.id){
      tutNavRef.current = b.id;
      if (b.goto === 'care'){ setSel('rabbit'); setMeters(m => m.rabbit ? m : { ...m, rabbit:{ hunger:60, thirst:60, clean:60, happy:64, trust:30 } }); prevTab.current = tab; setTab('care'); }
      else setTab(b.goto);
    }
  }, [activeBeat ? activeBeat.id : null]);

  const level = levelFromXp(xp);
  useEffect(()=>{ if(prevLvlRef.current!=null && level>prevLvlRef.current){ setLvlUp(true); zbeep(1046,0.22,'triangle',0.18); setTimeout(()=>setLvlUp(false),1700); } prevLvlRef.current=level; }, [level]);
  const [gameSpeed, setGameSpeed] = useState(1);
  // ---- ZOO ECONOMY MODEL — animals → appeal → visitors → gold/hr (one causal chain) ----
  // ① animals create APPEAL (happier animals are more appealing) → ② appeal pulls in VISITORS,
  //    capped by how many guests the zoo can hold → ③ visitors spend gold at the gate = GOLD/sec.
  const VISITORS_PER_APPEAL = 1.0;   // guests drawn per point of appeal       (tuning knob)
  const SPEND_PER_VISITOR   = 0.05;  // gold/sec each guest spends at the gate  (tuning knob)
  const totalAnimals = owned.reduce((s,k)=> s + cntOf(k), 0);
  // welfare = average of ALL four needs (hunger/thirst/clean/happy), not happiness alone — so
  // feeding, watering & cleaning each move the economy. Removes the "spam free Play, ignore the
  // rest" dominant strategy (L9). happyMult range stays 0.5–1.4 to match the economy GDD.
  const welfareOf = (k)=>{ const mt=meters[k]; if(!mt) return 60; return (mt.hunger + mt.thirst + mt.clean + mt.happy)/4; };
  const happyMult = (function(){ const w=owned.map(welfareOf); const avg=w.length?w.reduce((a,b)=>a+b,0)/w.length:60; return Math.max(0.5, Math.min(1.4, 0.4 + avg/100)); })(); // well-cared animals are more appealing
  const appeal   = Math.round(owned.reduce((s,k)=> s + appealOf(k), 0) * happyMult);        // ① total zoo attractiveness
  // capacity = guests the zoo can actually SHOW. Each animal seats viewers in proportion to its
  // draw; enclosure upgrades add seats; attractions widen the whole zoo. Grow this so appeal
  // isn't wasted at the gate (when demand > capacity the visitor pill turns amber).
  const seatsOf  = (k)=> (AA[k]?AA[k].appeal:0) * cntOf(k) * (0.6 + 0.5*(lvOf(k)-1));
  const capacity = Math.round((5 + owned.reduce((s,k)=> s + seatsOf(k), 0)) * (1 + 0.15*built.length));
  const demand   = Math.round(appeal * VISITORS_PER_APPEAL);                               // ② guests the appeal would draw
  const visitors = Math.min(demand, capacity);                                            // ② capped by capacity — expand to hold more
  const visitorCapped = demand > capacity;                                                // appeal wasted for lack of capacity
  const zooRate  = Math.max(1, Math.round(visitors * SPEND_PER_VISITOR * (1 + 0.12*built.length))); // ③ gold / second (attractions raise spend/head)
  // slow decay — daily-ritual cadence (NOT a frantic active tapper). One tick every 30 min;
  // a full stat drains 100→~warning over ~8–12h, so the player cares once per session and
  // returns hours later to gently-low animals. Old rate (−6/12s) drained in 2–3 min (idle-inverting).
  // ⚠️ provisional tuning — confirm against a wall-clock model in the balance pass.
  useEffect(() => {
    const iv = setInterval(() => {
      setMeters(ms => { const n = { ...ms }; owned.forEach(k=>{ if(n[k]) n[k] = { ...n[k], hunger:clamp(n[k].hunger-3), thirst:clamp(n[k].thirst-4), clean:clamp(n[k].clean-3), happy:clamp(n[k].happy-2) }; }); return n; });
    }, 1800000);   // 30 min
    return () => clearInterval(iv);
  }, [owned]);

  function buyMoreAnimal(k){
    if (cntOf(k) >= capOf(k)){ flash(t('fx.enc_full')); return; }
    const cost = Math.round((AA[k].appeal||1) * 11 * cntOf(k)) + 50;   // mult halved (was 22) — appeal max is now 3000
    if (gold < cost){ flash(t('fx.need_gold', { cost: cost.toLocaleString() })); return; }
    pay(cost); setPops(p=>({ ...p, [k]: cntOf(k)+1 })); flash(t('fx.plus_one_animal', { name: nameOf(k) }));
    setNameInput(nameOf(k)); setRenameKey(k);
  }
  function upgradeEnc(k){
    if (lvOf(k) >= MAX_ENCLOSURE_LEVEL){ flash(t('fx.enc_max', { max: MAX_ENCLOSURE_LEVEL })); return; }   // L8 cap
    const cost = Math.round((AA[k].appeal||1) * 80 * lvOf(k)) + 300;   // mult halved (was 160)
    if (gold < cost){ flash(t('fx.need_gold', { cost: cost.toLocaleString() })); return; }
    pay(cost); setEncLv(e=>({ ...e, [k]: lvOf(k)+1 })); flash(t('fx.enc_upgraded', { lv: lvOf(k)+1 }));
    completeTutAction('upgrade');
  }
  // global idle income — runs on every tab, not just the Zoo
  useEffect(() => {
    if (!started) return;                          // no income until the player presses “Let’s go”
    const iv = setInterval(() => { setGold(g=>g+zooRate*gameSpeed); }, 1000);
    return () => clearInterval(iv);
  }, [zooRate, gameSpeed, started]);

  // ---- F3 PERSIST — write the versioned save blob whenever meaningful state changes ----
  // closedAt = last write ≈ last active moment, so on resume (now − closedAt) is the time away.
  useEffect(() => {
    if (!started) return;                          // don't persist the pre-"Let's go" empty shell
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v:SAVE_VERSION, owned, gold, gems, xp, counts, chapterIdx, serviceIdx,
        meters, built, enrich, names, pops, encLv, started, tutDone,
        rate: zooRate, closedAt: Date.now(),
      }));
    } catch(e){}
  }, [owned, gold, gems, xp, counts, chapterIdx, serviceIdx, meters, built, enrich, names, pops, encLv, started, tutDone, zooRate]);

  // ---- Fe7 OFFLINE — on resume, grant accrued gold + gently decay needs (mount only) ----
  useEffect(() => {
    if (!SAVED || !SAVED.started || !SAVED.closedAt) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - SAVED.closedAt)/1000));   // clock moved back ⇒ 0
    if (elapsed < 60) return;                                                      // ignore brief reloads
    const eff = Math.min(elapsed, OFFLINE_CAP_SEC);                                // clamp to idle cap (8h)
    const g = Math.floor(eff * (SAVED.rate||1) * OFFLINE_RATE_FACTOR);
    const hrs = eff/3600;                                                          // gentle offline decay toward a floor
    setMeters(ms => { const n={...ms}; (SAVED.owned||[]).forEach(k=>{ if(n[k]) n[k]={ ...n[k],
      hunger:Math.max(35, Math.round(n[k].hunger - hrs*4)),
      thirst:Math.max(35, Math.round(n[k].thirst - hrs*5)),
      clean: Math.max(35, Math.round(n[k].clean  - hrs*3)),
      happy: Math.max(40, Math.round(n[k].happy  - hrs*2)) }; }); return n; });
    if (g > 0){ setOfflineReward({ gold:g, secs:eff, capped: elapsed > OFFLINE_CAP_SEC }); setOffline(true); }
  }, []);
  const bump2 = (k,n=1)=> setCounts(c=>({ ...c, [k]:(c[k]||0)+n }));
  const flash = (msg) => { zbeep(640,0.05,'sine',0.10); setToast(msg); clearTimeout(window.__z_t); window.__z_t = setTimeout(() => setToast(null), 1400); };
  const adjust = (key, patch) => setMeters(m => { const nm = { ...m[key] }; Object.entries(patch).forEach(([k,v]) => nm[k] = clamp((nm[k]||0)+v)); return { ...m, [key]: nm }; });
  const openCare = (k) => {
    if (!AA[k]) return;
    zbeep(300 + (AA[k].tier||0)*60, 0.16, 'triangle', 0.16);
    setMeters(m => m[k] ? m : { ...m, [k]: { hunger:60, thirst:60, clean:60, happy:64, trust:40 } });
    prevTab.current = tab; setSel(k); setTab('care');
  };
  const openEnclosure = (k) => {
    if (!AA[k]) return;
    setMeters(m => m[k] ? m : { ...m, [k]: { hunger:60, thirst:60, clean:60, happy:64, trust:40 } });
    encFrom.current = (tab==='animals' ? 'animals' : 'live'); setSelEnc(k); setTab('enclosure');
  };

  function doAction(key){
    const def = ACT[key];
    const stat = def.stat;
    if (stat && (meters[sel][stat]||0) >= 98){ flash(t('fx.stat_full', { species: speciesName(sel), stat })); return; }
    const cost = def.cost ? Math.round(def.cost * (1 + AA[sel].tier*0.4)) : 0;
    if (cost && gold < cost){ flash(t('fx.need_gold', { cost: cost.toLocaleString() })); return; }
    if (cost) pay(cost);
    adjust(sel, def.effect);
    setXp(x => x + 3);
    setBump(b => b + 1);
    const label = { feed: t('fx.care_feed'), water: t('fx.care_water'), clean: t('fx.care_clean'), play: t('fx.care_play'), heal: t('fx.care_heal') }[key];
    flash(cost ? t('fx.care_paid', { label, cost }) : label);
    if (key==='feed') bump2('feed'); if (key==='clean') bump2('clean');
    completeTutAction(key);
  }

  function unlockAnimal(k){
    const u = UNLOCKS.find(x=>x.key===k); if(!u || owned.includes(k)) return;
    if (level < u.lv){ flash(t('fx.reach_lv', { lv: u.lv })); return; }
    if (gold < u.gold){ flash(t('fx.need_gold', { cost: u.gold.toLocaleString() })); return; }
    setNameInput(AA[k].species); setBuyTarget(k);   // open naming modal
  }
  function confirmBuy(){
    const k = buyTarget; const u = UNLOCKS.find(x=>x.key===k); if(!u) { setBuyTarget(null); return; }
    pay(u.gold); setOwned(o=>[...o,k]); setXp(x=>x+40);
    setPops(p=>({ ...p, [k]:1 }));
    setMeters(m=> m[k]?m:{ ...m, [k]:{ hunger:60, thirst:58, clean:64, happy:66, trust:30 } });
    const nm = (nameInput||'').trim();
    if (nm) setNames(n=>({ ...n, [k]:nm }));
    setBuyTarget(null);
    flash(t('fx.welcome_animal', { name: nm || speciesName(k) }));
    completeTutAction('buy');
  }
  function claimQuest(q){
    setGold(g=>g+q.rw.gold); setXp(x=>x+q.rw.xp);
    setChapterIdx(i=>i+1);
    flash(t('fx.chapter_done', { ch: q.ch, gold: q.rw.gold.toLocaleString() }));
  }

  function buildAttraction(key){
    const at = ATTRACTIONS.find(a=>a.key===key);
    const need = parseInt(String(at.unlock).replace(/\D/g,''),10) || 1;   // L5: enforce the Zoo Level gate
    if (level < need){ flash(t('fx.reach_lv_build', { lv: need, name: at.name })); return; }
    if (gold < (at.cost||0)){ flash(t('fx.need_gold_build', { cost: (at.cost||0).toLocaleString() })); return; }
    pay(at.cost||0);
    setBuilt(b => [...b, key]);
    const cat = ENT_CATS.find(c=>c.attr===key);
    flash(cat ? t('fx.attraction_built_act', { icon: at.icon, name: at.name, acts: cat.name }) : t('fx.attraction_built', { icon: at.icon, name: at.name }));
    completeTutAction('build');
  }

  // entertainment activities — play out, then reward
  const [playAct, setPlayAct] = useState(null);
  function runActivity(a){
    zbeep(520,0.1,'square',0.1);
    const k = owned.find(o=>AA[o] && AA[o].species===a.req);
    setPlayAct({ act:a, animal: k ? AA[k] : null });
    // L7: quest counters credit on COMPLETION (see finishActivity), not on start —
    // otherwise start→cancel→restart farms quest progress without finishing anything.
  }
  function finishActivity(){
    if (playAct){ const a=playAct.act; zbeep(880,0.12,'triangle',0.14);
      setGold(g=>g+(a.gold||0)); setXp(x=>x+(a.xp||0));
      bump2('activity'); if(a.cat==='photo') bump2('photo'); if(a.cat==='feeding') bump2('feeding'); if(a.cat==='riding') bump2('ride');
      flash(t('fx.activity_done', { name: entName(a.key), gold: (a.gold||0).toLocaleString() })); tryViral(entName(a.key));
    }
    setPlayAct(null);
  }
  function serveVip(){ const bonus = Math.round(zooRate*15)+200; setGold(g=>g+bonus); bump2('vip'); flash(t('fx.vip_served', { gold: bonus.toLocaleString() })); tryViral(t('fx.vip_name')); }
  function addEnrichment(k){ const lv=enrLvOf(k); if(lv>=MAX_ENRICH_LEVEL){ flash(t('fx.enrich_max', { max: MAX_ENRICH_LEVEL })); return; } const cost=Math.round((AA[k].appeal||1)*20*(lv+1))+200; if(gold<cost){ flash(t('fx.need_gold', { cost: cost.toLocaleString() })); return; } pay(cost); setEnrich(e=>({ ...e, [k]:lv+1 })); adjust(k,{ happy:18, trust:8 }); zbeep(720,0.12,'triangle',0.14); flash(t('fx.enrich_up', { species: speciesName(k), lv: lv+1 })); }
  function tryViral(name){ const hs=owned.map(k=>(meters[k]&&meters[k].happy)||0); const avg=hs.length?hs.reduce((a,b)=>a+b,0)/hs.length:0; if(avg>=68 && Math.random()<0.3){ const bonus=Math.round(zooRate*30)+500; setGold(g=>g+bonus); zbeep(1320,0.28,'triangle',0.18); setViral({ name, bonus }); setTimeout(()=>setViral(null),2600); } }
  function pay(cost){ cost=Math.round(cost||0); if(cost<=0) return; setGold(g=>g-cost); const id=Date.now()+Math.random(); setGoldFx({id,v:-cost}); setTimeout(()=>setGoldFx(g=>g&&g.id===id?null:g),1000); }
  function claimService(q){ setGold(g=>g+q.rw.gold); setServiceIdx(i=>i+1); flash(t('fx.service_done', { title: q.title, gold: q.rw.gold.toLocaleString() })); }
  // admin helpers
  function adminLevel(n){ const target = Math.min(LEVEL_XP.length, level+n); setXp(LEVEL_XP[target-1] || LEVEL_XP[LEVEL_XP.length-1]); flash(t('fx.admin_level', { lv: target })); }
  function adminUnlockNext(){ const nx = UNLOCKS.find(u=>!owned.includes(u.key)); if(!nx){ flash(t('fx.admin_all_unlocked')); return; } setOwned(o=>[...o,nx.key]); setMeters(m=>m[nx.key]?m:{ ...m,[nx.key]:{ hunger:62,thirst:60,clean:66,happy:68,trust:40 } }); flash(t('fx.admin_unlocked', { species: speciesName(nx.key) })); }
  function adminUnlockAll(){ const all = UNLOCKS.map(u=>u.key); setOwned(o=>Array.from(new Set([...o,...all]))); setMeters(m=>{ const nm={...m}; all.forEach(k=>{ if(!nm[k]) nm[k]={ hunger:62,thirst:60,clean:66,happy:68,trust:40 }; }); return nm; }); flash(t('fx.admin_unlock_all')); }
  function adminReset(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} setOwned(['rabbit']); setGold(50); setGems(10); setXp(0); setBuilt([]); setCounts({ feed:0,clean:0,activity:0,photo:0,feeding:0,ride:0,vip:0 }); setChapterIdx(0); setServiceIdx(0); setMeters({ ...FRESH_METERS }); setPops({}); setEncLv({}); setNames({}); setEnrich({}); setAdminOpen(false); setTab('live'); flash(t('fx.game_reset')); }

  const a = AA[sel];
  const m = meters[sel];
  const tutFocus = (activeBeat && activeBeat.action && ['feed','water','clean','play','heal'].includes(activeBeat.action)) ? activeBeat.action : null;
  const rateFocus = !!(activeBeat && activeBeat.hi === 'income');
  const buyFocus  = !!(activeBeat && activeBeat.hi === 'buy');
  const tabsLocked = !!(activeBeat && activeBeat.cta);   // only an info-tip dims the tabs; action beats & gaps stay free
  const atMaxLevel = level >= MAX_LEVEL;
  const curLvXp = LEVEL_XP[level-1] || 0;
  const nextLvXp = atMaxLevel ? curLvXp : (LEVEL_XP[level] || curLvXp);
  const xpPct = (!atMaxLevel && nextLvXp>curLvXp) ? Math.min(100, Math.round((xp-curLvXp)/(nextLvXp-curLvXp)*100)) : 100;

  const SIDE = {
    live:       { t: t('scr.side.live.t'),        d: t('scr.side.live.d') },
    animals:    { t: t('scr.side.animals.t'),      d: t('scr.side.animals.d') },
    care:       { t: t('scr.side.care.t'),         d: t('scr.side.care.d') },
    enclosure:  { t: t('scr.side.enclosure.t'),    d: t('scr.side.enclosure.d') },
    attractions:{ t: t('scr.side.attractions.t'),  d: t('scr.side.attractions.d') },
    show:       { t: t('scr.side.show.t'),         d: t('scr.side.show.d') },
    shop:       { t: t('scr.side.shop.t'),         d: t('scr.side.shop.d') },
  };

  const screen = (
    <div className="act-screen">
      <div className="act-notch"></div>
      <div className="act-status"><span>9:41</span><span>{!activeBeat && <span onClick={replayTut} style={{ cursor:'pointer' }} title="Replay the guide">❔ </span>}<span onClick={()=>setSoundOn(s=>!s)} style={{ cursor:'pointer' }} title="Sound on/off">{soundOn?'🔊':'🔇'} </span><span onClick={()=>setSetOpen(true)} style={{ cursor:'pointer' }} title={t('set.title')}>⚙️ </span>📶 🔋</span></div>

      <div className="act-top">
        <Cur icon="🪙" v={Math.round(gold).toLocaleString()} t={t('cur.gold')} bg="#FFEFC2" />
        <Cur icon="💎" v={gems} t={t('cur.gems')} bg="#D4ECF5" />
        <Cur icon="⭐" v={'Lv '+level} t={t('cur.zoo')} bg="#E8E0FF" />
      </div>
      <div className="xp-bar">
        <div className="xp-track"><i style={{ width:xpPct+'%' }}></i></div>
        <span className="xp-lbl">{atMaxLevel ? t('xp.max',{ lv:level }) : t('xp.next',{ lv:level, n:Math.max(0, nextLvXp-Math.round(xp)).toLocaleString(), next:level+1 })}</span>
      </div>

      {goldFx && <div className="float" style={{ position:'absolute', top:74, left:'16%', transform:'translateX(-50%)', color:'#FF9AA6', fontWeight:800, fontSize:15, zIndex:62, pointerEvents:'none', background:'rgba(20,16,26,.55)', padding:'3px 10px', borderRadius:999 }}>{goldFx.v.toLocaleString()} 🪙</div>}
      {lvlUp && <div className="float" style={{ position:'absolute', top:74, right:'8%', color:'#fff', fontWeight:800, fontSize:15, zIndex:62, pointerEvents:'none', background:'rgba(124,92,255,.85)', padding:'3px 10px', borderRadius:999 }}>⬆️ Lv {level}</div>}
      <div className="act-view">
        {tab==='live'    && <LiveZoo owned={owned} meters={meters} counts={pops} rate={Math.round(zooRate)} gold={gold} setGold={setGold} xp={xp} setXp={setXp} onOpen={openEnclosure} rateFocus={rateFocus} speed={gameSpeed} setSpeed={setGameSpeed} onVip={serveVip} locked={false} appeal={appeal} visitors={visitors} capacity={capacity} capped={visitorCapped} satis={happyMult} onLocked={()=>setTab('animals')} />}
        {tab==='animals' && <AnimalsScreen owned={owned} meters={meters} counts={pops} level={level} gold={gold} onPick={openEnclosure} onUnlock={unlockAnimal} buyFocus={buyFocus} nameOf={nameOf} />}
        {tab==='enclosure' && <EnclosureScreen a={AA[selEnc]} m={meters[selEnc]} count={cntOf(selEnc)} cap={capOf(selEnc)} encLv={lvOf(selEnc)} appeal={Math.round(appealOf(selEnc))} gold={gold} name={nameOf(selEnc)} lock={false} onRename={()=>openRename(selEnc)} onBuyMore={()=>buyMoreAnimal(selEnc)} onUpgrade={()=>upgradeEnc(selEnc)} onPick={()=>openCare(selEnc)} onBack={()=>setTab(encFrom.current)} enrLv={enrLvOf(selEnc)} onEnrich={()=>addEnrichment(selEnc)} />}
        {tab==='care'    && <CareScreen a={a} m={m} bump={bump} name={nameOf(sel)} lock={false} onRename={()=>openRename(sel)} onAction={doAction} focus={tutFocus} onBack={()=>setTab(prevTab.current==='care'?'live':prevTab.current)} />}
        {tab==='attractions' && <AttractionsScreen built={built} onBuild={buildAttraction} owned={owned} onOpen={openCare} gold={gold} level={level} meters={meters} />}
        {tab==='show'    && <ActivitiesScreen owned={owned} built={built} onRun={runActivity} onGo={()=>setTab('attractions')} level={level} />}
        {tab==='shop'    && <ShopScreen gems={gems} onBuyGold={(g,gd)=>{ if(gems>=g){ setGems(x=>x-g); setGold(x=>x+gd); flash(t('fx.shop_bought_gold', { gold: gd.toLocaleString(), gems: g })); } else { flash(t('fx.shop_need_gems', { gems: g })); } }} />}

        {/* New Player Quest tracker (home only, once the core intro is done) */}
        {tab==='live' && introDone && <QuestTracker chapterIdx={chapterIdx} counts={counts} owned={owned} level={level} animals={owned.reduce((s,k)=>s+cntOf(k),0)} onClaim={claimQuest} onGo={(t)=>setTab(t)} />}
        {tab==='live' && introDone && <ServiceQuests idx={serviceIdx} counts={counts} owned={owned} level={level} onClaim={claimService} />}
        {introDone && <AdminPanel open={adminOpen} onOpen={()=>setAdminOpen(true)} onClose={()=>setAdminOpen(false)} level={level} gold={gold} onGold={(n)=>{setGold(g=>g+n);}} onGems={(n)=>setGems(g=>g+n)} onLevel={adminLevel} onUnlockNext={adminUnlockNext} onUnlockAll={adminUnlockAll} onReset={adminReset} />}

        {performing && <ShowStage lineup={performing} meters={meters} onDone={()=>setPerforming(null)} />}
        {playAct && <ActivityStage act={playAct.act} animal={playAct.animal} onDone={finishActivity} />}

        {renameKey && (
          <div className="act-modal-scrim">
            <div className="act-modal pop">
              <div style={{ fontSize:38 }}>{AA[renameKey].emoji}</div>
              <div style={{ fontSize:16, fontWeight:800, marginTop:4 }}>{t('modal.rename.title', { species: speciesName(renameKey) })}</div>
              <div style={{ position:'relative', marginTop:8 }}>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)} maxLength={14}
                  style={{ width:'100%', textAlign:'center', fontFamily:'inherit', fontSize:15, fontWeight:800, color:'var(--act-ink)', padding:'10px 34px', borderRadius:12, border:'2px solid #E2CFB2', background:'#fff', outline:'none' }} />
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none', opacity:.7 }}>✏️</span>
              </div>
              <div className="row" style={{ gap:9, marginTop:12 }}>
                <button className="gbtn ghost sm" style={{ flex:1 }} onClick={()=>setRenameKey(null)}>{t('modal.btn.cancel')}</button>
                <button className="gbtn grass sm" style={{ flex:1 }} onClick={saveRename}>{t('modal.btn.save')}</button>
              </div>
            </div>
          </div>
        )}

        {activeBeat && !buyTarget && <TutorialCoach beat={activeBeat} done={tutDone.length} total={TUT_BEATS.length} onInfo={()=>completeTut(activeBeat)} onSkip={skipTut} />}

        {buyTarget && (
          <div className="act-modal-scrim">
            <div className="act-modal pop">
              <div style={{ fontSize:40 }}>{AA[buyTarget].emoji}</div>
              <div style={{ fontSize:17, fontWeight:800, marginTop:4 }}>{t('modal.adopt.title', { species: speciesName(buyTarget) })}</div>
              <div style={{ fontSize:12, color:'var(--act-ink-soft)', margin:'4px 0 12px' }}>{t('modal.adopt.sub')}</div>
              <div style={{ position:'relative' }}>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)} maxLength={14}
                  style={{ width:'100%', textAlign:'center', fontFamily:'inherit', fontSize:15, fontWeight:800, color:'var(--act-ink)', padding:'10px 34px', borderRadius:12, border:'2px solid #E2CFB2', background:'#fff', outline:'none' }} />
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none', opacity:.7 }}>✏️</span>
              </div>
              <div className="row" style={{ gap:9, marginTop:12 }}>
                <button className="gbtn ghost sm" style={{ flex:1 }} onClick={()=>setBuyTarget(null)}>{t('modal.btn.cancel')}</button>
                <button className="gbtn grass sm" style={{ flex:1 }} onClick={confirmBuy}>{t('modal.btn.adopt')}</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'rgba(20,16,26,.9)', color:'#fff', padding:'12px 18px', borderRadius:16, fontSize:13.5, fontWeight:800, width:'66%', textAlign:'center', lineHeight:1.4, zIndex:95, boxShadow:'0 10px 30px rgba(20,16,26,.5)' }}>{toast}</div>}

        {viral && (
          <div className="act-modal-scrim" style={{ zIndex:64, background:'rgba(20,16,26,.45)' }}>
            <div className="pop" style={{ textAlign:'center', color:'#fff' }}>
              <div style={{ fontSize:56 }}>📹</div>
              <div style={{ fontSize:20, fontWeight:800 }}>{t('modal.viral.title')}</div>
              <div style={{ fontSize:13, fontWeight:600, marginTop:6, opacity:.92 }}>{t('modal.viral.sub', { name: viral.name })}</div>
              <div style={{ display:'inline-block', marginTop:12, fontSize:16, fontWeight:800, color:'#191C1D', background:'var(--act-gold)', padding:'8px 20px', borderRadius:999, boxShadow:'0 8px 24px rgba(245,150,11,.5)' }}>{t('modal.viral.bonus', { n: viral.bonus.toLocaleString() })}</div>
            </div>
          </div>
        )}

        {setOpen && (
          <div className="act-modal-scrim" style={{ zIndex:80 }} onClick={()=>setSetOpen(false)}>
            <div className="act-modal pop" onClick={e=>e.stopPropagation()} style={{ textAlign:'left' }}>
              <div style={{ fontSize:17, fontWeight:800, textAlign:'center', marginBottom:12 }}>⚙️ {t('set.title')}</div>

              <div className="row" style={{ justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:13, fontWeight:700 }}>🔊 {t('set.sound')}</span>
                <button className={'gbtn sm '+(soundOn?'grass':'ghost')} style={{ minWidth:70 }} onClick={()=>setSoundOn(s=>!s)}>{soundOn?t('set.on'):t('set.off')}</button>
              </div>

              <div style={{ marginBottom:16 }}>
                <div className="row" style={{ justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>🔈 {t('set.volume')}</span>
                  <span style={{ fontSize:12, fontWeight:800, fontVariantNumeric:'tabular-nums' }}>{Math.round(vol*100)}%</span>
                </div>
                <input type="range" min="0" max="100" value={Math.round(vol*100)} disabled={!soundOn}
                  onChange={e=>setVol(Number(e.target.value)/100)}
                  onMouseUp={()=>zbeep(660,0.06,'sine',0.12)} onTouchEnd={()=>zbeep(660,0.06,'sine',0.12)}
                  style={{ width:'100%', accentColor:'#36C98A', opacity:soundOn?1:.4 }} />
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:7 }}>🌐 {t('set.language')}</div>
                <div className="row" style={{ gap:8 }}>
                  <button className={'gbtn sm '+(lang==='en'?'grass':'ghost')} style={{ flex:1 }} onClick={()=>{ window.__lang='en'; setLang('en'); }}>🇬🇧 {t('set.english')}</button>
                  <button className={'gbtn sm '+(lang==='vi'?'grass':'ghost')} style={{ flex:1 }} onClick={()=>{ window.__lang='vi'; setLang('vi'); }}>🇻🇳 {t('set.vietnamese')}</button>
                </div>
              </div>

              <button className="gbtn grass" style={{ width:'100%' }} onClick={()=>setSetOpen(false)}>{t('set.done')}</button>
            </div>
          </div>
        )}

        {!started && (
          <div className="act-modal-scrim" style={{ zIndex:70 }}>
            <div className="act-modal pop" style={{ textAlign:'center' }}>
              <div style={{ fontSize:46 }}>🦊</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--act-ink)', marginTop:6 }}>{t('start.title')}</div>
              <div style={{ fontSize:12.5, color:'var(--act-ink-soft)', fontWeight:600, lineHeight:1.5, marginTop:8 }}>{t('start.body')}</div>
              <button className="gbtn grass" style={{ width:'100%', marginTop:16 }} onClick={()=>{ setStarted(true); }}>{t('start.cta')}</button>
            </div>
          </div>
        )}

        {offline && offlineReward && (function(){
          const s=offlineReward.secs, h=Math.floor(s/3600), mm=Math.floor((s%3600)/60);
          const away = h>0 ? `${h}h ${mm}m` : `${mm}m`;
          return (
          <div className="act-modal-scrim">
            <div className="act-modal pop">
              <div style={{ fontSize:40 }}>🦁</div>
              <div style={{ fontSize:17, fontWeight:800, marginTop:4 }}>{t('off.title')}</div>
              <div style={{ fontSize:12, color:'var(--act-ink-soft)', margin:'4px 0 12px' }}>{t('off.away',{ t:away })}{offlineReward.capped?t('off.cap'):''}</div>
              <div className="gcard" style={{ margin:0 }}>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>🪙 {t('off.gold')}</span><b>+{offlineReward.gold.toLocaleString()}</b></div>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>🪙 {t('off.rate')}</span><b>{t('off.rateval',{ r:((SAVED&&SAVED.rate)||0).toLocaleString() })}</b></div>
              </div>
              <button className="gbtn gold" style={{ marginTop:12 }} onClick={()=>{ const g=offlineReward.gold; setGold(x=>x+g); setOffline(false); setOfflineReward(null); flash(t('off.collected',{ n:g.toLocaleString() })); }}>{t('off.collect')}</button>
            </div>
          </div>
          );
        })()}

        {show && (
          <div className="act-modal-scrim">
            <div className="act-modal pop">
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--act-grape)' }}>{t('modal.show.title')}</div>
              <div className="bigstars" style={{ marginTop:6 }}>{'⭐'.repeat(show.stars)}{'☆'.repeat(3-show.stars)}</div>
              <div style={{ fontSize:12, color:'var(--act-ink-soft)', marginTop:4 }}>{t('modal.show.crowd', { n: show.combo.toFixed(1) })}</div>
              <div className="gcard" style={{ margin:'12px 0 0' }}>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>🪙 {t('modal.show.revenue')}</span><b>+{show.reward.toLocaleString()}</b></div>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>🏅 {t('modal.show.rep')}</span><b>+{show.rep}</b></div>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>⭐ {t('modal.show.xp')}</span><b>+{show.xp}</b></div>
              </div>
              <button className="gbtn grape" style={{ marginTop:12 }} onClick={()=>setShow(null)}>{t('modal.show.bow')}</button>
            </div>
          </div>
        )}
      </div>

      <div className="act-tabs" style={{ pointerEvents: tabsLocked?'none':'auto', opacity: tabsLocked?0.45:1, filter: tabsLocked?'grayscale(0.5)':'none' }}>
        <Tab on={tab==='live'} ic="🏞️" l={t('tab.zoo')} onClick={()=>setTab('live')} />
        <Tab on={tab==='animals'||tab==='care'||tab==='enclosure'} ic="🐾" l={t('tab.animals')} onClick={()=>setTab('animals')} />
        <Tab on={tab==='attractions'} ic="🎡" l={t('tab.attract')} onClick={()=>setTab('attractions')} noti={tab!=='attractions' && ATTRACTIONS.some(at=>!built.includes(at.key) && gold>=(at.cost||0) && level>=(parseInt(String(at.unlock).replace(/\D/g,''),10)||1))} />
        <Tab on={tab==='show'} ic="🎟️" l={t('tab.activities')} onClick={()=>setTab('show')} noti={tab!=='show' && ENTERTAINMENT.some(act=>{ const c=ENT_CATS.find(x=>x.key===act.cat); return c && built.includes(c.attr) && owned.some(k=>AA[k]&&AA[k].species===act.req); })} />
        <Tab on={tab==='shop'} ic="🛍️" l={t('tab.shop')} onClick={()=>setTab('shop')} />
      </div>
    </div>
  );

  if (fullscreen) return <div className="act-fullscreen">{screen}</div>;

  return (
    <div className="proto-stage">
      <div>
        <div className="act-device">{screen}</div>
        <div className="proto-cap">{t('scr.misc.cap')}</div>
      </div>

      <div className="proto-side">
        <div className="section-label">Screen · {SIDE[tab].t}</div>
        <p className="prose" style={{ marginTop:0 }}>{SIDE[tab].d}</p>
        <div className="screen-pills" style={{ justifyContent:'flex-start' }}>
          {[['live','Zoo'],['animals','Animals'],['attractions','Attractions'],['show','Activities'],['shop','Shop']].map(([k,l])=>(
            <button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="note" style={{ marginTop:18 }}>
          <div className="note-h">{t('scr.misc.artnote_h')}</div>
          {t('scr.misc.artnote_b')}
        </div>
      </div>
    </div>
  );
}

function Cur({ icon, v, t, bg }) {
  return <div className="cur"><span className="ico" style={{ background:bg }}>{icon}</span><div style={{ lineHeight:1.1 }}><div className="v">{v}</div><div className="t">{t}</div></div></div>;
}
function Tab({ on, ic, l, onClick, noti }) {
  return <button className={'act-tab'+(on?' on':'')} onClick={onClick}><span className="ti" style={{ position:'relative' }}>{ic}{noti && <span className="tab-noti"></span>}</span><span className="tl">{l}</span></button>;
}
function MiniMeter({ icon, v, color }) {
  return <div className="meter"><span className="mt">{icon}</span><div className="bar"><i style={{ width:v+'%', background:color }}></i></div></div>;
}

Object.assign(window, { Phone, MiniMeter });
