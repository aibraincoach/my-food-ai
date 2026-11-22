import {AuthShell} from '../_components/AuthShell';
import Link from 'next/link';
import {Suspense} from 'react';
import {connection} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {updatePassword} from '@/lib/auth/password-reset';
import {Button} from '@/components/ui/Button';
import {AuthField} from '../_components/AuthField';
import {AuthBackRow,AuthHeader,AuthErrorBanner} from '../_components/AuthPieces';

type Props={searchParams:Promise<{error?:string}>};
export default function NewPasswordPage(props:Props){
  return <Suspense fallback={null}><NewPasswordContent {...props}/></Suspense>;
}
async function NewPasswordContent({searchParams}:Props){
  await connection();
  const {error}=await searchParams;
  const supabase=await createClient(AbortSignal.timeout(8000));
  const {data:{user},error:identityError}=await supabase.auth.getUser();
  return <AuthShell>
    <AuthBackRow href="/sign-in">Sign in</AuthBackRow>
    <AuthHeader title="Choose a new password" align="start"/>
    {!user||identityError?<>
      <AuthErrorBanner>That reset link is invalid or has expired. Request a new link.</AuthErrorBanner>
      <Link href="/reset-password" className="inline-flex min-h-tap items-center text-body underline">Request a new link</Link>
    </>:<form action={updatePassword} className="flex flex-1 flex-col gap-4">
      {error?<AuthErrorBanner>{error}</AuthErrorBanner>:null}
      <AuthField label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Password"/>
      <Button type="submit">Save password</Button>
    </form>}
  </AuthShell>;
}
