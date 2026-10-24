// Checks every stored number against audit/verified/*.json and audit/flags.json, plus matcher unit cases.
// Run from the repo root: node audit/verify.mjs   (must report 0 failures before any commit)
import fs from 'fs';
const src = fs.readFileSync('src/WillThisFit.jsx','utf8');
// pull the brand arrays out as JS and evaluate them
const grab = (name) => { const i = src.indexOf(`const ${name} = [`); let d=0, j=i+`const ${name} = `.length; for(;j<src.length;j++){ if(src[j]==='[')d++; else if(src[j]===']'){d--; if(d===0)break;} } return Function(`return ${src.slice(i+`const ${name} = `.length, j+1)}`)(); };
const all = ['WOMEN_BRANDS','MEN_BRANDS','KIDS_BRANDS','SHOE_BRANDS','BRA_BRANDS','KNICKER_BRANDS'].flatMap(n => { try { return grab(n); } catch { return []; } });
const byId = Object.fromEntries(all.map(b=>[b.id,b]));
let fails = 0, rows = 0;
for (const f of fs.readdirSync('audit/verified')) {
  const v = JSON.parse(fs.readFileSync('audit/verified/'+f,'utf8'));
  const b = byId[v.id]; if (!b) { console.log('MISSING', v.id); fails++; continue; }
  if (b.sizes.length !== v.rows.length) { console.log('COUNT', v.id, b.sizes.length, v.rows.length); fails++; }
  v.rows.forEach((r,i) => { rows++; const s = b.sizes[i];
    for (const k of ['bust','chest','waist','hips']) { if (!(k in r)) { if (s[k]!==undefined && !(k==='bust'&&false)) { console.log('EXTRA', v.id, i, k, s[k]); fails++; } continue; }
      const want = r[k];
      if (Array.isArray(want)) { const got = s.rng?.[k]; if (!got || got[0]!==want[0] || got[1]!==want[1] || Math.abs(s[k]-(want[0]+want[1])/2)>0.051) { console.log('RANGE', v.id, i, k, want, got, s[k]); fails++; } }
      else if (s[k] !== want) { console.log('VAL', v.id, i, k, want, s[k]); fails++; } }
    if (s.label !== r.label) { console.log('LABEL', v.id, i, r.label, s.label); fails++; }
  });
  if (b.lastVerified !== v.checked || b.verifiedBy !== 'official-page') { console.log('META', v.id, b.lastVerified, b.verifiedBy); fails++; }
}
const flags = JSON.parse(fs.readFileSync('audit/flags.json','utf8'));
for (const fl of flags) { const b = byId[fl.id]; if (!b || b.auditFlag !== fl.flag || b.verifiedBy!=='unverified') { console.log('FLAG', fl.id); fails++; } }
// matcher
const fn = src.slice(src.indexOf('function dimDist'), src.indexOf('// ─── GOOGLE OAUTH'));
const dimDist = Function(fn + '; return dimDist;')();
const t = [[dimDist(95,{bust:96,rng:{bust:[93,99]}},'bust'),0],[dimDist(100,{bust:96,rng:{bust:[93,99]}},'bust'),1],[dimDist(90,{chest:96,rng:{chest:[93,99]}},'bust'),3],[dimDist(90,{bust:92},'bust'),2],[dimDist(0,{bust:92},'bust'),0],[dimDist(80,{waist:76},'waist'),4]];
t.forEach(([g,w],i)=>{ if (g!==w) { console.log('DIMDIST', i, g, w); fails++; } });
console.log(`checked ${rows} rows in ${fs.readdirSync('audit/verified').length} entries, ${flags.length} flags, ${t.length} matcher cases: ${fails} failures`);
