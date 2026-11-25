// Native GoTrue + SMTP acceptance. No production sender or real inbox.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
const app=process.env.APP_URL,mail=process.env.TEST_MAILPIT_URL,out=process.env.AUTH_EMAIL_OUT,follow=process.env.AUTH_EMAIL_FOLLOW_LINKS!=='0',engine=process.env.ONLY_ENGINE??'chromium';
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||[app,mail,process.env.NEXT_PUBLIC_SUPABASE_URL].some(value=>!['localhost','127.0.0.1'].includes(new URL(value).hostname)))throw Error('Disposable loopback SMTP stack required');
await fs.mkdir(out,{recursive:true});
const copy=JSON.parse(await fs.readFile(new URL('../fixtures/auth-email-copy.json',import.meta.url))),admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),ids=new Set(),result={engine:follow?engine:'smtp-only',cases:[],realMailClient:false};
const checked=r=>{if(r.error)throw Error(r.error.code??'Local Auth operation failed');return r.data;};
const text=html=>html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi,'').replace(/<[^>]*>/g,' ').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replace(/\s+/g,' ').trim();
async function message(email){for(let i=0;i<50;i++){const list=await(await fetch(mail+'/api/v1/messages')).json(),m=list.messages?.find(m=>m.To.some(t=>t.Address===email));if(m)return(await fetch(mail+'/api/v1/message/'+m.ID)).json();await new Promise(r=>setTimeout(r,100));}throw Error('Local SMTP message did not arrive');}
let browser;
try{
 if(follow){const pw=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');assert.ok(['chromium','webkit'].includes(engine));browser=await pw[engine].launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});}
 for(const locale of ['en','ja'])for(const flow of ['confirmation','recovery']){
  const tag=randomUUID().slice(0,8),email='mail1364-'+tag+'@example.com',password='Local-'+randomUUID()+'!',handle='mail1364_'+tag,cookies=[];
  const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>cookies,setAll:rows=>{for(const row of rows){const i=cookies.findIndex(v=>v.name===row.name);if(i<0)cookies.push(row);else cookies[i]=row;}}}});
  if(flow==='confirmation'){const data=checked(await auth.auth.signUp({email,password,options:{data:{pending_handle:handle},emailRedirectTo:app+'/auth/callback'}}));assert.ok(data.user);ids.add(data.user.id);}
  else{const user=checked(await admin.auth.admin.createUser({email,password,email_confirm:true})).user;ids.add(user.id);checked(await admin.from('profiles').insert({id:user.id,handle}));checked(await auth.auth.resetPasswordForEmail(email,{redirectTo:app+'/auth/password-reset'}));}
  const m=await message(email),html=m.HTML??m.Text,visible=text(html),links=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m=>m[1].replaceAll('&amp;','&')),subject=copy.en[flow+'.subject']+' / '+copy.ja[flow+'.subject'].replace(/^My Food AI: /,'');
  const row={locale,flow,subjectMatches:m.Subject===subject,copyMatches:['en','ja'].every(lang=>['heading','reason','action','ignore','signoff'].every(key=>visible.includes(copy[lang][flow+'.'+key]))),actionLinks:links.length,privateValuesAbsent:![email,handle,password].some(v=>html.includes(v)),linkShape:null};
  assert.equal(links.length,1,'exactly one native action link');const link=new URL(links[0]);row.linkShape={host:link.host,path:link.pathname,keys:[...link.searchParams.keys()].sort(),redirectPath:new URL(link.searchParams.get('redirect_to')).pathname};assert.equal(link.origin,process.env.NEXT_PUBLIC_SUPABASE_URL);assert.equal(link.pathname,'/auth/v1/verify');assert.equal(link.searchParams.get('redirect_to'),app+(flow==='confirmation'?'/auth/callback':'/auth/password-reset'));
  if(follow){const context=await browser.newContext({viewport:{width:390,height:844}});try{await context.addCookies([...cookies.map(c=>({name:c.name,value:c.value,url:app})),{name:'lang',value:locale,url:app}]);const page=await context.newPage();await page.goto(link.href,{waitUntil:'load'});await page.waitForURL(url=>url.pathname===(flow==='confirmation'?'/choose-handle':'/new-password'),{timeout:15000});if(flow==='confirmation')await page.locator('input[name=handle]').waitFor();else await page.locator('input[type=password]').first().waitFor();assert.ok((await context.cookies()).some(c=>c.name.includes('auth-token')&&!c.name.includes('code-verifier')));row.finalPath=new URL(page.url()).pathname;row.signedIn=true;await page.screenshot({path:out+'/'+engine+'-'+locale+'-'+flow+'.png'});}finally{await context.close();}}
  row.pass=row.subjectMatches&&row.copyMatches&&row.actionLinks===1&&row.privateValuesAbsent;result.cases.push(row);
 }
 assert.ok(result.cases.every(r=>r.pass),'approved bilingual subject/text must match every delivered email');result.pass=true;
}catch(error){result.pass=false;result.error=error.message;process.exitCode=1;}
finally{
 await browser?.close();for(const id of ids)checked(await admin.auth.admin.deleteUser(id));
 const users=checked(await admin.auth.admin.listUsers()).users;assert.equal(users.filter(u=>ids.has(u.id)).length,0);if(ids.size)assert.equal(checked(await admin.from('profiles').select('id').in('id',[...ids])).length,0);
 assert.ok((await fetch(mail+'/api/v1/messages',{method:'DELETE'})).ok);assert.equal((await(await fetch(mail+'/api/v1/messages')).json()).total,0);
 result.cleanup={createdAccounts:ids.size,auth:0,profiles:0,messages:0};await fs.writeFile(out+'/smtp-'+result.engine+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify({engine:result.engine,pass:result.pass,cases:result.cases.length,cleanup:result.cleanup}));
}
