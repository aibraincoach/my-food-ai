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
  await connection();
  const {error,sent}=await searchParams;
  return <AuthShell>
    <AuthBackRow href="/sign-in">Sign in</AuthBackRow>
    <AuthHeader title={sent==='1'?'Check your email':'Reset your password'} align="start"/>
    {sent==='1'?<p className="text-body">If an account uses that email, you will receive a link to choose a new password.</p>:<form action={requestPasswordReset} className="flex flex-1 flex-col gap-4">
      {error?<AuthErrorBanner>{error}</AuthErrorBanner>:null}
      <AuthField label="Email" name="email" type="email" required autoComplete="email" placeholder="name@example.com"/>
      <HCaptcha/>
      <Button type="submit">Send reset link</Button>
    </form>}
  </AuthShell>;
}
