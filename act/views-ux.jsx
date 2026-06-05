// ============================================================
// PROTOTYPE VIEW — UX flow / sitemap, wireframes, tutorial (FTUE)
// ============================================================
function Wf({ children, h, label }) {
  return (
    <div style={{ border:'1.5px solid hsl(var(--border))', borderRadius:8, background:'hsl(210 40% 98%)', padding:10, height:h, display:'flex', flexDirection:'column', gap:6 }}>
      {label && <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'hsl(var(--muted-foreground))' }}>{label}</div>}
      {children}
    </div>
  );
}
const wfB = (h, c='hsl(214 32% 88%)') => <div style={{ height:h, borderRadius:5, background:c }}></div>;

function UXFlow() {
  const NODES = [
    { t:'Animals', d:'Collection / habitats' },
    { t:'Care', d:'Feed · water · clean · trust' },
    { t:'Attractions', d:'Petting → performance' },
    { t:'Show', d:'Performance arena' },
    { t:'Shop', d:'Gems · cosmetics · VIP' },
  ];
  const OVERLAYS = ['Offline rewards','Daily login','Missions','Events hub','Animal unlock','Habitat upgrade','Settings / Help'];
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Prototype" title="UX flow & wireframes" sub="Navigation model, low-fi screen wireframes, and the first-time user experience." />

      <div className="section-label">Navigation model</div>
      <p className="prose" style={{ marginTop:0, marginBottom:16 }}>Flat, tab-first. The <strong>live Zoo</strong> is home; a 5-item bottom bar routes the core surfaces. Care is a push-screen reached by tapping any animal. Time-based moments (offline, login, unlocks) surface as <strong>overlays</strong> over the home, never buried in menus.</p>

      <div className="card" style={{ padding:20, marginBottom:24 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div style={{ padding:'10px 18px', borderRadius:10, background:'hsl(239 84% 67% / .1)', border:'1px solid hsl(239 84% 67% / .3)', fontWeight:600, fontSize:13, color:'hsl(239 60% 42%)' }}>🏞️ Zoo · live idle home</div>
          <div style={{ width:1, height:16, background:'hsl(var(--border))' }}></div>
          <div className="row" style={{ gap:10, flexWrap:'wrap', justifyContent:'center' }}>
            {NODES.map(n=>(
              <div key={n.t} style={{ width:150, padding:12, borderRadius:8, border:'1px solid hsl(var(--border))', background:'hsl(var(--card))' }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{n.t}</div>
                <div className="muted text-xs">{n.d}</div>
              </div>
            ))}
          </div>
          <div style={{ width:1, height:16, background:'hsl(var(--border))' }}></div>
          <div className="row" style={{ gap:6, flexWrap:'wrap', justifyContent:'center' }}>
            <span className="muted text-xs" style={{ width:'100%', textAlign:'center', marginBottom:2 }}>Surfaced as overlays</span>
            {OVERLAYS.map(o=> <span key={o} className="chip-x">{o}</span>)}
          </div>
        </div>
      </div>

      <div className="section-label">Key screen wireframes</div>
      <div className="grid-3" style={{ marginBottom:24 }}>
        <Wf h={230} label="Home · Zoo">
          {wfB(18,'hsl(239 84% 67% / .25)')}
          <div style={{ flex:1, borderRadius:5, background:'linear-gradient(hsl(199 89% 82%), hsl(120 40% 80%))', position:'relative' }}>
            <div style={{ position:'absolute', top:6, left:6, fontSize:9, fontWeight:700, color:'hsl(222 30% 30%)' }}>gate · habitats · visitors</div>
          </div>
          {wfB(22,'hsl(214 32% 80%)')}
        </Wf>
        <Wf h={230} label="Care">
          <div style={{ height:56, borderRadius:5, background:'hsl(354 78% 85%)' }}></div>
          {wfB(9)}{wfB(9)}{wfB(9)}{wfB(9)}{wfB(9)}
          <div className="row" style={{ gap:6 }}>{wfB(18)}{wfB(18)}{wfB(18)}</div>
        </Wf>
        <Wf h={230} label="Attractions">
          {wfB(14)}
          <div style={{ height:40, borderRadius:5, background:'hsl(160 50% 82%)' }}></div>
          <div style={{ height:40, borderRadius:5, background:'hsl(160 50% 82%)' }}></div>
          <div style={{ height:40, borderRadius:5, background:'hsl(160 50% 82%)' }}></div>
        </Wf>
      </div>

      <div className="section-label">First-time user experience (FTUE)</div>
      <Card title="Tutorial flow" desc="Short, interactive, always skippable · 7 guided steps">
        <div className="tbl-wrap" style={{ border:'none' }}>
          <table className="tbl">
            <thead><tr><th>Step</th><th>What the player does</th><th>Reward</th></tr></thead>
            <tbody>
              {TUTORIAL.map((s,i)=>(
                <tr key={i}>
                  <td><span className="row" style={{ gap:8 }}><span style={{ width:22, height:22, borderRadius:999, background: i===TUTORIAL.length-1?'hsl(160 84% 39%)':'hsl(var(--primary))', color:'#fff', fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>{i+1}</span><b style={{ fontSize:12.5 }}>{s.t}</b></span></td>
                  <td className="text-sm">{s.d}</td>
                  <td><Badge tone="success">{s.reward}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop:16 }}><div className="note-h">Design rules</div>A visible <strong>Skip Tutorial</strong> button is always available. Each step teaches one verb and gates the next action. Tutorials are revisitable later via the Help menu.</div>
      </Card>
    </div>
  );
}
Object.assign(window, { UXFlow });
