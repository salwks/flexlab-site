const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const worksDoc=JSON.parse(fs.readFileSync(path.join(root,'works.json'),'utf8'));
const thumbsDoc=JSON.parse(fs.readFileSync(path.join(root,'thumbnails.json'),'utf8'));
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const works=Array.isArray(worksDoc)?worksDoc:(worksDoc.works||[]);
const thumbs=thumbsDoc.thumbnails||{};
function ok(v,msg){if(!v)throw new Error(msg)}
ok(!works.some(w=>'img' in w||'thumb' in w),'works.json must not contain image URLs');
ok(index.includes("THUMB_DATA_URL='./thumbnails.json'"),'index must load thumbnails.json');
ok(!index.includes('joseon-painting-thumb.onrender.com'),'browser must not call runtime thumbnail proxy');
const ids=new Set(works.map(w=>String(w.id)));
for(const [id,t] of Object.entries(thumbs)){
  ok(ids.has(String(id)),`unknown thumbnail id ${id}`);
  ok(t.verified===true,`thumbnail ${id} must be verified`);
  ok(/^https:\/\//.test(t.thumbnail||''),`thumbnail ${id} must be https`);
}
const unresolved=works.filter(w=>!thumbs[String(w.id)]).length;
ok(thumbsDoc.count===Object.keys(thumbs).length,'thumbnail count mismatch');
ok(thumbsDoc.unresolved===unresolved,'unresolved count mismatch');
console.log(JSON.stringify({works:works.length,verified:Object.keys(thumbs).length,unresolved}));
