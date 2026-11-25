import {nutritionNumber,type Numeric} from './totals';
export const HIGH_DAY_KCAL=4000;
export type DayReviewMeal={id:string;kcal?:Numeric;totals?:{calories:Numeric}};
/** Read-only review flag: never adjusts, hides or certifies the day total. */
export function dayReview(kcal:Numeric,posts:readonly DayReviewMeal[]=[]){
 const total=nutritionNumber(kcal);
 return {high:total!==null&&total>HIGH_DAY_KCAL,
  meals:total!==null&&total>HIGH_DAY_KCAL?posts.map(post=>({id:post.id,kcal:post.totals?post.totals.calories:post.kcal})).filter(post=>nutritionNumber(post.kcal)!==null).sort((a,b)=>Number(b.kcal)-Number(a.kcal)||a.id.localeCompare(b.id)).slice(0,3):[]};
}
