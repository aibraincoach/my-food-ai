import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostDetail, isUuid } from "@/lib/posts/items";
import { font } from "@/lib/theme/font";
import { TopBar } from "@/components/ui/TopBar";
import { Icon } from "@/components/ui/Icon";
import OutlineOverlay, { DetailDate } from "@/components/OutlineOverlay";
import Thread from "@/components/Thread";
import EatenAtEditor from "@/components/EatenAtEditor";
import NutritionTable from "@/components/NutritionTable";
import ServingsControl from "@/components/ServingsControl";
import PostMenu from "@/components/PostMenu";

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
  return <main className={`${font.className} mx-auto min-h-dvh w-full max-w-phone bg-surface pb-sheet-safe text-text`}>
    <TopBar title={<DetailDate value={detail.post.eaten_at} weekday />} right={<PostMenu postId={id} caption={detail.post.caption} />} left={<Link href="/" aria-label="Back to meals" className="flex min-h-tap min-w-tap items-center"><Icon name="back" /></Link>} />
    <OutlineOverlay key={id} initialized={detail.post.analysis_initialized_at != null} readOnly={detail.isDrink} postId={id} caption={detail.post.caption} eatenAt={detail.post.eaten_at} status={detail.post.status} photo={detail.photo} items={detail.items} />
    <EatenAtEditor key={`${id}:${detail.post.eaten_at}`} postId={id} eatenAt={detail.post.eaten_at} />
    {detail.post.analysis_initialized_at != null && !detail.isDrink ? <ServingsControl key={`${id}:${detail.post.servings}`} postId={id} servings={Number(detail.post.servings)} /> : null}
    {detail.post.analysis_initialized_at != null && (detail.items.length > 0 || detail.post.status === "ready") ? <NutritionTable items={detail.items} /> : null}
    <Thread key={id} postId={id} readOnly={detail.isDrink} />
  </main>;
}
