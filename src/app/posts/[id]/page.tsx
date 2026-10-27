import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostDetail, isUuid } from "@/lib/posts/items";
import { font } from "@/lib/theme/font";
import { TopBar } from "@/components/ui/TopBar";
import { Icon } from "@/components/ui/Icon";
import OutlineOverlay, { DetailDate } from "@/components/OutlineOverlay";
import NutritionTable from "@/components/NutritionTable";

export const instant = false;

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const detail = await getPostDetail(supabase, id);
  if (!detail) notFound();
  return <main className={`${font.className} mx-auto min-h-dvh w-full max-w-phone bg-surface pb-sheet-bottom text-text`}>
    <TopBar title={<DetailDate value={detail.post.eaten_at} weekday />} left={<Link href="/" aria-label="Back to meals" className="flex min-h-tap min-w-tap items-center"><Icon name="back" /></Link>} />
    <OutlineOverlay postId={id} caption={detail.post.caption} eatenAt={detail.post.eaten_at} status={detail.post.status} photo={detail.photo} items={detail.items} />
    <NutritionTable items={detail.items} />
  </main>;
}
