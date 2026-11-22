import {checkMessages, readMessages} from './check-messages.mjs';
import {lintTargets} from './eslint-i18n.mjs';
import {spawnSync} from 'node:child_process';
const result=checkMessages(readMessages());
console.log(`${result.keys} message keys; ${result.locales.join(', ')}`);
const lint=spawnSync(process.execPath,['node_modules/eslint/bin/eslint.js',...lintTargets],{stdio:'inherit'});
if(lint.error) throw lint.error;
process.exitCode=lint.status??1;
