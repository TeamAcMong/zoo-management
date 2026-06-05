// ============================================================
// DESIGN-DOC VIEW — Care & Performance systems
// ============================================================
function CarePerformance() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Core systems" title="Care & performance" sub="The daily care loop that builds trust, and the late-game performance attraction it unlocks." />

      <div className="section-label">Care actions</div>
      <div className="grid-3" style={{ marginBottom:24 }}>
        {ACTIONS.map(a=>(
          <div key={a.key} className="pillar" style={{ padding:14 }}>
            <div className="row" style={{ gap:10 }}>
              <span style={{ width:36, height:36, borderRadius:10, background:'hsl(var(--muted))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{a.icon}</span>
              <div style={{ flex:1 }}>
                <div className="row" style={{ justifyContent:'space-between' }}><b style={{ fontSize:13 }}>{a.name}</b><span className="mono text-xs muted">{a.cost? a.cost+' 🪙' : 'free'}</span></div>
                <div className="muted text-xs">{a.note}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <Card title="Care → income chain" desc="Why care matters mechanically">
          <div className="note" style={{ marginBottom:12 }}>
            <code className="mono" style={{ fontSize:12.5, display:'block', lineHeight:1.7, color:'hsl(var(--foreground))' }}>
              needs met → happiness ↑<br/>happiness × cleanliness → visitor satisfaction<br/>satisfaction × reputation × attractions → gold/hr
            </code>
          </div>
          <p className="prose" style={{ marginTop:0 }}>Neglect is never punishing — needs simply <strong>throttle income & XP</strong> until topped up. There is no death, no debt; the wholesome, relaxing pillar forbids a stress state.</p>
        </Card>
        <Card title="Trust system" desc="The slow bond that gates content">
          <div className="stack-12">
            {[
              ['Builds via','Play (+5), brush (+2), daily streaks. Slow by design.'],
              ['Unlocks','Special animations, unique interactions, attraction & performance eligibility.'],
              ['Pacing','Max trust takes days of care per animal — encourages attachment, not rushing.'],
            ].map(([h,d])=>(
              <div key={h} className="row" style={{ alignItems:'flex-start', gap:10 }}>
                <span style={{ color:'hsl(var(--primary))', marginTop:1 }}><Heart size={15} /></span>
                <div><div style={{ fontWeight:600, fontSize:13 }}>{h}</div><div className="muted text-xs">{d}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="section-label">Performance system (late-game)</div>
      <Card title="Animal performance" desc="Unlocks Lv45 · only certain high-trust animals qualify">
        <div className="grid-2" style={{ gap:24 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>Eligible performers</div>
            <div className="chips" style={{ marginBottom:16 }}>{PERFORMERS.map(p=> <span key={p} className="chip-x">{p}</span>)}</div>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>Performance skills</div>
            <div className="chips">{PERF_SKILLS.map(p=> <span key={p} className="chip-x">{p}</span>)}</div>
          </div>
          <div>
            <dl className="kv">
              <dt>Requires</dt><dd>High trust + Training Center + time</dd>
              <dt>Crowd bonus</dt><dd>1.0× → 1.5× by average performer trust</dd>
              <dt>Star rating</dt><dd>1–3★ scales revenue, reputation & XP</dd>
              <dt>Cadence</dt><dd>Auto-runs on a schedule; watchable live</dd>
            </dl>
            <div className="note" style={{ marginTop:14 }}>The Performance Arena is the marquee mid-to-late attraction — see it play out live on the prototype's Show tab.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
Object.assign(window, { CarePerformance });

// ============================================================
// DESIGN-DOC VIEW — Entertainment activities
// ============================================================
function ActivitiesDoc() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Core systems" title="Entertainment activities" sub="Cooldown-based visitor experiences. Each requires specific animals — so unlocking species opens new activities & revenue." />

      <div className="grid-4" style={{ marginBottom:24 }}>
        <Metric label="Categories" value="5" delta="photo → premium" />
        <Metric label="Activities" value={String(ENTERTAINMENT.length)} delta="launch set" />
        <Metric label="Cooldowns" value="15m–4h" delta="by category" />
        <Metric label="Rewards" value="4" delta="gold · rep · XP · satisfaction" />
      </div>

      <div className="section-label">Categories & cooldowns</div>
      <div className="grid-auto" style={{ marginBottom:24 }}>
        {ENT_CATS.map(c=>(
          <div key={c.key} className="pillar" style={{ padding:14 }}>
            <div className="row" style={{ gap:9, marginBottom:6 }}>
              <span style={{ width:32, height:32, borderRadius:9, background:'hsl(var(--muted))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{c.icon}</span>
              <div><div style={{ fontWeight:600, fontSize:13 }}>{c.name}</div><Badge tone="default">CD {c.cd}</Badge></div>
            </div>
            <div className="muted text-xs">{c.blurb}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Activity table</div>
      <div className="tbl-wrap" style={{ marginBottom:24 }}>
        <table className="tbl">
          <thead><tr><th>Activity</th><th>Category</th><th>Requires</th><th>Rewards</th><th style={{ textAlign:'right' }}>Cooldown</th></tr></thead>
          <tbody>
            {ENTERTAINMENT.map(a=>{
              const cat = ENT_CATS.find(c=>c.key===a.cat);
              const r = [a.gold&&`${a.gold} gold`, a.rep&&`${a.rep} rep`, a.xp&&`${a.xp} XP`, a.happy&&`+${a.happy} happy`].filter(Boolean).join(' · ');
              return (
                <tr key={a.key}>
                  <td><b style={{ fontSize:12.5 }}>{a.name}</b>{a.watch && <Badge tone="primary">live</Badge>}</td>
                  <td className="text-sm">{cat.icon} {cat.name}</td>
                  <td className="text-sm">{a.req}</td>
                  <td className="text-xs muted">{r}</td>
                  <td className="num mono text-sm" style={{ textAlign:'right' }}>{a.cd}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <Card title="Progression philosophy" desc="Animals as gameplay, not just collection">
          <p className="prose" style={{ marginTop:0 }}>Every newly unlocked animal should introduce <strong>at least one unique activity</strong> wherever possible — a rabbit brings photo sessions, a horse brings rides, a monkey an intelligence demo, a dolphin a premium encounter. Players unlock species not just to complete the collection, but to open <strong>entirely new attractions and revenue sources</strong>.</p>
        </Card>
        <Card title="Cooldown loop" desc="Why timers drive retention">
          <div className="stack-12">
            {[
              ['Short (15–30m)','Photo & feeding — run every session.'],
              ['Medium (1–2h)','Rides & educational — a midday return.'],
              ['Long (4h)','Premium encounters — the daily anchor.'],
              ['Upgrades','Reduce cooldowns & boost rewards over time.'],
            ].map(([h,d])=>(
              <div key={h} className="row" style={{ alignItems:'flex-start', gap:10 }}><span style={{ color:'hsl(var(--primary))', marginTop:1 }}><Clock size={15} /></span><div><div style={{ fontWeight:600, fontSize:13 }}>{h}</div><div className="muted text-xs">{d}</div></div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
Object.assign(window, { ActivitiesDoc });
