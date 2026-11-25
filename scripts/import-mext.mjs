// Prepare an idempotent import locally. This tool never connects to a database.
// Usage: node scripts/import-mext.mjs --source-dir /local/files --report /local/report.json [--sql /local/import.sql]
// Python 3 standard library is required for XLSX decoding; no third-party parser.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {importRows,importSql} from './lib/mext-import.mjs';
import {verifyErrata} from './lib/mext-errata.mjs';

const args = process.argv.slice(2), options = {};
for (let i=0;i<args.length;i+=2) {
  if (!['--source-dir','--report','--sql'].includes(args[i]) || !args[i+1] || options[args[i]]) throw Error('Use --source-dir PATH --report PATH [--sql PATH]');
  options[args[i]]=args[i+1];
}
if (!options['--source-dir'] || !options['--report']) throw Error('Source directory and report path are required');
const manifest = JSON.parse(readFileSync(new URL('./mext-sources.json',import.meta.url),'utf8'));
const workbooks = {};
for (const [name,source] of Object.entries(manifest)) {
  const filename = path.resolve(options['--source-dir'],source.file);
  const digest = createHash('sha256').update(readFileSync(filename)).digest('hex');
  if (digest !== source.sha256) throw Error(`Source checksum mismatch: ${name}`);
  const result = spawnSync('python3',[fileURLToPath(new URL('./lib/read-mext-xlsx.py',import.meta.url)),filename],{encoding:'utf8',maxBuffer:32*1024*1024});
  if (result.error || result.status !== 0) throw Error(`Workbook decoding failed: ${name}`);
  workbooks[name]=JSON.parse(result.stdout);
}
const rows = importRows(workbooks,manifest);
const acceptance = ['01088','11129','11277','11153','10134','10135','10136'];
for (const id of acceptance) {
  if (rows.find(row=>row.food_number===id)?.identity_status !== 'joined') throw Error(`Acceptance identity refused: ${id}`);
}
const counts = {};
for (const row of rows) counts[row.identity_status]=(counts[row.identity_status]??0)+1;
const errata = verifyErrata(workbooks.errata,rows);
const report = {source_manifest:manifest,counts,total:rows.length,acceptance,errata,
  exclusions:rows.filter(row=>row.identity_status!=='joined').map(({food_number,identity_status,name_ja,name_ja_2015})=>({food_number,identity_status,name_ja,name_ja_2015})),
  corrections_verified:true,sql_prepared:Boolean(options['--sql']),database_connections:0};
if (options['--sql']) writeFileSync(options['--sql'],importSql(rows),{flag:'wx',mode:0o600});
writeFileSync(options['--report'],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({total:rows.length,counts,database_connections:0,corrections_verified:true}));
