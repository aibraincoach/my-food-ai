import Link from "next/link";
import { connection } from "next/server";
import { signIn } from "@/lib/auth/actions";
import FacebookButton from "@/components/FacebookButton";

export const instant = false;

const FACEBOOK_LOGIN = process.env.NEXT_PUBLIC_FACEBOOK_LOGIN === "1";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-full w-full max-w-[390px] flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">My Food AI</h1>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <form action={signIn} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className="border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="border border-neutral-300 px-3 py-2" />
        </label>
        <button type="submit" className="bg-black py-2 text-sm text-white">
          Sign in
        </button>
      </form>
      {FACEBOOK_LOGIN ? <FacebookButton /> : null}
      <p className="text-sm text-neutral-500">
        No account? <Link href="/sign-up" className="underline">Sign up</Link>
      </p>
    </main>
  );
}
