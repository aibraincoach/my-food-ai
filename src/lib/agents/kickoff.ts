import { after } from 'next/server';
export function kickoffAgentWork(request: Request) {
  after(async () => {
    try { await fetch(new URL('/api/jobs/tick', request.url), { cache: 'no-store', signal: AbortSignal.timeout(10000) }); }
    catch { /* The queued job is picked up by the worker's next wake. */ }
  });
}
