import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {auditRouteNamespaces,checkRouteNamespaces} from '../scripts/check-route-namespaces.mjs';
function fixture(files,run){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mfa-route-scope-'));
 const all={'messages/en.json':JSON.stringify({postMenu:{close:'Close'},serverOnly:{title:'Title'},other:{title:'Other'}}),'src/app/layout.tsx':'export default function Root({children}){return <>{children}</>}',...files};
 try{for(const[file,content]of Object.entries(all)){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);}return run(root);}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('server useTranslations and getTranslations read request namespaces without a client provider',()=>fixture({
 'src/app/page.tsx':`import {useTranslations} from 'next-intl';export default function Page(){const t=useTranslations('serverOnly');return <h1>{t('title')}</h1>}`,
 'src/app/other/page.tsx':`import {getTranslations} from 'next-intl/server';export default async function Page(){const t=await getTranslations('serverOnly');return <h1>{t('title')}</h1>}`,
},root=>assert.equal(checkRouteNamespaces(root).issues.length,0)));
test('a client useTranslations path with no getTranslations requires its provider',()=>fixture({
 'src/app/page.tsx':`'use client';import {useTranslations} from 'next-intl';export default function Page(){const t=useTranslations('postMenu');return <h1>{t('close')}</h1>}`,
},root=>{const result=auditRouteNamespaces(root);assert.equal(result.issues.length,1);assert.equal(result.issues[0].boundary,'client');assert.equal(result.issues[0].namespace,'postMenu');}));
test('a shared named component is server on one path and client through a client import',()=>fixture({
 'src/components/Shared.tsx':`import {useTranslations} from 'next-intl';export function Shared(){const t=useTranslations('postMenu');return <h1>{t('close')}</h1>}`,
 'src/app/page.tsx':`import {Shared} from '@/components/Shared';export default function Page(){return <Shared/>}`,
 'src/app/client/page.tsx':`'use client';import {Shared} from '@/components/Shared';export default function Page(){return <Shared/>}`,
},root=>{const result=auditRouteNamespaces(root);assert.equal(result.issues.length,1);assert.equal(result.issues[0].route,'/client');assert.equal(result.issues[0].consumer,'src/components/Shared.tsx');}));
test('every real route/layout is audited, and deleting the Agents provider names the original Sheet path',()=>{
 const result=checkRouteNamespaces();assert.ok(result.entries.length>=25);
 const file='src/app/profile/agents/layout.tsx',source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),bad=source.replace(/<StrictIntlProvider\b[^>]+>/,'').replace('</StrictIntlProvider>','');
 const red=auditRouteNamespaces(undefined,{overrides:{[file]:bad}});
 for(const route of ['/profile/agents','/profile/agents/new'])assert.ok(red.issues.some(row=>row.route===route&&row.namespace==='postMenu'&&row.consumer==='src/components/ui/Sheet.tsx'),route);
});
test('a nested provider replaces namespaces rather than silently inheriting an outer one',()=>{
 const file='src/app/(tabs)/profile/page.tsx',source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const red=auditRouteNamespaces(undefined,{overrides:{[file]:source.replace(',postMenu:(await getMessages()).postMenu','')}});
 assert.ok(red.issues.some(row=>row.route==='/profile'&&row.namespace==='postMenu'&&row.chain.some(part=>part.includes('FreezeReport'))));
});
test('route-code readers require the full api namespace, including imported hooks',()=>{
 assert.equal(checkRouteNamespaces().issues.length,0);
 const file='src/i18n/capture-scope.ts',source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const red=auditRouteNamespaces(undefined,{overrides:{[file]:source.replace("'api',",'')}});
 assert.ok(red.issues.some(row=>row.namespace==='api'&&row.consumer==='src/i18n/failure-messages.ts'));
});
test('table readers require nutrients without putting table labels in the root provider',()=>{
 const root=fs.readFileSync(new URL('../src/app/layout.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(root,/nutrients\s*:/);
 const file='src/i18n/capture-scope.ts',source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const red=auditRouteNamespaces(undefined,{overrides:{[file]:source.replace("'nutrients',",'')}});
 assert.ok(red.issues.some(row=>row.namespace==='nutrients'&&row.consumer==='src/components/NutritionTable.tsx'));
});
