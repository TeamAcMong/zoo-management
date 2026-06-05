// ============================================================
// LIVE ZOO — 2D illustrated park guide-map. Lake, river,
// winding paths, trees, ferris wheel, decorative entrance gate.
// Income is automatic & per-second = Σ(count × animal income).
// ============================================================

const A = Object.fromEntries(ANIMALS.map(a => [a.key, a]));

const POS = {
  dolphin:[24,13], sealion:[45,10], lion:[75,15],
  goat:[59,29], horse:[81,33],
  rabbit:[17,35], cat:[38,46], dog:[65,51], chicken:[21,60], duck:[46,65],
};
const FALLBACK = [[20,30],[40,30],[60,30],[80,30],[20,55],[40,55],[60,55],[80,55],[30,75],[60,75]];

const DECOS = [
  ['🎡',88,7,30], ['🌳',7,20,24], ['🌲',52,17,22], ['🌴',93,27,24],
  ['🌳',9,49,24], ['🌲',90,55,22], ['🌳',33,80,24], ['🌴',71,75,24],
  ['⛲',50,45,22], ['🌷',28,52,14], ['🌻',68,40,14],
];

function LiveZoo({ owned, meters, counts, rate, gold, setGold, xp, setXp, onOpen, rateFocus, speed=1, setSpeed=()=>{}, onVip=()=>{}, locked=false, appeal=0, visitors=0, capacity=0, capped=false, satis=1, onLocked=()=>{} }) {
  const [sess, setSess]   = useState(0);
  const [parts, setParts] = useState([]);
  const [vip, setVip]     = useState(null);
  const vipCdRef           = useRef(0);
  const [vipHint, setVipHint] = useState(false);
  useEffect(()=>{ if(vip){ setVipHint(true); const t=setTimeout(()=>setVipHint(false), 3000); return ()=>clearTimeout(t); } else { setVipHint(false); } }, [vip]);
  const [zoom, setZoom]   = useState(0.85);
  const mapRef = useRef(null);
  const drag = useRef(null);
  const onDown = (e)=>{ const el=mapRef.current; if(!el) return; drag.current={ y:e.clientY, x:e.clientX, top:el.scrollTop, left:el.scrollLeft }; el.classList.add('grabbing'); };
  const onMove = (e)=>{ if(!drag.current||!mapRef.current) return; const el=mapRef.current; el.scrollTop = drag.current.top - (e.clientY - drag.current.y); el.scrollLeft = drag.current.left - (e.clientX - drag.current.x); };
  const onUp = ()=>{ drag.current=null; if(mapRef.current) mapRef.current.classList.remove('grabbing'); };
  // center the wider map horizontally on first mount
  useEffect(()=>{ const el=mapRef.current; if(el) el.scrollLeft=(el.scrollWidth-el.clientWidth)/2; }, []);

  useEffect(() => { if (rateFocus && mapRef.current) mapRef.current.scrollTop = 0; }, [rateFocus]);

  const cnt = (k)=> (counts && counts[k]!=null) ? counts[k] : 1;
  const RATE = (rate!=null) ? rate : owned.reduce((s,k)=> s + cnt(k) * ((A[k]||{}).appeal||0), 0);
  const plots = owned.map((k,i)=>({ k, pos: POS[k] || FALLBACK[i % FALLBACK.length] }));

  const spawn = (x, y, val, big) => {
    const id = Math.random();
    setParts(p => [...p.slice(-5), { id, x, y, val: val||0, big: !!big }]);
    setTimeout(() => setParts(p => p.filter(z => z.id !== id)), 10000);
  };
  const collect = (p, e) => { if(e) e.stopPropagation(); if(window.zbeep) window.zbeep(p.big?990:760,0.06,'sine',0.12); setGold(g=>g+p.val); setParts(ps=>ps.filter(z=>z.id!==p.id)); };

  useEffect(() => {
    const iv = setInterval(() => {
      setSess(s => s + speed);
      const base = Math.max(8, Math.round(RATE*4));
      if (Math.random() < 0.16) spawn(16 + Math.random()*66, 26 + Math.random()*56, base*3, false);
      if (Math.random() < 0.035) spawn(26 + Math.random()*48, 24 + Math.random()*42, base*9, true);   // jackpot bag
      setVip(v => {
        if (v) { if (Math.random()<0.018) { vipCdRef.current = 15; return null; } return v; }   // present → may leave, then start cooldown
        if (vipCdRef.current > 0) { vipCdRef.current--; return null; }                              // cooling down
        return (Math.random()<0.09 ? { x:20+Math.random()*58, y:26+Math.random()*44 } : null);
      });
    }, 1100);
    return () => clearInterval(iv);
  }, [speed]);

  const mm = String(Math.floor(sess/60)).padStart(2,'0');
  const ss = String(sess%60).padStart(2,'0');

  return (
    <div className="live-root">
      <div className="live-hud">
        <span className={'live-rate'+(rateFocus?' tut-hi':'')}><span className="pulse"></span>+{RATE.toLocaleString()} 🪙/s</span>
        <span className="live-stat" title="Zoo appeal → draws visitors">✨ {appeal.toLocaleString()}</span>
        <span className={'live-stat'+(capped?' cap':'')} title={capped?'Visitors capped — add animals/attractions for more capacity':'Visitors / capacity'}>👥 {visitors.toLocaleString()}/{capacity.toLocaleString()}</span>
        <span className="live-clock">⏱ {mm}:{ss}</span>
        <span className="spd">{[1,2].map(s=><button key={s} className={speed===s?'on':''} onClick={()=>setSpeed(s)}>{s}×</button>)}</span>
        <span className="zm-zoomctl">
          <button onClick={()=>setZoom(z=>Math.max(0.7, +(z-0.15).toFixed(2)))} title="Zoom out">🔍−</button>
          <button onClick={()=>setZoom(z=>Math.min(1.3, +(z+0.15).toFixed(2)))} title="Zoom in">🔍+</button>
        </span>
      </div>
      <div className="zmap" ref={mapRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} style={{ pointerEvents: locked ? 'none' : undefined }}>
      <div className="zmap-canvas" style={{ transform:'scale('+zoom+')', transformOrigin:'top center', width:'132%' }}>
        <div className="zm-title">🗺️ Animal World Zoo · Park map</div>

        {/* water + paths */}
        <div className="zm-shape" style={{ left:'2%', top:'3%', width:'52%', height:'118px', background:'#8CCBEA', borderRadius:'48% 52% 56% 44% / 56% 50% 50% 44%', boxShadow:'inset 0 0 0 3px rgba(255,255,255,.4)' }}></div>
        <div className="zm-shape" style={{ left:'34%', top:'12%', width:'70%', height:'26px', background:'#8CCBEA', borderRadius:'20px', transform:'rotate(13deg)' }}></div>
        <div className="zm-shape" style={{ left:'43%', top:'18%', width:'15px', height:'66%', background:'#E8D2A6', borderRadius:'12px', transform:'rotate(4deg)' }}></div>
        <div className="zm-shape" style={{ left:'9%', top:'40%', width:'82%', height:'15px', background:'#E8D2A6', borderRadius:'12px', transform:'rotate(-6deg)' }}></div>
        <div className="zm-shape" style={{ left:'11%', top:'63%', width:'78%', height:'15px', background:'#E8D2A6', borderRadius:'12px', transform:'rotate(5deg)' }}></div>
        <div className="zm-shape" style={{ left:'46%', top:'78%', width:'15px', height:'16%', background:'#E8D2A6', borderRadius:'12px' }}></div>

        {DECOS.map((d,i)=>(
          <div key={i} className="zm-deco" style={{ left:d[1]+'%', top:d[2]+'%', fontSize:d[3] }}>{d[0]}</div>
        ))}

        {plots.map(({k,pos})=>{
          const a = A[k]; const m = meters && meters[k];
          const needs = m ? [m.hunger<35&&'🍖', m.thirst<35&&'💧', m.clean<40&&'🫧', m.happy<45&&'😕', (m.hunger<22&&m.thirst<22)&&'🤒'].filter(Boolean) : [];
          return (
            <div key={k} className={'zm-plot'+(needs.length?' need':'')} style={{ left:pos[0]+'%', top:pos[1]+'%' }} onClick={()=>onOpen(k)} title={a.species}>
              <div className="zm-pad" style={{ background:a.bg }}>
                {needs.length>0 && <span className="zm-need">{needs.map((n,idx)=><span key={idx}>{n}</span>)}</span>}
                <span className="bob" style={{ display:'inline-block' }}>{a.emoji}</span>
              </div>
              <div className="zm-sign">{a.species} ×{cnt(k)}</div>
            </div>
          );
        })}

        {Object.keys(POS).filter(k=>!owned.includes(k) && A[k]).map(k=>{
          const pos = POS[k];
          return (
            <div key={'lk-'+k} className="zm-plot zm-locked" style={{ left:pos[0]+'%', top:pos[1]+'%' }} onClick={(e)=>{ e.stopPropagation(); onLocked(); }} title="Locked — tap to view the collection">
              <div className="zm-pad" style={{ background:'#CFC4B2' }}><span style={{ fontSize:18, filter:'grayscale(1)', opacity:.5 }}>{A[k].emoji}</span><span className="zm-lock">🔒</span></div>
              <div className="zm-sign" style={{ opacity:.7 }}>Locked</div>
            </div>
          );
        })}

        <div className="zm-visitor2 zm-walk1">🧑</div>
        <div className="zm-visitor2 zm-walk2">👨‍👩‍👧</div>
        <div className="zm-visitor2 zm-walk3">🧒</div>
        <div className="zm-visitor2 zm-walk1" style={{ animationDelay:'-5s' }}>👫</div>
        <div className="zm-visitor2 zm-walk2" style={{ animationDelay:'-7s' }}>🧍</div>

        {/* decorative entrance gate (no button — income is automatic) */}
        <div className="zm-gate2" style={{ left:'50%', top:'90%', cursor:'default', animation:'none' }}>
          <div className="arch2"></div>
          <div className="sign2">🏛️ Welcome</div>
        </div>

        {vip && <button className={'zm-vip'+(vipHint?' focus':'')} style={{ left:vip.x+'%', top:vip.y+'%' }} onClick={(e)=>{ e.stopPropagation(); if(window.zbeep) window.zbeep(560,0.14,'triangle',0.16); onVip(); vipCdRef.current=15; setVipHint(false); setVip(null); }} onPointerDown={(e)=>e.stopPropagation()}>🤵<span className="zv-tag">VIP! tap to serve</span></button>}

        {parts.map(p=>(
          <button key={p.id} className={'ztap'+(p.big?' big':'')} style={{ left:p.x+'%', top:p.y+'%' }} onClick={(e)=>collect(p,e)} onPointerDown={(e)=>e.stopPropagation()}>{p.big?'💰':'🪙'}<span className="ztv">+{p.val.toLocaleString()}</span></button>
        ))}
      </div>
      </div>
      <div className="zm-hint">✋ Drag to pan · 🪙 tap coins for bonus gold</div>
      {vipHint && <div className="vip-firsthint">🤵 A VIP guest arrived! Tap them on the map to serve — big reward 🎁</div>}
    </div>
  );
}

Object.assign(window, { LiveZoo });
