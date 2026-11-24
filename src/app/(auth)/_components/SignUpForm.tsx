'use client';
import {useTranslations} from 'next-intl';

import {startTransition,useActionState} from 'react';
import {signUp,type SignUpState} from '@/lib/auth/actions';
import HCaptcha from '@/components/HCaptcha';
import {Button} from '@/components/ui/Button';
import {AuthField} from './AuthField';
import {AuthErrorBanner} from './AuthPieces';
const initial:SignUpState={error:null,email:'',handle:''};
export default function SignUpForm(){
 const t=useTranslations('auth');
 const [state,submit,pending]=useActionState(signUp,initial);
 return <form method="post" onSubmit={event=>{event.preventDefault();if(pending)return;const data=new FormData(event.currentTarget);startTransition(()=>submit(data));}} className="flex flex-1 flex-col gap-4">
  {state.error?<AuthErrorBanner>{state.error}</AuthErrorBanner>:null}
  <AuthField label={t('email')} name="email" type="email" required autoComplete="email" placeholder={t('emailPlaceholder')} defaultValue={state.email}/>
  <AuthField label={t('handle')} name="handle" type="text" required maxLength={80} autoComplete="nickname" placeholder={t('handlePlaceholder')} help={t('handleHelp')} defaultValue={state.handle}/>
  <AuthField label={t('password')} name="password" type="password" required autoComplete="new-password" placeholder={t('password')}/>
  <HCaptcha/>
  <Button type="submit" disabled={pending}>{t('createAccount')}</Button>
 </form>;
}
