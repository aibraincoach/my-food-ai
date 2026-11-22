import Link from "next/link";
import { Suspense } from "react";
import { signUp } from "@/lib/auth/actions";
import HCaptcha from "@/components/HCaptcha";
import AuthProviders from "@/components/AuthProviders";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/Button";
import {AuthField} from "../_components/AuthField";
import {AuthHeader,AuthErrorBanner,AuthBackRow} from "../_components/AuthPieces";
import { font } from "@/lib/theme/font";
import { tokens } from "@/lib/theme/tokens";

export default function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <Suspense fallback={null}><SignUpContent searchParams={searchParams} /></Suspense>;
}

async function SignUpContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { connection } = await import("next/server");
  await connection();
  const { error } = await searchParams;
  return (
    <main className={`${font.className} mx-auto flex min-h-dvh w-full max-w-phone flex-col justify-center bg-surface px-card-padding text-text`}
      style={{ paddingBottom: tokens.spacing['sheet-bottom'] * 2, gap: tokens.spacing['sheet-bottom'] }}>
      <AuthBackRow href="/sign-in">Sign in</AuthBackRow>
      <AuthHeader title="My Food AI"><BrandMark /></AuthHeader>
      <form action={signUp} className="flex flex-col gap-tooltip-y">
        {error ? <AuthErrorBanner>{error}</AuthErrorBanner> : null}
        <AuthField label="Email" name="email" type="email" required autoComplete="email" placeholder="Email" aria-label="Email" />
        <AuthField label="Handle" name="handle" type="text" required autoComplete="nickname" placeholder="Handle" aria-label="Handle" />
        <AuthField label="Password" name="password" type="password" required autoComplete="new-password" placeholder="Password" aria-label="Password" />
        <HCaptcha />
        <Button type="submit" className="mt-tooltip-offset">Sign up</Button>
        <p className="py-tooltip-y text-center text-comment text-muted">
          Have an account? <Link href="/sign-in" className="font-semibold text-text">Sign in</Link>
        </p>
      </form>
      <AuthProviders />
    </main>
  );
}
