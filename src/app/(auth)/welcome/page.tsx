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
  await connection();
  return <AuthShell welcome>
    <div className="mfaAuth-welcomeHeader"><h2>Welcome</h2><p>Sign in or create your account.</p></div>
    <AuthProviders/>
    <Link href="/sign-in" prefetch={false} className="flex min-h-field-h items-center justify-center text-body font-semibold underline underline-offset-4">Continue with email</Link>
  </AuthShell>;
}
