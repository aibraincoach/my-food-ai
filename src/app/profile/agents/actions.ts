'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createToken, revokeToken, AgentError } from '@/lib/agents/tokens';
import { isUuid } from '@/lib/posts/items';
export async function createTokenAction(name: string) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: 'Sign in required.' };
  try { const result = await createToken(user.id, name); revalidatePath('/profile'); return result; }
  catch (error) { return { error: error instanceof AgentError ? error.message : 'The token could not be created.' }; }
}
export async function revokeTokenAction(id: string) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: 'Sign in required.' };
  if (!isUuid(id)) return { error: 'Token not found' };
  try { await revokeToken(db, id); revalidatePath('/profile'); revalidatePath('/profile/agents'); return { ok: true }; }
  catch (error) { return { error: error instanceof AgentError ? error.message : 'The token could not be revoked.' }; }
}
