// ============================================================
// PROTOTYPE SHELL — phone with a LIVE zoo home + care/attractions/show/shop
// Playful palette scoped under .act-* / .live (sanctioned break).
// ============================================================

const AA = Object.fromEntries(ANIMALS.map(a => [a.key, a]));
const ACT = Object.fromEntries(ACTIONS.map(a => [a.key, a]));
const levelFromXp = (xp)=>{ let lv=1; for(let i=0;i<LEVEL_XP.length;i++){ if(xp>=LEVEL_XP[i]) lv=i+1; } return lv; };
const FRESH_METERS = { rabbit:{ hunger:42, thirst:36, clean:64, happy:70, trust:30 } };

function clamp(n){ return Math.max(0, Math.min(100, Math.round(n))); }
function zbeep(freq, dur, type, vol){ if(!window.__soundOn) return; try{ if(!window.__actx) window.__actx=new (window.AudioContext||window.webkitAudioContext)(); const ctx=window.__actx; const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||'sine'; o.frequency.value=freq; g.gain.value=vol||0.12; o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime+(dur||0.08)); o.stop(ctx.currentTime+(dur||0.08)); }catch(e){} }
window.__soundOn = true; window.zbeep = zbeep;

function Phone({ fullscreen }) {
  const [tab, setTab]   = useState('live');
  const [sel, setSel]   = useState('rabbit');
  const [owned, setOwned] = useState(['rabbit']);   // fresh start: only a rabbit
  const [gold, setGold] = useState(50);
  const [gems, setGems] = useState(10);
  const [xp, setXp]     = useState(0);
  const [counts, setCounts] = useState({ feed:0, clean:0, activity:0, photo:0, feeding:0, ride:0, vip:0 });
  const [chapterIdx, setChapterIdx] = useState(0);
  const [serviceIdx, setServiceIdx] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [goldFx, setGoldFx] = useState(null);
  const [lvlUp, setLvlUp] = useState(false);
  const prevGoldRef = useRef(null);
  const prevLvlRef = useRef(null);
  useEffect(()=>{ window.__soundOn = soundOn; }, [soundOn]);
  const prevTab = useRef('live');

  const [meters, setMeters] = useState({ ...FRESH_METERS });
  const [built, setBuilt] = useState([]);
  const [toast, setToast] = useState(null);
  const [show, setShow]   = useState(null);
  const [offline, setOffline] = useState(false);
  const [performing, setPerforming] = useState(null);
  const [bump, setBump]   = useState(0);
  const [tutStep, setTutStep] = useState(null);   // interactive FTUE; null = done
  const [started, setStarted] = useState(false);  // game starts (income accrues) only after "Let's go"
  const [enrich, setEnrich] = useState({});        // ✨ enrichment level per species
  const [viral, setViral] = useState(null);        // 📹 viral moment overlay
  const [selEnc, setSelEnc] = useState('rabbit');
  const encFrom = useRef('live');
  const [names, setNames] = useState({});            // custom animal names
  const [pops, setPops]   = useState({});            // extra animals bought per enclosure
  const [encLv, setEncLv] = useState({});            // per-enclosure upgrade level
  const [buyTarget, setBuyTarget] = useState(null);  // animal key being named/bought
  const [renameKey, setRenameKey] = useState(null);  // animal key being renamed
  const [nameInput, setNameInput] = useState('');
  function openRename(k){ setNameInput(nameOf(k)); setRenameKey(k); }
  function saveRename(){ const nm=(nameInput||'').trim(); if(nm) setNames(n=>({ ...n, [renameKey]:nm })); setRenameKey(null); flash('✏️ Renamed'); }
  const nameOf = (k)=> names[k] || (AA[k] ? AA[k].species : k);
  const cntOf  = (k)=> (pops[k]!=null ? pops[k] : 1);
  const lvOf   = (k)=> encLv[k]||1;
  const capOf  = (k)=> 2 + (lvOf(k)-1);                                                  // matches HAB_UPGRADE slots (2,3,4,5,6,…)
  const multOf = (k)=> 1 + 0.25*(lvOf(k)-1);                                             // enclosure upgrade boosts this animal's appeal
  const enrLvOf = (k)=> (enrich[k]||0);
  const appealOf = (k)=> (AA[k]?AA[k].appeal:0) * cntOf(k) * multOf(k) * (1 + 0.10*enrLvOf(k)); // one animal's visitor draw

  // tutorial drives the visible tab (and opens Clover's care for action steps)
  useEffect(() => {
    if (tutStep === null || !TUT_STEPS[tutStep]) return;
    const s = TUT_STEPS[tutStep];
    if (s.care) { setSel('rabbit'); setTab('care'); }
    else if (s.tab) setTab(s.tab);
  }, [tutStep]);
  function tutAction(key){
    if (tutStep !== null && TUT_STEPS[tutStep] && TUT_STEPS[tutStep].need === key) nextTut();
  }
  function nextTut(){
    const i = tutStep; const s = TUT_STEPS[i];
    if (s && s.rw){ if(s.rw.gold) setGold(g=>g+s.rw.gold); if(s.rw.xp) setXp(x=>x+s.rw.xp); }
    if (i + 1 < TUT_STEPS.length) { setTutStep(i + 1); flash('🎁 ' + (s?s.reward:'')); }
    else { setTutStep(null); flash('🎉 Tutorial complete!'); }
  }
  function skipTut(){ setTutStep(null); flash('Tutorial skipped'); }
  function replayTut(){ setTutStep(0); }

  const level = levelFromXp(xp);
  useEffect(()=>{ if(prevLvlRef.current!=null && level>prevLvlRef.current){ setLvlUp(true); zbeep(1046,0.22,'triangle',0.18); setTimeout(()=>setLvlUp(false),1700); } prevLvlRef.current=level; }, [level]);
  const [gameSpeed, setGameSpeed] = useState(1);
  // ---- ZOO ECONOMY MODEL — animals → appeal → visitors → gold/hr (one causal chain) ----
  // ① animals create APPEAL (happier animals are more appealing) → ② appeal pulls in VISITORS,
  //    capped by how many guests the zoo can hold → ③ visitors spend gold at the gate = GOLD/sec.
  const VISITORS_PER_APPEAL = 1.0;   // guests drawn per point of appeal       (tuning knob)
  const SPEND_PER_VISITOR   = 0.05;  // gold/sec each guest spends at the gate  (tuning knob)
  const totalAnimals = owned.reduce((s,k)=> s + cntOf(k), 0);
  const happyMult = (function(){ const h=owned.map(k=>(meters[k]&&meters[k].happy)||60); const avg=h.length?h.reduce((a,b)=>a+b,0)/h.length:60; return Math.max(0.5, Math.min(1.4, 0.4 + avg/100)); })(); // happy animals are more appealing
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
  // slow decay — needs drop over time so they must be refilled
  useEffect(() => {
    const iv = setInterval(() => {
      setMeters(ms => { const n = { ...ms }; owned.forEach(k=>{ if(n[k]) n[k] = { ...n[k], hunger:clamp(n[k].hunger-6), thirst:clamp(n[k].thirst-8), clean:clamp(n[k].clean-5), happy:clamp(n[k].happy-3) }; }); return n; });
    }, 12000);
    return () => clearInterval(iv);
  }, [owned]);

  function buyMoreAnimal(k){
    if (cntOf(k) >= capOf(k)){ flash('Enclosure full — upgrade it first'); return; }
    const cost = Math.round((AA[k].appeal||1) * 22 * cntOf(k)) + 50;
    if (gold < cost){ flash(`Need ${cost.toLocaleString()} 🪙`); return; }
    pay(cost); setPops(p=>({ ...p, [k]: cntOf(k)+1 })); flash(`🐾 +1 ${nameOf(k)}`);
    setNameInput(nameOf(k)); setRenameKey(k);
  }
  function upgradeEnc(k){
    const cost = Math.round((AA[k].appeal||1) * 160 * lvOf(k)) + 300;
    if (gold < cost){ flash(`Need ${cost.toLocaleString()} 🪙`); return; }
    pay(cost); setEncLv(e=>({ ...e, [k]: lvOf(k)+1 })); flash(`🏗️ Enclosure → Lv ${lvOf(k)+1} (+slot & appeal)`);
  }
  // global idle income — runs on every tab, not just the Zoo
  useEffect(() => {
    if (!started) return;                          // no income until the player presses “Let’s go”
    const iv = setInterval(() => { setGold(g=>g+zooRate*gameSpeed); }, 1000);
    return () => clearInterval(iv);
  }, [zooRate, gameSpeed, started]);
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
    if (stat && (meters[sel][stat]||0) >= 98){ flash(`${AA[sel].species}'s ${stat} is already full!`); return; }
    const cost = def.cost ? Math.round(def.cost * (1 + AA[sel].tier*0.4)) : 0;
    if (cost && gold < cost){ flash(`Need ${cost} 🪙`); return; }
    if (cost) pay(cost);
    adjust(sel, def.effect);
    setXp(x => x + 3);
    setBump(b => b + 1);
    const label = { feed:'🍖 Fed', water:'💧 Watered', clean:'🫧 Bathed', play:'🎾 Played', heal:'➕ Vaccinated' }[key];
    flash(cost ? `${label} · −${cost} 🪙` : label);
    if (key==='feed') bump2('feed'); if (key==='clean') bump2('clean');
    tutAction(key);
  }

  function unlockAnimal(k){
    const u = UNLOCKS.find(x=>x.key===k); if(!u || owned.includes(k)) return;
    if (level < u.lv){ flash(`Reach Lv ${u.lv} first`); return; }
    if (gold < u.gold){ flash(`Need ${u.gold.toLocaleString()} 🪙`); return; }
    setNameInput(AA[k].species); setBuyTarget(k);   // open naming modal
  }
  function confirmBuy(){
    const k = buyTarget; const u = UNLOCKS.find(x=>x.key===k); if(!u) { setBuyTarget(null); return; }
    pay(u.gold); setOwned(o=>[...o,k]); setXp(x=>x+40);
    setPops(p=>({ ...p, [k]:1 }));
    setMeters(m=> m[k]?m:{ ...m, [k]:{ hunger:60, thirst:58, clean:64, happy:66, trust:30 } });
    const nm = (nameInput||'').trim();
    if (nm) setNames(n=>({ ...n, [k]:nm }));
    const advanceBuy = (tutStep !== null && TUT_STEPS[tutStep] && TUT_STEPS[tutStep].need === 'buy');
    setBuyTarget(null);
    flash(`🎉 Welcome, ${nm || AA[k].species}!`);
    if (advanceBuy) nextTut();
  }
  function claimQuest(q){
    setGold(g=>g+q.rw.gold); setXp(x=>x+q.rw.xp);
    setChapterIdx(i=>i+1);
    flash(`🏅 Chapter ${q.ch} done! +${q.rw.gold.toLocaleString()} 🪙`);
  }

  function buildAttraction(key){
    const at = ATTRACTIONS.find(a=>a.key===key);
    if (gold < (at.cost||0)){ flash(`Need ${(at.cost||0).toLocaleString()} 🪙 to build`); return; }
    pay(at.cost||0);
    setBuilt(b => [...b, key]);
    const cat = ENT_CATS.find(c=>c.attr===key);
    flash(cat ? `${at.icon} ${at.name} built · ${cat.name} activities open!` : `${at.icon} ${at.name} built!`);
  }

  // entertainment activities — play out, then reward
  const [playAct, setPlayAct] = useState(null);
  function runActivity(a){
    zbeep(520,0.1,'square',0.1);
    const k = owned.find(o=>AA[o] && AA[o].species===a.req);
    setPlayAct({ act:a, animal: k ? AA[k] : null });
    bump2('activity'); if(a.cat==='photo') bump2('photo'); if(a.cat==='feeding') bump2('feeding'); if(a.cat==='riding') bump2('ride');
  }
  function finishActivity(){
    if (playAct){ const a=playAct.act; zbeep(880,0.12,'triangle',0.14); setGold(g=>g+(a.gold||0)); setXp(x=>x+(a.xp||0)); flash(`${a.name} ✓ +${(a.gold||0).toLocaleString()} 🪙`); tryViral(a.name); }
    setPlayAct(null);
  }
  function serveVip(){ const bonus = Math.round(zooRate*15)+200; setGold(g=>g+bonus); bump2('vip'); flash(`🤵 VIP served! +${bonus.toLocaleString()} 🪙`); tryViral('Your VIP guest'); }
  function addEnrichment(k){ const lv=enrLvOf(k); const cost=Math.round((AA[k].appeal||1)*40*(lv+1))+200; if(gold<cost){ flash(`Need ${cost.toLocaleString()} 🪙`); return; } pay(cost); setEnrich(e=>({ ...e, [k]:lv+1 })); adjust(k,{ happy:18, trust:8 }); zbeep(720,0.12,'triangle',0.14); flash(`✨ ${AA[k].species} enrichment Lv ${lv+1} — happier & more appealing!`); }
  function tryViral(name){ const hs=owned.map(k=>(meters[k]&&meters[k].happy)||0); const avg=hs.length?hs.reduce((a,b)=>a+b,0)/hs.length:0; if(avg>=68 && Math.random()<0.3){ const bonus=Math.round(zooRate*30)+500; setGold(g=>g+bonus); zbeep(1320,0.28,'triangle',0.18); setViral({ name, bonus }); setTimeout(()=>setViral(null),2600); } }
  function pay(cost){ cost=Math.round(cost||0); if(cost<=0) return; setGold(g=>g-cost); const id=Date.now()+Math.random(); setGoldFx({id,v:-cost}); setTimeout(()=>setGoldFx(g=>g&&g.id===id?null:g),1000); }
  function claimService(q){ setGold(g=>g+q.rw.gold); setServiceIdx(i=>i+1); flash(`🛎️ ${q.title} ✓ +${q.rw.gold.toLocaleString()} 🪙`); }
  // admin helpers
  function adminLevel(n){ const target = Math.min(LEVEL_XP.length, level+n); setXp(LEVEL_XP[target-1] || LEVEL_XP[LEVEL_XP.length-1]); flash(`🛠️ Level → ${target}`); }
  function adminUnlockNext(){ const nx = UNLOCKS.find(u=>!owned.includes(u.key)); if(!nx){ flash('All unlocked'); return; } setOwned(o=>[...o,nx.key]); setMeters(m=>m[nx.key]?m:{ ...m,[nx.key]:{ hunger:62,thirst:60,clean:66,happy:68,trust:40 } }); flash(`🛠️ Unlocked ${AA[nx.key].species}`); }
  function adminUnlockAll(){ const all = UNLOCKS.map(u=>u.key); setOwned(o=>Array.from(new Set([...o,...all]))); setMeters(m=>{ const nm={...m}; all.forEach(k=>{ if(!nm[k]) nm[k]={ hunger:62,thirst:60,clean:66,happy:68,trust:40 }; }); return nm; }); flash('🛠️ All animals unlocked'); }
  function adminReset(){ setOwned(['rabbit']); setGold(50); setGems(10); setXp(0); setBuilt([]); setCounts({ feed:0,clean:0,activity:0,photo:0,feeding:0,ride:0,vip:0 }); setChapterIdx(0); setMeters({ ...FRESH_METERS }); setPops({}); setEncLv({}); setNames({}); setAdminOpen(false); setTab('live'); flash('↺ Game reset'); }

  const a = AA[sel];
  const m = meters[sel];
  const tutFocus = (tutStep !== null && TUT_STEPS[tutStep] && TUT_STEPS[tutStep].need) || null;
  const rateFocus = (tutStep !== null && TUT_STEPS[tutStep] && TUT_STEPS[tutStep].hi === 'income');
  const buyFocus  = (tutStep !== null && TUT_STEPS[tutStep] && TUT_STEPS[tutStep].hi === 'buy');
  const atMaxLevel = level >= MAX_LEVEL;
  const curLvXp = LEVEL_XP[level-1] || 0;
  const nextLvXp = atMaxLevel ? curLvXp : (LEVEL_XP[level] || curLvXp);
  const xpPct = (!atMaxLevel && nextLvXp>curLvXp) ? Math.min(100, Math.round((xp-curLvXp)/(nextLvXp-curLvXp)*100)) : 100;

  const SIDE = {
    live:   { t:'Live zoo (idle home)', d:'The home screen is a living zoo. Visitors stream in through the ticket gate and stroll the paths past your habitats — and gold ticks up in real time even while you watch. This is the idle session: the zoo earns whether you play 90 seconds or 20 minutes. Use the speed toggle to fast-forward.' },
    animals:{ t:'Animals / collection', d:'Every owned species with its live needs. Amber ring = a need is low. Tap to open care. Animals are organised by habitat (Meadow, Pasture, …) and unlocked one at a time as the zoo levels up — never bought with money.' },
    care:   { t:'Animal care', d:'Six one-tap actions move the five needs. Hunger & Thirst drain on a timer; Cleanliness is habitat hygiene; Happiness is the visible outcome; Trust builds slowly through daily care and gates attractions & performance. Better care = more visitor satisfaction & income.' },
    enclosure:{ t:'Enclosure detail', d:'Tapping an enclosure opens the animals living inside it. Each individual shows its own status — Hungry, Thirsty, Needs cleaning, Restless, Content or Thriving — so you can spot which one needs attention. Tap an animal to care for it.' },
    attractions:{ t:'Attractions', d:'Built gradually as the zoo expands. Petting, Feeding Zone, Rides, Educational Shows and the Performance Arena each multiply visitors, revenue or reputation. Big milestone purchases that reshape income.' },
    show:   { t:'Entertainment activities', d:'Visitor experiences — photo sessions, feeding, rides, educational demos and premium encounters. Each activity requires specific animal species and has a cooldown, so unlocking a new animal opens entirely new activities and revenue. Players strategically run activities through the day for gold, reputation, satisfaction and XP.' },
    shop:   { t:'Shop', d:'Cosmetic-led monetization: gem packs, VIP membership, decor & habitat themes, event pass. Convenience and cosmetics only — progression and animals are never sold.' },
  };

  const screen = (
    <div className="act-screen">
      <div className="act-notch"></div>
      <div className="act-status"><span>9:41</span><span>{tutStep===null && <span onClick={replayTut} style={{ cursor:'pointer' }} title="Replay tutorial">❔ </span>}<span onClick={()=>setSoundOn(s=>!s)} style={{ cursor:'pointer' }} title="Sound on/off">{soundOn?'🔊':'🔇'} </span>📶 🔋</span></div>

      <div className="act-top">
        <Cur icon="🪙" v={Math.round(gold).toLocaleString()} t="Gold" bg="#FFEFC2" />
        <Cur icon="💎" v={gems} t="Gems" bg="#D4ECF5" />
        <Cur icon="⭐" v={'Lv '+level} t="Zoo" bg="#E8E0FF" />
      </div>
      <div className="xp-bar">
        <div className="xp-track"><i style={{ width:xpPct+'%' }}></i></div>
        <span className="xp-lbl">{atMaxLevel ? `Lv ${level} · MAX` : `Lv ${level} · ${Math.max(0, nextLvXp-Math.round(xp)).toLocaleString()} XP → Lv ${level+1}`}</span>
      </div>

      {goldFx && <div className="float" style={{ position:'absolute', top:74, left:'16%', transform:'translateX(-50%)', color:'#FF9AA6', fontWeight:800, fontSize:15, zIndex:62, pointerEvents:'none', background:'rgba(20,16,26,.55)', padding:'3px 10px', borderRadius:999 }}>{goldFx.v.toLocaleString()} 🪙</div>}
      {lvlUp && <div className="float" style={{ position:'absolute', top:74, right:'8%', color:'#fff', fontWeight:800, fontSize:15, zIndex:62, pointerEvents:'none', background:'rgba(124,92,255,.85)', padding:'3px 10px', borderRadius:999 }}>⬆️ Lv {level}</div>}
      <div className="act-view">
        {tab==='live'    && <LiveZoo owned={owned} meters={meters} counts={pops} rate={Math.round(zooRate)} gold={gold} setGold={setGold} xp={xp} setXp={setXp} onOpen={openEnclosure} rateFocus={rateFocus} speed={gameSpeed} setSpeed={setGameSpeed} onVip={serveVip} locked={tutStep!==null} appeal={appeal} visitors={visitors} capacity={capacity} capped={visitorCapped} satis={happyMult} onLocked={()=>setTab('animals')} />}
        {tab==='animals' && <AnimalsScreen owned={owned} meters={meters} counts={pops} level={level} gold={gold} onPick={openEnclosure} onUnlock={unlockAnimal} buyFocus={buyFocus} nameOf={nameOf} />}
        {tab==='enclosure' && <EnclosureScreen a={AA[selEnc]} m={meters[selEnc]} count={cntOf(selEnc)} cap={capOf(selEnc)} encLv={lvOf(selEnc)} appeal={Math.round(appealOf(selEnc))} gold={gold} name={nameOf(selEnc)} lock={tutStep!==null} onRename={()=>openRename(selEnc)} onBuyMore={()=>buyMoreAnimal(selEnc)} onUpgrade={()=>upgradeEnc(selEnc)} onPick={()=>openCare(selEnc)} onBack={()=>setTab(encFrom.current)} enrLv={enrLvOf(selEnc)} onEnrich={()=>addEnrichment(selEnc)} />}
        {tab==='care'    && <CareScreen a={a} m={m} bump={bump} name={nameOf(sel)} lock={tutStep!==null} onRename={()=>openRename(sel)} onAction={doAction} focus={(tutFocus==='feed'||tutFocus==='clean')?tutFocus:null} onBack={()=>setTab(prevTab.current==='care'?'live':prevTab.current)} />}
        {tab==='attractions' && <AttractionsScreen built={built} onBuild={buildAttraction} owned={owned} onOpen={openCare} gold={gold} />}
        {tab==='show'    && <ActivitiesScreen owned={owned} built={built} onRun={runActivity} onGo={()=>setTab('attractions')} level={level} />}
        {tab==='shop'    && <ShopScreen gems={gems} onBuyGold={(g,gd)=>{ if(gems>=g){ setGems(x=>x-g); setGold(x=>x+gd); flash(`🪙 +${gd.toLocaleString()} for 💎 ${g}`); } else { flash(`Need 💎 ${g}`); } }} />}

        {/* New Player Quest tracker (home only, after tutorial) */}
        {tab==='live' && tutStep===null && <QuestTracker chapterIdx={chapterIdx} counts={counts} owned={owned} level={level} animals={owned.reduce((s,k)=>s+cntOf(k),0)} onClaim={claimQuest} onGo={(t)=>setTab(t)} />}
        {tab==='live' && tutStep===null && <ServiceQuests idx={serviceIdx} counts={counts} owned={owned} level={level} onClaim={claimService} />}
        {tutStep===null && <AdminPanel open={adminOpen} onOpen={()=>setAdminOpen(true)} onClose={()=>setAdminOpen(false)} level={level} gold={gold} onGold={(n)=>{setGold(g=>g+n);}} onGems={(n)=>setGems(g=>g+n)} onLevel={adminLevel} onUnlockNext={adminUnlockNext} onUnlockAll={adminUnlockAll} onReset={adminReset} />}

        {performing && <ShowStage lineup={performing} meters={meters} onDone={()=>setPerforming(null)} />}
        {playAct && <ActivityStage act={playAct.act} animal={playAct.animal} onDone={finishActivity} />}

        {renameKey && (
          <div className="act-modal-scrim">
            <div className="act-modal pop">
              <div style={{ fontSize:38 }}>{AA[renameKey].emoji}</div>
              <div style={{ fontSize:16, fontWeight:800, marginTop:4 }}>Name your {AA[renameKey].species}</div>
              <div style={{ position:'relative', marginTop:8 }}>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)} maxLength={14}
                  style={{ width:'100%', textAlign:'center', fontFamily:'inherit', fontSize:15, fontWeight:800, color:'var(--act-ink)', padding:'10px 34px', borderRadius:12, border:'2px solid #E2CFB2', background:'#fff', outline:'none' }} />
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none', opacity:.7 }}>✏️</span>
              </div>
              <div className="row" style={{ gap:9, marginTop:12 }}>
                <button className="gbtn ghost sm" style={{ flex:1 }} onClick={()=>setRenameKey(null)}>Cancel</button>
                <button className="gbtn grass sm" style={{ flex:1 }} onClick={saveRename}>Save</button>
              </div>
            </div>
          </div>
        )}

        {tutStep !== null && !buyTarget && <TutorialCoach step={tutStep} onNext={nextTut} onSkip={skipTut} />}

        {buyTarget && (
          <div className="act-modal-scrim">
            <div className="act-modal pop">
              <div style={{ fontSize:40 }}>{AA[buyTarget].emoji}</div>
              <div style={{ fontSize:17, fontWeight:800, marginTop:4 }}>Adopt a {AA[buyTarget].species}</div>
              <div style={{ fontSize:12, color:'var(--act-ink-soft)', margin:'4px 0 12px' }}>Give your new animal a name</div>
              <div style={{ position:'relative' }}>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)} maxLength={14}
                  style={{ width:'100%', textAlign:'center', fontFamily:'inherit', fontSize:15, fontWeight:800, color:'var(--act-ink)', padding:'10px 34px', borderRadius:12, border:'2px solid #E2CFB2', background:'#fff', outline:'none' }} />
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none', opacity:.7 }}>✏️</span>
              </div>
              <div className="row" style={{ gap:9, marginTop:12 }}>
                <button className="gbtn ghost sm" style={{ flex:1 }} onClick={()=>setBuyTarget(null)}>Cancel</button>
                <button className="gbtn grass sm" style={{ flex:1 }} onClick={confirmBuy}>Adopt</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'rgba(20,16,26,.9)', color:'#fff', padding:'12px 18px', borderRadius:16, fontSize:13.5, fontWeight:800, width:'66%', textAlign:'center', lineHeight:1.4, zIndex:95, boxShadow:'0 10px 30px rgba(20,16,26,.5)' }}>{toast}</div>}

        {viral && (
          <div className="act-modal-scrim" style={{ zIndex:64, background:'rgba(20,16,26,.45)' }}>
            <div className="pop" style={{ textAlign:'center', color:'#fff' }}>
              <div style={{ fontSize:56 }}>📹</div>
              <div style={{ fontSize:20, fontWeight:800 }}>Going viral!</div>
              <div style={{ fontSize:13, fontWeight:600, marginTop:6, opacity:.92 }}>{viral.name} stole the show 💛</div>
              <div style={{ display:'inline-block', marginTop:12, fontSize:16, fontWeight:800, color:'#191C1D', background:'var(--act-gold)', padding:'8px 20px', borderRadius:999, boxShadow:'0 8px 24px rgba(245,150,11,.5)' }}>+{viral.bonus.toLocaleString()} 🪙 viral bonus</div>
            </div>
          </div>
        )}

        {!started && (
          <div className="act-modal-scrim" style={{ zIndex:70 }}>
            <div className="act-modal pop" style={{ textAlign:'center' }}>
              <div style={{ fontSize:46 }}>🦊</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--act-ink)', marginTop:6 }}>Welcome to your zoo!</div>
              <div style={{ fontSize:12.5, color:'var(--act-ink-soft)', fontWeight:600, lineHeight:1.5, marginTop:8 }}>Adopt animals, care for them and let visitors stream in. Your zoo earns gold automatically — ready to open the gates?</div>
              <button className="gbtn grass" style={{ width:'100%', marginTop:16 }} onClick={()=>{ setStarted(true); setTutStep(0); }}>Let’s go ▶</button>
            </div>
          </div>
        )}

        {offline && (
          <div className="act-modal-scrim">
            <div className="act-modal pop">
              <div style={{ fontSize:40 }}>🦁</div>
              <div style={{ fontSize:17, fontWeight:800, marginTop:4 }}>While you were away</div>
              <div style={{ fontSize:12, color:'var(--act-ink-soft)', margin:'4px 0 12px' }}>Your zoo welcomed visitors for 8h 04m</div>
              <div className="gcard" style={{ margin:0 }}>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>🪙 Gold</span><b>+5,240</b></div>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>⭐ Zoo XP</span><b>+820</b></div>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>🎤 Show revenue</span><b>+1,100</b></div>
              </div>
              <button className="gbtn gold" style={{ marginTop:12 }} onClick={()=>{ setGold(g=>g+6340); setXp(x=>x+820); setOffline(false); flash('Collected! 🪙 +6,340'); }}>Collect rewards</button>
            </div>
          </div>
        )}

        {show && (
          <div className="act-modal-scrim">
            <div className="act-modal pop">
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--act-grape)' }}>Showtime!</div>
              <div className="bigstars" style={{ marginTop:6 }}>{'⭐'.repeat(show.stars)}{'☆'.repeat(3-show.stars)}</div>
              <div style={{ fontSize:12, color:'var(--act-ink-soft)', marginTop:4 }}>Crowd bonus ×{show.combo.toFixed(1)} from animal trust</div>
              <div className="gcard" style={{ margin:'12px 0 0' }}>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>🪙 Revenue</span><b>+{show.reward.toLocaleString()}</b></div>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>🏅 Reputation</span><b>+{show.rep}</b></div>
                <div className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>⭐ Zoo XP</span><b>+{show.xp}</b></div>
              </div>
              <button className="gbtn grape" style={{ marginTop:12 }} onClick={()=>setShow(null)}>Take a bow 🎤</button>
            </div>
          </div>
        )}
      </div>

      <div className="act-tabs" style={{ pointerEvents: tutStep!==null?'none':'auto', opacity: tutStep!==null?0.45:1, filter: tutStep!==null?'grayscale(0.5)':'none' }}>
        <Tab on={tab==='live'} ic="🏞️" l="Zoo" onClick={()=>setTab('live')} />
        <Tab on={tab==='animals'||tab==='care'||tab==='enclosure'} ic="🐾" l="Animals" onClick={()=>setTab('animals')} />
        <Tab on={tab==='attractions'} ic="🎡" l="Attract" onClick={()=>setTab('attractions')} noti={tab!=='attractions' && ATTRACTIONS.some(at=>!built.includes(at.key) && gold>=(at.cost||0))} />
        <Tab on={tab==='show'} ic="🎟️" l="Activities" onClick={()=>setTab('show')} noti={tab!=='show' && ENTERTAINMENT.some(act=>{ const c=ENT_CATS.find(x=>x.key===act.cat); return c && built.includes(c.attr) && owned.some(k=>AA[k]&&AA[k].species===act.req); })} />
        <Tab on={tab==='shop'} ic="🛍️" l="Shop" onClick={()=>setTab('shop')} />
      </div>
    </div>
  );

  if (fullscreen) return <div className="act-fullscreen">{screen}</div>;

  return (
    <div className="proto-stage">
      <div>
        <div className="act-device">{screen}</div>
        <div className="proto-cap">Live idle zoo — watch it run, then tap in.</div>
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
          <div className="note-h">Art direction note</div>
          Final build replaces these emoji stand-ins with cute stylized-3D animals, an isometric zoo diorama, strolling visitor crowds and high-quality idle animations. Layout, motion intent and the live idle loop shown here are production-intent.
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
