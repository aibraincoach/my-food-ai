'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createToken, revokeToken, AgentError } from '@/lib/agents/tokens';
import { isUuid } from '@/lib/posts/items';
export async function createTokenAction(name: string) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { message_code: "route_ac6a88b19530" };
  try { const result = await createToken(user.id, name); revalidatePath('/profile'); return result; }
  catch (error) { return { message_code: error instanceof AgentError ? error.message_code : "route_e9844fc0e758" }; }
}
export async function revokeTokenAction(id: string) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { message_code: "route_ac6a88b19530" };
  if (!isUuid(id)) return { message_code: "route_4441b4b45947" };
  try { await revokeToken(db, id); revalidatePath('/profile'); revalidatePath('/profile/agents'); return { ok: true }; }
  catch (error) { return { message_code: error instanceof AgentError ? error.message_code : "route_55b90e3fb6ef" }; }
}
