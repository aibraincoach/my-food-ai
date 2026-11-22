import type {ReactNode} from 'react';
import {font} from '@/lib/theme/font';
import {AuthProduct} from './AuthProduct';
import './AuthShell.css';

export function AuthShell({children,welcome=false}:{children:ReactNode;welcome?:boolean}){
  return <main className={`${font.className} mfaAuth-shell ${welcome?'mfaAuth-welcome':''}`}>
    <section className="mfaAuth-product" aria-label="My Food AI sample"><AuthProduct welcome={welcome}/></section>
    <section className="mfaAuth-formPane" aria-label={welcome?'Sign-in options':'Account form'}><div className="mfaAuth-form">{children}</div></section>
  </main>;
}
