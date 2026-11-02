import DesktopWorkspace from "@/components/DesktopWorkspace";
import PostDetail from "@/components/PostDetail";
import ConnectAgentRow from '@/components/ConnectAgentRow';
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ProfileGrid } from "@/components/ProfileGrid";
import { SignOutButton } from "@/components/SignOutButton";
import { getProfileGrid } from "@/lib/posts/grid";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage({searchParams}:{searchParams:Promise<{post?:string}>}) {
  const {post}=await searchParams;
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const [{ data: profile, error }, posts] = await Promise.all([
    supabase.from("profiles").select("handle").eq("id", user.id).single(),
    getProfileGrid(supabase, user.id),
  ]);
  if (error) throw new Error("Profile could not be loaded.");
  return (
    <DesktopWorkspace width={760} detail={post?<PostDetail id={post}/>:undefined}><main className="flex flex-1 flex-col desktop:pt-2">
      <header className="flex h-top-safe shrink-0 items-center justify-between gap-3 px-screen-x desktop:h-[72px] desktop:gap-5 desktop:px-0">
        <span className="hidden desktop:flex desktop:size-[72px] desktop:shrink-0 desktop:items-center desktop:justify-center desktop:rounded-circle desktop:bg-text desktop:text-[26px] desktop:font-semibold desktop:text-surface" aria-hidden="true">{profile.handle.slice(0,1).toUpperCase()}</span>
        <h1 className="truncate text-title desktop:flex-1 desktop:text-[24px]">@{profile.handle}</h1>
        <SignOutButton />
      </header>
      <ConnectAgentRow userId={user.id} />
      <ProfileGrid posts={posts} />
    </main></DesktopWorkspace>
  );
}
