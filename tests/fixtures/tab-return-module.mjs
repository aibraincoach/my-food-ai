// Execute the production subscription against each component harness's own DOM.
import vm from 'node:vm';import ts from 'typescript';import{readFileSync}from'node:fs';
const code=ts.transpileModule(readFileSync(new URL('../../src/lib/client/tab-return.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const modules=new WeakMap();
export function tabReturnModule(window,document){let value=modules.get(window);if(!value){value={};vm.runInNewContext(code,{exports:value,window,document,performance});modules.set(window,value);}return value;}
export function returnToTab(document){document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));}
