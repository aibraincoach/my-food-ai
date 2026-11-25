import type {NutritionTranslator} from './nutrition';
import type {Locale} from './locales';
import {formatEnergy,formatNumber} from './format';
import type {MonthSummary} from '@/lib/posts/days';
import {gapSentence,nutritionGaps} from '@/lib/nutrition/totals';
// Accessibility summaries use the same active-locale gap formatter.
export function calendarDayValues(locale:Locale,date:string,day:MonthSummary['days'][number]|undefined,tn:NutritionTranslator) {
 const gap=day?.missing?.length?gapSentence(nutritionGaps({missing:{calories:day.missing}},['calories']),tn,locale):'';
 return {date,hasDay:day?'yes':'no',count:day?.posts??0,
  hasPending:day?.pending?'yes':'no',unfinished:formatNumber(locale,day?.pending??0,{useGrouping:false}),
  hasIntake:day?.intake?'yes':'no',ready:day?.ready?'yes':'no',
  kcal:formatEnergy(locale,day?.kcal),hasGap:gap?'yes':'no',gap};
}
