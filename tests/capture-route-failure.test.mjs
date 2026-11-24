import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import ts from'typescript';import{execFileSync}from'node:child_process';
import{CAPTURE_ROUTE_FAILURES,captureRouteMessageCode}from'../src/lib/posts/capture-route-failure.ts';import{failureFromResponse}from'../src/lib/posts/capture-failure.ts';import{captureEnglish}from'./fixtures/capture-wording.mjs';
test('all26 known route/helper errors retain their exact English through the persisted code boundary',()=>{
 assert.equal(Object.keys(CAPTURE_ROUTE_FAILURES).length,26);
 for(const[line,code]of Object.entries(CAPTURE_ROUTE_FAILURES)){
  assert.equal(captureRouteMessageCode(line),code);const f=failureFromResponse({error:line,message_code:code});
  assert.equal(f.code,code);assert.equal(captureEnglish(f.code),line);assert.equal(JSON.stringify(f).includes(line),false);
 }
});
test('unknown runtime detail and prototype-like strings receive a neutral message',()=>{
 for(const value of['New database detail','toString','__proto__',null]){
  assert.equal(captureRouteMessageCode(value),'unknownFailure');
  assert.equal(captureEnglish(failureFromResponse({message_code:captureRouteMessageCode(value)}).code),'Something went wrong. Try again.');
 }
 assert.equal(captureEnglish('saved-before-update'),'Something went wrong. Try again.');
});
test('mutation error responses have display codes while existing English error expressions are unchanged',()=>{
 const files=execFileSync('git',['diff','1efa5c5e78be14b2a3c85364a675bce4d355d838','--name-only'],{encoding:'utf8'}).trim().split('\n').filter(p=>p.startsWith('src/app/api/')&&p.endsWith('/route.ts'));
 const errors=(source,requireCode)=>{
  const ast=ts.createSourceFile('route.ts',source,ts.ScriptTarget.Latest,true),values=[];
  function visit(n){
   if(ts.isCallExpression(n)&&n.expression.getText(ast)==='NextResponse.json'&&ts.isObjectLiteralExpression(n.arguments[0])){
    const props=n.arguments[0].properties,err=props.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='error');
    let read=false;for(let p=n;p;p=p.parent)if(ts.isFunctionDeclaration(p)&&p.name?.text==='GET')read=true;
    if(err){values.push(err.initializer.getText(ast));if(requireCode&&!read)assert.ok(props.some(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='message_code'),'missing code: '+err.getText(ast));}
   }ts.forEachChild(n,visit);
  }visit(ast);return values;
 };
 for(const path of files)assert.deepEqual(errors(fs.readFileSync(path,'utf8'),true),errors(execFileSync('git',['show','1efa5c5e78be14b2a3c85364a675bce4d355d838:'+path],{encoding:'utf8'}),false),path);
});
