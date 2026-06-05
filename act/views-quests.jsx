// ============================================================
// DESIGN-DOC VIEW — New Player Quests (7 chapters) + early flow
// ============================================================
function Quests() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Onboarding" title="New player quests" sub="A 7-chapter guided ramp for the first ~7 days. A visible tracker sits on the home screen; rewards cover ~40–60% of early gold." />

      <div className="grid-4" style={{ marginBottom:24 }}>
        <Metric label="Chapters" value="7" delta="gated, sequential" />
        <Metric label="Active window" value="~7" unit="days" delta="first week" />
        <Metric label="Gold from quests" value="40–60%" delta="of early progression" />
        <Metric label="Skippable" value="Yes" delta="rewards still granted" />
      </div>

      <div className="section-label">Chapter breakdown</div>
      <div className="stack-12" style={{ marginBottom:24 }}>
        {QUESTS.map(q=>(
          <div key={q.ch} className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="row" style={{ alignItems:'stretch', gap:0 }}>
              <div style={{ width:64, background:'hsl(239 84% 67% / .1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderRight:'1px solid hsl(var(--border))' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'hsl(239 60% 42%)', textAlign:'center' }}>CH<br/>{q.ch}</div>
              </div>
              <div style={{ flex:1, padding:'12px 16px' }}>
                <div className="row" style={{ justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <b style={{ fontSize:13.5 }}>{q.title}</b>
                    <div className="muted text-xs" style={{ margintop:2 }}>{q.purpose}</div>
                  </div>
                  <Badge tone="success">+{q.rw.gold.toLocaleString()} 🪙 · +{q.rw.xp} XP</Badge>
                </div>
                <div className="chips" style={{ marginTop:8 }}>
                  {q.obj.map((o,i)=> <span key={i} className="chip-x">{o.label}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <Card title="Early economy philosophy" desc="Accelerate learning without removing progression">
          <p className="prose" style={{ marginTop:0 }}>Quest rewards provide roughly <strong>40–60% of the gold</strong> needed for early progression. Players still must collect visitor income, manage habitats and run activities — quests teach and cushion, they don't replace the loop. This prevents early-game resource shortages while keeping the core economy meaningful.</p>
        </Card>
        <Card title="Skip & return" desc="Respect experienced players">
          <div className="stack-12">
            {[
              ['Temporary skip','Players can hide quest guidance at any time.'],
              ['Rewards persist','Skipping never forfeits quest rewards.'],
              ['Help Center','Completed tutorials & quest explanations are reviewable later.'],
            ].map(([h,d])=>(
              <div key={h} className="row" style={{ alignItems:'flex-start', gap:10 }}><span style={{ color:'hsl(var(--primary))', marginTop:1 }}><Check size={15} /></span><div><div style={{ fontWeight:600, fontSize:13 }}>{h}</div><div className="muted text-xs">{d}</div></div></div>
            ))}
          </div>
        </Card>
      </div>

      <div className="section-label" style={{ marginTop:24 }}>Zoo Level XP curve</div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Level</th><th style={{ textAlign:'right' }}>Total XP</th><th style={{ textAlign:'right' }}>XP from prev</th><th>Unlocks (1 / level)</th></tr></thead>
          <tbody>
            {LEVEL_XP.map((xp,i)=>{
              const lv=i+1; const prev=i>0?LEVEL_XP[i-1]:0;
              const u=(typeof UNLOCKS!=='undefined'?UNLOCKS.find(x=>x.lv===lv):null);
              const sp=u?(ANIMALS.find(a=>a.key===u.key)||{}).species:null;
              return (
                <tr key={lv}>
                  <td className="mono num" style={{ fontWeight:600 }}>{lv}</td>
                  <td className="num mono" style={{ textAlign:'right' }}>{xp.toLocaleString()}</td>
                  <td className="num mono" style={{ textAlign:'right' }}>{(xp-prev).toLocaleString()}</td>
                  <td className="text-sm">{sp ? `${sp} · ${u.gold.toLocaleString()} 🪙` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="note" style={{ marginTop:14 }}>Zoo XP comes from <strong>quests & care</strong> — idle gold doesn't level you up. New species unlock as your <strong>Zoo Level</strong> rises (each gated by a level), then are bought with gold in the Animals tab.</div>

      <div className="section-label" style={{ marginTop:24 }}>Early progression flow (Lv 1 → Lv 11)</div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Stage</th><th>Player does</th><th>Unlocks</th><th style={{ textAlign:'right' }}>Gold/s (rough)</th></tr></thead>
          <tbody>
            <tr><td className="mono">Lv 1</td><td className="text-sm">Tutorial: feed, clean, collect; adopt Chicken &amp; Duck (~500🪙)</td><td className="text-sm">Photo activities</td><td className="num mono" style={{ textAlign:'right' }}>~4–10</td></tr>
            <tr><td className="mono">Lv 3–5</td><td className="text-sm">Adopt Dog (Lv3) &amp; Cat (Lv5); first enclosure upgrades</td><td className="text-sm">Dog performs · more activities</td><td className="num mono" style={{ textAlign:'right' }}>~10–25</td></tr>
            <tr><td className="mono">Lv 6–7</td><td className="text-sm">Pasture opens (Lv6); adopt Goat; build Petting Area (Lv7)</td><td className="text-sm">Pasture · Petting Area</td><td className="num mono" style={{ textAlign:'right' }}>~25–45</td></tr>
            <tr><td className="mono">Lv 8–10</td><td className="text-sm">Adopt Sheep (Lv8); enrich animals &amp; upgrade enclosures</td><td className="text-sm">More capacity &amp; appeal</td><td className="num mono" style={{ textAlign:'right' }}>~45–80</td></tr>
            <tr><td className="mono">Lv 11</td><td className="text-sm">Adopt Horse — Tier 2 begins; chase the next species</td><td className="text-sm">Pasture fills out · bigger appeal jump</td><td className="num mono" style={{ textAlign:'right' }}>~80–130</td></tr>
          </tbody>
        </table>
      </div>
      <div className="note" style={{ marginTop:14 }}>The live prototype starts exactly here — Level 1 with a single rabbit. Use the in-app <strong>🛠️ Admin tools</strong> to jump levels, top up gold/gems and unlock animals to preview any stage.</div>
    </div>
  );
}
Object.assign(window, { Quests });
