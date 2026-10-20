
const http=require('http');
const {URL}=require('url');
const PORT=process.env.PORT||10000;
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/155 Safari/537.36 JoseonPaintingGallery/1.0';
const CACHE=new Map(), MAX_CACHE=4000;
const ALLOWED=['britishmuseum.org','brooklynmuseum.org','metmuseum.org','clevelandart.org','lacma.org','asianart.org','mfah.org','dia.org','nich.go.jp','heritage.go.kr','kansong.org','mfa.org','busan.go.kr','leeumhoam.org','si.edu','philamuseum.org','ewha.ac.kr','pem.org','harvardartmuseums.org','princeton.edu','guimet.fr','smb.museum','gogung.go.kr','nfm.go.kr','museum.go.kr','horimmuseum.org','worcesterart.org','slam.org','thewalters.org','spencerart.ku.edu','nelson-atkins.org','portlandartmuseum.org','honolulumuseum.org','usc.edu','gangseo.seoul.kr','aks.ac.kr','gugak.go.kr','commons.wikimedia.org','media.britishmuseum.org','collectionapi.metmuseum.org','piction.clevelandart.org','collections-images.lacma.org'];
function allowed(h){h=(h||'').toLowerCase();return ALLOWED.some(d=>h===d||h.endsWith('.'+d))}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchRetry(url,opts={},tries=4){let r;for(let i=0;i<tries;i++){r=await fetch(url,opts);if(![429,502,503,504].includes(r.status))return r;if(i<tries-1)await sleep(600*Math.pow(2,i))}return r}

function ent(s){return (s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function abs(base,v){if(!v)return'';v=ent(v.trim()).replace(/\\u002F/gi,'/').replace(/\\\//g,'/');if(v.startsWith('//'))v='https:'+v;try{return new URL(v,base).href}catch{return''}}
function attr(tag,n){const m=tag.match(new RegExp('\\b'+n+'\\s*=\\s*["\\\']([^"\\\']+)["\\\']','i'));return m?m[1]:''}
function candidates(html,base){
 const a=[];
 for(const t of html.match(/<meta\b[^>]*>/gi)||[]){const k=(attr(t,'property')||attr(t,'name')||'').toLowerCase(),v=attr(t,'content');if(k==='og:image'||k==='og:image:url'||k==='og:image:secure_url'||k==='twitter:image'||k==='twitter:image:src')a.push(abs(base,v))}
 for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))for(const x of m[1].matchAll(/"(?:image|contentUrl|thumbnailUrl)"\s*:\s*"([^"]+)"/g))a.push(abs(base,x[1]));
 for(const t of html.match(/<img\b[^>]*>/gi)||[]){for(const n of ['src','data-src','data-original','data-lazy-src','data-image','data-url'])a.push(abs(base,attr(t,n)));const ss=attr(t,'srcset')||attr(t,'data-srcset');if(ss)for(const p of ss.split(','))a.push(abs(base,p.trim().split(/\s+/)[0]))}
 for(const m of html.matchAll(/https?:\\?\/\\?\/[^"'<>\s]+?\.(?:jpe?g|png|webp)(?:\?[^"'<>\s]*)?/gi))a.push(abs(base,m[0]));
 for(const m of html.matchAll(/["'](\/[^"']+?\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi))a.push(abs(base,m[1]));
 return [...new Set(a.filter(Boolean))]
}
function score(u){
 const s=u.toLowerCase();let n=0;
 if(/\.svg(?:\?|$)|logo|favicon|apple-touch|iconified|\/icon|sprite|avatar|facebook|twitter|instagram|youtube|qr|banner|pixel|placeholder/.test(s))n-=220;
 if(/media\.britishmuseum\.org/.test(s))n+=260;
 if(/ids\.si\.edu|smithsonian/.test(s)&&/\.jpe?g|\.png|\.webp|idurl=/.test(s))n+=180;
 if(/mfa\.org|mfah|cloudfront|amazonaws/.test(s)&&/\.jpe?g|\.png|\.webp/.test(s))n+=130;
 if(/colbase\.nich\.go\.jp/.test(s)&&/\.jpe?g|\.png|\.webp/.test(s))n+=120;
 if(/asianart|lacma|dia\.org|brooklynmuseum/.test(s)&&/\.jpe?g|\.png|\.webp/.test(s))n+=110;
 if(/collectionapi\.metmuseum\.org/.test(s))n+=160;
 if(/piction\.clevelandart\.org|openaccess/.test(s))n+=140;
 if(/collections-images\.lacma\.org/.test(s))n+=140;
 if(/\/internal\/media\/dispatcher\//.test(s))n+=130;
 if(/\/upload\/museum\//.test(s))n+=130;
 if(/relic_image|collection|object|artwork|museum|image|images|media|iiif|thumb|thumbnail|preview|primary/.test(s))n+=35;
 if(/thumbnail|preview|-t\.|_t\.|small|medium|mid_/.test(s))n+=12;
 return n
}
function bm(raw){try{const u=new URL(raw);if(!u.hostname.includes('britishmuseum.org')||u.pathname.startsWith('/collection/object/'))return raw;const k=u.searchParams.get('keyword')||'',m=k.match(/^OA\+,0\.482\.(\d+)$/i);if(m)return 'https://www.britishmuseum.org/collection/object/A_OA-0-482-'+m[1]}catch{}return raw}
async function resolveImage(target){
 target=bm(target);const u=new URL(target),host=u.hostname.toLowerCase();if(!allowed(host))throw Error('host');
 let m=u.pathname.match(/\/art\/collection\/search\/(\d+)/);
 if(host.endsWith('metmuseum.org')&&m){const r=await fetchRetry('https://collectionapi.metmuseum.org/public/collection/v1/objects/'+m[1],{headers:{'user-agent':UA}});if(r.ok){const j=await r.json();if(j.primaryImageSmall||j.primaryImage)return j.primaryImageSmall||j.primaryImage}}
 m=u.pathname.match(/\/art\/([^/?#]+)/);
 if(host.endsWith('clevelandart.org')&&m){const r=await fetchRetry('https://openaccess-api.clevelandart.org/api/artworks/'+encodeURIComponent(m[1]),{headers:{'user-agent':UA}});if(r.ok){const j=await r.json(),im=(j.data&&j.data.images)||j.images,x=im&&(im.web&&im.web.url||im.print&&im.print.url||im.full&&im.full.url);if(x)return x}}
 let pageErr='';
 try{
   const r=await fetchRetry(target,{redirect:'follow',headers:{'user-agent':UA,'accept':'text/html,application/xhtml+xml,*/*;q=0.8','accept-language':'en-US,en;q=0.8,ko;q=0.7'}});
   if(r.ok){
     const html=await r.text(),cs=candidates(html,r.url).sort((a,b)=>score(b)-score(a));
     if(cs.length&&score(cs[0])>-80)return cs[0];
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
     const cs=[...new Set(arr.map(x=>ent(x)).filter(Boolean))].sort((a,b)=>score(b)-score(a));
     if(cs.length&&score(cs[0])>-80)return cs[0];
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

const SELFTEST=[
 ['met','https://www.metmuseum.org/art/collection/search/50897'],
 ['cleveland','https://www.clevelandart.org/art/1997.147'],
 ['british','https://www.britishmuseum.org/collection/object/A_OA-0-482-1'],
 ['brooklyn','https://www.brooklynmuseum.org/opencollection/objects/114653'],
 ['lacma','https://collections.lacma.org/object/84448'],
 ['asianart','https://searchcollection.asianart.org/objects/14284/tiger-and-magpies'],
 ['smithsonian','https://asia.si.edu/object/F1976.18/'],
 ['mfa','https://collections.mfa.org/objects/25411/falcon-on-a-perch'],
 ['mfah','https://emuseum.mfah.org/objects/139672/visit'],
 ['dia','https://dia.org/collection/grapevine/36725'],
 ['colbase','https://colbase.nich.go.jp/collection_items/tnm/TA-112?locale=ja'],
 ['heritage','https://heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1111102160000&pageNo=1_1_1_1'],
 ['kansong','https://kansong.org/front/clctn/listViewCollectionFront.do?pageIndex=5'],
 ['leeum','https://www.leeumhoam.org/leeum/collection/traditional/721'],
 ['busan','https://museum.busan.go.kr/busan/collectinfo01/view?bbsNo=1&curPage=2&dataNo=22&srchDiv=5'],
 ['ewha','https://museum.ewha.ac.kr/museum/collection/designatedCulturalProperty.do?article.offset=0&articleLimit=8&articleNo=9516&mode=view']
];
setTimeout(async()=>{for(const [name,url] of SELFTEST){try{const img=await resolveImage(url);console.log('SELFTEST',name,'OK',img)}catch(e){console.log('SELFTEST',name,'FAIL',e.message)}await sleep(250)}},2500);
http.createServer(async(req,res)=>{try{const q=new URL(req.url,'http://x');if(q.pathname==='/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,cache:CACHE.size}))}if(q.pathname!=='/thumb')return fail(res);const t=q.searchParams.get('url');if(!t)return fail(res);let img=CACHE.get(t);if(!img){img=await resolveImage(t);if(CACHE.size>=MAX_CACHE)CACHE.delete(CACHE.keys().next().value);CACHE.set(t,img)}await serveImage(res,img)}catch(e){console.error(req.url,e.message);fail(res)}}).listen(PORT,()=>console.log('thumb proxy',PORT));
