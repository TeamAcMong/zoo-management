// ============================================================
// INTERACTIVE TUTORIAL (FTUE) — action-gated guided flow.
// Starts on the Zoo home; only switches tab when a step needs it.
// Skipping warns about losing rewards (Yes/No).
// ============================================================

// need: real action that advances (feed/clean). cta: Continue label for info steps.
// hi:  what to spotlight ('income' rate · 'buy' animal). rw: reward granted on advance.
const TUT_STEPS = [
  { tab:'live', mascot:'🦁', title:'Welcome to your zoo!', body:'This is your park — meet Clover the rabbit on the map. Let\u2019s learn the basics.', reward:'+100 Gold', cta:"Let's go", rw:{ gold:100 } },
  { care:true, need:'feed',  doHint:'Tap 🍖 Feed', mascot:'🍖', title:'Feed Clover', body:'Tap the 🍖 Feed button below to fill hunger.', reward:'+200 Gold', rw:{ gold:200 } },
  { care:true, need:'clean', doHint:'Tap 🫧 Clean', mascot:'🫧', title:'Clean the habitat', body:'Tap the 🫧 Clean button below.', reward:'+150 Gold', rw:{ gold:150 } },
  { tab:'live', hi:'income', mascot:'🪙', title:'Income is automatic', body:'Visitors pay as they arrive — your gold rises on its own every second, even while you\u2019re away. Watch the live rate at the top.', reward:'+100 Gold', cta:'Got it', rw:{ gold:100 } },
  { tab:'animals', hi:'buy', need:'buy', doHint:'Scroll down · tap Buy', mascot:'🛒', title:'Buy your first new animal', body:'New species unlock as your zoo level rises. Scroll to the Chicken below and tap its Buy button to adopt it.', reward:'+150 Gold', rw:{ gold:150 } },
  { tab:'animals', mascot:'🏗️', title:'Upgrade the Meadow', body:'Spend gold to add another animal slot so your habitat holds more animals — raising its appeal.', reward:'+300 Gold', cta:'Got it', rw:{ gold:300 } },
  { tab:'live', mascot:'😊', title:'Keep animals happy', body:'Well-fed, clean, happy animals are more appealing — so more visitors stream in, and gold rises faster.', reward:'+200 Gold', cta:'Nice!', rw:{ gold:200 } },
  { tab:'show', mascot:'🎟️', title:'Run visitor activities', body:'Build an attraction, then run activities here (photo, feeding, rides…) for gold, reputation & XP. Each has a cooldown.', reward:'+250 Gold', cta:'Got it', rw:{ gold:250 } },
  { tab:'animals', mascot:'⭐', title:'Level up your zoo', body:'Care and quests earn Zoo XP. Raise your Zoo Level to unlock new animals, habitats and attractions.', reward:'+500 Gold', cta:'Finish', rw:{ gold:500 } },
];

function TutorialCoach({ step, onNext, onSkip }) {
  const [confirm, setConfirm] = useState(false);
  const s = TUT_STEPS[step];
  if (!s) return null;
  const isAction = !s.cta;
  return (
    <>
      <div className="tut-scrim"></div>
      {confirm ? (
        <div className="tut-coach" style={{ textAlign:'center' }}>
          <div style={{ fontSize:30 }}>⚠️</div>
          <div className="tc-title" style={{ marginTop:4 }}>Skip the tutorial?</div>
          <div className="tc-body" style={{ marginTop:6 }}>You\u2019ll miss the remaining step rewards (gold, XP & unlocks). Are you sure?</div>
          <div className="row" style={{ gap:10, justifyContent:'center', marginTop:14 }}>
            <button className="gbtn ghost sm" onClick={()=>setConfirm(false)}>No, keep it</button>
            <button className="gbtn sm" style={{ background:'#EF4B5C', boxShadow:'0 4px 0 #c33442' }} onClick={onSkip}>Yes, skip</button>
          </div>
        </div>
      ) : (
        <div className={'tut-coach' + (isAction ? ' top' : '')}>
          <div className="tc-head">
            <div className="tc-av">{s.mascot}</div>
            <div style={{ flex:1 }}>
              <div className="tc-step">Step {step+1} of {TUT_STEPS.length}</div>
              <div className="tc-title">{s.title}</div>
            </div>
          </div>
          <div className="tc-body">{s.body}</div>
          {!isAction && <div className="tc-reward">🎁 Reward · {s.reward}</div>}
          <div className="tc-foot">
            <button className="tc-skip" onClick={()=>setConfirm(true)}>Skip tutorial</button>
            <div className="row" style={{ gap:10, alignItems:'center' }}>
              <div className="tc-dots">{TUT_STEPS.map((_,i)=><i key={i} className={i<=step?'on':''}></i>)}</div>
              {isAction
                ? <span className="tc-do">👆 {s.doHint}</span>
                : <button className="gbtn grass sm" onClick={onNext}>{s.cta}</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { TUT_STEPS, TutorialCoach });
