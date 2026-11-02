import DesktopWorkspace from "@/components/DesktopWorkspace";
import PostDetail from "@/components/PostDetail";
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
    <DesktopWorkspace width={760} detail={post?<PostDetail id={post}/>:undefined}><main className="flex flex-1 flex-col">
      <header className="flex h-top-safe shrink-0 items-center justify-between gap-3 px-screen-x">
        <h1 className="truncate text-title">@{profile.handle}</h1>
        <SignOutButton />
      </header>
      <ProfileGrid posts={posts} />
    </main></DesktopWorkspace>
  );
}
