import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {foodRows,joinIdentities,normalizeIdentity,parseValue,importRows,importSql} from '../scripts/lib/mext-import.mjs';
import {verifyErrata} from '../scripts/lib/mext-errata.mjs';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/mext-source-sample.json',import.meta.url),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('../scripts/mext-sources.json',import.meta.url),'utf8'));
const rows=importRows(fixture,manifest),byId=id=>rows.find(row=>row.food_number===id);

test('twenty official rows retain kcal, fibre, sodium, Tr and unavailable values',()=>{
  assert.equal(rows.length,20);
  assert.equal(byId('01088').nutrients['1008'].value,156);
  assert.equal(byId('01088').nutrients['1079'].value,1.5);
  assert.equal(byId('01088').nutrients['1093'].value,1);
  assert.equal(byId('01001').nutrients['1106'].marker,'Tr');
  assert.equal(byId('01001').nutrients['1106'].value,null);
  assert.equal(byId('03032').nutrients['1106'].marker,'-');
  assert.equal(byId('01088').nutrients['2000'].reason,'no_equivalent');
  assert.equal(byId('01088').nutrients['2000'].value,null);
  assert.equal(byId('03032').nutrients['1079'].value,14);
  assert.equal(byId('03032').nutrients['1079'].annotation,'†');
  assert.match(byId('03032').nutrients['1079'].annotation_note,/規定法/);
});

test('all seven acceptance identities join, changed and new identities stay excluded',()=>{
  for(const id of ['01088','11129','11277','11153','10134','10135','10136']) assert.equal(byId(id).identity_status,'joined');
  assert.equal(byId('01006').identity_status,'identity_changed');
  assert.equal(byId('11315').identity_status,'no_english');
  assert.equal(byId('01088').name_en_source,'mext-2015-en');
  assert.ok(!rows.some(row=>row.name_ja==='味噌汁'),'no instant/paste identity substitutes for the composed dish');
});

test('notation changes are explicit; qualifiers and uncited equivalents remain distinct',()=>{
  assert.equal(normalizeIdentity('＜魚類＞（さけ･ます類）皮つき、生'),normalizeIdentity('<魚類>(さけ・ます類) 皮つき 生'));
  assert.equal(normalizeIdentity('ささ身'),normalizeIdentity('ささみ'));
  assert.notEqual(normalizeIdentity('皮むき'),normalizeIdentity('皮なし'));
  assert.notEqual(normalizeIdentity('豚 生'),normalizeIdentity('豚 焼き'));
});

test('a group mismatch refuses an otherwise equal Japanese name',()=>{
  const current=foodRows([{A:'01',B:'01088',D:'こめ'}]);
  const old=foodRows([{A:'01',B:'01088',D:'こめ'}]);
  const english=foodRows([{A:'11',B:'01088',D:'Rice'}]);
  assert.equal(joinIdentities(current,old,english,new Map())[0].identity_status,'group_mismatch');
});

test('Japanese supplement text never overwrites the official English identity',()=>{
  const base=foodRows([{A:'01',B:'01001',D:'アマランサス'}]);
  const english=foodRows([{A:'01',B:'01001',D:'Amaranth'}]);
  assert.equal(joinIdentities(base,base,english,base)[0].name_en,'Amaranth');
});

test('estimated numbers preserve notation and malformed numbers fail visibly',()=>{
  assert.deepEqual(parseValue('(Tr)'),{value:null,marker:'Tr',estimated:true,raw:'(Tr)',annotation:null});
  assert.equal(parseValue('(3.6)').value,3.6);
  for(const value of ['','NaN','Infinity','about 3','3*']) assert.throws(()=>parseValue(value));
});

test('XLSX visible-text reader excludes phonetic ruby, including rich text',()=>{
  const result=spawnSync('python3',['-B','-c',`import importlib.util,xml.etree.ElementTree as E
s=importlib.util.spec_from_file_location('reader','scripts/lib/read-mext-xlsx.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
x=E.fromstring('<si xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><r><t>食品</t></r><rPh sb="0" eb="2"><t>ショクヒン</t></rPh></si>')
print(m.visible_text(x))`],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'食品');
});

test('imported-field errata are exact and a changed imported value fails',()=>{
  const errata={'sheet2.xml':[{C:'01088',F:'エネルギー kcal',H:'156'}],
    'sheet1.xml':[{C:'01088',F:'調理方法',H:'not imported'}],
    'sheet4.xml':[{C:'01088',F:'amino acid',H:'not imported'}]};
  const report=verifyErrata(errata,rows);
  assert.equal(report['sheet2.xml'].verified_fields,1);
  assert.equal(report['sheet1.xml'].out_of_scope_entries,1);
  const changed=structuredClone(rows);changed.find(row=>row.food_number==='01088').raw_values.ENERC_KCAL='155';
  assert.throws(()=>verifyErrata(errata,changed),/Errata mismatch/);
  const wrongParsed=structuredClone(rows);wrongParsed.find(row=>row.food_number==='01088').nutrients['1008'].value=155;
  assert.throws(()=>verifyErrata(errata,wrongParsed),/mapped nutrient mismatch/);
});

test('duplicate food numbers and missing mapped headers refuse the import',()=>{
  assert.throws(()=>foodRows([{A:'01',B:'01088',D:'a'},{A:'01',B:'01088',D:'b'}]),/Duplicate/);
  const changed=structuredClone(fixture);changed.current['sheet1.xml'].find(row=>row.D==='成分識別子').G='ENERC';
  assert.throws(()=>importRows(changed,manifest),/Missing mapped nutrient/);
});

test('import preparation is deterministic and changes only unequal record hashes',()=>{
  assert.deepEqual(importRows(fixture,manifest),rows);
  const sql=importSql(rows);
  assert.match(sql,/on conflict\(food_number\) do update/);
  assert.match(sql,/where jp_foods.record_sha256 is distinct from excluded.record_sha256/);
  assert.match(sql,/statement_timeout='5s'/);
});

test('CLI refuses a changed source before producing SQL or a report',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'mext-bad-source-'));
  try {
    writeFileSync(path.join(dir,'main.xlsx'),'not the pinned public workbook');
    const result=spawnSync(process.execPath,['scripts/import-mext.mjs','--source-dir',dir,'--report',path.join(dir,'report.json'),'--sql',path.join(dir,'import.sql')],{encoding:'utf8'});
    assert.notEqual(result.status,0);assert.match(result.stderr,/Source checksum mismatch/);
    assert.equal(existsSync(path.join(dir,'report.json')),false);
    assert.equal(existsSync(path.join(dir,'import.sql')),false);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
