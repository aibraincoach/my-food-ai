import Link from "next/link";
import { connection } from "next/server";
import { signUp } from "@/lib/auth/actions";
import FacebookButton from "@/components/FacebookButton";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { font } from "@/lib/theme/font";
import { tokens } from "@/lib/theme/tokens";

export const instant = false;
const FACEBOOK_LOGIN = process.env.NEXT_PUBLIC_FACEBOOK_LOGIN === "1";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection();
  const { error } = await searchParams;
  return (
    <main className={`${font.className} mx-auto flex min-h-dvh w-full max-w-phone flex-col justify-center bg-surface px-card-padding text-text`}
      style={{ paddingBottom: tokens.spacing['sheet-bottom'] * 2, gap: tokens.spacing['sheet-bottom'] }}>
      <div className="flex flex-col items-center gap-screen-x">
        <BrandMark />
        <h1 className="text-title">My Food AI</h1>
      </div>
      <form action={signUp} className="flex flex-col gap-tooltip-y">
        {error ? <p role="alert" className="text-detail text-text">{error}</p> : null}
        <Field name="email" type="email" required autoComplete="email" placeholder="Email" aria-label="Email" />
        <Field name="handle" type="text" required autoComplete="nickname" placeholder="Handle" aria-label="Handle" />
        <Field name="password" type="password" required autoComplete="new-password" placeholder="Password" aria-label="Password" />
        <Button type="submit" className="mt-tooltip-offset">Sign up</Button>
        <p className="py-tooltip-y text-center text-comment text-muted">
          Have an account? <Link href="/sign-in" className="font-semibold text-text">Sign in</Link>
        </p>
        {FACEBOOK_LOGIN ? <FacebookButton /> : null}
      </form>
    </main>
  );
}
