import Link from "next/link";
import { verifiedUserId } from "@/lib/auth/verified-user";
import {openWeightsConfigured} from "@/lib/meta/open-weights";
import IdentifyProviderSwitch from "./IdentifyProviderSwitch";
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
  const verified = await verifiedUserId();
  const user = verified ? {id: verified} : (await supabase.auth.getUser()).data.user;
  if (!user) redirect("/sign-in");
  const [{ data: profile, error }, posts] = await Promise.all([
    supabase.from("profiles").select("handle").eq("id", user.id).single(),
    getProfileGrid(supabase, user.id),
  ]);
  if (error) throw new Error("Profile could not be loaded.");
  // During configuration/rollout the optional preference column may not yet
  // exist. Keep the ordinary Profile usable; the setting endpoint reports a
  // failed save until its migration is present.
  const preference = openWeightsConfigured()
    ? await supabase.from("profiles").select("identify_provider").eq("id",user.id).maybeSingle()
    : {data:null};
  return (
    <DesktopWorkspace width={820} detail={post?<PostDetail id={post} desktopModal/>:undefined}><main className="flex flex-1 flex-col desktop:pt-4">
      <header className="flex h-top-safe shrink-0 items-center justify-between gap-3 px-screen-x desktop:h-[88px] desktop:gap-6 desktop:px-0">
        <span className="hidden desktop:flex desktop:size-[88px] desktop:shrink-0 desktop:items-center desktop:justify-center desktop:rounded-circle desktop:bg-text desktop:text-[32px] desktop:font-semibold desktop:text-surface" aria-hidden="true">{profile.handle.slice(0,1).toUpperCase()}</span>
        <div className="min-w-0 desktop:flex-1"><h1 className="truncate text-title desktop:text-[24px]"><span className="desktop:hidden">@</span>{profile.handle}</h1><div className="hidden desktop:mt-3 desktop:flex desktop:gap-2"><ConnectAgentRow userId={user.id} desktopButton/><SignOutButton desktopButton/></div></div>
        <div className="desktop:hidden"><SignOutButton /></div>
      </header>
      <div className="desktop:hidden"><ConnectAgentRow userId={user.id} /></div>
      {openWeightsConfigured()?<IdentifyProviderSwitch initial={preference.data?.identify_provider==='open'?'open':'meta'}/>:null}
      <Link href="/profile/deleted" className="flex min-h-tap items-center px-screen-x text-detail desktop:px-0">Recently deleted</Link>
      <ProfileGrid posts={posts} />
    </main></DesktopWorkspace>
  );
}
