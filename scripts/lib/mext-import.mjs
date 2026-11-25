import {createHash} from 'node:crypto';

// H14 N2: explicit cited name equivalence, never a fuzzy synonym rule.
export const NAME_EQUIVALENCES = [{
  from: 'ささ身', to: 'ささみ',
  source: 'https://www.mext.go.jp/content/20201225-mxt_kagsei-mext_01110_011.pdf',
  section: 'Chapter 3, meat notes, printed p.442 (PDF p.266)',
}];

export function normalizeIdentity(name) {
  let result = name.normalize('NFKC').replace(/\s/gu, '').replaceAll('･', '・').replaceAll('、', '');
  for (const pair of NAME_EQUIVALENCES) result = result.replaceAll(pair.from, pair.to);
  return result;
}

export function englishName(value) {
  return typeof value === 'string' && /[A-Za-z]/u.test(value) && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value);
}

export function englishIdentityKey(name) {
  return name.normalize('NFKC').trim().replace(/\s+/gu,' ').toLowerCase();
}

export function foodRows(rows) {
  const result = new Map();
  for (const row of rows) {
    if (!/^[0-9]{5}$/u.test(row.B ?? '')) continue;
    if (result.has(row.B)) throw Error(`Duplicate food number ${row.B}`);
    if (!row.D || !/^(0[1-9]|1[0-8])$/u.test(row.A ?? '')) throw Error(`Invalid identity ${row.B}`);
    result.set(row.B, row);
  }
  return result;
}

export function joinIdentities(current, oldJapanese, mainEnglish, supplement) {
  const english = new Map([...mainEnglish].map(([id, row]) => [id, {...row, source: 'mext-2015-en'}]));
  for (const [id, row] of supplement) {
    if (englishName(row.D)) english.set(id, {...row, source: 'mext-2016-supp-en'});
  }
  const identities = [...current].map(([food_number, row]) => {
    const en = english.get(food_number), old = oldJapanese.get(food_number);
    let identity_status = 'joined';
    if (!englishName(en?.D)) identity_status = 'no_english';
    else if (row.A !== en.A) identity_status = 'group_mismatch';
    else if (!old?.D || normalizeIdentity(row.D) !== normalizeIdentity(old.D)) identity_status = 'identity_changed';
    return {
      food_number, name_ja: row.D, food_group: row.A,
      name_ja_2015: old?.D ?? null, name_en: englishName(en?.D) ? en.D : null,
      name_en_source: englishName(en?.D) ? en.source : null, identity_status,
    };
  });
  // An English gate identity must identify one food number. Exclude every
  // member of an ambiguous set; order or Japanese display text cannot fix it.
  const names = new Map();
  for (const identity of identities) {
    if (identity.identity_status !== 'joined') continue;
    const key = englishIdentityKey(identity.name_en);
    const members = names.get(key) ?? [];
    members.push(identity);
    names.set(key,members);
  }
  for (const members of names.values()) {
    if (members.length > 1) for (const identity of members) identity.identity_status = 'english_name_ambiguous';
  }
  return identities;
}

// Only exact nutrient equivalents from the main table. No sugars substitution.
// Main-table identifiers are asserted by the importer, rather than column guesses.
export const NUTRIENT_MAPPING = {
  1008: ['ENERC_KCAL','KCAL'], 1003: ['PROT-','G'], 1004: ['FAT-','G'],
  1005: ['CHOCDF-','G'], 1079: ['FIB-','G'], 1093: ['NA','MG'],
  1051: ['WATER','G'], 1087: ['CA','MG'], 1089: ['FE','MG'],
  1090: ['MG','MG'], 1091: ['P','MG'], 1092: ['K','MG'],
  1095: ['ZN','MG'], 1098: ['CU','MG'], 1101: ['MN','MG'],
  1103: ['SE','UG'], 1105: ['RETOL','UG'], 1106: ['VITA_RAE','UG'],
  1109: ['TOCPHA','MG'], 1114: ['VITD','UG'], 1162: ['VITC','MG'],
  1165: ['THIA','MG'], 1166: ['RIBF','MG'], 1167: ['NIA','MG'],
  1175: ['VITB6A','MG'], 1177: ['FOL','UG'], 1178: ['VITB12','UG'],
  1185: ['VITK','UG'], 1253: ['CHOLE','MG'],
};
export const NO_EQUIVALENT = {
  2000:'G', 1057:'MG', 1104:'IU', 1110:'IU', 1180:'MG',
  1186:'UG', 1190:'UG', 1258:'G', 1292:'G', 1293:'G',
};

export function parseValue(source) {
  if (typeof source !== 'string' || !source.trim()) throw Error('Missing source value');
  const raw = source.trim(), annotation = raw.endsWith('†') ? '†' : null;
  const annotated = annotation ? raw.slice(0,-1).trim() : raw;
  const estimated = annotated.startsWith('(') && annotated.endsWith(')');
  const token = estimated ? annotated.slice(1,-1).trim() : annotated;
  if (token === 'Tr' || token === '-') return {value:null, marker:token, estimated, raw, annotation};
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(token)) throw Error(`Unrecognised source value ${raw}`);
  const value = Number(token);
  if (!Number.isFinite(value)) throw Error('Nonfinite source value');
  return {value, marker:null, estimated, raw, annotation};
}

export function tagColumns(rows) {
  const header = rows.find(row => row.D === '成分識別子');
  if (!header) throw Error('Missing MEXT nutrient identifier header');
  const tags = new Map(Object.entries(header).filter(([col]) => col !== 'D').map(([col, tag]) => [tag.trim(),col]));
  for (const [tag] of Object.values(NUTRIENT_MAPPING)) {
    if (!tags.has(tag)) throw Error(`Missing mapped nutrient ${tag}`);
  }
  return tags;
}

export function importRows(workbooks, manifest) {
  const rows = workbooks.current['sheet1.xml'], columns = tagColumns(rows);
  const current = foodRows(rows);
  const joined = joinIdentities(current, foodRows(workbooks.japanese['sheet1.xml']),
    foodRows(workbooks.english['sheet1.xml']), foodRows(workbooks.supplement['sheet1.xml']));
  return joined.map(identity => {
    const row = current.get(identity.food_number), nutrients = {}, raw_values = {};
    for (const [tag] of Object.values(NUTRIENT_MAPPING)) raw_values[tag] = row[columns.get(tag)] ?? null;
    raw_values.REFUSE = row.E;
    for (const [id,[tag,unitName]] of Object.entries(NUTRIENT_MAPPING)) {
      const parsed = parseValue(row[columns.get(tag)]);
      nutrients[id] = {...parsed,unitName,source_tag:tag,
        ...(parsed.annotation ? {annotation_note:row.BJ} : {})};
    }
    for (const [id,unitName] of Object.entries(NO_EQUIVALENT)) {
      nutrients[id] = {value:null,marker:'-',estimated:false,raw:null,unitName,source_tag:null,reason:'no_equivalent'};
    }
    const refuse = parseValue(row.E);
    if (refuse.marker || refuse.value < 0 || refuse.value > 100) throw Error(`Invalid refuse ratio ${identity.food_number}`);
    const value = {...identity,refuse_percent:refuse.value,nutrients,raw_values,source_manifest:manifest};
    return {...value,record_sha256:createHash('sha256').update(JSON.stringify(value)).digest('hex')};
  });
}

export function importSql(rows) {
  const data = JSON.stringify(rows);
  if (data.includes('$mext_import$')) throw Error('SQL payload delimiter collision');
  const columns = ['food_number','name_ja','food_group','name_ja_2015','name_en','name_en_source','identity_status','refuse_percent','nutrients','raw_values','source_manifest','record_sha256'];
  return `-- Prepared locally; execution needs its separate apply/import order.\nbegin;\nset local lock_timeout='1s';\nset local statement_timeout='5s';\ninsert into public.jp_foods (${columns.join(',')})\nselect ${columns.join(',')} from jsonb_populate_recordset(null::public.jp_foods,$mext_import$${data}$mext_import$::jsonb)\non conflict(food_number) do update set ${columns.filter(c=>c!=='food_number').map(c=>`${c}=excluded.${c}`).join(',')},imported_at=now()\nwhere jp_foods.record_sha256 is distinct from excluded.record_sha256;\ncommit;\n`;
}
