import {getTranslations} from 'next-intl/server';
import {AuthShell} from '../_components/AuthShell';
import {Suspense} from 'react';
import {connection} from 'next/server';
import {requestPasswordReset} from '@/lib/auth/password-reset';
import {Button} from '@/components/ui/Button';
import HCaptcha from '@/components/HCaptcha';
import {AuthField} from '../_components/AuthField';
import {AuthBackRow,AuthHeader,AuthErrorBanner} from '../_components/AuthPieces';

type Props={searchParams:Promise<{error?:string;sent?:string}>};
export default function ResetPasswordPage(props:Props){
  return <Suspense fallback={null}><ResetPasswordContent {...props}/></Suspense>;
}
async function ResetPasswordContent({searchParams}:Props){
 const t=await getTranslations('auth');
  await connection();
  const {error,sent}=await searchParams;
  return <AuthShell>
    <AuthBackRow href="/sign-in">{t('signIn')}</AuthBackRow>
    <AuthHeader title={sent==='1'?t('checkEmail'):t('resetPassword')} align="start"/>
    {sent==='1'?<p className="text-body">{t('resetSent')}</p>:<form action={requestPasswordReset} className="flex flex-1 flex-col gap-4">
      {error?<AuthErrorBanner>{error}</AuthErrorBanner>:null}
      <AuthField label={t('email')} name="email" type="email" required autoComplete="email" placeholder={t('emailPlaceholder')}/>
      <HCaptcha/>
      <Button type="submit">{t('sendReset')}</Button>
    </form>}
  </AuthShell>;
}
