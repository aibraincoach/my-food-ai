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
  await connection();
  return <AuthShell>
    <AuthBackRow href="/welcome">Welcome</AuthBackRow>
    <AuthHeader title="Create your account" align="start"/>
    <SignUpForm/>
    <p className="text-center text-comment">Have an account? <Link href="/sign-in" className="inline-flex min-h-tap items-center font-semibold underline underline-offset-4">Sign in</Link></p>
  </AuthShell>;
}
