import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
export type AgentIdentity = { userId: string; tokenId: string };
export class AgentError extends Error { constructor(message: string, public status = 400) { super(message); } }
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export function randomToken(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'mfa_live_';
  // Rejection sampling keeps all 62 characters equally likely.
  while (token.length < 41) for (const byte of crypto.getRandomValues(new Uint8Array(48))) {
    if (byte < 248 && token.length < 41) token += alphabet[byte % 62];
  }
  return token;
}
export async function createToken(userId: string, name: string, db: SupabaseClient = createAdminClient()) {
  if (typeof name !== 'string' || !name.trim() || [...name.trim()].length > 40 || name.includes('\0')) throw new AgentError('Enter a name up to 40 characters.');
  const token = randomToken();
  const { data, error } = await db.from('agent_tokens').insert({ user_id: userId, name: name.trim(), token_hash: hashToken(token), token_last4: token.slice(-4) }).select('id,name').single();
  if (error || !data) throw new AgentError('The token could not be created.', 503);
  return { id: data.id as string, name: data.name as string, token };
}
/** Count each JSON-RPC batch entry, rather than allowing a batch to bypass the
 * same 60-call limit as the HTTP API. No operation runs on a refused batch. */
export async function authenticateBearer(request: Request, calls = 1, db: SupabaseClient = createAdminClient()): Promise<AgentIdentity> {
  const match = /^Bearer (mfa_live_[A-Za-z0-9]{32})$/i.exec(request.headers.get('authorization') ?? '');
  if (!match) throw new AgentError('Token required', 401);
  const { data, error } = await db.from('agent_tokens').select('id,user_id,revoked_at').eq('token_hash', hashToken(match[1])).maybeSingle();
  if (error) throw new AgentError('Token could not be checked', 503);
  if (!data || data.revoked_at) throw new AgentError('Token required', 401);
  for (let i = 0; i < Math.min(Math.max(calls, 1), 61); i++) {
    const { data: allowed, error } = await db.rpc('agent_hit', { p_token_id: data.id, p_limit: 60 });
    if (error) throw new AgentError('Call limit could not be checked', 503);
    if (!allowed) throw new AgentError('Too many requests', 429);
  }
  if (calls > 60) throw new AgentError('Too many requests', 429);
  const { data: used, error: updateError } = await db.from('agent_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).is('revoked_at', null).select('id').maybeSingle();
  if (updateError) throw new AgentError('Token activity could not be saved', 503);
  if (!used) throw new AgentError('Token required', 401);
  return { userId: data.user_id, tokenId: data.id };
}
export async function revokeToken(db: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await db.from('agent_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', id).is('revoked_at', null).select('id').maybeSingle();
  if (error || !data) throw new AgentError('Token not found', 404);
}
export function agentErrorResponse(error: unknown): Response {
  if (error instanceof SyntaxError) return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  return Response.json({ error: error instanceof AgentError ? error.message : 'The request could not be completed' }, { status: error instanceof AgentError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
}
