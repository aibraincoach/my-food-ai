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
  await connection();
  const {error}=await searchParams;
  return <AuthShell>
    <AuthBackRow href="/welcome">Welcome</AuthBackRow>
    <AuthHeader title="Welcome back" description="Sign in to see your meals." align="start"/>
    <form action={signIn} className="flex flex-1 flex-col gap-4">
      {error?<AuthErrorBanner>{error}</AuthErrorBanner>:null}
      <AuthField label="Email" name="email" type="email" required autoComplete="email" placeholder="name@example.com"/>
      <AuthField label="Password" name="password" type="password" required autoComplete="current-password" placeholder="Password"/>
      <HCaptcha/>
      <Button type="submit">Sign in</Button>
    </form>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-meta text-muted"><span className="h-px flex-1 bg-line"/>New here?<span className="h-px flex-1 bg-line"/></div>
      <Link href="/sign-up" className="flex min-h-field-h items-center justify-center rounded-field border border-line bg-white text-body font-semibold">Create an account</Link>
    </div>
  </AuthShell>;
}
