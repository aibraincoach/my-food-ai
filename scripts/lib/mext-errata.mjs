import assert from 'node:assert/strict';
import {NUTRIENT_MAPPING,parseValue} from './mext-import.mjs';

// Main-table errata labels, as published. Unknown labels fail rather than
// disappearing from the scope report. Remarks and unmapped nutrients stay out.
const LABELS = {
  'レチノール活性当量':'VITA_RAE', '食物繊維総量':'FIB-',
  'βクリプトキサンチン':'CRYPXB', '利用可能炭水化物(質量計)':'CHOAVL',
  '利用可能炭水化物(単糖当量)':'CHOAVLM', '差引き法による利用可能炭水化物':'CHOAVLDF-',
  '利用可能炭水化物(差引き法による利用可能炭水化物)':'CHOAVLDF-',
  '炭水化物':'CHOCDF-', 'エネルギーkJ':'ENERC', 'エネルギーkcal':'ENERC_KCAL',
  'ナイアシン当量':'NE', 'ビオチン':'BIOT', '糖アルコール':'POLYL',
};
const compact = text => text.normalize('NFKC').replace(/\s/gu,'');

export function verifyErrata(workbook, rows) {
  const byId = new Map(rows.map(row=>[row.food_number,row]));
  const importedTags = new Set(Object.values(NUTRIENT_MAPPING).map(([tag])=>tag));
  importedTags.add('REFUSE');
  const report = {};
  const stat = name => report[name]??= {verified_fields:0,out_of_scope_entries:0,reasons:{}};
  const outside = (name,reason) => {
    const s=stat(name);s.out_of_scope_entries++;s.reasons[reason]=(s.reasons[reason]??0)+1;
  };
  const check = (sheet,id,field,actual,expected) => {
    assert.equal(actual,expected,`Errata mismatch ${sheet} ${id} ${field}`);
    const nutrientId=Object.keys(NUTRIENT_MAPPING).find(key=>NUTRIENT_MAPPING[key][0]===field);
    if (nutrientId) {
      const parsed=parseValue(expected), nutrient=byId.get(id).nutrients[nutrientId];
      for (const key of ['value','marker','estimated','raw']) {
        assert.equal(nutrient[key],parsed[key],`Errata mapped nutrient mismatch ${sheet} ${id} ${field} ${key}`);
      }
    }
    stat(sheet).verified_fields++;
  };
  for (const [sheet,data] of Object.entries(workbook)) {
    stat(sheet);
    if (sheet === 'sheet2.xml') {
      for (const correction of data.filter(row=>/^[0-9]{5}$/u.test(row.C??''))) {
        const record=byId.get(correction.C);
        assert.ok(record,`Missing errata food ${correction.C}`);
        const label=compact(correction.F??'');
        if (label==='備考') {outside(sheet,'remarks_not_imported');continue;}
        if (label==='各成分') {outside(sheet,'checked_in_sheet3_corrected_rows');continue;}
        if (label.endsWith('アスタリスク')) {outside(sheet,'unmapped_available_carbohydrate_asterisk');continue;}
        if (label==='食品名') {
          const corrected=correction.E.replace(correction.G,correction.H);
          check(sheet,record.food_number,'name_ja',record.name_ja,corrected);
          continue;
        }
        const tag=LABELS[label];
        assert.ok(tag,`Unclassified errata label ${correction.F}`);
        if (!importedTags.has(tag)) {outside(sheet,`unmapped_${tag}`);continue;}
        check(sheet,record.food_number,tag,record.raw_values[tag],correction.H);
      }
    } else if (sheet==='sheet3.xml') {
      const header=data.find(row=>row.E==='成分識別子');
      assert.ok(header,'Errata corrected-row header missing');
      for (const correction of data.filter(row=>row.A==='正' && /^[0-9]{5}$/u.test(row.C??''))) {
        const record=byId.get(correction.C);
        assert.ok(record,`Missing corrected food ${correction.C}`);
        check(sheet,record.food_number,'name_ja',record.name_ja,correction.E);
        for (const [col,tag] of Object.entries(header)) {
          if (!importedTags.has(tag.trim())) continue;
          check(sheet,record.food_number,tag.trim(),record.raw_values[tag.trim()],correction[col]);
        }
      }
    } else {
      // Sheet1: recipe method tables12/13. Sheets4+: ancillary editions.
      const entries=data.filter(row=>/^[0-9]{5}$/u.test(row.C??'') || ['正','誤'].includes(row.A));
      for (const entry of entries) {
        if (entry.A==='誤') continue;
        outside(sheet,sheet==='sheet1.xml'?'recipe_method_not_imported':'ancillary_table_not_imported');
      }
    }
  }
  assert.ok(Object.values(report).reduce((n,s)=>n+s.verified_fields,0)>0,'No imported errata checked');
  return report;
}
