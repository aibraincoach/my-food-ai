import { authenticateBearer, agentErrorResponse } from '@/lib/agents/tokens';
import { correctMeal, getMeal } from '@/lib/agents/ops';
import { kickoffAgentWork } from '@/lib/agents/kickoff';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try { return Response.json(await getMeal(await authenticateBearer(request), (await params).id), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return agentErrorResponse(error); }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const identity = await authenticateBearer(request);
    const body = await request.json();
    const result = await correctMeal(identity, (await params).id, body?.text);
    kickoffAgentWork(request);
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return agentErrorResponse(error); }
}
