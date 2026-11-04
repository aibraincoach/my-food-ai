import { Suspense } from "react";
import { connection } from "next/server";
import DaysScreen from "@/components/DaysScreen";

export default function DaysPage({ searchParams }: { searchParams: Promise<{ tz?: string }> }) {
  return <Suspense fallback={null}><DaysPageContent searchParams={searchParams} /></Suspense>;
}

async function DaysPageContent({ searchParams }: { searchParams: Promise<{ tz?: string }> }) {
  await connection();
  const { tz } = await searchParams;
  return <DaysScreen tz={tz} />;
}
