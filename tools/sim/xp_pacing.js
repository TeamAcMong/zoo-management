// ============================================================================
// XP Pacing model + Excel (.xlsx) generator — Animal World Zoo
// Target: an "engaged" player reaches Lv92 (current max) in ~180 days (6 months).
//
// What it does:
//   1. Reproduces the LEVEL_XP[92] curve exactly per zoo-level.md's algorithm.
//   2. Models XP income per day under a redesigned set of SCALING faucets.
//   3. Binary-searches the faucet scale S so an engaged player hits Lv92 at 180d.
//   4. Emits a multi-sheet .xlsx part-set (zipped by the companion PowerShell step)
//      and CSV mirrors.
//
// Run:  node tools/sim/xp_pacing.js
// Output parts: tools/sim/_xlsxbuild/**   (zip these into the .xlsx)
//        CSVs:  tools/sim/_csv/*.csv
// ============================================================================
const fs = require('fs');
const path = require('path');

// ---------- LEVEL_XP curve (verbatim algorithm from design/gdd/zoo-level.md) ----------
function roundNice(x){ if(x<=0) return 0; const d=Math.ceil(Math.log10(x)); const p=Math.pow(10,3-d); return Math.round(x*p)/p; }
const LEVELS=[{lv:1,xp:0},{lv:7,xp:5200},{lv:18,xp:42000},{lv:30,xp:210000},{lv:45,xp:980000},{lv:60,xp:3600000},{lv:84,xp:18000000}];
const MAX=92; const LX=new Array(MAX); LX[0]=0;
for(let s=0;s<6;s++){ const a=LEVELS[s], b=LEVELS[s+1];
  for(let lv=a.lv+1; lv<=b.lv; lv++){ const f=(lv-a.lv)/(b.lv-a.lv);
    const x = a.xp>0 ? a.xp*Math.pow(b.xp/a.xp,f) : b.xp*Math.pow(f,2.2); LX[lv-1]=roundNice(x); } }
const lastA=LEVELS[6], prevA=LEVELS[5];
const G=Math.pow(lastA.xp/prevA.xp, 1/(lastA.lv-prevA.lv)); // ~1.0694 endgame ratio
for(let lv=lastA.lv+1; lv<=MAX; lv++) LX[lv-1]=roundNice(LX[lv-2]*G);
const lvFrom = xp => { let lv=1; for(let i=0;i<MAX;i++) if(xp>=LX[i]) lv=i+1; return lv; };

// ---------- content / species ----------
const UNLOCK=[1,3,5,6,8,11,13,15,17,20,23,25,28,32,36,40,44,48,54,60,66,70,74,80,84,88,92];
const speciesAt = lv => UNLOCK.filter(u=>u<=lv).length;
const QUESTS=[{lv:1,xp:300},{lv:2,xp:550},{lv:3,xp:850},{lv:4,xp:1200},{lv:5,xp:1600},{lv:8,xp:2300},{lv:10,xp:3000}];
const CONTENT={1:'Meadow, Rabbit (starter)',3:'Dog',5:'Cat',6:'Goat, Pasture',7:'Petting Area; daily missions',8:'Sheep',11:'Horse',13:'Donkey',15:'Alpaca',17:'Cow',18:'Feeding Zone; Day/Night',20:'Fox, Woodland',23:'Monkey',25:'Raccoon',26:'Educational Shows',28:'Wolf',30:'Animal Rides',32:'Zebra, Savanna',36:'Giraffe',40:'Rhinoceros',44:'Hippopotamus',45:'Performance Arena',48:'Lion',54:'Elephant',60:'Brown Bear, Polar Peaks',66:'Polar Bear',70:'Turtle, Reptile House',74:'Python',80:'Crocodile',84:'Seal, Marine Cove',88:'Sea Lion',92:'Dolphin (endgame)'};

// ---------- daily XP model ----------
// flat care (early) + scaling pool P=S*G^L (education+daily missions+show) + weekly + monthly event.
function dailyXP(L,s,m){
  const care = speciesAt(L)*5*3;            // 5 useful care actions/animal/day * 3 XP
  const P    = s*Math.pow(G,L)*m;           // core scaling daily pool
  const weekly = (s*0.9*Math.pow(G,L)*m)/7; // weekly mission set, amortized
  const event  = (s*4*Math.pow(G,L)*m)/30;  // monthly event lump, amortized
  return care + P + weekly + event;
}
function sim(s,m){
  let xp=0, claimed=new Set(), prevSp=0; const day=new Array(MAX+1); day[1]=0;
  for(let d=1; d<=40000; d++){
    let lv=lvFrom(xp);
    const sp=speciesAt(lv); if(sp>prevSp){ xp+=(sp-prevSp)*40; prevSp=sp; }
    for(const q of QUESTS) if(lv>=q.lv && !claimed.has(q.lv)){ xp+=q.xp; claimed.add(q.lv); }
    xp += dailyXP(lv,s,m);
    const nl=lvFrom(xp);
    for(let L=lv+1; L<=nl; L++) day[L]=d;
    if(nl>=MAX) break;
  }
  return day;
}

// ---------- solve S so engaged (m=1.0) hits Lv92 at ~180 days ----------
let lo=1, hi=5e7;
for(let i=0;i<80;i++){ const mid=(lo+hi)/2; const d=sim(mid,1.0)[92]; (d===undefined||d>180)?lo=mid:hi=mid; }
const S=Math.round((lo+hi)/2);
const CAS=sim(S,0.45), ENG=sim(S,1.0), MX=sim(S,1.9);
const P = L => Math.round(S*Math.pow(G,L));

// ============================ Excel (.xlsx) emit ============================
const BUILD = path.join(__dirname,'_xlsxbuild');
const CSV   = path.join(__dirname,'_csv');
fs.rmSync(BUILD,{recursive:true,force:true}); fs.rmSync(CSV,{recursive:true,force:true});
fs.mkdirSync(path.join(BUILD,'_rels'),{recursive:true});
fs.mkdirSync(path.join(BUILD,'xl','_rels'),{recursive:true});
fs.mkdirSync(path.join(BUILD,'xl','worksheets'),{recursive:true});
fs.mkdirSync(CSV,{recursive:true});

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function colRef(n){ let s=''; n++; while(n>0){ const r=(n-1)%26; s=String.fromCharCode(65+r)+s; n=Math.floor((n-1)/26);} return s; }
function sheetXml(rows){
  let xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
  rows.forEach((row,ri)=>{ xml+='<row r="'+(ri+1)+'">';
    row.forEach((c,ci)=>{ const ref=colRef(ci)+(ri+1);
      if(typeof c==='number'&&isFinite(c)) xml+='<c r="'+ref+'"><v>'+c+'</v></c>';
      else xml+='<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+esc(c)+'</t></is></c>';
    }); xml+='</row>'; });
  return xml+'</sheetData></worksheet>';
}
const fmtMo = d => d===undefined?'>15y':(d/30).toFixed(1)+' mo';
const fmtD  = d => d===undefined?'never':d;
const showXP = L => Math.round(120*(1+0.05*L));

// Sheet 1 — Curve & pacing per level
const s1=[['Level','LEVEL_XP (cumulative)','Delta XP to next','Engaged XP/day target','Day: Casual','Day: Engaged','Day: Max','Content unlocked']];
for(let L=1;L<=MAX;L++){ const delta=L<MAX?(LX[L]-LX[L-1]):0;
  s1.push([L,LX[L-1],delta,Math.round(dailyXP(L,S,1.0)),fmtD(CAS[L]),fmtD(ENG[L]),fmtD(MX[L]),CONTENT[L]||'']); }
// Sheet 2 — Faucet allocation
const s2=[['XP FAUCET ALLOCATION  (target Lv92 in 180 days)'],
  ['Scaling daily pool  P(L) = round('+S+' * '+G.toFixed(4)+'^Level)'],[],
  ['Level','P(L) pool/day','Education 60% (active+offline/day)','Daily missions 25% (5/day)','per daily mission','Show 15% (/day)','Weekly set (0.9*P /week)','Event lump (4*P /month)','Care (early /day)']];
for(const L of [7,18,30,45,60,75,92]){ const p=P(L);
  s2.push([L,p,Math.round(.6*p),Math.round(.25*p),Math.round(.05*p),Math.round(.15*p),Math.round(.9*p),Math.round(4*p),speciesAt(L)*15]); }
// Sheet 3 — Profile comparison
const s3=[['PACING BY PROFILE — months to reach'],[],['Milestone','Casual (x0.45)','Engaged (x1.0)','Max (x1.9)','Content']];
for(const L of [7,18,30,45,60,75,92]) s3.push(['Lv'+L,fmtMo(CAS[L]),fmtMo(ENG[L]),fmtMo(MX[L]),CONTENT[L]||'']);
s3.push([]); s3.push(['Solved faucet scale S =',S]); s3.push(['Curve ratio G =',Number(G.toFixed(4))]);
s3.push(['Engaged Lv92 (days) =',ENG[92]]); s3.push(['Casual Lv92 (days) =',CAS[92]]); s3.push(['Max Lv92 (days) =',MX[92]]);
// Sheet 4 — Tuning knobs
const s4=[['TUNING KNOBS'],[],['Knob','Symbol','Proposed','Safe range','Effect'],
  ['Faucet scale','S',S,(S*0.5)+' - '+(S*2),'Master pacing lever; shifts whole 6mo journey'],
  ['Curve ratio (endgame)','G',Number(G.toFixed(4)),'1.05 - 1.09','Late-curve steepness; keep matched to faucet'],
  ['Education XP per visitor','XP_PER_VISITOR',0.02,'0.005 - 0.05','Calibrate so passive XP/day ~= 0.60*P(L) via economy sim'],
  ['Offline XP rate factor','OFFLINE_XP_FACTOR',0.6,'0.3 - 0.9','Offline XP as fraction of active (mirrors gold)'],
  ['Daily mission count','DAILY_MISSION_COUNT',5,'3 - 8','Each grants ~0.05*P(L) XP + 5-15 gems'],
  ['Show XP base','SHOW_XP_BASE',120,'60 - 240','showXP = round(BASE*(1+SLOPE*level))'],
  ['Show XP level slope','SHOW_XP_SLOPE',0.05,'0.02 - 0.10','Per-level growth of show XP'],
  ['Monthly event XP mult','EVENT_XP_MULT',4,'2 - 8','Event lump = mult * P(L), once/month'],
  ['Offline cap free','OFFLINE_CAP_FREE_SEC',28800,'14400 - 86400','Shared w/ gold; anti clock-exploit'],
  ['Quest chain total (early)','QUEST_XP_TOTAL',9800,'5000 - 15000','One-time early ramp Lv1->10']];

// Sheet 5 — Full per-level faucet table (all 92 levels)
const s5=[['XP FAUCET — FULL PER-LEVEL TABLE (target Lv92 in 180 days)'],
  ['P(level) = round('+S+' * '+G.toFixed(4)+'^level)'],[],
  ['Level','LEVEL_XP','Delta to next','P(L) pool','Education/day (0.60*P)','Daily mission each (0.05*P)','Daily missions x5 (0.25*P)','Show XP (level)','Weekly (0.90*P)','Event (4*P)','Care/day','Engaged XP/day total','Day reached (engaged)']];
for(let L=1;L<=MAX;L++){ const p=P(L); const delta=L<MAX?(LX[L]-LX[L-1]):0;
  s5.push([L,LX[L-1],delta,p,Math.round(.6*p),Math.round(.05*p),Math.round(.25*p),showXP(L),Math.round(.9*p),Math.round(4*p),speciesAt(L)*15,Math.round(dailyXP(L,S,1.0)),ENG[L]===undefined?'':ENG[L]]); }

const sheets=[{n:'Curve_Pacing',r:s1},{n:'Faucet_Allocation',r:s2},{n:'Faucet_PerLevel',r:s5},{n:'Profile_Comparison',r:s3},{n:'Tuning_Knobs',r:s4}];
sheets.forEach((s,i)=>fs.writeFileSync(path.join(BUILD,'xl','worksheets','sheet'+(i+1)+'.xml'),sheetXml(s.r)));
fs.writeFileSync(path.join(BUILD,'[Content_Types].xml'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
  sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>');
fs.writeFileSync(path.join(BUILD,'_rels','.rels'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
fs.writeFileSync(path.join(BUILD,'xl','workbook.xml'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+
  sheets.map((s,i)=>'<sheet name="'+s.n+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>');
fs.writeFileSync(path.join(BUILD,'xl','_rels','workbook.xml.rels'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
  sheets.map((s,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'</Relationships>');

// CSV mirrors
const toCsv = rows => rows.map(r=>r.map(c=>{const v=(c===undefined?'':String(c));return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}).join(',')).join('\n');
fs.writeFileSync(path.join(CSV,'curve_pacing.csv'),toCsv(s1));
fs.writeFileSync(path.join(CSV,'faucet_allocation.csv'),toCsv(s2));
fs.writeFileSync(path.join(CSV,'profile_comparison.csv'),toCsv(s3));
fs.writeFileSync(path.join(CSV,'tuning_knobs.csv'),toCsv(s4));
fs.writeFileSync(path.join(CSV,'faucet_perlevel.csv'),toCsv(s5));

console.log('S='+S+'  G='+G.toFixed(4));
console.log('Lv92 days  -> casual='+CAS[92]+'  engaged='+ENG[92]+'  max='+MX[92]);
console.log('Milestones (engaged, months): Lv30='+(ENG[30]/30).toFixed(1)+' Lv60='+(ENG[60]/30).toFixed(1)+' Lv92='+(ENG[92]/30).toFixed(1));
console.log('parts -> '+BUILD);
