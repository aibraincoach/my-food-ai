"use server";

import { verifiedUserId } from "@/lib/auth/verified-user";
import { createClient } from "@/lib/supabase/server";

type HintKey = "capture" | "thread" | "thumbs" | "modes";
const isHint = (key: string): key is HintKey => ["capture", "thread", "thumbs", "modes"].includes(key);

export async function getHintState(key: HintKey): Promise<{ userId: string; seen: boolean } | null> {
  if (!isHint(key)) return null;
  const client = await createClient();
  const verified = await verifiedUserId();
  if (!verified) console.info("auth verify hint");
  const user = verified ? { id: verified } : (await client.auth.getUser()).data.user;
  if (!user) return null;
  const { data, error } = await client.from("profiles").select("hints_seen").eq("id", user.id).single();
  if (error || !data) return null;
  return { userId: user.id, seen: (data.hints_seen as string[]).includes(key) };
}

export async function dismissHint(key: HintKey): Promise<void> {
  if (!isHint(key)) throw new Error("Unknown hint.");
  const client = await createClient();
  const { error } = await client.rpc("dismiss_hint", { hint_key: key });
  if (error) throw new Error("Hint could not be saved.");
}
