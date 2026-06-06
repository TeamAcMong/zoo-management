// ============================================================
// PACED TUTORIAL (FTUE) — condition-gated coach, NOT a linear chain.
// Each beat appears only when its trigger fires (often: "when you can
// afford it"). The player plays freely between beats — no rapid-fire
// step chaining, no full UI lock. Progress persists in the save blob.
//
// Strings live in the i18n table (data.jsx) under keys 'tut.<id>.title',
// 'tut.<id>.body', 'tut.<id>.do' (action beats) / '.cta' (info beats) —
// so the whole tutorial is bilingual (EN / VI).
//
// Beat fields (structural only):
//   id       unique key, also written to tutDone[] when completed
//   trigger  (s)=>bool over { done[], gold, level, ownedCount } — when to show
//   action   real action that completes the beat ('play'|'feed'|'buy'|'upgrade'|'build'…)
//   info     true for info beats (no action; player taps the cta button)
//   goto     tab to gently open when the beat becomes active ('care' focuses Clover)
//   hi       spotlight hint ('income' · 'buy' · care-action key)
//   mascot   emoji · reward  display string (e.g. '+30 🪙') · rw  granted on completion
// ============================================================
const TUT_BEATS = [
  { id:'play',       goto:'care',        action:'play',    hi:'play',   mascot:'🎾', reward:'+30 🪙',  rw:{ gold:30,  xp:10 }, trigger:(s)=> true },
  { id:'watch',      info:true,                            hi:'income', mascot:'🪙', reward:'+10 XP',  rw:{ xp:10 },           trigger:(s)=> s.done.includes('play') },
  { id:'feed',       goto:'care',        action:'feed',    hi:'feed',   mascot:'🍖', reward:'+60 🪙',  rw:{ gold:60,  xp:15 }, trigger:(s)=> s.done.includes('watch') && s.gold>=40 },
  { id:'buy',        goto:'animals',     action:'buy',     hi:'buy',    mascot:'🛒', reward:'+100 🪙', rw:{ gold:100, xp:20 }, trigger:(s)=> s.done.includes('feed') && s.gold>=500 },
  { id:'upgrade',    goto:'animals',     action:'upgrade',              mascot:'🏗️', reward:'+150 🪙', rw:{ gold:150, xp:25 }, trigger:(s)=> s.done.includes('buy') && s.ownedCount>=2 && s.gold>=550 },
  { id:'levelup',    info:true,                                         mascot:'⭐', reward:'+200 🪙', rw:{ gold:200 },        trigger:(s)=> s.done.includes('upgrade') && s.level>=2 },
  { id:'attraction', goto:'attractions', action:'build',                mascot:'🎡', reward:'+300 🪙', rw:{ gold:300, xp:30 }, trigger:(s)=> s.done.includes('levelup') && s.level>=7 && s.gold>=500 },
  { id:'graduate',   info:true,                                         mascot:'🎉', reward:'+500 🪙', rw:{ gold:500, xp:50 }, trigger:(s)=> s.done.includes('attraction') },
];

// pick the active beat: first not-yet-done beat whose trigger fires (null = play freely)
function activeTutBeat(state){
  return TUT_BEATS.find(b => !state.done.includes(b.id) && b.trigger(state)) || null;
}

function TutorialCoach({ beat, done = 0, total = 1, onInfo, onSkip }) {
  const [confirm, setConfirm] = useState(false);
  if (!beat) return null;
  const isAction = !beat.info;   // action beats wait for the real tap (no Next button, no scrim)
  return (
    <>
      {!isAction && <div className="tut-scrim"></div>}
      {confirm ? (
        <div className="tut-coach" style={{ textAlign:'center' }}>
          <div style={{ fontSize:30 }}>⚠️</div>
          <div className="tc-title" style={{ marginTop:4 }}>{t('tut.skipTitle')}</div>
          <div className="tc-body" style={{ marginTop:6 }}>{t('tut.skipBody')}</div>
          <div className="row" style={{ gap:10, justifyContent:'center', marginTop:14 }}>
            <button className="gbtn ghost sm" onClick={()=>setConfirm(false)}>{t('tut.skipNo')}</button>
            <button className="gbtn sm" style={{ background:'#EF4B5C', boxShadow:'0 4px 0 #c33442' }} onClick={onSkip}>{t('tut.skipYes')}</button>
          </div>
        </div>
      ) : (
        <div className={'tut-coach' + (isAction ? ' top' : '')}>
          <div className="tc-head">
            <div className="tc-av">{beat.mascot}</div>
            <div style={{ flex:1 }}>
              <div className="tc-step">{t('tut.guide', { n:Math.min(done+1,total), m:total })}</div>
              <div className="tc-title">{t('tut.'+beat.id+'.title')}</div>
            </div>
          </div>
          <div className="tc-body">{t('tut.'+beat.id+'.body')}</div>
          {!isAction && beat.reward && <div className="tc-reward">{t('tut.reward', { r:beat.reward })}</div>}
          <div className="tc-foot">
            <button className="tc-skip" onClick={()=>setConfirm(true)}>{t('tut.skip')}</button>
            <div className="row" style={{ gap:10, alignItems:'center' }}>
              {isAction
                ? <span className="tc-do">👆 {t('tut.'+beat.id+'.do')}</span>
                : <button className="gbtn grass sm" onClick={onInfo}>{t('tut.'+beat.id+'.cta')}</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { TUT_BEATS, activeTutBeat, TutorialCoach });
