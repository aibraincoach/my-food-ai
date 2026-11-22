import test from 'node:test';import assert from 'node:assert/strict';
import{spawnSync}from'node:child_process';import{mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,symlinkSync,lstatSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';import{fileURLToPath}from'node:url';
const runner=fileURLToPath(new URL('./agy-review.mjs',import.meta.url));
function fixture(){const root=mkdtempSync(join(tmpdir(),'review-output-safety-')),repo=join(root,'checkout');mkdirSync(repo);const git=args=>{const r=spawnSync('git',args,{cwd:repo,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};git(['init','-q']);git(['config','user.email','fixture@example.invalid']);git(['config','user.name','Fixture']);writeFileSync(join(repo,'source'),'base');git(['add','.']);git(['commit','-qm','base']);const base=git(['rev-parse','HEAD']);writeFileSync(join(repo,'source'),'head');git(['commit','-am','head']);const head=git(['rev-parse','HEAD']);writeFileSync(join(repo,'sentinel'),'keep owner changes');writeFileSync(join(root,'sentinel'),'keep parent');return{root,repo,base,head,close:()=>rmSync(root,{recursive:true,force:true})};}
const run=(f,out)=>spawnSync('node',[runner,'--base',f.base,'--head',f.head,'--repo','fixture/fixture','--dry-run',...(out===undefined?[]:['--out',out])],{cwd:f.repo,encoding:'utf8',timeout:15000});
for(const target of['dot','absolute','ancestor','existing','symlink','symlink-parent','git-child']){
 test(`dry-run refuses ${target} output before modifying any sentinel`,()=>{const f=fixture();try{
  let out;if(target==='dot')out='.';if(target==='absolute')out=f.repo;if(target==='ancestor')out=f.root;
  const unrelated=join(f.root,'unowned');mkdirSync(unrelated);writeFileSync(join(unrelated,'sentinel'),'keep unrelated');
  if(target==='existing')out=unrelated;
  if(target==='symlink'){out=join(f.root,'link');symlinkSync(unrelated,out,'dir');}
  if(target==='symlink-parent'){symlinkSync(unrelated,join(f.root,'alias'),'dir');out=join(f.root,'alias','packet');}
  if(target==='git-child')out=join(f.repo,'.git','packet');
  const r=run(f,out);
  assert.equal(readFileSync(join(f.repo,'sentinel'),'utf8'),'keep owner changes');assert.equal(readFileSync(join(f.root,'sentinel'),'utf8'),'keep parent');assert.equal(readFileSync(join(unrelated,'sentinel'),'utf8'),'keep unrelated');assert.ok(existsSync(join(f.repo,'.git','HEAD')));
  if(target==='symlink')assert.ok(lstatSync(out).isSymbolicLink());
  assert.notEqual(r.status,0,'unsafe path must be refused');assert.match(r.stderr,/unsafe review output|must be new|symlink/i);
  if(target==='symlink-parent')assert.ok(!existsSync(join(unrelated,'packet')));
 }finally{f.close();}});
}
test('safe fresh packet directory works without overwriting its first packet',()=>{const f=fixture();try{const out=join(f.root,'packet'),r=run(f,out);assert.equal(r.status,0,r.stderr);const before=readFileSync(join(out,'MANIFEST.json'),'utf8');const again=run(f,out);assert.notEqual(again.status,0);assert.equal(readFileSync(join(out,'MANIFEST.json'),'utf8'),before);}finally{f.close();}});
test('default dry-runs allocate distinct fresh packets without reusing Git metadata',()=>{const f=fixture(),outputs=[];try{for(let i=0;i<2;i++){const r=run(f);assert.equal(r.status,0,r.stderr);const out=/^packet: (.+) \(/m.exec(r.stdout)?.[1];assert.ok(out);outputs.push(out);assert.ok(existsSync(join(out,'MANIFEST.json')));}assert.notEqual(outputs[0],outputs[1]);}finally{for(const out of outputs)if(out.startsWith(join(tmpdir(),'mfa-agy-')))rmSync(out,{recursive:true,force:true});f.close();}});
