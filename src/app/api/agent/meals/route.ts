import { authenticateBearer, agentErrorResponse } from '@/lib/agents/tokens';
import { listMeals, logMeal } from '@/lib/agents/ops';
import { kickoffAgentWork } from '@/lib/agents/kickoff';
export async function POST(request: Request) {
  try {
    const identity = await authenticateBearer(request);
    const result = await logMeal(identity, await request.json());
    kickoffAgentWork(request);
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return agentErrorResponse(error); }
}
export async function GET(request: Request) {
  try {
    const identity = await authenticateBearer(request);
    const search = new URL(request.url).searchParams;
    return Response.json(await listMeals(identity, { ...(search.has('from') ? { from: search.get('from') } : {}), ...(search.has('to') ? { to: search.get('to') } : {}), ...(search.has('limit') ? { limit: Number(search.get('limit')) } : {}) }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return agentErrorResponse(error); }
}
