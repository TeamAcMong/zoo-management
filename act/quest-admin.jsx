// ============================================================
// QUEST TRACKER (New Player Quests) + ADMIN TOOL
// ============================================================

// progress value for an objective type
function questProgress(t, { counts, owned, level, animals }) {
  if (t === 'owned') return (animals!=null ? animals : owned.length);
  if (t === 'level') return level;
  return counts[t] || 0;
}

function QuestTracker({ chapterIdx, counts, owned, level, animals, onClaim, onGo = ()=>{} }) {
  const TAB_FOR = { feed:'animals', clean:'animals', owned:'animals', photo:'show', feeding:'show', ride:'show', activity:'show', level:'animals' };
  const [open, setOpen] = useState(false);
  const q = QUESTS[chapterIdx];
  const status = q ? q.obj.map(o => ({ ...o, cur: Math.min(questProgress(o.t, { counts, owned, level, animals }), o.n) })) : [];
  const done = q ? status.every(s => s.cur >= s.n) : false;
  return (
    <>
      <button className="quest-fab" onClick={()=>setOpen(o=>!o)} title="Quests">📋{done && <span className="quest-dot"></span>}</button>
      {open && (
        <div className={'quest-pop'+(done?' ready':'')}>
          <button className="qb-x" onClick={()=>setOpen(false)} title="Close">✕</button>
          {!q ? (
            <div className="qb-head"><span className="qb-title">🏅 All quests complete!</span></div>
          ) : (
            <>
              <div className="qb-head" style={{ padding:0, marginBottom:6 }}>
                <span className="qb-chip">CH {q.ch}</span>
                <span className="qb-title">{q.title}</span>
              </div>
              {status.map((s,i)=>(
                <div key={i} className="qb-obj">
                  <span className={'qb-tick'+(s.cur>=s.n?' on':'')}>{s.cur>=s.n?'✓':''}</span>
                  <span className="qb-lbl">{s.label}</span>
                  <span className="qb-num">{s.cur}/{s.n}</span>
                  {s.cur<s.n && <button className="qb-go" onClick={()=>onGo(TAB_FOR[s.t]||'animals')} title="Go">›</button>}
                </div>
              ))}
              <div className="qb-foot">
                <span className="qb-rw">🎁 +{q.rw.gold.toLocaleString()} 🪙</span>
                <button className={'gbtn grass sm'+(done?' rdy':'')} disabled={!done} style={{ opacity:done?1:.5 }} onClick={()=>{ if(done){ onClaim(q); } }}>Claim</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function AdminPanel({ open, onOpen, onClose, level, gold, onGold, onGems, onLevel, onUnlockNext, onUnlockAll, onReset }) {
  if (!open) return <button className="admin-fab" onClick={onOpen} title="Admin tools">🛠️</button>;
  return (
    <div className="admin-scrim" onClick={onClose}>
      <div className="admin-panel" onClick={e=>e.stopPropagation()}>
        <div className="admin-h"><span>🛠️ Admin tools</span><button className="admin-x" onClick={onClose}>✕</button></div>
        <div className="admin-row"><span>Zoo Level</span><b>Lv {level}</b></div>
        <div className="admin-grid">
          <button className="gbtn gold sm" onClick={()=>onGold(1000)}>+1,000 🪙</button>
          <button className="gbtn gold sm" onClick={()=>onGold(10000)}>+10,000 🪙</button>
          <button className="gbtn gold sm" onClick={()=>onGold(100000)}>+100k 🪙</button>
          <button className="gbtn sm" style={{ background:'#34B6F0', boxShadow:'0 4px 0 #1f93cc' }} onClick={()=>onGems(100)}>+100 💎</button>
          <button className="gbtn grape sm" onClick={()=>onLevel(1)}>Level +1</button>
          <button className="gbtn grape sm" onClick={()=>onLevel(5)}>Level +5</button>
          <button className="gbtn grass sm" onClick={onUnlockNext}>Unlock next 🐾</button>
          <button className="gbtn grass sm" onClick={onUnlockAll}>Unlock all 🐾</button>
        </div>
        <button className="gbtn ghost sm" style={{ width:'100%', marginTop:10 }} onClick={onReset}>↺ Reset game</button>
        <div style={{ fontSize:10, color:'var(--act-ink-soft)', textAlign:'center', marginTop:8, fontWeight:600 }}>For testing — jump levels & top up to pass any stage.</div>
      </div>
    </div>
  );
}

Object.assign(window, { QuestTracker, AdminPanel, questProgress, ServiceQuests });

function ServiceQuests({ idx, counts, owned, level, onClaim }) {
  const [open, setOpen] = useState(false);
  const list = (typeof VIP_SERVICES!=='undefined') ? VIP_SERVICES : [];
  const q = list[idx] || (function(){ const n = 10 + (idx-3)*10; return { id:idx+1, title:'VIP Concierge', obj:[{ t:'vip', n, label:`Serve ${n} VIP guests` }], rw:{ gold: 3000 + (idx-3)*1500 } }; })();
  const status = q ? q.obj.map(o => ({ ...o, cur: Math.min(questProgress(o.t, { counts, owned, level }), o.n) })) : [];
  const done = q ? status.every(s => s.cur >= s.n) : false;
  return (
    <>
      <button className="quest-fab svc-fab" onClick={()=>setOpen(o=>!o)} title="VIP services">🛎️{done && <span className="quest-dot"></span>}</button>
      {open && q && (
        <div className={'quest-pop svc-pop'+(done?' ready':'')}>
          <button className="qb-x" onClick={()=>setOpen(false)} title="Close">✕</button>
          <div className="qb-head" style={{ marginBottom:6 }}><span className="qb-chip" style={{ background:'#EF7B4B' }}>VIP</span><span className="qb-title">{q.title}</span></div>
          {status.map((s,i)=>(
            <div key={i} className="qb-obj">
              <span className={'qb-tick'+(s.cur>=s.n?' on':'')}>{s.cur>=s.n?'✓':''}</span>
              <span className="qb-lbl">{s.label}</span>
              <span className="qb-num">{s.cur}/{s.n}</span>
            </div>
          ))}
          <div className="qb-foot">
            <span className="qb-rw">🎁 +{q.rw.gold.toLocaleString()} 🪙</span>
            <button className={'gbtn grass sm'+(done?' rdy':'')} disabled={!done} style={{ opacity:done?1:.5 }} onClick={()=>{ if(done) onClaim(q); }}>Claim</button>
          </div>
        </div>
      )}
    </>
  );
}
