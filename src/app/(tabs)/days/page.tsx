import { connection } from "next/server";
import DaysScreen from "@/components/DaysScreen";

export const instant = false;

export default async function DaysPage({ searchParams }: { searchParams: Promise<{ tz?: string }> }) {
  await connection();
  const { tz } = await searchParams;
  return <DaysScreen tz={tz} />;
}
