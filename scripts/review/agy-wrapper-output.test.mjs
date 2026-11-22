import test from 'node:test';import assert from 'node:assert/strict';import{spawnSync}from'node:child_process';import{mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';
const source=readFileSync(new URL('../run-agy-pr.sh',import.meta.url),'utf8');
for(const mode of['success','blockers','missing'])test(`PR wrapper uses only its fresh receipt: ${mode}`,()=>{
 const root=mkdtempSync(join(tmpdir(),'agy-wrapper-')),bin=join(root,'bin');try{
  mkdirSync(bin);mkdirSync(join(root,'scripts'));writeFileSync(join(root,'scripts','run-agy-pr.sh'),source);
  const legacy=join(root,'.git','review-state','agy-aaaaaaa');mkdirSync(legacy,{recursive:true});writeFileSync(join(legacy,'receipt.md'),'STALE receipt');
  const tool=(name,body)=>writeFileSync(join(bin,name),'#!/bin/bash\nset -e\n'+body+'\n',{mode:0o755});
  tool('git',`if [[ "$1" == "merge-base" ]];then echo bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb;elif [[ "$1" == "rev-parse" ]];then echo '${root}/.git';fi`);
  tool('gh',`if [[ "$1 $2" == "pr view" ]];then if [[ "$*" == *headRefOid* ]];then echo aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;else echo bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb;fi;elif [[ "$1 $2" == "pr comment" ]];then while [[ $# -gt 0 ]];do if [[ "$1" == "--body-file" ]];then cp "$2" '${root}/comment';break;fi;shift;done;fi`);
  tool('node',`out='';while [[ $# -gt 0 ]];do if [[ "$1" == "--out" ]];then out="$2";break;fi;shift;done\nif [[ -z "$out" ]];then out="$(mktemp -d '${root}/new-default-XXXXXX')/packet";fi\nmkdir "$out"\necho "packet: $out (1 paths, 1 parts)"\nif [[ '${mode}' != missing ]];then echo 'FRESH receipt' > "$out/receipt.md";fi\nif [[ '${mode}' == blockers ]];then exit 3;fi`);
  const r=spawnSync('bash',['scripts/run-agy-pr.sh','1'],{cwd:root,encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,TMPDIR:root},timeout:10000});
  assert.equal(readFileSync(join(legacy,'receipt.md'),'utf8'),'STALE receipt');
  if(mode==='missing'){assert.notEqual(r.status,0);assert.ok(!existsSync(join(root,'comment')),'must never post an old receipt');}
  else{assert.equal(r.status,mode==='blockers'?3:0,r.stderr);assert.equal(readFileSync(join(root,'comment'),'utf8'),'FRESH receipt\n');}
 }finally{rmSync(root,{recursive:true,force:true});}
});
