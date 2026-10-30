import { connection } from "next/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import TabsLayout from "@/app/(tabs)/layout";
import DaysScreen from "@/components/DaysScreen";
import { dateInZone, validDate, validZone } from "@/lib/posts/days";

export const instant = false;

export default async function DayPage({ params, searchParams }: { params: Promise<{ date: string }>; searchParams: Promise<{ tz?: string }> }) {
  await connection();
  const { date } = await params;
  if (!validDate(date)) notFound();
  const { tz } = await searchParams;
  const zone = validZone(tz || (await cookies()).get("time-zone")?.value);
  if (date > dateInZone(new Date(), zone)) notFound();
  return <TabsLayout><DaysScreen tz={tz} date={date} /></TabsLayout>;
}
