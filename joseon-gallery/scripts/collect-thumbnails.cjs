const fs=require('fs');
const path=require('path');
const {resolveImage,pickVerifiedImage}=require('./thumbnail-resolver.cjs');

const ROOT=path.resolve(__dirname,'..');
const WORKS=path.join(ROOT,'works.json');
const THUMBS=path.join(ROOT,'thumbnails.json');
const QUEUE=path.join(ROOT,'thumbnail-queue.json');
const args=process.argv.slice(2);
function arg(name,def=''){const i=args.indexOf(name);return i>=0&&i+1<args.length?args[i+1]:def}
const limit=Math.max(0,Number(arg('--limit','0'))||0);
const sourceFilter=arg('--source','').toLowerCase();
const idFilter=arg('--id','');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const wdoc=JSON.parse(fs.readFileSync(WORKS,'utf8'));
const works=Array.isArray(wdoc)?wdoc:(wdoc.works||[]);
const tdoc=fs.existsSync(THUMBS)?JSON.parse(fs.readFileSync(THUMBS,'utf8')):{version:'',thumbnails:{}};
const thumbnails=tdoc.thumbnails||tdoc;
let queue=works.filter(w=>{
  const t=thumbnails[String(w.id)];
  if(t&&t.verified&&t.thumbnail)return false;
  if(!w.url)return false;
  if(sourceFilter&&!String(w.source||'').toLowerCase().includes(sourceFilter))return false;
  if(idFilter&&String(w.id)!==String(idFilter))return false;
  return true;
});
if(limit)queue=queue.slice(0,limit);

const results=[];
(async()=>{
  for(let i=0;i<queue.length;i++){
    const w=queue[i];
    const row={id:w.id,title:w.title||'',source:w.source||'',url:w.url||'',status:'failed'};
    try{
      const candidate=await resolveImage(w.url);
      const verified=await pickVerifiedImage([candidate]);
      if(!verified)throw new Error('image verification failed');
      thumbnails[String(w.id)]={
        thumbnail:verified,
        image:verified,
        source:w.source||'',
        verified:true,
        verifiedAt:new Date().toISOString().slice(0,10)
      };
      row.status='verified';row.thumbnail=verified;
    }catch(e){
      row.error=e&&e.message?e.message:String(e);
    }
    results.push(row);
    process.stdout.write(`[${i+1}/${queue.length}] ${w.id} ${row.status}\n`);
    await sleep(350);
  }

  const unresolved=works.filter(w=>!(thumbnails[String(w.id)]&&thumbnails[String(w.id)].verified&&thumbnails[String(w.id)].thumbnail));
  const bySource={};
  for(const w of unresolved)bySource[w.source||'']=(bySource[w.source||'']||0)+1;
  const now=new Date().toISOString().slice(0,10);
  const out={
    version:now,
    generatedFrom:`works.json ${wdoc.version||''}`.trim(),
    count:Object.keys(thumbnails).filter(id=>thumbnails[id]&&thumbnails[id].verified&&thumbnails[id].thumbnail).length,
    unresolved:unresolved.length,
    thumbnails
  };
  fs.writeFileSync(THUMBS,JSON.stringify(out,null,2)+'\n');
  const priorQueue=fs.existsSync(QUEUE)?JSON.parse(fs.readFileSync(QUEUE,'utf8')):{items:[]};
  const attempts=new Map((priorQueue.items||[]).map(x=>[String(x.id),x]));
  for(const r of results)attempts.set(String(r.id),{...(attempts.get(String(r.id))||{}),...r,lastChecked:now});
  const items=unresolved.map(w=>({
    id:w.id,title:w.title||'',artist:w.artist||'',source:w.source||'',url:w.url||'',
    status:(attempts.get(String(w.id))||{}).status||'pending',
    error:(attempts.get(String(w.id))||{}).error||'',
    lastChecked:(attempts.get(String(w.id))||{}).lastChecked||''
  }));
  fs.writeFileSync(QUEUE,JSON.stringify({
    version:now,total:items.length,
    bySource:Object.fromEntries(Object.entries(bySource).sort((a,b)=>b[1]-a[1])),
    items
  },null,2)+'\n');
  console.log(JSON.stringify({processed:results.length,verified:results.filter(x=>x.status==='verified').length,failed:results.filter(x=>x.status==='failed').length,totalVerified:out.count,unresolved:out.unresolved}));
})().catch(e=>{console.error(e);process.exit(1)});
