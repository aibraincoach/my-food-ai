import Link from "next/link";
import {Suspense} from "react";
import {connection} from "next/server";
import {signUp} from "@/lib/auth/actions";
import HCaptcha from "@/components/HCaptcha";
import {Button} from "@/components/ui/Button";
import {AuthField} from "../_components/AuthField";
import {AuthHeader,AuthErrorBanner,AuthBackRow} from "../_components/AuthPieces";
import {font} from "@/lib/theme/font";

type Props={searchParams:Promise<{error?:string}>};
export default function SignUpPage(props:Props){
  return <Suspense fallback={null}><SignUpContent {...props}/></Suspense>;
}
async function SignUpContent({searchParams}:Props){
  await connection();
  const {error}=await searchParams;
  const handleError=error==="That handle is taken. Choose another."?error:undefined;
  return <main className={`${font.className} mx-auto flex min-h-dvh w-full max-w-phone flex-col gap-5 bg-surface px-screen-x pb-5 pt-4 text-text`}>
    <AuthBackRow href="/welcome">Welcome</AuthBackRow>
    <AuthHeader title="Create your account" align="start"/>
    <form action={signUp} className="flex flex-1 flex-col gap-4">
      {error&&!handleError?<AuthErrorBanner>{error}</AuthErrorBanner>:null}
      <AuthField label="Email" name="email" type="email" required autoComplete="email" placeholder="name@example.com"/>
      <AuthField label="Handle" name="handle" type="text" required maxLength={80} autoComplete="nickname" placeholder="yourname" help="The name shown on your posts." error={handleError}/>
      <AuthField label="Password" name="password" type="password" required autoComplete="new-password" placeholder="Password"/>
      <HCaptcha/>
      <Button type="submit">Create account</Button>
    </form>
    <p className="text-center text-comment">Have an account? <Link href="/sign-in" className="inline-flex min-h-tap items-center font-semibold underline underline-offset-4">Sign in</Link></p>
  </main>;
}
