import test from 'node:test';import assert from 'node:assert/strict';
import{mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync}from'node:fs';
import{tmpdir}from'node:os';import{join}from'node:path';import{spawnSync}from'node:child_process';
const source=readFileSync(new URL('../scripts/cleanup.sh',import.meta.url),'utf8');
const realGit=spawnSync('which',['git'],{encoding:'utf8'}).stdout.trim();
function fixture({merged=false,dirty=false,failRemove=false,failFetch=false,failBranch=false,space=false}={}){
 const root=mkdtempSync(join(tmpdir(),'cleanup-safety-')),main=join(root,'main'),remote=join(root,'remote.git'),wt=join(root,space?'my-food-ai-work space':'my-food-ai-work'),bin=join(root,'bin'),log=join(root,'calls');
 const git=(args,cwd=main)=>{const r=spawnSync(realGit,args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 mkdirSync(bin);git(['init','--bare',remote],root);git(['init','-b','main',main],root);git(['config','user.email','fixture@example.invalid']);git(['config','user.name','Fixture']);writeFileSync(join(main,'base'),'base');git(['add','base']);git(['commit','-m','base']);git(['remote','add','origin',remote]);git(['push','-u','origin','main']);
 git(['worktree','add','-b','candidate',wt]);writeFileSync(join(wt,'change'),'work');git(['add','change'],wt);git(['commit','-m','candidate'],wt);git(['push','origin','candidate'],wt);
 if(merged){git(['merge','--ff-only','candidate']);git(['push','origin','main']);}
 if(dirty)writeFileSync(join(wt,'dirty'),'unfinished');
 mkdirSync(join(main,'scripts'));writeFileSync(join(main,'scripts','cleanup.sh'),source);
 const tool=(name,body)=>writeFileSync(join(bin,name),'#!/bin/bash\n'+body+'\n',{mode:0o755});
 // No real process kill or profile removal is possible in this harness.
 tool('pgrep','exit 1');tool('kill','exit 99');tool('stat',"echo fixture-profile-owner-does-not-match");tool('gh','echo CLOSED');
 tool('git',`printf '%s\\n' "$*" >> ${JSON.stringify(log)}\n${failRemove?'if [[ "$1 $2" == "worktree remove" ]]; then echo injected-remove-failure >&2; exit 65; fi':''}\n${failBranch?'if [[ "$1 $2" == "branch -D" ]]; then echo injected-branch-failure >&2; exit 67; fi':''}\n${failFetch?'if [[ "$1" == "fetch" ]]; then echo injected-fetch-failure >&2; exit 66; fi':''}\nexec ${JSON.stringify(realGit)} "$@"`);
 const r=spawnSync('bash',['scripts/cleanup.sh'],{cwd:main,encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH},timeout:15000});
 const result={r,wt,git,calls:existsSync(log)?readFileSync(log,'utf8'):''};return{...result,cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('cleanup preserves a closed unmerged branch and its worktree and remote ref',()=>{const f=fixture();try{assert.equal(f.r.status,0,f.r.stderr);assert.ok(existsSync(f.wt));assert.equal(f.git(['branch','--list','candidate']),' + candidate'.trim());assert.ok(f.git(['ls-remote','--heads','origin','candidate']));}finally{f.cleanup();}});
test('cleanup removes genuinely merged clean work from local and remote',()=>{const f=fixture({merged:true});try{assert.equal(f.r.status,0,f.r.stderr);assert.ok(!existsSync(f.wt));assert.equal(f.git(['branch','--list','candidate']),'');assert.equal(f.git(['ls-remote','--heads','origin','candidate']),'');}finally{f.cleanup();}});
test('cleanup preserves dirty merged work',()=>{const f=fixture({merged:true,dirty:true});try{assert.equal(f.r.status,0,f.r.stderr);assert.ok(existsSync(join(f.wt,'dirty')));assert.ok(f.git(['ls-remote','--heads','origin','candidate']));}finally{f.cleanup();}});
test('failed worktree removal is visible and stops before branch or remote deletion',()=>{const f=fixture({merged:true,failRemove:true});try{assert.notEqual(f.r.status,0);assert.match(f.r.stderr,/injected-remove-failure/);assert.ok(existsSync(f.wt));assert.doesNotMatch(f.calls,/branch -D|push origin --delete/);assert.ok(f.git(['ls-remote','--heads','origin','candidate']));}finally{f.cleanup();}});
test('failed fetch stops before cleanup can trust stale main',()=>{const f=fixture({merged:true,failFetch:true});try{assert.notEqual(f.r.status,0);assert.match(f.r.stderr,/injected-fetch-failure/);assert.ok(existsSync(f.wt));assert.doesNotMatch(f.calls,/worktree remove|branch -D|push origin --delete/);}finally{f.cleanup();}});

test('cleanup handles a merged worktree path with spaces',()=>{const f=fixture({merged:true,space:true});try{assert.equal(f.r.status,0,f.r.stderr);assert.ok(!existsSync(f.wt));assert.equal(f.git(['ls-remote','--heads','origin','candidate']),'');}finally{f.cleanup();}});
test('failed local branch deletion stops before remote deletion',()=>{const f=fixture({merged:true,failBranch:true});try{assert.notEqual(f.r.status,0);assert.match(f.r.stderr,/injected-branch-failure/);assert.doesNotMatch(f.calls,/push origin --delete/);assert.ok(f.git(['ls-remote','--heads','origin','candidate']));assert.ok(f.git(['branch','--list','candidate']));}finally{f.cleanup();}});
