import {getTranslations} from 'next-intl/server';
import Link from 'next/link';
import {Suspense} from 'react';
import {connection} from 'next/server';
import AuthProviders from '@/components/AuthProviders';
import {AuthShell} from '../_components/AuthShell';
import '../_components/AuthShell.css';

export default function WelcomePage(){
  return <Suspense fallback={null}><WelcomeContent/></Suspense>;
}
async function WelcomeContent(){
 const t=await getTranslations('auth');
  await connection();
  return <AuthShell welcome>
    <div className="mfaAuth-welcomeHeader"><h2>{t('welcome')}</h2><p>{t('intro')}</p></div>
    <AuthProviders/>
    <Link href="/sign-in" prefetch={false} className="flex min-h-field-h items-center justify-center text-body font-semibold underline underline-offset-4">{t('emailPath')}</Link>
  </AuthShell>;
}
