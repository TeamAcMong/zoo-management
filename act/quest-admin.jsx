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
      <button className="quest-fab" onClick={()=>setOpen(o=>!o)} title={t('quest.fab_title')}>📋{done && <span className="quest-dot"></span>}</button>
      {open && (
        <div className={'quest-pop'+(done?' ready':'')}>
          <button className="qb-x" onClick={()=>setOpen(false)} title={t('quest.close')}>✕</button>
          {!q ? (
            <div className="qb-head"><span className="qb-title">🏅 {t('quest.all_done')}</span></div>
          ) : (
            <>
              <div className="qb-head" style={{ padding:0, marginBottom:6 }}>
                <span className="qb-chip">{t('quest.ch_chip', {ch:q.ch})}</span>
                <span className="qb-title">{t('quest.ch.'+q.ch+'.title')}</span>
              </div>
              {status.map((s,i)=>(
                <div key={i} className="qb-obj">
                  <span className={'qb-tick'+(s.cur>=s.n?' on':'')}>{s.cur>=s.n?'✓':''}</span>
                  <span className="qb-lbl">{t('quest.obj.'+s.t, {n:s.n})}</span>
                  <span className="qb-num">{s.cur}/{s.n}</span>
                  {s.cur<s.n && <button className="qb-go" onClick={()=>onGo(TAB_FOR[s.t]||'animals')} title={t('quest.go')}>›</button>}
                </div>
              ))}
              <div className="qb-foot">
                <span className="qb-rw">🎁 +{q.rw.gold.toLocaleString()} 🪙</span>
                <button className={'gbtn grass sm'+(done?' rdy':'')} disabled={!done} style={{ opacity:done?1:.5 }} onClick={()=>{ if(done){ onClaim(q); } }}>{t('quest.claim')}</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function AdminPanel({ open, onOpen, onClose, level, gold, onGold, onGems, onLevel, onUnlockNext, onUnlockAll, onReset }) {
  if (!open) return <button className="admin-fab" onClick={onOpen} title={t('admin.title')}>🛠️</button>;
  return (
    <div className="admin-scrim" onClick={onClose}>
      <div className="admin-panel" onClick={e=>e.stopPropagation()}>
        <div className="admin-h"><span>🛠️ {t('admin.title')}</span><button className="admin-x" onClick={onClose}>✕</button></div>
        <div className="admin-row"><span>{t('admin.zoo_level')}</span><b>{t('admin.lv', {lv:level})}</b></div>
        <div className="admin-grid">
          <button className="gbtn gold sm" onClick={()=>onGold(1000)}>{t('admin.gold_add', {n:'1,000'})} 🪙</button>
          <button className="gbtn gold sm" onClick={()=>onGold(10000)}>{t('admin.gold_add', {n:'10,000'})} 🪙</button>
          <button className="gbtn gold sm" onClick={()=>onGold(100000)}>{t('admin.gold_add', {n:'100k'})} 🪙</button>
          <button className="gbtn sm" style={{ background:'#34B6F0', boxShadow:'0 4px 0 #1f93cc' }} onClick={()=>onGems(100)}>{t('admin.gems_add', {n:'100'})} 💎</button>
          <button className="gbtn grape sm" onClick={()=>onLevel(1)}>{t('admin.level_add', {n:1})}</button>
          <button className="gbtn grape sm" onClick={()=>onLevel(5)}>{t('admin.level_add', {n:5})}</button>
          <button className="gbtn grass sm" onClick={onUnlockNext}>{t('admin.unlock_next')} 🐾</button>
          <button className="gbtn grass sm" onClick={onUnlockAll}>{t('admin.unlock_all')} 🐾</button>
        </div>
        <button className="gbtn ghost sm" style={{ width:'100%', marginTop:10 }} onClick={onReset}>{t('admin.reset')}</button>
        <div style={{ fontSize:10, color:'var(--act-ink-soft)', textAlign:'center', marginTop:8, fontWeight:600 }}>{t('admin.dev_note')}</div>
      </div>
    </div>
  );
}

Object.assign(window, { QuestTracker, AdminPanel, questProgress, ServiceQuests });

function ServiceQuests({ idx, counts, owned, level, onClaim }) {
  const [open, setOpen] = useState(false);
  const list = (typeof VIP_SERVICES!=='undefined') ? VIP_SERVICES : [];
  const q = list[idx] || (function(){ const n = 10 + (idx-3)*10; return { id:idx+1, title:t('svc.title.concierge'), obj:[{ t:'vip', n, label:t('quest.obj.vip', {n}) }], rw:{ gold: 3000 + (idx-3)*1500 } }; })();
  const status = q ? q.obj.map(o => ({ ...o, cur: Math.min(questProgress(o.t, { counts, owned, level }), o.n) })) : [];
  const done = q ? status.every(s => s.cur >= s.n) : false;
  return (
    <>
      <button className="quest-fab svc-fab" onClick={()=>setOpen(o=>!o)} title={t('svc.fab_title')}>🛎️{done && <span className="quest-dot"></span>}</button>
      {open && q && (
        <div className={'quest-pop svc-pop'+(done?' ready':'')}>
          <button className="qb-x" onClick={()=>setOpen(false)} title={t('quest.close')}>✕</button>
          <div className="qb-head" style={{ marginBottom:6 }}><span className="qb-chip" style={{ background:'#EF7B4B' }}>VIP</span><span className="qb-title">{t('svc.title.'+q.id)}</span></div>
          {status.map((s,i)=>(
            <div key={i} className="qb-obj">
              <span className={'qb-tick'+(s.cur>=s.n?' on':'')}>{s.cur>=s.n?'✓':''}</span>
              <span className="qb-lbl">{t('quest.obj.'+s.t, {n:s.n})}</span>
              <span className="qb-num">{s.cur}/{s.n}</span>
            </div>
          ))}
          <div className="qb-foot">
            <span className="qb-rw">🎁 +{q.rw.gold.toLocaleString()} 🪙</span>
            <button className={'gbtn grass sm'+(done?' rdy':'')} disabled={!done} style={{ opacity:done?1:.5 }} onClick={()=>{ if(done) onClaim(q); }}>{t('quest.claim')}</button>
          </div>
        </div>
      )}
    </>
  );
}
