const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const helpers=html.slice(html.indexOf('const THUMB_PROXY='),html.indexOf('function render(){'));
const ctx=vm.createContext({esc:s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;')});vm.runInContext(helpers,ctx);
const run=s=>vm.runInContext(s,ctx);
assert.equal(run("thumbnailCandidates({thumb:'small',img:'full',url:'page'}).join(',')"),'small,full');
assert.equal(run("thumbnailCandidates({thumb:'same',img:'same'}).length"),1);
assert.match(run("thumbnailMarkup({title:'A',thumb:'small',img:'full'},0)"),/loading="eager" fetchpriority="high"/);
assert.match(run("thumbnailMarkup({title:'A',img:'full'},8)"),/loading="lazy" fetchpriority="auto"/);
assert.match(run("thumbnailMarkup({title:'A',url:'https://museum.example/object/1'},0)"),/loading="lazy" fetchpriority="low"/);
assert.equal(run("thumbnailMarkup({title:'A'},0)"),'');
const img={dataset:{fallback:'full'},style:{},parentElement:{classList:{add(c){this.added=c}}}};ctx.img=img;
run('retryThumbnail(img)');assert.equal(img.src,'full');
run('retryThumbnail(img)');assert.equal(img.onerror,null);assert.equal(img.style.display,'none');assert.equal(img.parentElement.classList.added,'broken');
console.log('PASS: syntax, direct URL priority, native lazy loading, independent proxy requests, full-image fallback and termination');

const data=JSON.parse(readFileSync(require('node:path').join(__dirname,'../works.json'),'utf8'));
assert.equal(data.count,data.works.length);
assert.equal(new Set(data.works.map(w=>w.id)).size,data.works.length);
for(const w of data.works.filter(w=>w.thumb)){
 assert.ok(/^https:\/\//.test(w.thumb));
 assert.ok(!w.thumb.includes('joseon-painting-thumb.onrender.com'));
}
console.log('PASS: stable record IDs/count and pinned thumbnails use source image URLs');
