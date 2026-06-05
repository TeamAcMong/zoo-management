// ============================================================
// EXTRA VIEWS — Endgame, Technical architecture, Data tables, MVP
// ============================================================

function Endgame() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Systems" title="Endgame progression" sub="What keeps a fully-built zoo compelling for months after the last tier unlocks." />
      <div className="grid-2">
        {ENDGAME.map(([h,d])=>(
          <div key={h} className="pillar"><h4 style={{ fontSize:14 }}>{h}</h4><p>{d}</p></div>
        ))}
      </div>
      <div className="note" style={{ marginTop:20 }}><div className="note-h">Endgame intent</div>The loop shifts from <strong>unlocking</strong> to <strong>perfecting & sharing</strong> — prestige multipliers, breeding for rare morphs, reputation rank, and co-op conservation give long-term players fresh goals without a hard content wall.</div>
    </div>
  );
}

function TechArch() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Engineering" title="Technical architecture" sub="A pragmatic mobile stack for a data-driven, LiveOps-heavy idle game." />
      <div className="stack-12" style={{ marginBottom:24 }}>
        {TECH.map(([h,d])=>(
          <div key={h} className="card" style={{ padding:'14px 16px' }}>
            <div className="row" style={{ alignItems:'flex-start', gap:14 }}>
              <div style={{ width:150, flexShrink:0, fontWeight:600, fontSize:13 }}>{h}</div>
              <div className="text-sm" style={{ color:'hsl(222 30% 30%)', lineHeight:1.55 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid-3">
        {[
          ['Offline accrual','Server timestamps the close; gold = rate × min(Δt, cap). Currency never trusted to the client.'],
          ['Remote config','Animals, habitats, attractions, events & balance all ship as hot-swappable JSON.'],
          ['Save & sync','Local protobuf blob + cloud save; conflict-resolve on the higher Zoo Level.'],
        ].map(([h,d])=>(<div key={h} className="pillar"><h4 style={{ fontSize:13 }}>{h}</h4><p>{d}</p></div>))}
      </div>
    </div>
  );
}

function DataTables() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Reference" title="Data tables" sub="Designer-facing tuning tables — the kind that ship as remote-config JSON." />

      <div className="section-label">Animals</div>
      <div className="tbl-wrap" style={{ marginBottom:24 }}>
        <table className="tbl">
          <thead><tr><th>Animal</th><th>Tier</th><th>Habitat</th><th>Taming</th><th style={{ textAlign:'right' }}>Appeal</th><th>Unlock</th><th style={{ textAlign:'center' }}>Perform</th></tr></thead>
          <tbody>
            {ANIMALS.map(a=>(
              <tr key={a.key}>
                <td><span className="row" style={{ gap:7 }}><span style={{ fontSize:15 }}>{a.emoji}</span><b style={{ fontSize:12 }}>{a.species}</b></span></td>
                <td className="mono num">{a.tier}</td>
                <td className="text-xs muted" style={{ textTransform:'capitalize' }}>{a.habitat}</td>
                <td className="text-xs" style={{ color:TAMING[a.taming].color, fontWeight:600 }}>{a.taming}</td>
                <td className="num mono" style={{ textAlign:'right' }}>{a.appeal}</td>
                <td className="text-xs mono muted">{a.unlock}</td>
                <td style={{ textAlign:'center' }}>{a.perform ? <Check size={14} /> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <Card title="Habitat upgrade table" desc="Per-habitat ladder">
          <div className="tbl-wrap" style={{ border:'none' }}>
            <table className="tbl">
              <thead><tr><th>Lv</th><th style={{ textAlign:'right' }}>Slots</th><th style={{ textAlign:'right' }}>Income</th><th style={{ textAlign:'right' }}>Cost</th></tr></thead>
              <tbody>{HAB_UPGRADE.map(u=>(
                <tr key={u.lv}><td className="mono num">{u.lv}</td><td className="num mono" style={{ textAlign:'right' }}>{u.slots}</td><td className="num mono" style={{ textAlign:'right' }}>{u.income}</td><td className="num mono" style={{ textAlign:'right' }}>{u.cost}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
        <Card title="Attraction table" desc="Unlock & effect">
          <div className="tbl-wrap" style={{ border:'none' }}>
            <table className="tbl">
              <thead><tr><th>Attraction</th><th>Unlock</th><th style={{ textAlign:'right' }}>Effect</th></tr></thead>
              <tbody>{ATTRACTIONS.map(at=>(
                <tr key={at.key}><td><span className="row" style={{ gap:6 }}><span>{at.icon}</span><span className="text-sm">{at.name}</span></span></td><td className="num mono text-sm">{at.unlock}</td><td className="num mono text-sm" style={{ textAlign:'right' }}>{at.effect}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MVPScope() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Launch" title="Recommended MVP scope" sub="The smallest build that proves the core loop and the idle hook." />
      <div className="grid-2" style={{ marginBottom:24 }}>
        <Card title="In scope" desc="Ship at launch" action={<Badge tone="success" dot>v1.0</Badge>}>
          <div className="stack-6">
            {MVP.in.map(x=>(
              <div key={x} className="row" style={{ gap:8, alignItems:'flex-start' }}><span style={{ color:'hsl(160 84% 39%)', marginTop:2 }}><Check size={14} /></span><span className="text-sm">{x}</span></div>
            ))}
          </div>
        </Card>
        <Card title="Out of scope" desc="Fast-follow / post-launch" action={<Badge tone="default" dot>Later</Badge>}>
          <div className="stack-6">
            {MVP.out.map(x=>(
              <div key={x} className="row" style={{ gap:8, alignItems:'flex-start' }}><span style={{ color:'hsl(var(--muted-foreground))', marginTop:2 }}><Clock size={14} /></span><span className="text-sm muted">{x}</span></div>
            ))}
          </div>
        </Card>
      </div>
      <div className="note"><div className="note-h">Why this cut</div>{MVP.why}</div>
    </div>
  );
}

Object.assign(window, { Endgame, TechArch, DataTables, MVPScope });
