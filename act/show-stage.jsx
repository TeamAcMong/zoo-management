// ============================================================
// PERFORMANCE STAGE — a watchable educational show. Each
// performer takes the ring and demonstrates a routine; the
// crowd's applause builds, then a finale + revenue payout.
// ============================================================

const PERF_TRICKS = [
  { name:'Ball balancing', icon:'🔵', cls:'t-wobble', prop:'🔵' },
  { name:'Dancing',        icon:'💃', cls:'t-spin',   prop:null },
  { name:'Jumping',        icon:'⬆️', cls:'t-jump',   prop:null },
  { name:'Fetching',       icon:'🥏', cls:'t-flip',   prop:'🥏' },
  { name:'Team routine',   icon:'🤝', cls:'t-jump',   prop:null },
];

function ShowStage({ lineup, meters, onDone }) {
  const N = lineup.length;
  const [step, setStep]   = useState(0);
  const [phase, setPhase] = useState('perform');
  const [applause, setApplause] = useState(28);
  const [combo, setCombo] = useState(1);
  const [kick, setKick]   = useState(0);
  const [sparks, setSparks] = useState([]);

  const result = useMemo(() => {
    const base = lineup.reduce((s,a)=>s + a.appeal*6, 0);
    const avg  = lineup.reduce((s,a)=>s + (meters[a.key]?.trust||50), 0)/N;
    const mult = avg>70 ? 1.5 : avg>50 ? 1.2 : 1.0;
    const stars = avg>78 ? 3 : avg>55 ? 2 : 1;
    return { reward: Math.round(base*mult), rep: stars*3, xp: stars*40, stars, combo: mult, avg: Math.round(avg) };
  }, []);

  const spark = (e) => {
    const id = Math.random();
    setSparks(s => [...s.slice(-6), { id, e, left: 26 + Math.random()*48 }]);
    setTimeout(() => setSparks(s => s.filter(x => x.id !== id)), 1300);
  };

  useEffect(() => {
    let t;
    if (phase === 'perform') {
      const a = lineup[step];
      setApplause(p => Math.min(100, p + 14 + Math.round((meters[a.key]?.trust||50)/12)));
      if (step > 0) { setCombo(c => c + 1); setKick(k => k + 1); }
      for (let i=0;i<3;i++) setTimeout(()=>spark(['✨','⭐','🎉','💫'][Math.floor(Math.random()*4)]), i*220);
      t = setTimeout(() => { step+1 < N ? setStep(step+1) : setPhase('finale'); }, 1950);
    } else {
      for (let i=0;i<9;i++) setTimeout(()=>spark(['🎉','✨','⭐','🎊','💫'][Math.floor(Math.random()*5)]), i*110);
      t = setTimeout(() => onDone(result), 1900);
    }
    return () => clearTimeout(t);
  }, [step, phase]);

  const cur = lineup[step];
  const trick = PERF_TRICKS[step % PERF_TRICKS.length];

  return (
    <div className="show-stage">
      <div className="ss-canopy"></div>
      <div className="ss-top">
        <span className="ss-title">🎤 Showtime</span>
        <span className="ss-dots">{lineup.map((_,i)=><i key={i} className={i<=step?'on':''}></i>)}</span>
        <button className="ss-skip" onClick={()=>onDone(result)}>Skip ▶</button>
      </div>

      <div className="ss-arena">
        <div className="ss-spot"></div>
        <div className="ss-ring"></div>
        <div className={'ss-combo'+(kick?' kick':'')} key={kick}>COMBO ×{combo}</div>

        <div className="ss-bench left">{lineup.map((a,i)=> i>step ? <span key={a.key} className="w dim">{a.emoji}</span> : null)}</div>
        <div className="ss-bench right">{lineup.map((a,i)=> i<step ? <span key={a.key} className="w done">{a.emoji}</span> : null)}</div>

        {phase==='perform' && (
          <div className="ss-callout" key={'c'+step}>
            <div className="nm">{cur.name}</div>
            <div className="tk">{trick.icon} {trick.name}!</div>
          </div>
        )}

        {phase==='perform' && (
          <>
            {trick.prop && <div className="ss-prop">{trick.prop}{trick.prop}{trick.prop}</div>}
            <div className="ss-actor" key={'a'+step}><span className={trick.cls}>{cur.emoji}</span></div>
          </>
        )}

        {sparks.map(s => <span key={s.id} className="ss-spark" style={{ left:s.left+'%', bottom:160 }}>{s.e}</span>)}

        <div className="ss-hud">
          <div className="ss-applause"><span className="lbl">👏 Crowd</span><div className="track"><i style={{ width:applause+'%' }}></i></div></div>
        </div>

        <div className="ss-aud">
          {['👏','🧑‍🤝‍🧑','👏','👨‍👩‍👧','👏','🧒','👏','👫','👏'].map((e,i)=><span key={i} style={{ animationDelay:(i*0.12)+'s' }}>{e}</span>)}
        </div>

        {phase==='finale' && (
          <div className="ss-finale">
            <div className="ss-title">Grand finale!</div>
            <div className="fstars">{'⭐'.repeat(result.stars)}{'☆'.repeat(3-result.stars)}</div>
            <div style={{ display:'flex', gap:6 }}>{lineup.map(a=><span key={a.key} style={{ fontSize:36 }} className="perform">{a.emoji}</span>)}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.85)', marginTop:4 }}>Avg trust {result.avg}% · combo ×{result.combo.toFixed(1)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ShowStage });
