import Link from "next/link";
import { connection } from "next/server";
import { signUp } from "@/lib/auth/actions";

export const instant = false;

export default async function SignUpPage({
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
      <form action={signUp} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className="border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Handle
          <input name="handle" type="text" required autoComplete="nickname" className="border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input name="password" type="password" required autoComplete="new-password" className="border border-neutral-300 px-3 py-2" />
        </label>
        <button type="submit" className="bg-black py-2 text-sm text-white">
          Sign up
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        Have an account? <Link href="/sign-in" className="underline">Sign in</Link>
      </p>
    </main>
  );
}
