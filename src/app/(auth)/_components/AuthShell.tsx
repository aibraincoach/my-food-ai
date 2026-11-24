import {useTranslations} from 'next-intl';
import type {ReactNode} from 'react';
import {font} from '@/lib/theme/font';
import {AuthProduct} from './AuthProduct';
import './AuthShell.css';

export function AuthShell({children,welcome=false}:{children:ReactNode;welcome?:boolean}){
 const t=useTranslations('auth');
  return <main className={`${font.className} mfaAuth-shell ${welcome?'mfaAuth-welcome':''}`}>
    <section className="mfaAuth-product" aria-label={t('sampleLabel')}><AuthProduct welcome={welcome}/></section>
    <section className="mfaAuth-formPane" aria-label={welcome?t('signInOptions'):t('accountForm')}><div className="mfaAuth-form">{children}</div></section>
  </main>;
}
