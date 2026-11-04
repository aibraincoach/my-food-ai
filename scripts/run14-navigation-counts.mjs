// node --env-file=.env.local scripts/run14-navigation-counts.mjs [--label=before] [--endpoint=http://127.0.0.1:9245]
// One observed page open per row; request URLs and account/session values never enter the receipt.
import {writeFile,mkdir} from 'node:fs/promises';
import {signInAsTestUser} from './lib/session.mjs';
import {attachCDP,pause} from './lib/cdp.mjs';
const option=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const label=option('label','before'),base=process.env.APP_URL,c=await attachCDP(option('endpoint','http://127.0.0.1:9245'));
const cookie=await signInAsTestUser(2),origin=new URL(base),rows=[];
try{
 await c.send('Page.enable');await c.send('Network.enable');await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await c.send('Emulation.setCPUThrottlingRate',{rate:4});
 const jar=cookie.split('; ').map(pair=>{const p=pair.indexOf('=');return{name:pair.slice(0,p),value:pair.slice(p+1),domain:origin.hostname,path:'/',secure:origin.protocol==='https:',httpOnly:false,sameSite:'Lax'}});
 await c.send('Network.setCookies',{cookies:jar});
 for(const [path,zonePresent] of [['/',true],['/',false],['/days',true],['/profile',true]]){
  await c.send('Network.clearBrowserCache');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
  await c.send('Page.navigate',{url:'about:blank'});await pause(100);
  if(zonePresent)await c.send('Network.setCookie',{name:'time-zone',value:'Asia%2FJakarta',url:base,path:'/'});else await c.send('Network.deleteCookies',{name:'time-zone',url:base});
  c.events.length=0;const started=performance.now();await c.send('Page.navigate',{url:new URL(path,base).href});
  // Settle after the page's streaming response; 20 s window includes hydration, revalidation and first images.
  await pause(20000);
  const requests=c.events.filter(e=>e.method==='Network.requestWillBeSent').map(e=>({id:e.params.requestId,url:e.params.request.url,method:e.params.request.method,type:e.params.type}));
  const responseMap=new Map(c.events.filter(e=>e.method==='Network.responseReceived').map(e=>[e.params.requestId,e.params.response]));const finishes=new Map(c.events.filter(e=>e.method==='Network.loadingFinished').map(e=>[e.params.requestId,e.params.encodedDataLength]));
  const feedPhotos=requests.filter(x=>new URL(x.url).pathname.startsWith('/api/media/feed/'));const first=feedPhotos[0];
  const row={path,zonePresent,observationMs:Math.round(performance.now()-started),authUser:requests.filter(x=>new URL(x.url).pathname==='/auth/v1/user').length,apiFeed:requests.filter(x=>new URL(x.url).pathname==='/api/feed').length,apiDays:requests.filter(x=>new URL(x.url).pathname==='/api/days').length,serverActionPOSTs:requests.filter(x=>x.method==='POST'&&new URL(x.url).origin===origin.origin&&!new URL(x.url).pathname.startsWith('/api/')).length,feedPhotoRequests:feedPhotos.length,firstPhoto:first?{http:responseMap.get(first.id)?.status,encodedBytes:finishes.get(first.id)??null}:null,page:await c.evaluate('({path:location.pathname,title:document.title,feed:!!document.querySelector("[data-home-feed]"),error:!!document.querySelector("[role=alert]")})')};
  rows.push(row);console.log(JSON.stringify(row));await mkdir('uploads/run14',{recursive:true});await writeFile(`uploads/run14/navigation-${label}.json`,JSON.stringify({observedAt:new Date().toISOString(),account:'designated test account 2',cpuRate:4,network:'unthrottled',rows},null,2)+'\n');
 }
}finally{c.close();}
