import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import ts from 'typescript';import{readFileSync}from'node:fs';
const source=readFileSync(new URL('../src/components/CaptureSheet.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('CaptureSheet.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const initializers=new Map();function visit(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer)initializers.set(n.name.text,n.initializer.getText(ast));ts.forEachChild(n,visit);}visit(ast);
test('permission and recovery failures offer their distinct actions',()=>{assert.match(source,/cameraRecoveryFailed\s*\?\s*t\('try_again'\)\s*:\s*t\('allow_camera'\)/);assert.match(source,/setCameraRecoveryFailed\(true\)/);assert.match(source,/NotAllowedError/);});
test('either action opens once per user tap and never opens just for rendering the label',()=>{
 const fn=initializers.get('retryCamera');assert.ok(fn,'shared user action exists');let attempts=0;const context={reopened:{current:true},recovering:{current:false},cameraRecoveryFailed:true,setCameraAttempt:update=>{attempts=update(attempts);}};const retry=vm.runInNewContext('('+fn+')',context);assert.equal(attempts,0);retry();assert.equal(attempts,1);assert.equal(context.recovering.current,true);assert.equal(context.reopened.current,false);context.cameraRecoveryFailed=false;retry();assert.equal(attempts,2);assert.equal(context.recovering.current,false);assert.doesNotMatch(fn,/setTimeout|setInterval|retryCamera\(/);
});
test('the failure overlay hides the placeholder icon behind its action',()=>{assert.match(source,/\) : cameraUnavailable\|\|desktop&&forPost \? null : <Icon name="camera" \/>/);});
