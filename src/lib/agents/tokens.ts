import type {ApiMessageCode} from '@/i18n/api-codes';
import {machineMessage} from '@/i18n/machine-messages';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
export type AgentIdentity = { userId: string; tokenId: string };
export class AgentError extends Error { constructor(readonly message_code: ApiMessageCode, public status = 400) { super(machineMessage(message_code)); } }
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
  if (typeof name !== 'string' || !name.trim() || [...name.trim()].length > 40 || name.includes('\0')) throw new AgentError("route_5e56bcb7c8d1");
  const token = randomToken();
  const { data, error } = await db.from('agent_tokens').insert({ user_id: userId, name: name.trim(), token_hash: hashToken(token), token_last4: token.slice(-4) }).select('id,name').single();
  if (error || !data) throw new AgentError("route_e9844fc0e758", 503);
  return { id: data.id as string, name: data.name as string, token };
}
/** Count each JSON-RPC batch entry, rather than allowing a batch to bypass the
 * same 60-call limit as the HTTP API. No operation runs on a refused batch. */
export async function authenticateBearer(request: Request, calls = 1, db: SupabaseClient = createAdminClient()): Promise<AgentIdentity> {
  const match = /^Bearer (mfa_live_[A-Za-z0-9]{32})$/i.exec(request.headers.get('authorization') ?? '');
  if (!match) throw new AgentError("route_9ebe5656058e", 401);
  const { data, error } = await db.from('agent_tokens').select('id,user_id,revoked_at').eq('token_hash', hashToken(match[1])).maybeSingle();
  if (error) throw new AgentError("route_eae7adbc54c7", 503);
  if (!data || data.revoked_at) throw new AgentError("route_9ebe5656058e", 401);
  const increment = Math.min(Math.max(calls, 1), 61);
  const { data: allowed, error: hitError } = await db.rpc('agent_hit', { p_token_id: data.id, p_limit: 60, p_increment: increment });
  if (hitError) throw new AgentError("route_3e6b7ba7b910", 503);
  if (!allowed || calls > 60) throw new AgentError("route_802600d12446", 429);
  // agent_hit checks revocation, consumes the whole batch and records last use
  // under one token lock, rather than one RPC per entry plus a second write.
  return { userId: data.user_id, tokenId: data.id };
}
export async function revokeToken(db: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await db.from('agent_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', id).is('revoked_at', null).select('id').maybeSingle();
  if (error || !data) throw new AgentError("route_4441b4b45947", 404);
}
export function agentErrorResponse(error: unknown): Response {
  if (error instanceof SyntaxError) return Response.json({ error: machineMessage("route_f60c824125e6") }, { status: 400 });
  return Response.json({ error: error instanceof AgentError ? error.message : machineMessage("route_91d213c5adb6") }, { status: error instanceof AgentError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
}
