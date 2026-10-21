
const {URL}=require('url');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/155 Safari/537.36 JoseonPaintingGallery/1.0';
const ALLOWED=['britishmuseum.org','brooklynmuseum.org','metmuseum.org','clevelandart.org','lacma.org','asianart.org','mfah.org','dia.org','nich.go.jp','heritage.go.kr','kansong.org','mfa.org','busan.go.kr','leeumhoam.org','si.edu','asia-archive.si.edu','ids.si.edu','jpsearch.go.jp','philamuseum.org','ewha.ac.kr','pem.org','harvardartmuseums.org','princeton.edu','guimet.fr','smb.museum','gogung.go.kr','nfm.go.kr','museum.go.kr','horimmuseum.org','worcesterart.org','slam.org','thewalters.org','spencerart.ku.edu','nelson-atkins.org','portlandartmuseum.org','honolulumuseum.org','usc.edu','gangseo.seoul.kr','aks.ac.kr','gugak.go.kr','commons.wikimedia.org','media.britishmuseum.org','collectionapi.metmuseum.org','piction.clevelandart.org','collections-images.lacma.org'];
function allowed(h){h=(h||'').toLowerCase();return ALLOWED.some(d=>h===d||h.endsWith('.'+d))}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchRetry(url,opts={},tries=4){let r,lastErr;for(let i=0;i<tries;i++){try{const timeout=AbortSignal.timeout(15000),signal=opts.signal?AbortSignal.any([opts.signal,timeout]):timeout;r=await fetch(url,{...opts,signal});if(![429,502,503,504].includes(r.status))return r;if(i<tries-1)await sleep(600*Math.pow(2,i))}catch(e){lastErr=e;if(i<tries-1)await sleep(600*Math.pow(2,i))}}if(r)return r;throw lastErr||new Error('fetch failed')}

function ent(s){return (s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#0*38;|&#x0*26;/gi,'&').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function abs(base,v){if(!v)return'';v=ent(v.trim()).replace(/\\u002F/gi,'/').replace(/\\\//g,'/');if(v.startsWith('//'))v='https:'+v;try{return new URL(v,base).href}catch{return''}}
function attr(tag,n){const m=tag.match(new RegExp('\\b'+n+'\\s*=\\s*["\\\']([^"\\\']+)["\\\']','i'));return m?m[1]:''}
function candidates(html,base){
 const a=[];
 for(const t of html.match(/<meta\b[^>]*>/gi)||[]){const k=(attr(t,'property')||attr(t,'name')||'').toLowerCase(),v=attr(t,'content');if(k==='og:image'||k==='og:image:url'||k==='og:image:secure_url'||k==='twitter:image'||k==='twitter:image:src')a.push(abs(base,v))}
 for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))for(const x of m[1].matchAll(/"(?:image|contentUrl|thumbnailUrl)"\s*:\s*"([^"]+)"/g))a.push(abs(base,x[1]));
 for(const t of html.match(/<img\b[^>]*>/gi)||[]){for(const n of ['src','data-src','data-original','data-lazy-src','data-image','data-url'])a.push(abs(base,attr(t,n)));const ss=attr(t,'srcset')||attr(t,'data-srcset');if(ss)for(const p of ss.split(','))a.push(abs(base,p.trim().split(/\s+/)[0]))}
 for(const m of html.matchAll(/https?:\\?\/\\?\/[^"'<>\s]+?\.(?:jpe?g|png|webp)(?:\?[^"'<>\s]*)?/gi))a.push(abs(base,m[0]));
 for(const m of html.matchAll(/["'](\/[^"']+?\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi))a.push(abs(base,m[1]));
 for(const m of html.matchAll(/(?:https?:\\?\/\\?\/[^"'<>\s]+)?\/internal\/media\/(?:zoomdispatcher|dispatcher)\/\d+\/[^"'<>\s]*/gi))a.push(abs(base,m[0]));
 for(const m of html.matchAll(/["'](\/common\/apithumb\/relic\/\d+\.do)["']/gi))a.push(abs(base,m[1]));
 for(const m of html.matchAll(/["'](\/[^"']*\/(?:image|images|media|iiif)\/[^"']+)["']/gi))a.push(abs(base,m[1]));
 for(const m of html.matchAll(/https?:\\?\/\\?\/ids\.si\.edu\/ids\/deliveryService\?[^"'<>\s]+/gi))a.push(abs(base,m[0]));
 for(const m of html.matchAll(/["'](https?:\/\/ids\.si\.edu\/ids\/deliveryService\?[^"']+)["']/gi))a.push(abs(base,m[1]));
 return [...new Set(a.filter(x=>x&&!badCandidate(x)))]
}
function badCandidate(u){
 const s=(u||'').toLowerCase();
 return /doubleclick|googlesyndication|google-analytics|googleadservices|adservice|adnxs|adsrvr|casalemedia|criteo|taboola|outbrain|facebook\.com\/tr|connect\.facebook|pixel|tracker|logger\.co\.kr|gtag|analytics|matomo|clarity\.ms|hotjar|favicon|apple-touch|iconified|\/icon(?:[\/_\.-]|$)|logo|sprite|avatar|qr(?:[\/_\.-]|$)|banner(?:[\/_\.-]|$)|placeholder|\/images\/layout\/|breadcrumbs?|l-breadcrumbs|\/layout\/renew\/|\/_next\/static\/media\/|centennial-celebration-tile/.test(s);
}
function score(u){
 const s=u.toLowerCase();if(badCandidate(s))return -9999;let n=0;
 if(/\.svg(?:\?|$)|logo|favicon|apple-touch|iconified|\/icon|sprite|avatar|facebook|twitter|instagram|youtube|qr|banner|pixel|placeholder/.test(s))n-=220;
 if(/media\.britishmuseum\.org/.test(s))n+=260;
 if(/ids\.si\.edu\/ids\/deliveryService/.test(s))n+=420;
 if(/ids\.si\.edu|smithsonian/.test(s)&&/\.jpe?g|\.png|\.webp|idurl=/.test(s))n+=180;
 if(/mfa\.org|mfah|cloudfront|amazonaws/.test(s)&&/\.jpe?g|\.png|\.webp/.test(s))n+=130;
 if(/colbase\.nich\.go\.jp/.test(s)&&/\.jpe?g|\.png|\.webp/.test(s))n+=120;
 if(/asianart|lacma|dia\.org|brooklynmuseum/.test(s)&&/\.jpe?g|\.png|\.webp/.test(s))n+=110;
 if(/collectionapi\.metmuseum\.org/.test(s))n+=160;
 if(/piction\.clevelandart\.org|openaccess/.test(s))n+=140;
 if(/collections-images\.lacma\.org/.test(s))n+=140;
 if(/\/internal\/media\/(?:zoomdispatcher|dispatcher)\//.test(s))n+=240;
 if(/nfm\.go\.kr\/common\/apithumb\/relic\//.test(s))n+=360;
 if(/\/upload\/museum\//.test(s))n+=130;
 if(/relic_image|collection|object|artwork|museum|image|images|media|iiif|thumb|thumbnail|preview|primary/.test(s))n+=35;
 if(/thumbnail|preview|-t\.|_t\.|small|medium|mid_/.test(s))n+=12;
 return n
}
async function pickVerifiedImage(cs){
 for(const u of cs.slice(0,8)){
  if(!u||badCandidate(u)||score(u)<-80)continue;
  try{
   const host=new URL(u).hostname.toLowerCase();
   if(!allowed(host))continue;
   const r=await fetchRetry(u,{redirect:'follow',headers:{'user-agent':UA,'accept':'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'}},2);
   const ct=(r.headers.get('content-type')||'').toLowerCase();
   if(r.body&&r.body.cancel)try{await r.body.cancel()}catch(_){}
   if(r.ok&&ct.startsWith('image/'))return u;
  }catch(_){}
 }
 return '';
}
function bm(raw){try{const u=new URL(raw);if(!u.hostname.includes('britishmuseum.org')||u.pathname.startsWith('/collection/object/'))return raw;const k=u.searchParams.get('keyword')||'',m=k.match(/^OA\+,0\.482\.(\d+)$/i);if(m)return 'https://www.britishmuseum.org/collection/object/A_OA-0-482-'+m[1]}catch{}return raw}
async function resolveColBase(target){
 try{
  const u=new URL(target);
  const m=u.pathname.match(/^\/collection_items\/([^/]+)\/([^/?#]+)/);
  if(!m)return '';
  const inst=m[1],item=decodeURIComponent(m[2]);
  const api=new URL('https://jpsearch.go.jp/api/item/search/cobas-default');
  api.searchParams.set('keyword',item);api.searchParams.set('size','10');
  const r=await fetchRetry(api.href,{headers:{'user-agent':UA,'accept':'application/json'}},3);
  if(!r.ok)return '';
  const j=await r.json(),urls=[];
  const rows=Array.isArray(j.list)?j.list:[];
  const exact=rows.filter(row=>{const s=JSON.stringify(row);return s.includes('"'+item+'"')||s.includes('/'+item+'?')||s.includes('/'+item+'"')});
  const walk=x=>{
   if(!x)return;
   if(typeof x==='string'){
    if(/^https?:\/\//i.test(x)&&(/colbase\.nich\.go\.jp\/media\//i.test(x)||/thumbnail/i.test(x)))urls.push(x);
    return;
   }
   if(Array.isArray(x)){for(const v of x)walk(v);return}
   if(typeof x==='object')for(const [k,v] of Object.entries(x)){if(typeof v==='string'&&/thumbnailurl|contenturl|imageurl|representative|image/i.test(k)&&/^https?:\/\//i.test(v))urls.push(v);walk(v)}
  };
  walk(exact.length?exact:j);
  const ranked=[...new Set(urls)].sort((a,b)=>score(b)-score(a));
  const ok=await pickVerifiedImage(ranked);if(ok)return ok;
  // ColBase media URL can also be reconstructed when Japan Search exposes the image filename.
  const raw=JSON.stringify(j);
  const fn=[...raw.matchAll(/([A-Za-z0-9_.-]+\.(?:jpe?g|png|webp))/gi)].map(m=>m[1]).find(x=>x.toLowerCase().includes(item.toLowerCase()));
  if(fn){
   const clean=fn.replace(/^S_/,'');
   const guess='https://colbase.nich.go.jp/media/'+inst+'/'+encodeURIComponent(item)+'/image/slideshow/S_'+clean;
   const ok2=await pickVerifiedImage([guess]);if(ok2)return ok2;
  }
 }catch(e){}
 return '';
}
async function resolveSmithsonianArchive(target){
 try{
  const r=await fetchRetry(target,{redirect:'follow',headers:{'user-agent':UA,'accept':'text/html,*/*;q=0.8'}},3);
  if(!r.ok)return '';
  const html=await r.text(),arr=[];
  for(const m of html.matchAll(/https?:\\?\/\\?\/ids\.si\.edu\/ids\/deliveryService\?[^"'<>\s]+/gi))arr.push(abs(r.url,m[0]));
  for(const m of html.matchAll(/(?:href|src)=["']([^"']*ids\.si\.edu\/ids\/deliveryService\?[^"']+)["']/gi))arr.push(abs(r.url,m[1]));
  const ok=await pickVerifiedImage([...new Set(arr)]);if(ok)return ok;
 }catch(e){}
 return '';
}
async function resolveImage(target){
 target=bm(target);
 let pre=new URL(target);
 if(pre.hostname.endsWith('asia.si.edu')){
   const sm=pre.pathname.match(/^\/object\/([^/]+)\/?$/);
   if(sm) target='https://asia-archive.si.edu/object/'+encodeURIComponent(sm[1])+'/';
 }
 const u=new URL(target),host=u.hostname.toLowerCase();if(!allowed(host))throw Error('host');
 if(host.endsWith('colbase.nich.go.jp')){const x=await resolveColBase(target);if(x)return x;throw Error('colbase image unresolved')}
 if(host.endsWith('asia-archive.si.edu')){const x=await resolveSmithsonianArchive(target);if(x)return x;throw Error('smithsonian image unresolved')}
 let m=u.pathname.match(/\/art\/collection\/search\/(\d+)/);
 if(host.endsWith('metmuseum.org')&&m){const r=await fetchRetry('https://collectionapi.metmuseum.org/public/collection/v1/objects/'+m[1],{headers:{'user-agent':UA}});if(r.ok){const j=await r.json();if(j.primaryImageSmall||j.primaryImage)return j.primaryImageSmall||j.primaryImage}}
 m=u.pathname.match(/\/art\/([^/?#]+)/);
 if(host.endsWith('clevelandart.org')&&m){const r=await fetchRetry('https://openaccess-api.clevelandart.org/api/artworks/'+encodeURIComponent(m[1]),{headers:{'user-agent':UA}});if(r.ok){const j=await r.json(),im=(j.data&&j.data.images)||j.images,x=im&&(im.web&&im.web.url||im.print&&im.print.url||im.full&&im.full.url);if(x)return x}}
 let pageErr='';
 try{
   const r=await fetchRetry(target,{redirect:'follow',headers:{'user-agent':UA,'accept':'text/html,application/xhtml+xml,*/*;q=0.8','accept-language':'en-US,en;q=0.8,ko;q=0.7'}});
   if(r.ok){
     const html=await r.text(),cs=candidates(html,r.url).sort((a,b)=>score(b)-score(a));
     const ok=await pickVerifiedImage(cs);if(ok)return ok;
     pageErr='no image';
   }else pageErr='page '+r.status;
 }catch(e){pageErr=e.message||String(e)}
 // Dynamic/blocked museum sites: use a rendered-reader fallback, then extract the actual image URL only.
 try{
   const jr=await fetchRetry('https://r.jina.ai/'+target,{redirect:'follow',headers:{'user-agent':UA,'accept':'text/plain','x-engine':'browser'}},3);
   if(jr.ok){
     const txt=await jr.text(),arr=[];
     for(const m of txt.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g))arr.push(m[1]);
     for(const m of txt.matchAll(/https?:\/\/[^\s<>"'\)\]]+?(?:\.jpe?g|\.png|\.webp)(?:\?[^\s<>"'\)\]]*)?/gi))arr.push(m[0]);
     for(const m of txt.matchAll(/https?:\/\/[^\s<>"'\)\]]+?(?:image|media|iiif|thumbnail|preview)[^\s<>"'\)\]]*/gi))arr.push(m[0]);
     for(const m of txt.matchAll(/https?:\/\/[^\s<>"'\)\]]+?\/internal\/media\/(?:zoomdispatcher|dispatcher)\/\d+\/[^\s<>"'\)\]]*/gi))arr.push(m[0]);
     const cs=[...new Set(arr.map(x=>ent(x)).filter(x=>x&&!badCandidate(x)))].sort((a,b)=>score(b)-score(a));
     const ok=await pickVerifiedImage(cs);if(ok)return ok;
   }
 }catch(e){}
 throw Error(pageErr||'no image')
}
async function serveImage(res,url){
 const r=await fetchRetry(url,{redirect:'follow',headers:{'user-agent':UA,'accept':'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'}});if(!r.ok)throw Error('image '+r.status);const ct=r.headers.get('content-type')||'';if(!ct.startsWith('image/'))throw Error('not image');
 const b=Buffer.from(await r.arrayBuffer());if(b.length>12000000)throw Error('large');
 res.writeHead(200,{'content-type':ct,'cache-control':'public,max-age=86400,s-maxage=604800','access-control-allow-origin':'*','x-image-source':url});res.end(b)
}
function fail(res){const s='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><rect width="100%" height="100%" fill="#e8e0d3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b6256" font-family="sans-serif" font-size="20">원문에서 이미지 확인</text></svg>';res.writeHead(404,{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public,max-age=1800','access-control-allow-origin':'*'});res.end(s)}





module.exports={resolveImage,pickVerifiedImage};
