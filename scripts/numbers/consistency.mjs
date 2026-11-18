// Local questions, never corrections. No database client, subprocess or network.
import path from 'node:path';
import {parseArgs} from 'node:util';
import {privateDir,writeJson,readRows,isMain,refuseExisting} from './study-io.mjs';

export const ZERO_CALORIE_DRINKS=['water','sparkling water','black coffee','plain tea','diet soda','zero soda','diet cola','zero cola'];
const numeric=x=>typeof x==='number'&&Number.isFinite(x);
export const normalName=x=>String(x??'').toLowerCase().replace(/[^\p{L}\s]/gu,'').replace(/\s+/g,' ').trim();
const median=xs=>{const values=[...xs].sort((a,b)=>a-b),n=values.length;return n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2;};
const groups=(rows,key)=>{const result=new Map();for(const row of rows){const k=key(row);if(!k)continue;const group=result.get(k)??[];group.push(row);result.set(k,group);}return result;};

export function checkConsistency(rows){
 const questions=[];
 const add=(check,kind,foods,numbers)=>questions.push({check,kind,meals:[...new Set(foods.map(f=>f.meal))],items:foods.map(f=>f.item),foods:foods.map(f=>f.name),numbers});
 for(const food of rows){
  if(numeric(food.kcal_per_100g)&&(food.kcal_per_100g>902||food.kcal_per_100g<0))add(1,'impossible density',[food],{kcal_per_100g:food.kcal_per_100g});
  if(numeric(food.grams)&&food.grams>0&&food.kcal===0&&!ZERO_CALORIE_DRINKS.includes(normalName(food.name)))add(2,'zero calories with grams',[food],{grams:food.grams,kcal:food.kcal});
  const missing=[];if(food.grams==null)missing.push('grams');if(food.kcal==null)missing.push('kcal');if(food.not_eaten_g!=null&&food.not_eaten_kcal==null)missing.push('not_eaten_kcal');if(missing.length)add(3,'missing numbers',[food],{missing,grams:food.grams??null,kcal:food.kcal??null,not_eaten_g:food.not_eaten_g??null,not_eaten_kcal:food.not_eaten_kcal??null});
  if(numeric(food.not_eaten_g)&&food.not_eaten_g>0&&numeric(food.not_eaten_kcal)&&numeric(food.grams)&&food.grams>0&&numeric(food.kcal)){
   const eaten=food.kcal/food.grams*100,left=food.not_eaten_kcal/food.not_eaten_g*100;
   if(Math.abs(left-eaten)>1+Number.EPSILON)add(8,'leftovers density',[food],{eaten_kcal_per_100g:eaten,left_kcal_per_100g:left,grams:food.grams,kcal:food.kcal,not_eaten_g:food.not_eaten_g,not_eaten_kcal:food.not_eaten_kcal});
  }
  if(numeric(food.grams)&&(food.grams<3||food.grams>1000))add(9,'portion outside fixed bounds',[food],{grams:food.grams});
 }
 for(const [record,foods]of groups(rows.filter(f=>f.how==='match'&&numeric(f.kcal_per_100g)),f=>f.record)){
  const densities=foods.map(f=>f.kcal_per_100g);if(Math.max(...densities)-Math.min(...densities)>0.5+Number.EPSILON)add(4,'one record, two densities',foods,{record,densities});
 }
 for(const [name,foods]of groups(rows,f=>normalName(f.name))){
  const meals=new Set(foods.map(f=>f.meal)),known=foods.filter(f=>numeric(f.kcal_per_100g));
  if(meals.size>=2&&known.length>=2){const densities=known.map(f=>f.kcal_per_100g);if(Math.max(...densities)>2*Math.min(...densities))add(5,'one food, very different densities',known,{name,densities});}
  const records=[...new Set(foods.map(f=>f.record).filter(r=>r!=null&&r!==''))];if(records.length>1)add(6,'one food, several records (information)',foods,{name,records});
  for(const sameMeal of groups(foods,f=>f.meal).values())if(sameMeal.length>1)add(7,'possible duplicate',sameMeal,{name,count:sameMeal.length});
  if(meals.size>=3)for(const food of foods.filter(f=>numeric(f.grams)&&f.grams>0)){
   // Each other meal gets one vote, even if it has duplicate current rows.
   const other=[...groups(foods.filter(f=>f.meal!==food.meal&&numeric(f.grams)&&f.grams>0),f=>f.meal).values()].map(xs=>median(xs.map(f=>f.grams)));
   if(other.length<2)continue;const typical=median(other);
   if(food.grams>3*typical||food.grams<typical/3)add(9,'portion outside other-meal median',[food],{grams:food.grams,median_other_meals:typical,other_meal_medians:other});
  }
 }
 return {questions,summary:Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,questions.filter(q=>q.check===i+1).length])),unavailable:['calories against macros: no macros in SELECT26','record nutrient value: no record nutrients in SELECT26','same food across days: no dates in SELECT26']};
}
if(isMain(import.meta.url))try{
 const{values}=parseArgs({options:{rows:{type:'string'},out:{type:'string'}}});if(!values.rows||!values.out)throw Error('Required: --rows and --out.');
 const dir=privateDir(values.out),file=path.join(dir,'consistency.json');refuseExisting(file);
 const result=checkConsistency(readRows(values.rows));writeJson(file,result);console.log(JSON.stringify({questions:result.questions.length,checks:result.summary}));
}catch(error){console.error(error.message);process.exitCode=1;}
