import type {Locale} from './locales';
export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}
// Callers supply the person's zone, never the server's implicit zone.
export function formatDate(locale: Locale, value: Date | number, timeZone: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, {...options, timeZone}).format(value);
}

// Preserve existing energy precision and serialized-number handling; vary only the locale.
export function formatEnergy(locale:Locale,value:number|string|null|undefined):string {
 if(value==null||(typeof value==='string'&&!value.trim()))return '—';
 const amount=Number(value);
 if(!Number.isFinite(amount))return '—';
 if(amount>0&&Math.round(amount)===0)return '<1';
 return formatNumber(locale,Math.round(amount));
}

// Preserve the existing rounded, nonnegative nutrient display independently of energy.
export function formatNutrient(locale:Locale,value:number|string|null|undefined):string {
 if(value==null||(typeof value==='string'&&!value.trim()))return '—';
 const amount=Number(value);return Number.isFinite(amount)?formatNumber(locale,Math.round(Math.max(0,amount))):'—';
}
export function formatMicroNutrient(locale:Locale,value:number):string {
 return value>0&&value<0.01?'<0.01':formatNumber(locale,value,{maximumFractionDigits:2});
}
// Existing portion labels use whole grams without grouping, with unknown coercion to zero.
export function formatPortion(locale:Locale,value:number|string|null|undefined):string {
 const amount=Number(value),rounded=Math.round(Number.isFinite(amount)?amount:0);
 return `${formatNumber(locale,rounded===0?0:rounded,{useGrouping:false})} g`;
}
