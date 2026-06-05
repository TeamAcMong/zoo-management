// ============================================================
// ACTIVITY STAGE — plays out an entertainment activity so the
// player can watch it (themed per category), then shows the
// reward. Used for every activity run.
// ============================================================

const ACTV_THEME = {
  photo:   { cat:'Photo session',  crowd:['📸','🧑','📷','👨‍👩‍👧','📸'], cap:s=>`Say cheese! 📸` },
  feeding: { cat:'Feeding time',   crowd:['🥕','🧒','🍎','👫','🥬'],     cap:s=>`Yum! 😋` },
  riding:  { cat:'Animal ride',    crowd:['🎟️','🧑','👏','🧒','🎟️'],     cap:s=>`Giddy up! 🐎` },
  edu:     { cat:'Educational show',crowd:['👏','🧑‍🤝‍🧑','👏','🧒','👏'], cap:s=>`Amazing! ✨` },
  premium: { cat:'Premium encounter',crowd:['🤩','👏','🤩','👏','🤩'],   cap:s=>`Unforgettable! ⭐` },
};

function ActivityStage({ act, animal, onDone }) {
  const theme = ACTV_THEME[act.cat] || ACTV_THEME.photo;
  const [phase, setPhase] = useState('run');   // 'run' → 'done'
  const [prog, setProg]   = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setCanSkip(true), 3000); return ()=>clearTimeout(t); }, []);
  useEffect(()=>{ if(phase==='done'){ const t=setTimeout(onDone, 1500); return ()=>clearTimeout(t); } }, [phase]);
  const [sparks, setSparks] = useState([]);
  const moves = act.cat === 'riding';

  const spark = (e) => {
    const id = Math.random();
    setSparks(s => [...s.slice(-6), { id, e, left: 26 + Math.random()*48 }]);
    setTimeout(() => setSparks(s => s.filter(x => x.id !== id)), 1350);
  };

  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += 1.2; setProg(Math.min(100, p));
      if (Math.random() < 0.45) spark(['✨','⭐','🎉','💛','📸','💫'][Math.floor(Math.random()*6)]);
      if (p >= 100) { clearInterval(iv); setPhase('done'); }
    }, 180);
    return () => clearInterval(iv);
  }, []);

  const rewardLines = [
    act.gold && ['🪙 Gold', '+' + act.gold.toLocaleString()],
    act.rep  && ['🏅 Reputation', '+' + act.rep],
    act.xp   && ['⭐ Zoo XP', '+' + act.xp],
    act.happy&& ['😊 Satisfaction', '+' + act.happy],
  ].filter(Boolean);

  return (
    <div className={'actv-stage cat-' + act.cat}>
      <div className="actv-top">
        <span className="actv-cat">{theme.cat}</span>
        {phase!=='done' && canSkip && <button className="actv-skip" onClick={onDone}>Skip ▶</button>}
      </div>

      <div className="actv-arena">
        <div className="actv-spot"></div>
        <div className="actv-ground"></div>

        {phase==='run' && <div className="actv-cap">{theme.cap(act)}</div>}

        {/* themed props */}
        {act.cat==='photo'   && <div className="actv-prop cam">📷</div>}
        {act.cat==='feeding' && <div className="actv-prop food">🥕</div>}

        <div className={'actv-hero' + (moves ? ' move' : ' ')}>
          {moves && <span style={{ fontSize:30, verticalAlign:'top', marginRight:-8 }}>🧑</span>}
          {animal ? animal.emoji : '🦁'}
        </div>

        {act.cat==='photo' && <div className={'actv-flash go'}></div>}

        {sparks.map(s => <span key={s.id} className="actv-spark" style={{ left:s.left+'%', bottom:120 }}>{s.e}</span>)}

        <div className="actv-crowd">{theme.crowd.map((e,i)=><span key={i} style={{ animationDelay:(i*0.12)+'s' }}>{e}</span>)}</div>
        <div className="actv-bar"><i style={{ width:prog+'%' }}></i></div>

        {phase==='done' && (
          <div className="actv-done">
            <div style={{ fontSize:38 }}>{animal ? animal.emoji : '🎉'}</div>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:'.04em', textTransform:'uppercase' }}>{act.name} complete!</div>
            <div className="ad-card">
              {rewardLines.map(([l,v])=>(
                <div key={l} className="reward-row"><span style={{ fontWeight:700, fontSize:13 }}>{l}</span><b>{v}</b></div>
              ))}
              <button className="gbtn grass" style={{ marginTop:12 }} onClick={onDone}>Collect</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ActivityStage });
