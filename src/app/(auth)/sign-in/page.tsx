import Link from "next/link";
import { Suspense } from "react";
import { signIn } from "@/lib/auth/actions";
import HCaptcha from "@/components/HCaptcha";
import FacebookButton from "@/components/FacebookButton";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { font } from "@/lib/theme/font";
import { tokens } from "@/lib/theme/tokens";

export default function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <Suspense fallback={null}><SignInContent searchParams={searchParams} /></Suspense>;
}

async function SignInContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { connection } = await import("next/server");
  await connection();
  const { error } = await searchParams;
  return (
    <main className={`${font.className} mx-auto flex min-h-dvh w-full max-w-phone flex-col justify-center bg-surface px-card-padding text-text`}
      style={{ paddingBottom: tokens.spacing['sheet-bottom'] * 2, gap: tokens.spacing['sheet-bottom'] }}>
      <div className="flex flex-col items-center gap-screen-x">
        <BrandMark />
        <h1 className="text-title">My Food AI</h1>
      </div>
      <form action={signIn} className="flex flex-col gap-tooltip-y">
        {error ? <p role="alert" className="text-detail text-text">{error}</p> : null}
        <Field name="email" type="email" required autoComplete="email" placeholder="Email" aria-label="Email" />
        <Field name="password" type="password" required autoComplete="current-password" placeholder="Password" aria-label="Password" />
        <HCaptcha />
        <Button type="submit" className="mt-tooltip-offset">Sign in</Button>
        <p className="py-tooltip-y text-center text-comment text-muted">
          No account? <Link href="/sign-up" className="font-semibold text-text">Sign up</Link>
        </p>
        <FacebookButton />
      </form>
    </main>
  );
}
