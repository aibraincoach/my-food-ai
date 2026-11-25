'use client';
import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {formatDate,formatEnergy} from '@/i18n/format';
import {dayReview,type DayReviewMeal} from '@/lib/nutrition/day-review';
import type {Numeric} from '@/lib/nutrition/totals';
/** All full day notes and top-energy links use the same read-only decision. */
export default function DayTotalReview({kcal,posts=[],day}:{kcal:Numeric;posts?:readonly DayReviewMeal[];day?:string}){
 const locale=useLocale(),t=useTranslations('days'),review=dayReview(kcal,posts);
 if(!review.high)return null;
 return <aside data-day-review className="px-screen-x py-grid text-meta text-muted">
  {day?<p>{formatDate(locale,new Date(day+'T12:00:00Z'),'UTC',{month:'short',day:'numeric'})}</p>:null}
  <p>{t('highTotalNote')}</p>
  {review.meals.length?<ul className="flex flex-wrap gap-x-3">{review.meals.map(meal=><li key={meal.id}><Link className="inline-flex min-h-tap items-center underline" href={'/?post='+meal.id}>{formatEnergy(locale,meal.kcal)} kcal</Link></li>)}</ul>:null}
 </aside>;
}
