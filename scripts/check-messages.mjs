import {readFileSync,readdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {parse,TYPE} from '@formatjs/icu-messageformat-parser';

export function flattenMessages(value,prefix='',result={}) {
  if(!value || typeof value!=='object' || Array.isArray(value)) throw Error(`Invalid namespace: ${prefix}`);
  for(const [key,entry] of Object.entries(value)) {
    if(!key || key.includes('.')) throw Error(`Invalid message key: ${prefix}${key}`);
    const path=prefix?`${prefix}.${key}`:key;
    if(typeof entry==='string') {
      if(!entry.trim()) throw Error(`Empty message: ${path}`);
      result[path]=entry;
    } else flattenMessages(entry,path,result);
  }
  return result;
}

// Locale plural categories may differ. Argument names/types, select choices,
// exact-number plural cases, offsets and rich-text tags must still agree.
export function icuSignature(message) {
  const tokens=new Set();
  function walk(nodes) {
    for(const node of nodes) {
      if(node.type===TYPE.literal || node.type===TYPE.pound) continue;
      let token=`${node.type}:${node.value}`;
      if(node.type===TYPE.select) token+=`:${Object.keys(node.options).sort().join(',')}`;
      if(node.type===TYPE.plural) token+=`:${node.pluralType}:${node.offset}:${Object.keys(node.options).filter(key=>key.startsWith('=')).sort().join(',')}`;
      tokens.add(token);
      if(node.options) for(const option of Object.values(node.options)) walk(option.value);
      if(node.children) walk(node.children);
    }
  }
  walk(parse(message));return [...tokens].sort();
}

export function checkMessages(locales) {
  if(!locales.en || !locales.ja) throw Error('English and Japanese message files are required.');
  const source=flattenMessages(locales.en),keys=Object.keys(source).sort();
  if(!keys.length) throw Error('No messages.');
  for(const [locale,messages] of Object.entries(locales)) {
    const target=flattenMessages(messages),actual=Object.keys(target).sort();
    if(JSON.stringify(keys)!==JSON.stringify(actual)) throw Error(`Message keys differ: ${locale}`);
    for(const key of keys) {
      if(JSON.stringify(icuSignature(source[key]))!==JSON.stringify(icuSignature(target[key]))) throw Error(`ICU mismatch: ${locale}.${key}`);
    }
  }
  return {locales:Object.keys(locales),keys:keys.length};
}

export function readMessages(directory=new URL('../messages/',import.meta.url)) {
  return Object.fromEntries(readdirSync(directory).filter(name=>name.endsWith('.json')).map(name=>[name.slice(0,-5),JSON.parse(readFileSync(new URL(name,directory),'utf8'))]));
}
if(process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url) {
  const result=checkMessages(readMessages());console.log(`${result.keys} message keys; ${result.locales.join(', ')}`);
}
