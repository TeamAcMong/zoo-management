// ============================================================
// OPERATIONS VIEWS — LiveOps, 90-day journey, Content roadmap
// ============================================================

function LiveOps() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Operations" title="Live operations plan" sub="The cadence and seasonal events that keep a slow game feeling alive year-round." />

      <div className="section-label">Operating cadence</div>
      <div className="grid-4" style={{ marginBottom:24 }}>
        {CADENCE.map(c=>(
          <div key={c.cad} className="card" style={{ padding:16 }}>
            <div className="metric-label">{c.cad}</div>
            <div className="text-sm" style={{ marginTop:6, lineHeight:1.5 }}>{c.items}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Seasonal event calendar</div>
      <div className="tbl-wrap" style={{ marginBottom:24 }}>
        <table className="tbl">
          <thead><tr><th>Event</th><th>Window</th><th>Length</th><th>Headline reward</th><th>Mechanic</th></tr></thead>
          <tbody>
            {EVENTS.map(e=>(
              <tr key={e.name}>
                <td><span className="row" style={{ gap:8 }}><span style={{ fontSize:16 }}>{e.icon}</span><b style={{ fontSize:12.5 }}>{e.name}</b></span></td>
                <td className="text-sm">{e.when}</td>
                <td className="num mono text-sm">{e.len}</td>
                <td className="text-sm">{e.reward}</td>
                <td className="text-xs muted">{e.mechanic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <Card title="Event design principles" desc="Conservation-themed, never FOMO-toxic">
          <div className="stack-12">
            {[
              ['Always re-earnable','Event animals return in later seasons — no permanent FOMO.'],
              ['Conservation framing','Events tie to real-animal themes; wholesome, educational tone.'],
              ['Co-op donation drives','Community goals unlock shared endangered species.'],
              ['Cosmetic-led rewards','Decor, themes & skins headline; power stays in the core loop.'],
            ].map(([h,d])=>(
              <div key={h} className="row" style={{ alignItems:'flex-start', gap:10 }}><span style={{ color:'hsl(var(--primary))', marginTop:1 }}><Check size={15} /></span><div><div style={{ fontWeight:600, fontSize:13 }}>{h}</div><div className="muted text-xs">{d}</div></div></div>
            ))}
          </div>
        </Card>
        <Card title="Engagement anchors" desc="Habit hooks">
          <div className="stack-12">
            <div className="row" style={{ justifyContent:'space-between' }}><span className="text-sm">7-day login ramp</span><span className="mono text-sm muted">gold · gems · fragments</span></div>
            <div className="row" style={{ justifyContent:'space-between' }}><span className="text-sm">Rewarded-ad boost</span><span className="mono text-sm muted">opt-in · 3×/day cap</span></div>
            <div className="row" style={{ justifyContent:'space-between' }}><span className="text-sm">Weekend 2× idle</span><span className="mono text-sm muted">Fri–Sun</span></div>
            <div className="note" style={{ marginTop:4 }}><div className="note-h">No forced ads</div>Ads are always opt-in for a reward; the economy never depends on them.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProgressionPlan() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Operations" title="First 90-day journey" sub="The intended path for an engaged free player, day 1 to day 90." />
      <div className="tbl-wrap" style={{ marginBottom:20 }}>
        <table className="tbl">
          <thead><tr><th>Window</th><th>Zoo Level</th><th>Focus</th><th>Player goal</th></tr></thead>
          <tbody>
            {PLAN90.map(p=>(
              <tr key={p.day}><td><b className="mono" style={{ fontSize:12.5 }}>{p.day}</b></td><td className="text-sm">{p.lv}</td><td className="text-sm">{p.focus}</td><td className="text-xs muted">{p.goal}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid-3">
        {[
          ['Day 1–7 · Onboard','Form the daily care habit. FTUE → Petting Area → week-1 login. Success = D7 return.'],
          ['Day 8–30 · Invest','Deepen the loop: new biomes, attractions, first event. Success = first Tier 3 animal.'],
          ['Day 31–90 · Commit','Long-tail: savanna giants, Performance Arena, reputation. Success = first Tier 4 + arena.'],
        ].map(([h,d])=>(<div key={h} className="pillar"><h4 style={{ fontSize:13 }}>{h}</h4><p>{d}</p></div>))}
      </div>
    </div>
  );
}

function Roadmap() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Operations" title="12-month content roadmap" sub="Each quarter adds a biome, a tier of animals, a seasonal event, and a social or endgame layer." />
      <div className="stack-16">
        {ROADMAP.map((r,i)=>(
          <div key={r.q} className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="row" style={{ alignItems:'stretch', gap:0 }}>
              <div style={{ width:120, background: i===0?'hsl(239 84% 67% / .1)':'hsl(var(--muted) / .5)', padding:'16px', display:'flex', flexDirection:'column', justifyContent:'center', borderRight:'1px solid hsl(var(--border))', flexShrink:0 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', color: i===0?'hsl(239 60% 42%)':'hsl(var(--muted-foreground))' }}>{r.q}</div>
                <div style={{ fontWeight:600, fontSize:13.5, marginTop:3 }}>{r.title}</div>
              </div>
              <div style={{ flex:1, padding:'14px 16px' }}><div className="chips">{r.items.map(it=> <span key={it} className="chip-x">{it}</span>)}</div></div>
            </div>
          </div>
        ))}
      </div>
      <div className="note" style={{ marginTop:20 }}><div className="note-h">Cadence principle</div>Ship one new biome + animal tier per quarter and a seasonal event per month. The slow base economy means content can be metered out without starving engaged players.</div>
    </div>
  );
}

Object.assign(window, { LiveOps, ProgressionPlan, Roadmap });
