import fs from'node:fs';import os from'node:os';import path from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';
const repo=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
export function privateDir(dir){dir=path.resolve(dir);if([path.parse(dir).root,path.resolve(os.tmpdir()),path.resolve(os.homedir())].includes(dir))throw Error('Use a dedicated private output directory.');if(dir===repo||dir.startsWith(repo+path.sep))throw Error('Study outputs must be outside the repository.');fs.mkdirSync(dir,{recursive:true,mode:0o700});if(fs.lstatSync(dir).isSymbolicLink())throw Error('Private directory must not be a symlink.');fs.chmodSync(dir,0o700);return dir;}
export function privateWrite(file,data){privateDir(path.dirname(file));if(fs.existsSync(file)&&fs.lstatSync(file).isSymbolicLink())throw Error('Private output must not be a symlink.');fs.writeFileSync(file,data,{mode:0o600});fs.chmodSync(file,0o600);}
export const writeJson=(file,data)=>privateWrite(file,JSON.stringify(data,null,2)+'\n');
export const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
export const readRows=file=>fs.readFileSync(file,'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line));
export const isMain=url=>process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===url;
export function refuseExisting(file){if(fs.existsSync(file))throw Error('Output already exists; inspect the recorded attempt before proceeding.');}
export const validPrefix=value=>typeof value==='string'&&/^[0-9a-f]{8}$/.test(value);
