// ============================================================
// DESIGN-DOC VIEWS — Overview, Core loop, Animals
// ============================================================

function Overview({ onNavigate }) {
  const [cover, setCover] = useState('a');
  return (
    <div className="kat-page page-wide">
      <PageHead
        eyebrow="Mobile Game Design Document · v1.0"
        title="Animal World Zoo"
        sub="Idle zoo-builder & animal collection sim · iOS & Android · built for months of play. Internal build spec."
        action={<div className="row" style={{ gap:8 }}><Button variant="outline" icon={<Download size={16} />}>Export PDF</Button><Button variant="primary" icon={<Smartphone size={16} />} onClick={()=>onNavigate('proto')}>Open prototype</Button></div>}
      />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div className="section-label" style={{ margin:0 }}>Key art direction</div>
        <div className="seg">
          <button className={cover==='a'?'on':''} onClick={()=>setCover('a')}>A · Sunny Day Zoo</button>
          <button className={cover==='b'?'on':''} onClick={()=>setCover('b')}>B · Wild Safari</button>
        </div>
      </div>
      <div className={'cover '+(cover==='a'?'cover-a':'cover-b')} style={{ marginBottom:24 }}>
        <div className="cover-inner">
          <div className="cover-tent">{cover==='a'?'🦁':'🦒'}</div>
          <div className="pebble" style={{ alignSelf:'flex-start' }}>{cover==='a'?'🐰 🐐 🦊 🐘 🦁':'🦓 🦒 🦏 🐊 🐬'}</div>
          <div>
            <div className="tag" style={{ marginBottom:8 }}>{cover==='a'?'Cute stylized 3D · family-friendly · relaxing':'Wild · collection · world-class zoo'}</div>
            <h2>{cover==='a'?'Build the zoo the whole world wants to visit.':'From a local park to a world-class zoo.'}</h2>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {KPI.map(k=> <Metric key={k.label} label={k.label} value={k.value} unit={k.unit} delta={k.delta} />)}
      </div>

      <div className="section-label">The pitch</div>
      <p className="lede" style={{ marginBottom:20 }}>Players grow a small local animal park into a world-class zoo. They unlock animals from around the world <strong style={{ color:'hsl(var(--foreground))' }}>one at a time</strong>, care for them, upgrade habitats, build attractions, and keep visitors happy. The economy is deliberately <strong style={{ color:'hsl(var(--foreground))' }}>slow and sustainable</strong> — every unlock is earned and meaningful, and the zoo keeps earning while you're away. Designed to be played for months, even years.</p>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { ic:'🎫', c:'#FFE0CC', t:'Earn', d:'Visitors pay at the gate — passive gold that runs even offline.' },
          { ic:'❤️', c:'#FFD9E2', t:'Care', d:'Feed, water, clean & build trust across five animal needs.' },
          { ic:'🏗️', c:'#D7F0E2', t:'Upgrade', d:'Reinvest into habitats, facilities & attractions for more output.' },
          { ic:'🌍', c:'#FFE3B3', t:'Collect', d:`Unlock ${ANIMALS.length} species across 7 tiers — Rabbit to Dolphin.` },
        ].map(p=>(
          <div key={p.t} className="pillar"><div className="ic" style={{ background:p.c, fontSize:18 }}>{p.ic}</div><h4>{p.t}</h4><p>{p.d}</p></div>
        ))}
      </div>

      <div className="grid-2">
        <Card title="At a glance">
          <dl className="kv">
            <dt>Genre</dt><dd>Idle sim · zoo tycoon · collection</dd>
            <dt>Platform</dt><dd>iOS & Android · portrait · tablets</dd>
            <dt>Session</dt><dd>3–10 min · 2–3 sessions/day</dd>
            <dt>Audience</dt><dd>Ages 8–45 · animal lovers · idle & collection fans</dd>
            <dt>Pace</dt><dd>Slow & deliberate — months-to-years lifespan</dd>
            <dt>Content</dt><dd>30 animals · 7 habitats · 5 attractions</dd>
          </dl>
        </Card>
        <Card title="Design pillars" desc="Every feature must serve at least one">
          <div className="stack-12">
            {[
              ['Slow, meaningful progression','Every unlock is earned and matters. No content firehose.'],
              ['Emotional attachment','Trust & daily care make players bond with individual animals.'],
              ['Always earning','Idle gate income means every return is rewarded.'],
              ['Fair, cosmetic monetization','Sell convenience & decor — never animals or progression.'],
            ].map(([h,d])=>(
              <div key={h} className="row" style={{ alignItems:'flex-start', gap:10 }}>
                <span style={{ color:'hsl(var(--primary))', marginTop:1 }}><Check size={16} /></span>
                <div><div style={{ fontWeight:600, fontSize:13 }}>{h}</div><div className="muted text-sm" style={{ marginTop:1 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CoreLoop() {
  const steps = [
    ['Collect income','Tap the gate to bank visitor gold (and idle earnings).'],
    ['Upgrade habitats','Spend gold on slots, income & visitor appeal.'],
    ['Improve care','Feed, water, clean & build trust across five needs.'],
    ['Raise reputation','Happy animals + clean pens lift visitor satisfaction.'],
    ['Unlock species','Reach the Zoo Level gate for the next animal.'],
    ['Expand the zoo','Open new habitats & biomes as you grow.'],
    ['Unlock attractions','Petting, feeding, rides, shows — multiply revenue.'],
    ['Attract visitors','Higher reputation & attractions = more gold.'],
    ['Repeat','Each loop a little bigger, a little rarer.'],
  ];
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Core systems" title="Core gameplay loop" sub="A slow, satisfying cycle — the same nine beats at every scale of zoo." />
      <div className="loop" style={{ marginBottom:24 }}>
        {steps.map((s,i)=>(<div key={i} className="loop-step"><span className="n">{i+1}</span><h5>{s[0]}</h5><p>{s[1]}</p></div>))}
      </div>
      <div className="grid-2">
        <Card title="Two clocks" desc="What keeps the loop turning">
          <div className="stack-16">
            <div className="note"><div className="note-h">⚡ Active loop (foreground)</div>Care, cleaning, upgrades and shows. Spends gold, grants the most XP, and gives the satisfaction of direct progress.</div>
            <div className="note warn"><div className="note-h">🕓 Idle loop (background)</div>The visitor gate keeps earning while away — capped at 8h free / 24h VIP, at ~60% of active rate. Deliberately modest so idle supports, never replaces, active play.</div>
          </div>
        </Card>
        <Card title="Pacing philosophy" desc="Why progression is slow on purpose">
          <p className="prose" style={{ marginTop:0 }}>Players should constantly weigh <strong>upgrade a habitat</strong> vs <strong>unlock an animal</strong> vs <strong>build an attraction</strong>. Every major purchase is a real decision. Animals unlock one at a time so each arrival is an event — the opposite of a content firehose. This is what sustains a months-to-years lifespan.</p>
        </Card>
      </div>
    </div>
  );
}

function Animals() {
  const byTier = (t)=> ANIMALS.filter(a=>a.tier===t);
  return (
    <div className="kat-page page-wide">
      <PageHead eyebrow="Collection" title="Animal roster & collection" sub={`${ANIMALS.length} species across 7 tiers, each with a home habitat & taming difficulty. Unlocked as your Zoo Level rises.`} action={<span className="spec-tag"><Sparkles size={14} />Emoji = art stand-in</span>} />

      <div className="grid-4" style={{ marginBottom:24 }}>
        <Metric label="Species" value={String(ANIMALS.length)} delta="launch roster" />
        <Metric label="Tiers" value="7" delta="Rabbit → Dolphin" />
        <Metric label="Habitats" value="7" delta="Meadow → Marine" />
        <Metric label="Taming ranks" value="6" delta="Very Easy → Master" />
      </div>

      <div className="section-label">Collection by tier</div>
      <div className="stack-16" style={{ marginBottom:24 }}>
        {TIERS.map(tier=>(
          <div key={tier.t} className="card" style={{ padding:16 }}>
            <div className="row" style={{ justifyContent:'space-between', marginBottom:10 }}>
              <div><b style={{ fontSize:13.5 }}>{tier.name} · {tier.theme}</b><span className="muted text-xs" style={{ marginLeft:8 }}>{tier.span}</span></div>
            </div>
            <div className="row" style={{ gap:10, flexWrap:'wrap' }}>
              {byTier(tier.t).map(a=>{
                const tam = TAMING[a.taming];
                return (
                  <div key={a.key} style={{ width:104, border:'1px solid hsl(var(--border))', borderRadius:10, padding:'10px 8px', textAlign:'center', background:'hsl(var(--card))' }}>
                    <div style={{ fontSize:26 }}>{a.emoji}</div>
                    <div style={{ fontSize:11.5, fontWeight:600, marginTop:2 }}>{a.species}</div>
                    <div className="mono" style={{ fontSize:10, color:'hsl(var(--muted-foreground))' }}>✨{a.appeal}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:tam.color, marginTop:3 }}>{a.taming}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <Card title="Care needs" desc="Five meters drive satisfaction & income">
          <div className="stack-12">
            {STATS.map(s=>(
              <div key={s.key} className="row" style={{ alignItems:'flex-start', gap:10 }}>
                <span style={{ width:26, height:26, borderRadius:8, background:'hsl(var(--muted))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</span>
                <div><div style={{ fontWeight:600, fontSize:13 }}>{s.name}</div><div className="muted text-xs" style={{ marginTop:1 }}>{s.desc}</div></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Trust & taming" desc="The emotional-attachment system">
          <div className="tbl-wrap" style={{ border:'none', marginBottom:12 }}>
            <table className="tbl">
              <thead><tr><th>Taming</th><th>Tame time</th><th>Requirement</th></tr></thead>
              <tbody>
                {Object.entries(TAMING).map(([k,v])=>(
                  <tr key={k}><td><span style={{ fontWeight:600, color:v.color }}>{k}</span></td><td className="num mono text-sm">{v.time}</td><td className="text-xs muted">{v.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="note">Trust builds slowly through daily care. High trust unlocks special animations, attraction participation and performance training — the hook that makes players bond with individual animals.</div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { Overview, CoreLoop, Animals });
