import Link from "next/link";
import { connection } from "next/server";

export const instant = false;

// Placeholder until item 17 builds the detail with outlines,
// the nutrition table and the thread.
export default async function PostDetailPlaceholder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  // Consume the dynamic param so the route stays dynamic; the id is
  // used by item 17.
  await params;
  return (
    <main className="flex flex-1 flex-col gap-2 p-4">
      <p className="text-sm text-neutral-500">Meal detail is coming.</p>
      <Link href="/" className="text-sm text-neutral-500 underline">
        Back to meals
      </Link>
    </main>
  );
}
