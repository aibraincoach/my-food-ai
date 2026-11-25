// Serve the real NutritionTable SSR output with the built CSS, loopback only.
import fs from 'node:fs';
import http from 'node:http';
import {renderNutritionTable} from './render-nutrition-table.mjs';
const cases={usda:['123'],mixed:['123','off:123','estimate:soup'],personal:['label:reading','barcode-own:123','user:drink-correction:reading'],water:['user:drink-tile'],old:['barcode:123',null,'user:photo-drink:reading'],mext:['mext:01088']};
const html=new Map();
const css=fs.readdirSync('.next/static',{recursive:true}).filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync('.next/static/'+f,'utf8')).join('\n');
for(const locale of ['en','ja'])for(const [name,refs] of Object.entries(cases)){
 const messages=JSON.parse(fs.readFileSync('messages/'+locale+'.json'));
 const items=refs.map((source_ref,index)=>({id:String(index),name:locale==='ja'?'食品'+index:'Food '+index,source_ref,calories:10,protein_g:1,carbs_g:1,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:source_ref?.startsWith('estimate:')?[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:10,basis:'portion',per100:10,approximation:{kind:'estimate',basis:'soup',sourceRef:source_ref}}]:[]}));
 html.set('/'+locale+'/'+name,`<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Nutrition sources</title><style>${css}\nbody{width:390px;max-width:100%;margin:0;background:white;color:black;font-family:sans-serif}</style><body>${renderNutritionTable(locale,messages,items)}</body></html>`);
}
const server=http.createServer((req,res)=>{const page=html.get(req.url);res.writeHead(page?200:404,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(page??'Not found');});
server.listen(Number(process.env.SOURCE_PROOF_PORT??61720),'127.0.0.1',()=>console.log('NutritionTable component proof ready.'));
