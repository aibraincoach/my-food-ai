import {getTranslations} from 'next-intl/server';
import {AuthShell} from '../_components/AuthShell';
import Link from "next/link";
import {Suspense} from "react";
import {connection} from "next/server";
import SignUpForm from "../_components/SignUpForm";
import {AuthHeader,AuthBackRow} from "../_components/AuthPieces";

export default function SignUpPage(){
  return <Suspense fallback={null}><SignUpContent/></Suspense>;
}
async function SignUpContent(){
 const t=await getTranslations('auth');
  await connection();
  return <AuthShell>
    <AuthBackRow href="/welcome">{t('welcome')}</AuthBackRow>
    <AuthHeader title={t('createYourAccount')} align="start"/>
    <SignUpForm/>
    <p className="text-center text-comment">{t('haveAccount')} <Link href="/sign-in" className="inline-flex min-h-tap items-center font-semibold underline underline-offset-4">{t('signIn')}</Link></p>
  </AuthShell>;
}
