// ============================================================
// DESIGN-DOC VIEW — Habitats & Attractions
// ============================================================
function World() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Core systems" title="Habitats & attractions" sub="Habitats house animals and are the main long-term sink; attractions multiply visitors and revenue." />

      <div className="grid-4" style={{ marginBottom:24 }}>
        <Metric label="Habitats" value="7" delta="Meadow → Marine" />
        <Metric label="Upgrade tiers" value="5" delta="per habitat" />
        <Metric label="Attractions" value="5" delta="petting → performance" />
        <Metric label="Start" value="1·1·1" delta="habitat · training · stage" />
      </div>

      <div className="section-label">Habitats</div>
      <div className="stack-12" style={{ marginBottom:20 }}>
        {HABITATS.map((h,i)=>(
          <div key={h.key} className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="row" style={{ gap:0, alignItems:'stretch' }}>
              <div style={{ width:84, background:h.tint, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, flexShrink:0 }}>{h.icon}</div>
              <div style={{ flex:1, padding:'12px 16px' }}>
                <div className="row" style={{ justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div className="row" style={{ gap:8 }}><b style={{ fontSize:13.5 }}>{h.name}</b><Badge tone={i===0?'success':'default'} dot>{h.unlock}</Badge></div>
                    <div className="muted text-xs" style={{ marginTop:3 }}>Holds: {h.holds}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <Card title="Habitat upgrade ladder" desc="Per habitat · slots + income multiplier">
          <div className="tbl-wrap" style={{ border:'none' }}>
            <table className="tbl">
              <thead><tr><th>Lv</th><th style={{ textAlign:'right' }}>Slots</th><th style={{ textAlign:'right' }}>Income</th><th style={{ textAlign:'right' }}>Cost</th></tr></thead>
              <tbody>
                {HAB_UPGRADE.map(u=>(
                  <tr key={u.lv}><td className="mono num">{u.lv}</td><td className="num mono" style={{ textAlign:'right' }}>{u.slots}</td><td className="num mono" style={{ textAlign:'right' }}>{u.income}</td><td className="num mono" style={{ textAlign:'right' }}>{u.cost}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="note" style={{ marginTop:12 }}>Habitat upgrades are the <strong>primary long-term gold sink</strong> — costs scale steeply so each upgrade is a deliberate, satisfying milestone.</div>
        </Card>
        <Card title="Facilities" desc="Support buildings, upgraded with gold">
          <div className="stack-12">
            {[
              ['🎓 Training Center','Speeds taming & enables performance training.'],
              ['🍱 Food Factory','Auto-stocks food; slows hunger decay.'],
              ['🚿 Bath Station','Faster cleaning; raises cleanliness cap.'],
              ['🎫 Ticket Office','More daily visitors → higher passive gold.'],
            ].map(([h,d])=>(
              <div key={h} className="row" style={{ alignItems:'flex-start', gap:10 }}>
                <div><div style={{ fontWeight:600, fontSize:13 }}>{h}</div><div className="muted text-xs">{d}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="section-label">Attractions</div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Attraction</th><th>Unlock</th><th>Effect</th><th>How it works</th></tr></thead>
          <tbody>
            {ATTRACTIONS.map(at=>(
              <tr key={at.key}>
                <td><span className="row" style={{ gap:8 }}><span style={{ fontSize:16 }}>{at.icon}</span><b style={{ fontSize:12.5 }}>{at.name}</b></span></td>
                <td className="num mono text-sm">{at.unlock}</td>
                <td><Badge tone="primary">{at.effect}</Badge></td>
                <td className="text-xs muted">{at.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
Object.assign(window, { World });
