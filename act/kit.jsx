// ============================================================
// Workspace chrome + shared primitives (Katalyst vocabulary)
// ============================================================

function Button({ variant = 'primary', size = 'md', icon, children, ...rest }) {
  const cls = `btn btn-${variant}${size !== 'md' ? ' btn-' + size : ''}`;
  return <button className={cls} {...rest}>{icon}{children}</button>;
}

function Badge({ tone = 'default', dot, children }) {
  const dotColors = { default:'hsl(215 16% 47%)', primary:'hsl(239 84% 67%)', success:'hsl(160 84% 39%)', warn:'hsl(38 92% 50%)', error:'hsl(0 72% 51%)' };
  return <span className={`badge b-${tone}`}>{dot && <span className="dot" style={{ background: dotColors[tone] }}></span>}{children}</span>;
}

function Card({ title, desc, action, children, pad, style }) {
  return (
    <div className="card" style={style}>
      {(title || action) && (
        <div className="card-h">
          <div>
            {title && <div className="card-title">{title}</div>}
            {desc && <div className="card-desc">{desc}</div>}
          </div>
          {action}
        </div>
      )}
      <div className={'card-body' + (title ? '' : '')} style={{ paddingTop: title ? 0 : 18, ...(pad === false ? { padding: 0 } : {}) }}>{children}</div>
    </div>
  );
}

function Metric({ label, value, unit, delta, dir = 'up' }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="metric-label">{label}</div>
      <div className="metric-val" style={{ marginTop: 6, fontSize: 26 }}>
        {value}{unit && <span style={{ fontSize: 14, color:'hsl(var(--muted-foreground))', fontWeight:500, marginLeft:3 }}>{unit}</span>}
      </div>
      {delta && <div className={'metric-delta ' + (dir === 'up' ? 'delta-up' : 'delta-dn')} style={{ color:'hsl(var(--muted-foreground))' }}>{delta}</div>}
    </div>
  );
}

// ---- Sidebar ----------------------------------------------
const NAV = [
  { section:'Design doc', items:[
    { id:'overview', label:'Overview',   icon:Home },
    { id:'loop',     label:'Core loop',  icon:Repeat },
    { id:'animals',  label:'Animals',    icon:Paw },
    { id:'world',    label:'Habitats & attractions', icon:Layers },
    { id:'care',     label:'Care & performance', icon:Heart },
    { id:'activities', label:'Entertainment activities', icon:Ticket },
    { id:'quests',   label:'New player quests', icon:Flag },
  ]},
  { section:'Prototype', items:[
    { id:'proto',    label:'Live prototype', icon:Smartphone },
    { id:'ux',       label:'UX & wireframes', icon:Layout },
  ]},
  { section:'Systems', items:[
    { id:'economy',     label:'Economy',      icon:Coins },
    { id:'progression', label:'Zoo progression', icon:Trending },
    { id:'retention',   label:'Retention',    icon:Gauge },
    { id:'monetization',label:'Monetization', icon:Wallet },
    { id:'endgame',     label:'Endgame',      icon:Crown },
  ]},
  { section:'Operations', items:[
    { id:'liveops',  label:'LiveOps',         icon:Megaphone },
    { id:'plan',     label:'90-day journey',  icon:Flag },
    { id:'roadmap',  label:'Content roadmap', icon:MapIcon },
  ]},
  { section:'Build', items:[
    { id:'tech',     label:'Tech architecture', icon:Server },
    { id:'data',     label:'Data tables',       icon:Table },
    { id:'mvp',      label:'MVP scope',         icon:Rocket },
  ]},
];

function Sidebar({ active, onNavigate }) {
  return (
    <aside className="kat-side">
      <div className="kat-brand">
        <div style={{ width:28, height:28, borderRadius:9, background:'linear-gradient(150deg,#36C98A,#10B981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🦁</div>
        <div style={{ lineHeight:1.05 }}>
          <div className="kat-wm" style={{ fontSize:15 }}>Zoo Studio</div>
          <div style={{ fontSize:9.5, color:'hsl(var(--muted-foreground))', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase' }}>Build Spec v1.0</div>
        </div>
      </div>
      <nav className="kat-nav">
        {NAV.map(grp => (
          <React.Fragment key={grp.section}>
            <div className="kat-nav-section">{grp.section}</div>
            {grp.items.map(it => {
              const Ico = it.icon;
              return (
                <div key={it.id} className={'kat-nav-item' + (active === it.id ? ' active' : '')} onClick={() => onNavigate(it.id)}>
                  <Ico size={16} />{it.label}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </nav>
      <div style={{ padding:12, borderTop:'1px solid hsl(var(--border))', display:'flex', alignItems:'center', gap:10 }}>
        <div className="kat-avatar" style={{ background:'hsl(38 92% 50%)' }}>GD</div>
        <div style={{ fontSize:12, lineHeight:1.3 }}>
          <div style={{ fontWeight:500 }}>Game Design</div>
          <div className="muted">Animal World Zoo</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ crumbs, onExport }) {
  return (
    <header className="kat-top">
      <div className="kat-crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="kat-search">
        <Search size={14} />
        <input placeholder="Search systems, animals, currencies…" />
        <span className="kat-kbd">⌘K</span>
      </div>
      <button className="kat-icon-btn" aria-label="Notifications"><Bell size={18} /></button>
      <div className="kat-avatar" style={{ background:'hsl(38 92% 50%)' }}>GD</div>
    </header>
  );
}

function PageHead({ eyebrow, title, sub, action }) {
  return (
    <div className="kat-page-h">
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom:6 }}>{eyebrow}</div>}
        <h1 className="kat-h1">{title}</h1>
        {sub && <div className="kat-sub">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function AppShell({ active, onNavigate, crumbs, children }) {
  return (
    <div className="kat-app">
      <Sidebar active={active} onNavigate={onNavigate} />
      <Topbar crumbs={crumbs} />
      <main className="kat-main">{children}</main>
    </div>
  );
}

// small helper: render a horizontal stat bar inside tables
function Bar({ pct, color }) {
  return <div className="minibar"><i style={{ width: pct + '%', background: color }}></i></div>;
}

Object.assign(window, { Button, Badge, Card, Metric, Sidebar, Topbar, PageHead, AppShell, Bar });
