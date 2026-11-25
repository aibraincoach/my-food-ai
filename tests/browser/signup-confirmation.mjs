// Real GoTrue + local SMTP confirmation. Run only on a dedicated confirmation-on stack.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const app=process.env.APP_URL,mail=process.env.TEST_MAILPIT_URL,out=process.env.SIGNUP_CHECK_OUT;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!mail||!out||[app,mail,process.env.NEXT_PUBLIC_SUPABASE_URL].some(u=>!['localhost','127.0.0.1'].includes(new URL(u).hostname)))throw Error('Dedicated loopback confirmation stack required');
await fs.mkdir(out,{recursive:true});
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),ids=new Set(),emails=new Set(),tag=randomUUID().slice(0,8);
const checked=r=>{if(r.error)throw Error(r.error.message);return r.data;};
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const result={cases:[],pageerrors:[],steps:[]};
async function users(){return checked(await db.auth.admin.listUsers()).users;}
async function account(email){const user=(await users()).find(u=>u.email===email);assert.ok(user,'signup must create native Auth user');ids.add(user.id);return user;}
async function profile(id){return checked(await db.from('profiles').select('id,handle').eq('id',id).maybeSingle());}
async function confirmation(email){for(let i=0;i<30;i++){const list=await(await fetch(mail+'/api/v1/messages')).json(),message=list.messages?.find(m=>m.To.some(t=>t.Address===email));if(message){const detail=await(await fetch(mail+'/api/v1/message/'+message.ID)).json();const html=detail.HTML??detail.Text;const link=html.match(/https?:[^"<>\s]+\/verify\?[^"<>\s]+/)?.[0]?.replaceAll('&amp;','&');assert.ok(link,'native mail must contain verification URL');assert.equal(new URL(link).searchParams.get('redirect_to'),app+'/auth/callback');return link;}await new Promise(r=>setTimeout(r,100));}throw Error('No local confirmation email');}
async function context(browser,locale){const c=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844}});await c.addCookies([{name:'lang',value:locale,url:app}]);return c;}
async function signup(p,t,email,handle,password){emails.add(email);await p.goto(app+'/sign-up',{waitUntil:'load'});await p.locator('input[name=email]').fill(email);await p.locator('input[name=handle]').fill(handle);await p.locator('input[name=password]').fill(password);await p.getByRole('button',{name:t.createAccount,exact:true}).tap();await p.getByText(t.confirmOrSignIn,{exact:true}).waitFor();}
async function signin(p,t,email,password){await p.goto(app+'/sign-in',{waitUntil:'load'});await p.locator('input[name=email]').fill(email);await p.locator('input[name=password]').fill(password);await p.locator('button[type=submit]').tap();await p.waitForURL(u=>u.pathname==='/'||u.pathname==='/choose-handle');await p.goto(app+'/choose-handle',{waitUntil:'load'});}
let browser;
try{
 for(const[name,engine]of[['chromium',chromium],['webkit',webkit]].filter(([n])=>!process.env.ONLY_ENGINE||n===process.env.ONLY_ENGINE)){
 browser=await engine.launch(name==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});
 for(const locale of['en','ja']){
  const t=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url))).auth;
  for(const taken of[false,true]){
   const c=await context(browser,locale),p=await c.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>result.pageerrors.push({engine:name,locale,message:e.message}));
   const suffix=name+'_'+locale+'_'+Number(taken)+'_'+tag,email='signup_'+suffix+'@example.com',password='Local-'+randomUUID()+'!',handle='h_'+suffix;
   if(taken){const owner=checked(await db.auth.admin.createUser({email:'owner_'+suffix+'@example.com',password,email_confirm:true})).user;ids.add(owner.id);checked(await db.from('profiles').insert({id:owner.id,handle}));}
   try{
    result.steps.push({engine:name,locale,taken,phase:'signup'});await signup(p,t,email,handle,password);const user=await account(email);assert.equal(user.user_metadata.pending_handle,handle);assert.ok(!user.email_confirmed_at);assert.equal(await profile(user.id),null);
    result.steps.push({phase:'confirm'});await p.goto(await confirmation(email),{waitUntil:'load'});await p.waitForURL(u=>u.pathname==='/choose-handle');assert.equal(await p.locator('input[name=handle]').inputValue(),handle);assert.equal(await profile(user.id),null);
    await p.screenshot({path:out+'/'+suffix+'-prefill.png'});
    if(!taken){
     // A fresh context has none of the signup PKCE cookies. Password sign-in
     // after confirmation must still recover this account's metadata.
     const other=await context(browser,locale),q=await other.newPage();try{result.steps.push({phase:'fresh-context-signin'});await signin(q,t,email,password);await q.goto(app+'/choose-handle?handle=another_accounts_handle',{waitUntil:'load'});assert.equal(await q.locator('input[name=handle]').inputValue(),handle);}finally{await other.close();}
     if(locale==='ja')await p.locator('input[name=handle]').fill(handle+'_edited');
    }
    result.steps.push({phase:'continue'});await p.getByRole('button',{name:t.continue,exact:true}).tap();
    if(taken){await p.getByText(t.takenHandle,{exact:true}).waitFor();assert.equal(await p.locator('input[name=handle]').inputValue(),handle);assert.equal(await profile(user.id),null);await p.screenshot({path:out+'/'+suffix+'-taken.png'});await p.locator('input[name=handle]').fill(handle+'_free');await p.getByRole('button',{name:t.continue,exact:true}).tap();}
    await p.waitForURL(u=>u.pathname==='/');assert.equal((await profile(user.id)).handle,handle+(taken?'_free':locale==='ja'?'_edited':''));
    result.cases.push({engine:name,locale,taken,confirmedViaLocalMail:true,prefill:true,profileOnlyAfterContinue:true,crossDevice:!taken,edited:!taken&&locale==='ja',pass:true});
   }catch(e){await fs.writeFile(out+'/'+suffix+'-failure.html',await p.content());throw e;}finally{await c.close();}
  }
 }
 const denied=await context(browser,'en'),anonymous=await denied.newPage();try{await anonymous.goto(app+'/choose-handle',{waitUntil:'load'});assert.equal(new URL(anonymous.url()).pathname,'/welcome');await anonymous.goto(app+'/auth/callback?code=invalid-or-expired',{waitUntil:'load'});assert.equal(new URL(anonymous.url()).pathname,'/sign-in');assert.ok(new URL(anonymous.url()).searchParams.has('error'));result.cases.push({engine:name,signedOutChooseRejected:true,invalidOrExpiredCodeRejected:true,pass:true});}finally{await denied.close();}
 await browser.close();browser=null;
 }
 assert.deepEqual(result.pageerrors,[]);result.pass=true;
}catch(e){result.pass=false;result.failure=String(e);process.exitCode=1;}
finally{
 if(browser)await browser.close();
 for(const user of await users())if(emails.has(user.email))ids.add(user.id);
 for(const id of ids)checked(await db.auth.admin.deleteUser(id));
 assert.equal((await users()).filter(u=>ids.has(u.id)||emails.has(u.email)).length,0);
 if(ids.size)assert.equal(checked(await db.from('profiles').select('id').in('id',[...ids])).length,0);
 const deleted=await fetch(mail+'/api/v1/messages',{method:'DELETE'});assert.ok(deleted.ok);assert.equal((await(await fetch(mail+'/api/v1/messages')).json()).total,0);
 result.cleanup={auth:0,profiles:0,messages:0};await fs.writeFile(out+'/signup-confirmation-'+(process.env.ONLY_ENGINE??'both')+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
