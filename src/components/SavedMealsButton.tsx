'use client';
import {useTranslations} from 'next-intl';
import {Icon} from './ui/Icon';
export default function SavedMealsButton(){const t=useTranslations('postMenu');return <button className="flex min-h-tap min-w-tap items-center justify-center" aria-label={t('savedMeals')} onClick={()=>window.dispatchEvent(new CustomEvent('open-saved'))}><Icon name="bookmark"/></button>;}
