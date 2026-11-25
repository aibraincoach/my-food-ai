// Component accessibility/390px proof, not a signed-in app journey or real phone.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.MFA_PLAYWRIGHT_MODULE);
const engine=process.env.ONLY_ENGINE,origin=process.env.SOURCE_PROOF_URL,out=process.env.SOURCE_PROOF_OUT;
assert.ok(['chromium','webkit'].includes(engine));assert.equal(new URL(origin).hostname,'127.0.0.1');
const browser=await({chromium,webkit})[engine].launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{executablePath:process.env.TEST_WEBKIT_EXECUTABLE});
const result={engine,cases:[],pageErrors:[],limit:'NutritionTable component SSR with built CSS; emulated viewport; no authenticated app journey or real phone proof'};
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 page.on('pageerror',e=>result.pageErrors.push(e.message));
 for(const locale of ['en','ja'])for(const name of ['usda','mixed','personal','water','old','mext','bareLabel','photoWater']){
  await page.goto(origin+'/'+locale+'/'+name,{waitUntil:'load'});
  const table=page.getByRole('table');assert.equal(await table.count(),1);
  const source=page.locator('[data-meal-sources]'),text=await source.innerText();assert.ok(text.trim());
  const snapshot=await page.locator('section').ariaSnapshot();assert.ok(snapshot.includes('table'));assert.ok(snapshot.includes(locale==='ja'?'栄養成分':'Nutrition values'));
  const overflow=await source.evaluate(e=>e.scrollWidth>e.clientWidth);assert.equal(overflow,false,locale+'/'+name+' source text clips');
  assert.equal(await page.locator('a[href="https://world.openfoodfacts.org"]').count(),name==='mixed'?1:0);
  if(name==='usda'){assert.equal((text.match(/USDA/g)??[]).length,1);assert.ok(!text.includes('Open Food Facts'));}
  if(name==='mixed'){assert.ok(text.includes('USDA'));assert.ok(text.includes('Open Food Facts'));assert.ok(text.includes(locale==='ja'?'モデルの推定値':'model estimates'));}
  if(name==='old'){assert.ok(text.includes(locale==='ja'?'出典が記録されていません':'Source not recorded for some nutrients'));assert.ok(!text.includes('USDA'));}
  await page.screenshot({path:out+'/'+engine+'-'+locale+'-'+name+'.png',fullPage:true});
  result.cases.push({locale,name,text,snapshot,overflow});
 }
 await context.close();assert.deepEqual(result.pageErrors,[]);result.pass=true;
}finally{await browser.close();await fs.writeFile(out+'/'+engine+'-sources.json',JSON.stringify(result,null,2));}
