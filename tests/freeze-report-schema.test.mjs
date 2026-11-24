import test from 'node:test';
import assert from 'node:assert/strict';
import {validEvent,validReport,screenForPath,cameraFailure,VALUES} from '../src/lib/diagnostics/schema.ts';
const event={t:1730000000000,name:'screen',value:'post'};
const report={events:[event],user_agent:'Local browser',build:'test',camera_permission:'unknown'};
test('exact report schema rejects every extra, unbounded or arbitrary field',()=>{
 assert.equal(validReport(report),true);
 for(const bad of [{...report,caption:'porridge-canary-6142'},{...report,user_id:'private'},{...report,events:Array(21).fill(event)},{...report,user_agent:'x'.repeat(301)},{...report,build:'x'.repeat(81)},{...report,camera_permission:'maybe'},{...report,events:[{...event,url:'/posts/private'}]},{...report,events:[{...event,value:'porridge-canary-6142'}]},{...report,events:[{...event,t:NaN}]},{...report,events:[{...event,t:9_000_000_000_000_000}]},null,[]])assert.equal(validReport(bad),false,JSON.stringify(bad));
 for(const [name,values] of Object.entries(VALUES))for(const value of values.length?values:[undefined])assert.equal(validEvent({t:0,name,...value===undefined?{}:{value}}),true);
 for(const name of ['toString','constructor','error',{toString:null,valueOf:null}])assert.equal(validEvent({t:0,name,value:'other'}),false);
 assert.equal(validEvent({t:0,name:'page-load',value:undefined}),false);
});
test('route patterns disclose only fixed screens and never identities',()=>{
 const paths={'/':'feed','/posts/00000000-1111-2222-3333-444444444444':'post','/days':'days','/days/2026-11-24':'days','/search':'search','/profile':'profile','/profile/about':'about','/profile/deleted':'deleted','/profile/agents/new':'agents','/admin/posts/secret':'admin','/welcome':'welcome','/sign-in':'sign-in','/sign-up':'sign-up','/choose-handle':'handle','/reset-password':'reset','/unknown/canary-handle':'other'};
 for(const [path,screen] of Object.entries(paths))assert.equal(screenForPath(path),screen,path);
 const payload={...report,events:Object.keys(paths).map(path=>({t:0,name:'screen',value:screenForPath(path)}))};
 assert.equal(validReport(payload),true);assert.doesNotMatch(JSON.stringify(payload),/porridge-canary-6142|canary-handle|00000000|\/p\/|blob:|data:/);
});
test('camera errors are a fixed name only, never the exception message',()=>{
 assert.equal(cameraFailure({name:'NotAllowedError',message:'secret'}),'failed:NotAllowedError');
 assert.equal(cameraFailure({name:'canary-handle',message:'secret'}),'failed:other');
 assert.equal(cameraFailure(null),'failed:other');
});
