// ============================================================
// SYSTEMS VIEWS — Economy, Progression, Retention, Monetization
// ============================================================

function Economy() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Systems" title="Economy design & balancing" sub="Currencies, sources & sinks, and the deliberately slow balance that powers a months-long game." />

      <div className="section-label">Currencies</div>
      <div className="grid-auto" style={{ marginBottom:24 }}>
        {CURRENCIES.map(c=>(
          <div key={c.key} className="pillar" style={{ padding:14 }}>
            <div className="row" style={{ gap:9, marginBottom:6 }}>
              <span style={{ width:32, height:32, borderRadius:9, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{c.icon}</span>
              <div><div style={{ fontWeight:600, fontSize:13 }}>{c.name}</div><Badge tone={c.type==='Hard'?'warn':c.type==='Soft'?'success':'default'}>{c.type}</Badge></div>
            </div>
            <div className="muted text-xs">{c.use}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Revenue model — the four binding pillars</div>
      <div className="grid-2" style={{ marginBottom:24 }}>
        <Card title="How revenue is generated" desc="Animals → Appeal → Visitors → Gold (one causal chain)">
          <p className="prose" style={{ marginTop:0 }}>Gold per second is <strong>not</strong> a flat sum of animal income. Animals make the zoo <strong>appealing</strong>; appeal draws <strong>visitors</strong> (capped by how many the zoo can hold); visitors <strong>spend gold</strong> at the gate. Each link feeds the next, so the player must grow animals, happiness and capacity together.</p>
          <div className="tbl-wrap" style={{ border:'none', marginTop:8 }}>
            <table className="tbl">
              <thead><tr><th>Term</th><th>Formula</th><th>Driven by</th></tr></thead>
              <tbody>
                <tr><td className="text-sm" style={{ fontWeight:700 }}>① Appeal</td><td className="mono text-xs">Σ animal appeal × happiness</td><td className="text-sm">Animals owned · happiness · habitat Lv · enrichment</td></tr>
                <tr><td className="text-sm">Capacity</td><td className="mono text-xs">(5 + Σ animal seats) × (1 + .15·attractions)</td><td className="text-sm">Guests the zoo can show — seats ∝ appeal, +enclosure Lv</td></tr>
                <tr><td className="text-sm">Demand</td><td className="mono text-xs">Appeal · 1</td><td className="text-sm">Guests the appeal would draw</td></tr>
                <tr><td className="text-sm" style={{ fontWeight:700 }}>② Visitors</td><td className="mono text-xs">min(Demand, Capacity)</td><td className="text-sm">Appeal pulls them in; capacity caps them</td></tr>
                <tr><td className="text-sm">Spend / head</td><td className="mono text-xs">0.05 × (1 + .12·attractions)</td><td className="text-sm">Gate spend per visitor; attractions raise it</td></tr>
                <tr><td className="text-sm" style={{ fontWeight:700 }}>③ Gold/s</td><td className="mono text-xs">Visitors × Spend/head</td><td className="text-sm">The headline gold rate</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
        <div className="stack-16">
          <Card title="Mutual constraints" desc="Why no single stat can be over-invested">
            <div className="stack-12">
              {[
                ['Appeal ≫ Capacity','Visitors cap out — appeal is wasted. The HUD turns the visitor pill amber. Player must add attractions / upgrade enclosures for capacity.'],
                ['Capacity ≫ Appeal','Room for more guests than the animals attract — empty paths. Player must adopt more / rarer animals and raise happiness to lift appeal.'],
                ['Low happiness','The happiness multiplier drops toward 0.5× — appeal and visitors fall even in a full zoo. Player must feed, clean & enrich.'],
                ['Balanced growth','Visitors ≈ Capacity with high happiness — appeal, visitors and gold compound together.'],
              ].map(([h,d])=>(
                <div key={h} className="row" style={{ alignItems:'flex-start', gap:10 }}>
                  <span style={{ width:7, height:7, borderRadius:9, background:'hsl(var(--primary))', marginTop:6, flex:'0 0 auto' }}></span>
                  <div><div style={{ fontWeight:600, fontSize:13 }}>{h}</div><div className="muted text-xs">{d}</div></div>
                </div>
              ))}
            </div>
          </Card>
          <div className="note warn"><div className="note-h">⚖️ Designer intent</div>Revenue is gated by the player's <strong>weakest</strong> pillar, not the strongest. This forces continuous, varied decisions (adopt vs upgrade vs build vs serve vs care) — the core of session length & retention.</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <Card title="Sources" desc="Where currency enters" action={<Badge tone="success" dot>Faucets</Badge>}>
          <div className="tbl-wrap" style={{ border:'none' }}>
            <table className="tbl">
              <thead><tr><th>Source</th><th>Currency</th><th style={{ textAlign:'right' }}>Rate</th></tr></thead>
              <tbody>{SOURCES.map(s=>(
                <tr key={s.src}><td><div style={{ fontWeight:600, fontSize:12.5 }}>{s.src}</div><div className="muted text-xs">{s.note}</div></td><td className="text-sm">{s.cur}</td><td className="num mono" style={{ textAlign:'right', whiteSpace:'nowrap' }}>{s.rate}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
        <Card title="Sinks" desc="Where currency leaves" action={<Badge tone="error" dot>Drains</Badge>}>
          <div className="tbl-wrap" style={{ border:'none' }}>
            <table className="tbl">
              <thead><tr><th>Sink</th><th>Currency</th><th style={{ textAlign:'right' }}>Cost</th></tr></thead>
              <tbody>{SINKS.map(s=>(
                <tr key={s.sink}><td><div style={{ fontWeight:600, fontSize:12.5 }}>{s.sink}</div><div className="muted text-xs">{s.note}</div></td><td className="text-sm">{s.cur}</td><td className="num mono" style={{ textAlign:'right', whiteSpace:'nowrap' }}>{s.cost}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Balancing philosophy" desc="Slow & sustainable by design">
        <div className="grid-4">
          {[
            ['Habitat upgrade','primary sink','Steep cost curve absorbs the bulk of gold income.'],
            ['Income growth','sub-linear','Each tier earns more, but costs climb faster — no runaway.'],
            ['Time-to-unlock','days, not minutes','Animals gated by Zoo Level pace the whole game.'],
            ['Gem role','convenience','Compress timers; never gate content the free player can reach.'],
          ].map(([l,v,d])=>(
            <div key={l}><div className="metric-label">{l}</div><div className="metric-val" style={{ fontSize:18, marginTop:4 }}>{v}</div><div className="muted text-xs" style={{ marginTop:2 }}>{d}</div></div>
          ))}
        </div>
        <div className="note warn" style={{ marginTop:16 }}><div className="note-h">Balancing intent</div>Players should always have to <strong>choose</strong> between upgrading a habitat, unlocking an animal, or building an attraction. The surplus is intentionally thin so every major purchase feels important — the core of the slow-economy philosophy.</div>
      </Card>
    </div>
  );
}

function Progression() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Systems" title="Zoo level & progression" sub="A single global Zoo Level paces every unlock — habitats, animals, attractions & systems." />

      <div className="grid-4" style={{ marginBottom:24 }}>
        <Metric label="Launch level cap" value="92" delta="to Dolphin" />
        <Metric label="Biomes" value="7" delta="habitats" />
        <Metric label="XP sources" value="4" delta="care · upgrades · satisfaction · objectives" />
        <Metric label="Endgame" value="Prestige" delta="Zoo Tour soft-reset" />
      </div>

      <div className="grid-2" style={{ alignItems:'start' }}>
        <Card title="Zoo Level milestones" desc="XP gates the entire content drip">
          <div className="tbl-wrap" style={{ border:'none' }}>
            <table className="tbl">
              <thead><tr><th>Lv</th><th style={{ textAlign:'right' }}>Total XP</th><th>Unlocks</th></tr></thead>
              <tbody>{LEVELS.map(l=>(
                <tr key={l.lv}><td className="mono num" style={{ fontWeight:600 }}>{l.lv}</td><td className="num mono" style={{ textAlign:'right' }}>{l.xp.toLocaleString()}</td><td className="text-sm">{l.unlock}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
        <div className="stack-16">
          <Card title="Idle progression" desc="What banks while you're away">
            <div className="tbl-wrap" style={{ border:'none' }}>
              <table className="tbl">
                <tbody>{IDLE.map(i=>(
                  <tr key={i.k}><td style={{ fontWeight:600 }}>{i.k}</td><td className="num mono text-sm" style={{ textAlign:'right' }}>{i.v}</td><td className="text-xs muted">{i.note}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
          <div className="note"><div className="note-h">XP curve</div><code className="mono" style={{ color:'hsl(var(--foreground))' }}>XP(n) ≈ round(180 · n^2.05)</code> — gentle early, then stretching hard past Lv30 so late tiers take weeks. This is what gives the game its months-to-years lifespan.</div>
        </div>
      </div>
    </div>
  );
}

function Retention() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Systems" title="Retention systems" sub="The hooks that bring players back to a slow, cozy game — anchored on care & idle." />

      <div className="grid-2" style={{ marginBottom:24, alignItems:'start' }}>
        <Card title="Target retention" desc="Launch cohort goals (long-tail genre)">
          <div className="stack-12" style={{ marginTop:4 }}>
            {FUNNEL.map(f=>(
              <div key={f.d} className="funnel-row"><span className="lab">{f.d}</span><div className="funnel-bar"><i style={{ width:(f.pct*2)+'%' }}>{f.pct}%</i></div></div>
            ))}
          </div>
          <div className="muted text-xs" style={{ marginTop:12 }}>Idle + collection games skew lower on D1 but hold a strong long tail — D90 retention is the headline metric here.</div>
        </Card>
        <Card title="Why players return" desc="Each maps to a retention window">
          <div className="stack-12">
            {[
              ['D1','Offline gold waiting','The gate banks income while away — the first re-open always pays.'],
              ['D1–D7','Daily care + missions','Animals need feeding; 5 daily missions form the habit.'],
              ['D7','Next animal in sight','A visible Zoo-Level gate to the next species pulls check-ins.'],
              ['D7–D30','Trust grind & attractions','Bonding animals to max trust; building the next attraction.'],
              ['D30+','Collection & events','Completing tiers, seasonal conservation animals, prestige.'],
            ].map(([d,h,x])=>(
              <div key={h} className="row" style={{ alignItems:'flex-start', gap:10 }}>
                <Badge tone="primary">{d}</Badge>
                <div><div style={{ fontWeight:600, fontSize:13 }}>{h}</div><div className="muted text-xs">{x}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="section-label">Daily · weekly · monthly activities</div>
      <div className="grid-3">
        {[['Daily', ACTIVITIES.daily, 'primary'],['Weekly', ACTIVITIES.weekly, 'default'],['Monthly', ACTIVITIES.monthly, 'success']].map(([h,list,tone])=>(
          <Card key={h} title={h}>
            <div className="stack-6">
              {list.map(x=>(
                <div key={x} className="row" style={{ gap:8, alignItems:'flex-start' }}><span style={{ color:'hsl(var(--primary))', marginTop:2 }}><Check size={14} /></span><span className="text-sm">{x}</span></div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Monetization() {
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Systems" title="Monetization strategy" sub="Convenience & cosmetics only. Never sell progression. Never sell animals." />

      <div className="grid-4" style={{ marginBottom:24 }}>
        {KPI.map(k=> <Metric key={k.label} label={k.label} value={k.value} unit={k.unit} delta={k.delta} />)}
      </div>

      <div className="grid-2" style={{ marginBottom:24, alignItems:'start' }}>
        <Card title="Gem packs" desc="Hard-currency IAP · $9.99 anchored as best value">
          <div className="tbl-wrap" style={{ border:'none' }}>
            <table className="tbl">
              <thead><tr><th>Pack</th><th style={{ textAlign:'right' }}>Gems</th><th style={{ textAlign:'right' }}>Price</th><th style={{ textAlign:'right' }}>Per $</th></tr></thead>
              <tbody>{IAP.map(p=>{
                const n = parseFloat(p.price.replace('$',''));
                return <tr key={p.name}><td><b style={{ fontSize:12.5 }}>{p.name}</b> {p.best && <Badge tone="warn">Best value</Badge>}</td><td className="num mono" style={{ textAlign:'right' }}>{p.gems.toLocaleString()}</td><td className="num mono" style={{ textAlign:'right' }}>{p.price}</td><td className="num mono muted" style={{ textAlign:'right' }}>{Math.round(p.gems/n)}</td></tr>;
              })}</tbody>
            </table>
          </div>
        </Card>
        <Card title="Offers & recurring" desc="Cosmetic bundles, pass & subscription">
          <div className="stack-12">
            {OFFERS.map(o=>(
              <div key={o.name} className="row" style={{ alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid hsl(var(--border))' }}>
                <div style={{ flex:1 }}><div className="row" style={{ gap:8 }}><b style={{ fontSize:13 }}>{o.name}</b><Badge tone="primary">{o.tag}</Badge></div><div className="muted text-xs" style={{ marginTop:2 }}>{o.contents}</div></div>
                <div className="mono num" style={{ fontWeight:700, whiteSpace:'nowrap' }}>{o.price}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card title="What we sell" desc="Monetization-friendly surfaces">
          <div className="chips">
            {['Premium decorations','Habitat themes','VIP membership','Event pass','Cosmetic animal skins','Gem packs','Speed-ups','Rewarded-ad boosts'].map(c=> <span key={c} className="chip-x">{c}</span>)}
          </div>
          <div className="gdivide" style={{ background:'hsl(var(--border))' }}></div>
          <div className="note warn"><div className="note-h">Hard rules</div>Do not sell progression directly. Do not sell animals — they are always earned through play. Ads are opt-in (rewarded) only; never forced. The economy must be fully completable free.</div>
        </Card>
        <Card title="VIP Membership" desc="The recurring backbone">
          <div className="stack-12">
            <div className="row" style={{ justifyContent:'space-between' }}><span className="text-sm">Idle cap</span><span className="mono text-sm">8h → 24h</span></div>
            <div className="row" style={{ justifyContent:'space-between' }}><span className="text-sm">Daily gems</span><span className="mono text-sm">2× + bonus</span></div>
            <div className="row" style={{ justifyContent:'space-between' }}><span className="text-sm">Ads</span><span className="mono text-sm">removed</span></div>
            <div className="row" style={{ justifyContent:'space-between' }}><span className="text-sm">Cosmetic</span><span className="mono text-sm">VIP decor set</span></div>
            <div className="muted text-xs">All convenience & cosmetic — no power over the core loop.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { Economy, Progression, Retention, Monetization });
