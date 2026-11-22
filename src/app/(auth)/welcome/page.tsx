import Link from "next/link";
import {Suspense} from "react";
import {connection} from "next/server";
import AuthProviders from "@/components/AuthProviders";
import {BrandMark} from "@/components/BrandMark";
import {ResultsCard} from "@/components/ResultsCard";
import {font} from "@/lib/theme/font";

export default function WelcomePage() {
  return <Suspense fallback={null}><WelcomeContent /></Suspense>;
}
async function WelcomeContent() {
  await connection();
  return <main className={`${font.className} mx-auto flex min-h-dvh w-full max-w-phone flex-col gap-5 bg-surface px-screen-x pb-5 pt-8 text-text`}>
    <div className="flex items-center gap-[10px] text-month font-semibold"><BrandMark size={32} /><span>My Food AI</span></div>
    <figure className="flex flex-col items-center gap-1">
      <ResultsCard size={180} calories={503} protein={6} carbs={40} fat={20}
        items={[{name: "Rice", grams: 150}, {name: "Salmon", grams: 120}, {name: "Broccoli", grams: 90}]} />
      <figcaption className="text-label text-muted">Sample</figcaption>
    </figure>
    <div className="flex flex-col gap-2">
      <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.8px]">Log a meal in seconds.</h1>
      <p className="text-body">Photograph it, type it or say it.</p>
    </div>
    <div className="mt-auto flex flex-col gap-1">
      <AuthProviders />
      <Link href="/sign-in" prefetch={false} className="flex min-h-field-h items-center justify-center text-body font-semibold underline underline-offset-4">Continue with email</Link>
    </div>
  </main>;
}
