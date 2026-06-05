// ============================================================
// LIVE PROTOTYPE — zoo game screens
// ============================================================
const AZ = Object.fromEntries(ANIMALS.map(a => [a.key, a]));

// ---- ANIMALS / COLLECTION ----------------------------------
function AnimalsScreen({ owned, meters, level, gold, onPick, onUnlock = ()=>{}, buyFocus = false, nameOf = (k)=>(AZ[k]||{}).species, counts }) {
  const needs = (k)=> meters[k].hunger<35 || meters[k].thirst<35 || meters[k].clean<35;
  const locked = (typeof UNLOCKS!=='undefined' ? UNLOCKS : []).filter(u=>!owned.includes(u.key));
  const scRef = useRef(null); const buyRef = useRef(null);
  useEffect(()=>{ if(buyFocus && scRef.current && buyRef.current) scRef.current.scrollTop = Math.max(0, buyRef.current.offsetTop - scRef.current.clientHeight*0.5); }, [buyFocus]);
  return (
    <div className="act-scroll" ref={scRef}>
      <div className="bigtop" style={{ background:'repeating-linear-gradient(90deg,#36C98A 0 18px,#fff 18px 36px)', boxShadow:'0 6px 0 rgba(31,157,104,.22)' }}>
        <div className="inner">
          <h3>Good morning, Director! 🦁</h3>
          <p>Tap an animal to care for it, or adopt new species below as your zoo levels up.</p>
        </div>
      </div>
      <div className="act-sech">
        <div><div className="act-h">Your animals</div><div className="act-sub">{owned.length} species · Zoo Level {level}</div></div>
        <span className="act-secmore">Map ›</span>
      </div>
      <div className="pen-grid">
        {owned.map(k=>{
          const a = AZ[k]; const m = meters[k]; const cnt = (counts&&counts[k]!=null)?counts[k]:1;
          return (
            <div key={k} className={'pen'+(needs(k)?' alert':'')} onClick={()=>onPick(k)}>
              <div className="pen-emoji" style={{ background:a.bg }}>{a.emoji}</div>
              <div className="pen-name">{nameOf(k)} {needs(k) && <span className="starbadge">⚠️</span>}</div>
              <div className="pen-meta">{a.species} · ×{cnt} · ✨{(a.appeal*cnt).toLocaleString()} appeal</div>
              <MiniMeter icon="🍖" v={m.hunger} color="#EF4B5C" />
              <MiniMeter icon="💧" v={m.thirst} color="#34B6F0" />
              <MiniMeter icon="❤️" v={m.trust} color="#FF7FA8" />
            </div>
          );
        })}
      </div>

      {locked.length>0 && <div className="act-sech" ref={buyRef}><div className="act-h" style={{ fontSize:13 }}>Adopt new animals</div><div className="act-sub">unlocked as your Zoo Level rises</div></div>}
      <div className="pen-grid">
        {locked.map(u=>{
          const a = AZ[u.key]; const ok = level>=u.lv && gold>=u.gold; const cnt = ENC_COUNTS[u.key]||1;
          return (
            <div key={u.key} className="pen" style={{ textAlign:'center' }}>
              <div className="pen-emoji" style={{ background:'#EFE4D4', filter:'grayscale(.5) opacity(.85)' }}>{level>=u.lv?a.emoji:'🔒'}</div>
              <div className="pen-name">{a.species}</div>
              <div className="pen-meta">✨{(a.appeal*cnt).toLocaleString()} appeal · needs Lv{u.lv}</div>
              {level<u.lv
                ? <button className="gbtn ghost sm" style={{ width:'100%', marginTop:7, fontSize:10.5, opacity:.6 }} onClick={()=>onUnlock(u.key)}>🔒 Reach Lv {u.lv}</button>
                : <button className={'gbtn grass sm'+(buyFocus?' tut-hi':'')} style={{ width:'100%', marginTop:7, fontSize:10.5, opacity:ok?1:.55 }} onClick={()=>onUnlock(u.key)}>Buy · {u.gold.toLocaleString()} 🪙</button>}
            </div>
          );
        })}
      </div>
      <div style={{ height:8 }}></div>
    </div>
  );
}

// ---- CARE (5 stats / 6 actions) ----------------------------
function CareScreen({ a, m, bump, onAction, onBack, focus, name, lock=false, onRename=()=>{} }) {
  const fcls = (k)=> focus ? (focus===k ? ' tut-hi' : ' tut-dim') : '';
  const costOf = (key)=>{ const def = (typeof ACTIONS!=='undefined' ? ACTIONS.find(x=>x.key===key) : null)||{}; return Math.round((def.cost||0)*(1+(a.tier||0)*0.4)); };
  const tam = TAMING[a.taming];
  const cnt = ENC_COUNTS[a.key]||1;
  const rows = [
    { icon:'🍖', name:'Hunger',      v:m.hunger, c:'#EF4B5C' },
    { icon:'💧', name:'Thirst',      v:m.thirst, c:'#34B6F0' },
    { icon:'🫧', name:'Cleanliness', v:m.clean,  c:'#36C98A' },
    { icon:'😊', name:'Happiness',   v:m.happy,  c:'#FFB22E' },
    { icon:'❤️', name:'Trust',       v:m.trust,  c:'#FF7FA8' },
  ];
  return (
    <div className="act-scroll">
      <div style={{ padding:'2px 14px 0' }}>
        <button className="gbtn ghost sm" onClick={()=>{ if(!lock) onBack(); }} style={{ width:'auto', padding:'6px 12px', fontSize:11, opacity:lock?0.4:1 }}>‹ Animals</button>
      </div>
      <div className="gcard" style={{ textAlign:'center', marginTop:10 }}>
        <div key={bump} className="pop" style={{ fontSize:74, lineHeight:1 }}>{a.emoji}</div>
        <div style={{ fontSize:18, fontWeight:800, marginTop:4 }}>{name || a.species} <span onClick={onRename} style={{ cursor:'pointer', fontSize:14 }} title="Rename">✏️</span></div>
        <div style={{ fontSize:11.5, color:'var(--act-ink-soft)', fontWeight:600 }}>{a.species} · Adult · ✨{(a.appeal*cnt).toLocaleString()} appeal</div>
        <div className="chips" style={{ justifyContent:'center', marginTop:8 }}>
          <span className="chip-x" style={{ background:'#fff', border:'1px solid #F0E2CE', color:tam.color }}>Taming · {a.taming}</span>
          {a.perform && <span className="chip-x" style={{ background:'#F2D9FF', border:'none', color:'#7C5CFF' }}>🎪 Can perform</span>}
        </div>
      </div>

      <div className="gcard">
        <div style={{ fontSize:12.5, fontWeight:800, marginBottom:6 }}>Needs</div>
        {rows.map(s=>(
          <div key={s.name} style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 0' }}>
            <span style={{ width:18, textAlign:'center' }}>{s.icon}</span>
            <span style={{ width:80, fontSize:11, fontWeight:700, color:'var(--act-ink-soft)' }}>{s.name}</span>
            <div className="bar" style={{ flex:1, height:8, borderRadius:5, background:'#EFE4D4', overflow:'hidden' }}><i style={{ display:'block', height:'100%', width:s.v+'%', background:s.c, borderRadius:5, transition:'width .3s' }}></i></div>
            <span style={{ width:30, textAlign:'right', fontSize:11, fontWeight:800, fontVariantNumeric:'tabular-nums' }}>{s.v}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, padding:'0 14px 6px' }}>
        <button className={'gbtn'+fcls('feed')} onClick={()=>onAction('feed')}>🍖 Feed<br/><span style={{ fontSize:9, fontWeight:700 }}>{costOf('feed')} 🪙</span></button>
        <button className={'gbtn'+fcls('water')} style={{ background:'#34B6F0', boxShadow:'0 4px 0 #1f93cc' }} onClick={()=>onAction('water')}>💧 Water<br/><span style={{ fontSize:9, fontWeight:700 }}>{costOf('water')} 🪙</span></button>
        <button className={'gbtn grass'+fcls('clean')} onClick={()=>onAction('clean')}>🫧 Bathe<br/><span style={{ fontSize:9, fontWeight:700 }}>{costOf('clean')} 🪙</span></button>
        <button className={'gbtn gold'+fcls('play')} onClick={()=>onAction('play')}>🎾 Play<br/><span style={{ fontSize:9, fontWeight:700 }}>free</span></button>
        <button className={'gbtn grape'+fcls('heal')} onClick={()=>onAction('heal')}>➕ Health<br/><span style={{ fontSize:9, fontWeight:700 }}>{costOf('heal')} 🪙</span></button>
      </div>
      <div style={{ padding:'0 14px 14px', fontSize:9.5, color:'var(--act-ink-soft)', fontWeight:700, textAlign:'center' }}>🛒 Food price scales with species · needs refill on a cooldown</div>
    </div>
  );
}

// ---- ATTRACTIONS -------------------------------------------
function AttractionsScreen({ built, onBuild, owned = [], onOpen = ()=>{}, gold = 0 }) {
  // first affordable, unbuilt attraction → highlight its Build button
  const guideKey = (ATTRACTIONS.find(at=>!built.includes(at.key) && gold>=(at.cost||0))||{}).key;
  // which owned animals participate in each attraction
  const participants = (key) => {
    const has = owned.map(k=>AZ[k]).filter(Boolean);
    if (key==='petting')  return has.filter(a=>['Very Easy','Easy'].includes(a.taming));
    if (key==='feeding')  return has;
    if (key==='rides')    return has.filter(a=>['Horse','Donkey','Camel','Ostrich','Elephant','Pony'].includes(a.species));
    if (key==='shows' || key==='perform') return has.filter(a=>a.perform);
    return [];
  };
  return (
    <div className="act-scroll">
      <div className="act-sech"><div><div className="act-h">Attractions</div><div className="act-sub">Your animals draw the crowds</div></div></div>
      <div style={{ padding:'0 14px 14px' }} className="stack-12">
        {ATTRACTIONS.map(at=>{
          const isBuilt = built.includes(at.key);
          const stars = participants(at.key);
          return (
            <div key={at.key} className="gcard" style={{ margin:0 }}>
              <div className="grow" style={{ alignItems:'center' }}>
                <div style={{ width:46, height:46, borderRadius:13, background:'#FFF3D6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:23, flex:'0 0 auto' }}>{at.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800 }}>{at.name}</div>
                  <span className="combo-pill" style={{ marginTop:3 }}>{at.effect}</span>
                </div>
                {isBuilt && <span className="chip-x" style={{ background:'#D7F0E2', border:'none', color:'#1f9d68', fontWeight:800 }}>✓ Built</span>}
              </div>
              <div style={{ fontSize:11, color:'var(--act-ink-soft)', fontWeight:600, lineHeight:1.4, marginTop:8 }}>{at.desc}</div>
              {!isBuilt && <button className={'gbtn grass'+(at.key===guideKey?' tut-hi':'')} style={{ width:'100%', marginTop:10, opacity: gold>=(at.cost||0)?1:.6 }} onClick={()=>onBuild(at.key)}>Build · {(at.cost||0).toLocaleString()} 🪙</button>}
              {/* owned animals featured in this attraction */}
              {isBuilt && (
                <div style={{ marginTop:10, borderTop:'1px solid #F4E8D6', paddingTop:9 }}>
                  <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--act-ink-soft)', marginBottom:6 }}>Your animals here</div>
                  {stars.length ? (
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                      {stars.map(a=>(
                        <button key={a.key} onClick={()=>onOpen(a.key)} title={a.name} style={{ border:'none', background:a.bg, borderRadius:12, padding:'5px 8px', display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontFamily:'inherit' }}>
                          <span style={{ fontSize:18 }}>{a.emoji}</span>
                          <span style={{ fontSize:10.5, fontWeight:800, color:'var(--act-ink)' }}>{a.species}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize:10.5, color:'var(--act-ink-soft)', fontWeight:600 }}>No eligible animals yet — unlock one to feature it here.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- ENTERTAINMENT ACTIVITIES (cooldown-based) -------------
function ActivitiesScreen({ owned = [], built = [], onRun, onGo = ()=>{}, level = 1 }) {
  const ownedSpecies = React.useMemo(()=> new Set(owned.map(k=>AZ[k]&&AZ[k].species).filter(Boolean)), [owned]);
  const [cd, setCd] = useState({});   // key → seconds left
  useEffect(()=>{
    const iv = setInterval(()=> setCd(c=>{
      const n={}; let ch=false;
      for(const k in c){ if(c[k]>1){ n[k]=c[k]-1; ch=true; } else ch=true; }
      return ch ? n : c;
    }), 1000);
    return ()=>clearInterval(iv);
  },[]);
  const run = (a)=>{ setCd(c=>({ ...c, [a.key]: a.demo })); onRun(a); };
  const fmtCd = (n)=> n>=3600 ? `${Math.floor(n/3600)}h ${Math.floor(n%3600/60)}m` : n>=60 ? `${Math.floor(n/60)}m ${n%60}s` : `${n}s`;
  const attrName = (k)=> (ATTRACTIONS.find(at=>at.key===k)||{}).name || 'attraction';

  return (
    <div className="act-scroll">
      <div className="bigtop" style={{ background:'repeating-linear-gradient(90deg,#36C98A 0 18px,#fff 18px 36px)', boxShadow:'0 6px 0 rgba(31,157,104,.22)' }}>
        <div className="inner">
          <h3>Visitor activities 🎟️</h3>
          <p>Build an attraction to open its activities. Each runs for gold, reputation & XP, then needs a cooldown.</p>
        </div>
      </div>
      {ENT_CATS.map(cat=>{
        const acts = ENTERTAINMENT.filter(a=>a.cat===cat.key);
        const open = built.includes(cat.attr);
        return (
          <div key={cat.key}>
            <div className="act-sech">
              <div className="act-h" style={{ padding:0, fontSize:13 }}>{cat.icon} {cat.name}</div>
              {open
                ? <span className="act-sub" style={{ margin:0 }}>CD {cat.cd}</span>
                : (level >= (cat.lv||1)
                    ? <button className="gbtn grass sm" style={{ padding:'5px 11px', fontSize:10.5 }} onClick={onGo}>🏗️ Build {attrName(cat.attr)}</button>
                    : <span className="chip-x" style={{ background:'#F4E8D6', border:'none', color:'var(--act-ink-soft)', fontWeight:800 }}>🔒 Reach Lv {cat.lv}</span>)}
            </div>
            <div style={{ padding:'0 14px 8px' }} className="stack-12">
              {acts.map(a=>{
                const unlocked = ownedSpecies.has(a.req);
                const left = cd[a.key]||0;
                const rewards = [a.gold&&`🪙 ${a.gold}`, a.rep&&`🏅 ${a.rep}`, a.xp&&`⭐ ${a.xp}`, a.happy&&`😊 ${a.happy}`].filter(Boolean);
                return (
                  <div key={a.key} className="gcard" style={{ margin:0, opacity:(open&&unlocked)?1:0.66 }}>
                    <div className="grow" style={{ alignItems:'flex-start' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:800 }}>{a.name}{a.watch && <span style={{ fontSize:9, color:'#7C5CFF', marginLeft:5 }}>▶ live</span>}</div>
                        <div style={{ fontSize:10, color:'var(--act-ink-soft)', fontWeight:700, marginTop:1 }}>Requires {a.req}</div>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:5 }}>
                          {rewards.map(r=><span key={r} className="chip-x" style={{ fontSize:10, padding:'1px 7px' }}>{r}</span>)}
                        </div>
                      </div>
                      <div style={{ flex:'0 0 auto' }}>
                        {!open
                          ? <span className="chip-x" style={{ background:'#FFF0D6', border:'none', color:'#9a6a1e', fontWeight:800 }}>🏗️ Locked</span>
                          : !unlocked
                            ? <span className="chip-x" style={{ background:'#F4E8D6', border:'none', color:'var(--act-ink-soft)', fontWeight:800 }}>🔒 Unlock {a.req}</span>
                            : left>0
                              ? <span className="chip-x" style={{ background:'#EFE4D4', border:'none', color:'var(--act-ink-soft)', fontWeight:800, fontFamily:'var(--font-mono)' }}>⏳ {fmtCd(left)}</span>
                              : <button className="gbtn grass sm rdy" onClick={()=>run(a)}>Run</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ height:8 }}></div>
    </div>
  );
}

// ---- SHOP --------------------------------------------------
function ShopScreen({ gems=0, onBuyGold=()=>{} }) {
  const PACKS = [ {g:10, gold:5000}, {g:50, gold:30000}, {g:100, gold:70000} ];
  return (
    <div className="act-scroll">
      <div className="act-sech"><div><div className="act-h">Shop</div><div className="act-sub">Convenience & cosmetics — never animals</div></div></div>

      <div className="act-sech"><div className="act-h" style={{ padding:0, fontSize:13 }}>🪙 Buy gold with gems</div><span className="act-sub" style={{ margin:0 }}>💎 {gems}</span></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, padding:'0 14px 12px' }}>
        {PACKS.map(p=>{
          const ok = gems>=p.g;
          return (
            <div key={p.g} className="shop-card" style={{ opacity:ok?1:.5 }} onClick={()=>onBuyGold(p.g, p.gold)}>
              <div style={{ fontSize:20 }}>🪙</div>
              <div className="shop-amt" style={{ fontSize:14 }}>{p.gold.toLocaleString()}</div>
              <div className="shop-price" style={{ background:ok?'var(--act-grass)':'#B9AE9C' }}>💎 {p.g}</div>
            </div>
          );
        })}
      </div>
      <div className="gcard" style={{ background:'linear-gradient(150deg,#FFF7E6,#FFE2BC)', border:'1.5px solid var(--act-gold)' }}>
        <div className="grow">
          <div style={{ width:52, height:52, borderRadius:14, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>🌿</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13.5, fontWeight:800 }}>VIP Membership</div>
            <div style={{ fontSize:11, color:'var(--act-ink-soft)', fontWeight:600 }}>24h idle · 2× daily gems · no ads</div>
          </div>
          <div style={{ background:'var(--act-grass)', color:'#fff', fontWeight:800, fontSize:13, padding:'6px 10px', borderRadius:10 }}>$7.99</div>
        </div>
      </div>
      <div className="act-sech"><div className="act-h" style={{ padding:0, fontSize:13 }}>💎 Gem packs</div></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, padding:'0 14px 12px' }}>
        {IAP.slice(0,6).map(p=>(
          <div key={p.name} className={'shop-card'+(p.best?' feat':'')}>
            {p.best && <div className="shop-best">BEST VALUE</div>}
            <div style={{ fontSize:24 }}>💎</div>
            <div className="shop-amt">{p.gems.toLocaleString()}</div>
            <div className="shop-price">{p.price}</div>
          </div>
        ))}
      </div>
      <div className="act-sech"><div className="act-h" style={{ padding:0, fontSize:13 }}>🎟️ Offers</div></div>
      <div style={{ padding:'0 14px 16px' }} className="stack-12">
        {OFFERS.map(o=>(
          <div key={o.name} className="gcard" style={{ margin:0 }}>
            <div className="grow">
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9.5, fontWeight:800, color:'var(--act-grape)', textTransform:'uppercase', letterSpacing:'.04em' }}>{o.tag}</div>
                <div style={{ fontSize:13, fontWeight:800 }}>{o.name}</div>
                <div style={{ fontSize:10.5, color:'var(--act-ink-soft)', fontWeight:600 }}>{o.contents}</div>
              </div>
              <button className="gbtn grass sm">{o.price}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AnimalsScreen, CareScreen, AttractionsScreen, ActivitiesScreen, ShopScreen });

// ---- ENCLOSURE DETAIL (animals inside, varied statuses) ----
function EncMini({ ic, v, c }) {
  return <div style={{ display:'flex', alignItems:'center', gap:3 }}><span style={{ fontSize:9 }}>{ic}</span><div style={{ width:34, height:5, borderRadius:3, background:'#EFE4D4', overflow:'hidden' }}><i style={{ display:'block', height:'100%', width:v+'%', background:c }}></i></div></div>;
}
function EnclosureScreen({ a, m, count, cap=3, encLv=1, appeal=0, gold=0, onPick, onBack, name, onBuyMore=()=>{}, onUpgrade=()=>{}, lock=false, onRename=()=>{}, enrLv=0, onEnrich=()=>{} }) {
  const hab = HABITATS.find(h=>h.key===a.habitat) || {};
  const clampv = (n)=> Math.max(0, Math.min(100, Math.round(n)));
  const N = count || 3;
  // deterministic per-individual variance → different statuses; #1 = actual meters
  const OFFS = [
    { dh:0,   dt:0,   dc:0,   dp:0,   dr:0 },
    { dh:-30, dt:-6,  dc:+6,  dp:+8,  dr:+24 },
    { dh:+10, dt:-34, dc:-24, dp:-6,  dr:-6 },
    { dh:-14, dt:+12, dc:-30, dp:+4,  dr:+10 },
    { dh:+22, dt:-12, dc:+2,  dp:-22, dr:-16 },
  ];
  const variants = Array.from({length:N}, (_,i)=> ({ tag:'#'+(i+1), ...OFFS[i % OFFS.length] }));
  const statusOf = (e)=>{
    if (e.hunger<35) return ['Hungry','🍖','#EF4B5C'];
    if (e.thirst<35) return ['Thirsty','💧','#34B6F0'];
    if (e.clean<40)  return ['Needs cleaning','🫧','#1f9d68'];
    if (e.happy<50)  return ['Restless','😕','#F2960B'];
    if (e.trust>=68) return ['Thriving','🌟','#7C5CFF'];
    return ['Content','😊','#1f9d68'];
  };
  return (
    <div className="act-scroll">
      <div style={{ padding:'2px 14px 0' }}>
        <button className="gbtn ghost sm" onClick={()=>{ if(!lock) onBack(); }} style={{ width:'auto', padding:'6px 12px', fontSize:11, opacity:lock?0.4:1 }}>‹ Back</button>
      </div>
      <div className="gcard" style={{ textAlign:'center', marginTop:10, background:hab.tint||'#fff' }}>
        <div style={{ fontSize:10.5, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--act-ink-soft)' }}>{hab.icon} {hab.name} enclosure</div>
        <div style={{ fontSize:46, marginTop:4 }}>{a.emoji}</div>
        <div style={{ fontSize:16, fontWeight:800 }}>{a.species} <span onClick={onRename} style={{ cursor:'pointer', fontSize:13 }} title="Rename">✏️</span></div>
        <div style={{ fontSize:11, color:'var(--act-ink-soft)', fontWeight:600 }}>{variants.length} animals · ✨{(a.appeal*(ENC_COUNTS[a.key]||1)).toLocaleString()} appeal total</div>
      </div>
      <div className="gcard" style={{ margin:'0 14px 12px' }}>
        <div className="grow" style={{ marginBottom:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12.5, fontWeight:800 }}>🏗️ Enclosure · Lv {encLv||1}</div>
            <div style={{ fontSize:10.5, color:'var(--act-ink-soft)', fontWeight:600 }}>{count}/{cap} animals · ✨{(appeal||0).toLocaleString()} appeal</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <button className="gbtn grass sm" style={{ opacity: count<cap?1:.5 }} onClick={onBuyMore}>🐾 Buy {name||a.species}<br/><span style={{ fontSize:9, fontWeight:700 }}>{(Math.round((a.appeal||1)*22*count)+50).toLocaleString()} 🪙</span></button>
          <button className="gbtn grape sm" onClick={onUpgrade}>🏗️ Upgrade<br/><span style={{ fontSize:9, fontWeight:700 }}>{(Math.round((a.appeal||1)*160*(encLv||1))+300).toLocaleString()} 🪙</span></button>
        </div>
        {(function(){ const TOYS={rabbit:'Tunnel maze',chicken:'Peck garden',duck:'Splash pond',dog:'Agility hoops',cat:'Climbing tree',goat:'Balance bridge',horse:'Open paddock',lion:'Scent boxes',dolphin:'Floating toys',sealion:'Ball play',monkey:'Rope course'}; const toy=TOYS[a.key]||'Play set'; const ecost=Math.round((a.appeal||1)*40*(enrLv+1))+200; return (
          <button className="gbtn sm" style={{ width:'100%', marginTop:8, background:'#F5B73D', boxShadow:'0 4px 0 #d9982a', opacity: gold>=ecost?1:.6 }} onClick={onEnrich}>✨ Enrichment · {toy} {enrLv>0?`(Lv ${enrLv})`:''}<br/><span style={{ fontSize:9, fontWeight:700 }}>{ecost.toLocaleString()} 🪙 · +happiness & appeal</span></button>
        ); })()}
        {count>=cap && <div style={{ fontSize:9.5, color:'var(--act-gold-d)', fontWeight:700, textAlign:'center', marginTop:6 }}>Enclosure full — upgrade for +1 slot & more appeal</div>}
      </div>
      <div className="act-sech" style={{ marginTop:0 }}><div className="act-h" style={{ padding:0, fontSize:13 }}>Animals in this enclosure</div></div>
      <div style={{ padding:'0 14px 14px' }} className="stack-12">
        {variants.map((v,i)=>{
          const eff = { hunger:clampv(m.hunger+v.dh), thirst:clampv(m.thirst+v.dt), clean:clampv(m.clean+v.dc), happy:clampv(m.happy+v.dp), trust:clampv(m.trust+v.dr) };
          const [label,ic,col] = statusOf(eff);
          return (
            <div key={i} className="gcard" style={{ margin:0, cursor:'pointer' }} onClick={onPick}>
              <div className="grow">
                <div style={{ width:48, height:48, borderRadius:14, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flex:'0 0 auto' }}>{a.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:800 }}>{(i===0 && name) ? name : ['Sunny','Coco','Pip','Mochi','Luna','Ziggy','Pepper','Biscuit','Hazel','Olive'][(([...a.key].reduce((x,c)=>x+c.charCodeAt(0),0))+i)%10]} <span style={{ color:'var(--act-ink-soft)', fontWeight:600, fontSize:10 }}>· {a.species}</span></div>
                  <span className="chip-x" style={{ background:col+'22', border:'none', color:col, fontWeight:800, fontSize:10, display:'inline-block', marginTop:3 }}>{ic} {label}</span>
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <EncMini ic="🍖" v={eff.hunger} c="#EF4B5C" /><EncMini ic="💧" v={eff.thirst} c="#34B6F0" /><EncMini ic="🫧" v={eff.clean} c="#36C98A" />
                  </div>
                </div>
                <span style={{ color:'var(--act-ink-soft)', fontSize:18, alignSelf:'center' }}>›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { EnclosureScreen });
