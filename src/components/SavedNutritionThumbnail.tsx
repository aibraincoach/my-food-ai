'use client';
import {useLocale,useTranslations} from 'next-intl';
import {ResultsCard} from './ResultsCard';
import {cardDataFromRow} from '@/lib/pipeline/card-data';
import type {SavedItem,SavedDrink} from '@/lib/posts/saved';
import {tokens} from '@/lib/theme/tokens';
/** The immutable saved facts work even after the original post has been deleted. */
export default function SavedNutritionThumbnail({items,drinks=[]}:{items:SavedItem[];drinks?:SavedDrink[]}){
 const locale=useLocale(),t=useTranslations('card'),tn=useTranslations('nutrition');
 const size=tokens.spacing.phone;
 const facts=items.map(item=>({...item.nutrition,name:item.name,portion_grams:item.portion_grams,portion_text:item.portion_text,fibre_g:null,sugar_g:null,sodium_mg:null}));
 const itemDrinks=drinks.flatMap(d=>d.ml===null?[]:[{label:d.label??d.item_name??'',ml:d.ml,caffeineMg:d.kind==='caffeine'?d.amount:0,kind:d.kind}]);
 const data=cardDataFromRow({items:facts,itemDrinks},locale,{t,tn});
 return <span className="relative block size-12 shrink-0 overflow-hidden rounded-thumb bg-card" aria-label={t('summary')} data-saved-nutrition-card>
  <span style={{display:'block',width:size,height:size,transform:`scale(${48/size})`,transformOrigin:'top left'}}><ResultsCard data={data} size={size} t={t} tn={tn} locale={locale}/></span>
 </span>;
}
