import { readAgentText } from '@/lib/agents/request-body';
import { authenticateBearer, agentErrorResponse, AgentError } from '@/lib/agents/tokens';
import { AGENT_TOOLS } from '@/lib/agents/mcp-tools';
import { callTool, type AgentArgs } from '@/lib/agents/ops';
import { kickoffAgentWork } from '@/lib/agents/kickoff';
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
export async function POST(request: Request) {
  try {
    const raw = await readAgentText(request);
    let body: unknown;
    try { body = JSON.parse(raw); } catch {
      await authenticateBearer(request);
      return Response.json(rpcError(null, -32700, 'Parse error'));
    }
    const batch = Array.isArray(body);
    const requests: unknown[] = Array.isArray(body) ? body : [body];
    const identity = await authenticateBearer(request, requests.length);
    if (!requests.length) return Response.json(rpcError(null, -32600, 'Invalid Request'));
    let work = false;
    const responses = [];
    for (const entry of requests) {
      const rpc = entry as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown } | null;
      if (!rpc || typeof rpc !== 'object' || rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string' ||
        (rpc.id !== undefined && rpc.id !== null && typeof rpc.id !== 'number' && typeof rpc.id !== 'string')) {
        responses.push(rpcError(null, -32600, 'Invalid Request')); continue;
      }
      const notification = !Object.hasOwn(rpc, 'id');
      const params = rpc.params;
      let result: unknown;
      let error: { code: number; message: string } | undefined;
      switch (rpc.method) {
        case 'initialize': result = { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'my-food-ai', version: '1.0.0' } }; break;
        case 'notifications/initialized': break;
        case 'ping': result = {}; break;
        case 'tools/list': result = { tools: AGENT_TOOLS }; break;
        case 'tools/call': {
          if (!params || typeof params !== 'object' || Array.isArray(params)) { error = { code: -32602, message: 'Invalid params' }; break; }
          const { name, arguments: args = {} } = params as { name?: unknown; arguments?: unknown };
          if (!args || typeof args !== 'object' || Array.isArray(args)) { error = { code: -32602, message: 'Invalid params' }; break; }
          try {
            const data = await callTool(identity, name, args as AgentArgs);
            work ||= name === 'log_meal' || name === 'correct_meal';
            result = { content: [{ type: 'text', text: JSON.stringify(data) }] };
          } catch (failure) {
            result = { content: [{ type: 'text', text: failure instanceof AgentError ? failure.message : 'The request could not be completed' }], isError: true };
          }
          break;
        }
        default: error = { code: -32601, message: 'Method not found' };
      }
      if (!notification) responses.push(error ? rpcError(rpc.id, error.code, error.message) : { jsonrpc: '2.0', id: rpc.id, result: result ?? {} });
    }
    if (work) kickoffAgentWork(request);
    if (!responses.length) return new Response(null, { status: 202 });
    return Response.json(batch ? responses : responses[0], { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return agentErrorResponse(error); }
}
export function GET() { return new Response(null, { status: 405, headers: { Allow: 'POST, DELETE' } }); }
export async function DELETE(request: Request) {
  try { await authenticateBearer(request); return new Response(null, { status: 204 }); }
  catch (error) { return agentErrorResponse(error); }
}
