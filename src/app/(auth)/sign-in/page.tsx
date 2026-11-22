import {getTranslations} from 'next-intl/server';
import {AuthShell} from '../_components/AuthShell';
import Link from "next/link";
import {Suspense} from "react";
import {connection} from "next/server";
import {signIn} from "@/lib/auth/actions";
import HCaptcha from "@/components/HCaptcha";
import {Button} from "@/components/ui/Button";
import {AuthField} from "../_components/AuthField";
import {AuthHeader,AuthErrorBanner,AuthBackRow} from "../_components/AuthPieces";

type Props={searchParams:Promise<{error?:string}>};
export default function SignInPage(props:Props){
  return <Suspense fallback={null}><SignInContent {...props}/></Suspense>;
}
async function SignInContent({searchParams}:Props){
 const t=await getTranslations('auth');
  await connection();
  const {error}=await searchParams;
  return <AuthShell>
    <AuthBackRow href="/welcome">{t('welcome')}</AuthBackRow>
    <AuthHeader title={t('backTitle')} description={t('signInDescription')} align="start"/>
    <form action={signIn} className="flex flex-1 flex-col gap-4">
      {error?<AuthErrorBanner>{error}</AuthErrorBanner>:null}
      <AuthField label={t('email')} name="email" type="email" required autoComplete="email" placeholder={t('emailPlaceholder')}/>
      <AuthField label={t('password')} name="password" type="password" required autoComplete="current-password" placeholder={t('password')}/>
      <HCaptcha/>
      <Button type="submit">{t('signIn')}</Button>
    </form>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-meta text-muted"><span className="h-px flex-1 bg-line"/>{t('newHere')}<span className="h-px flex-1 bg-line"/></div>
      <Link href="/sign-up" className="flex min-h-field-h items-center justify-center rounded-field border border-line bg-white text-body font-semibold">{t('createAnAccount')}</Link>
    </div>
  </AuthShell>;
}
