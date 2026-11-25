import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import ts from'typescript';
import{failureFromResponse}from'../src/lib/posts/capture-failure.ts';import{captureEnglish}from'./fixtures/capture-wording.mjs';
const CAPTURE_ROUTE_FAILURES=JSON.parse(fs.readFileSync(new URL('./fixtures/capture-route-codes.json',import.meta.url)));
test('all26 known route/helper errors retain their exact English through the persisted code boundary',()=>{
 assert.equal(Object.keys(CAPTURE_ROUTE_FAILURES).length,26);
 for(const[line,code]of Object.entries(CAPTURE_ROUTE_FAILURES)){
  const f=failureFromResponse({message_code:code});assert.equal(f.code,code);assert.equal(captureEnglish(f.code),line);assert.equal(JSON.stringify(f).includes(line),false);
 }
});
test('unknown and missing response codes use the neutral registered message',()=>{
 for(const value of['New database detail','toString','__proto__',null])assert.deepEqual(failureFromResponse({message_code:value}),{code:'unknownFailure'});
 assert.equal(captureEnglish(failureFromResponse(null).code),'Something went wrong. Try again.');
});
const root=new URL('../',import.meta.url),sourceFiles=[];
function files(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=new URL(e.name+(e.isDirectory()?'/':''),dir);if(e.isDirectory())files(p);else if(e.name==='route.ts'&&!/\/api\/(agent|jobs|health)(\/|\.)/.test(p.pathname))sourceFiles.push(p);}}
files(new URL('src/app/api/',root));
test('all app route response literals omit error fields; codes exist in both dictionaries',()=>{
 const dictionaries=['en','ja'].map(locale=>JSON.parse(fs.readFileSync(new URL('messages/'+locale+'.json',root))));let coded=0;
 for(const file of sourceFiles){const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file.pathname,source,ts.ScriptTarget.Latest,true);
  function payload(n){if(ts.isConditionalExpression(n)){payload(n.whenTrue);payload(n.whenFalse);return;}if(!ts.isObjectLiteralExpression(n))return;
   for(const p of n.properties){if(!ts.isPropertyAssignment(p))continue;const name=p.name.getText(ast).replaceAll(/['"]/g,'');assert.notEqual(name,'error',file.pathname+': raw error response');if(name==='message_code'){coded++;if(ts.isStringLiteralLike(p.initializer))for(const dictionary of dictionaries)assert.ok(Object.hasOwn(dictionary.api,p.initializer.text)||Object.hasOwn(dictionary.capture,p.initializer.text),file.pathname+': '+p.initializer.text);}}
  }
  function visit(n){if(ts.isCallExpression(n)&&/^(NextResponse|Response)\.json$/.test(n.expression.getText(ast))&&n.arguments[0])payload(n.arguments[0]);ts.forEachChild(n,visit);}visit(ast);
 }
 assert.ok(coded>=270,'route inventory must remain populated, got '+coded);
});
test('no production sentence-to-code classifier survives',()=>{
 assert.equal(fs.existsSync(new URL('src/lib/posts/capture-route-failure.ts',root)),false);
 for(const file of sourceFiles)assert.equal(fs.readFileSync(file,'utf8').includes('captureRouteMessageCode'),false);
});

test('every literal error response from main renders byte-identical English at the same HTTP site',()=>{
const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/app-route-english.json',import.meta.url))),en=JSON.parse(fs.readFileSync(new URL('../messages/en.json',import.meta.url)));let direct=0,unknown=[];
for(const file of new Set(golden.rows.map(r=>r.file))){const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true),calls=[];
 function v(n){if((ts.isCallExpression(n)&&/^(NextResponse|Response)\.json$/.test(n.expression.getText(ast)))||(ts.isNewExpression(n)&&n.expression.getText(ast)==='Response'))calls.push(n);ts.forEachChild(n,v);}v(ast);
 function vals(n){if(!n)return[];if(ts.isStringLiteralLike(n))return[en.api[n.text]??en.capture[n.text]??n.text];if(ts.isConditionalExpression(n))return[...vals(n.whenTrue),...vals(n.whenFalse)];if(ts.isObjectLiteralExpression(n))return n.properties.flatMap(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='message_code'?vals(p.initializer):[]);return[];}
 for(const r of golden.rows.filter(r=>r.file===file)){const n=calls[r.site],lines=vals(n?.arguments?.[0]);const diagnosticFallback=(file==='src/app/api/posts/[id]/media/route.ts'&&r.site===7);
 if(diagnosticFallback){assert.deepEqual(lines,['Something went wrong. Try again.',...r.english],file+': unknown SDK exceptions retain the former classifier neutral output');direct++;}
 else if(JSON.stringify(lines)===JSON.stringify(r.english))direct++;else unknown.push({...r,now:lines,expr:n?.arguments?.[0]?.getText(ast)});}
}assert.equal(golden.rows.length,258);assert.deepEqual(unknown,[]);assert.equal(direct,258);
});
