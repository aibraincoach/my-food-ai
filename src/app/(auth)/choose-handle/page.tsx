import {getTranslations} from 'next-intl/server';
import {AuthShell} from '../_components/AuthShell';
import {Suspense} from 'react';
import {connection} from 'next/server';
import {chooseHandle} from '@/lib/auth/actions';
import {Button} from '@/components/ui/Button';
import {AuthField} from '../_components/AuthField';
import {AuthHeader,AuthErrorBanner,AuthBackRow} from '../_components/AuthPieces';

type Props={searchParams:Promise<{error?:string}>};
export default function ChooseHandlePage(props:Props){
  return <Suspense fallback={null}><ChooseHandleContent {...props}/></Suspense>;
}
async function ChooseHandleContent({searchParams}:Props){
 const t=await getTranslations('auth');
  await connection();
  const {error}=await searchParams;
  const handleError=error&&(error===t('takenHandle')||error===t('handleLength'))?error:undefined;
  return <AuthShell>
    <AuthBackRow href="/welcome">{t('welcome')}</AuthBackRow>
    <AuthHeader title={t('chooseHandle')} align="start"/>
    <form action={chooseHandle} className="flex flex-1 flex-col gap-4">
      {error&&!handleError?<AuthErrorBanner>{error}</AuthErrorBanner>:null}
      <AuthField label={t('handle')} name="handle" type="text" required maxLength={80} autoComplete="nickname" placeholder={t('handlePlaceholder')} help={t('handleHelp')} error={handleError}/>
      <Button type="submit">{t('continue')}</Button>
    </form>
  </AuthShell>;
}
