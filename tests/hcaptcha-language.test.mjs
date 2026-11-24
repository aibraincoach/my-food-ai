import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createTranslator} from 'next-intl';
function disclaimer(locale){
 const messages=JSON.parse(readFileSync(new URL('../messages/'+locale+'.json',import.meta.url),'utf8'));
 const jsx=(type,props)=>({type,props}),exports={};
 const modules={'next-intl':{useLocale:()=>locale,useTranslations:namespace=>createTranslator({locale,namespace,messages})},'react/jsx-runtime':{jsx,jsxs:jsx},react:{useCallback:fn=>fn,useState:()=>[false,()=>{}]},'next/script':{default:'script'},'@/app/(auth)/_components/AuthPieces':{AuthErrorBanner:'banner'}};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/components/HCaptcha.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,process:{env:{NEXT_PUBLIC_HCAPTCHA_SITE_KEY:'local-fixture'}},require:key=>{assert.ok(key in modules,key);return modules[key];}});
 const p=exports.default().props.children.find(x=>x?.type==='p');
 const text=n=>Array.isArray(n)?n.map(text).join(''):typeof n==='object'&&n?text(n.props.children):n??'';
 return{text:text(p),links:Array.from(p.props.children.filter(x=>x?.type==='a'),x=>x.props.href)};
}
test('Japanese captcha attributes both policies to hCaptcha with natural fragment joins',()=>{
 assert.deepEqual(disclaimer('ja'),{text:'このサイトは hCaptcha で保護されており、hCaptcha のプライバシーポリシーと利用規約が適用されます。',links:['https://www.hcaptcha.com/privacy','https://www.hcaptcha.com/terms']});
});
test('English captcha text and policy destinations remain unchanged',()=>{
 assert.deepEqual(disclaimer('en'),{text:'This site is protected by hCaptcha and its Privacy Policy and Terms of Service apply.',links:['https://www.hcaptcha.com/privacy','https://www.hcaptcha.com/terms']});
});
