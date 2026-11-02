Head at submission: aa311c68c9eb46e26061dfd7760c0ba2429c857c
Thread: https://www.perplexity.ai/search/450b48ed-5ec3-45cf-a093-60c14ee743a8
Selected model at capture: Gemini 3.8 Flash
Model proof: model_preference = gemini38flash
Elapsed since Enter: 39.5s
Elapsed since tab open: 74.9s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/300
Reopened same thread for complete visible-text capture
Selected model on reopen: Gemini 3.8 Flash

Answer
Links
Images
Share
5:01 AM

code review 
 aibraincoach/my-food-ai#300

Finished
19s

Pull Request 
 aibraincoach/my-food-ai#300 introduces agent token management and an MCP (Model Context Protocol) / REST HTTP interface, allowing external assistants to authenticate, log meals, list meals, and post corrections.

Overall, the architecture is clean and security-conscious: plaintext tokens are never stored, token attribution is protected via PostgreSQL triggers, and rate limiting is enforced at the database level. Below are specific findings, security considerations, and recommendations.

Critical & High Priority Issues
1. Rate Limiting Loop Inefficiency and DB Contention

In src/lib/agents/tokens.ts, rate limit quota consumption runs sequentially inside a JavaScript loop:

typescript
for (let i = 0; i < Math.min(Math.max(calls, 1), 61); i++) {
  const { data: allowed, error } = await db.rpc('agent_hit', { p_token_id: data.id, p_limit: 60 });
  if (error) throw new AgentError('Call limit could not be checked', 503);
  if (!allowed) throw new AgentError('Too many requests', 429);
}

Problem: For a batch of 50–60 JSON-RPC requests, this executes 50–60 distinct round-trip RPC calls sequentially to PostgreSQL before processing any request. This causes latency spikes and row-level contention on agent_token_hits.

Recommendation: Pass p_increment integer default 1 to agent_hit and increment by the batch size in a single atomic SQL call:

sql
insert into public.agent_token_hits(token_id, minute, hits)
values(p_token_id, date_trunc('minute', clock_timestamp()), p_increment)
on conflict(token_id, minute)
do update set hits = public.agent_token_hits.hits + p_increment
returning hits into v_hits;
2. SQL Migration Function Execution Permissions

In supabase/migrations/0031_agent_tokens.sql, the functions public.agent_hit and public.agent_log_meal execute with security definer:

sql
create function public.agent_hit(p_token_id uuid, p_limit integer) returns boolean
language plpgsql security definer set search_path=public,pg_temp as ...

create function public.agent_log_meal(p_user_id uuid, p_token_id uuid, p_caption text, p_eaten_at timestamptz) returns uuid
language plpgsql security definer set search_path=public,pg_temp as ...

Observation: revoke all ... from public,anon,authenticated; and grant execute ... to service_role; are specified.

Verification needed: Confirm whether Next.js server actions / API routes connect via service_role (admin client) or standard authenticated client. In src/lib/agents/tokens.ts and ops.ts, createAdminClient() is used as default, which is correct. Ensure client components never attempt direct RPC invocations for these functions.

Medium Priority & Bug Risks
1. Date Range Validation Bug in listMeals

In src/lib/agents/ops.ts:

typescript
const from = input.from === undefined ? undefined : date(input.from);
const to = input.to === undefined ? undefined : date(input.to);
if (from && to && from > to) throw new AgentError('Invalid date range');

Problem: date() converts date strings (e.g., "2026-11-01") using new Date("2026-11-01").toISOString(), which resolves to 2026-11-01T00:00:00.000Z. If the caller passes from: "2026-11-01" and to: "2026-11-01" expecting meals for that calendar day, from > to is false, but the query uses gte("eaten_at", from).lt("eaten_at", to). Because both equal 2026-11-01T00:00:00.000Z, the range is empty.

Recommendation: Document or normalize full date boundaries when only YYYY-MM-DD is supplied (e.g., set to to end-of-day 23:59:59.999Z when format has no time component).

2. Non-Atomicity Between Rate Check and last_used_at Update

In src/lib/agents/tokens.ts:

If an agent sends concurrent requests simultaneously, multiple threads read the same token row and attempt agent_tokens.update({ last_used_at }). While is('revoked_at', null) protects against revoked tokens, simultaneous updates can trigger write locks on agent_tokens.

Recommendation: Consider updating last_used_at within agent_hit inside Postgres rather than as a separate Supabase query.

3. Client Navigation Interception in TokenShown.tsx

TokenShown.tsx intercepts navigation using a global click listener:

typescript
const click = (event: MouseEvent) => {
  const link = (event.target as Element | null)?.closest('a[href]');
  if (!mayLeave.current && link instanceof HTMLAnchorElement && link.href !== location.href) {
    event.preventDefault(); destination.current = link.href; setLeaving(true);
  }
};

Risk: In Next.js App Router, <Link> components intercept clicks before native bubbling or handle route prefetching. Relying on capturing DOM click events to prevent navigation can be bypassed by keyboard navigation (Enter on links) or browser gestures.

Recommendation: Pair with standard beforeunload and ensure mobile swipe-back gestures are tested.

Low Priority & Code Quality
1. JSON Payload Limit Enforcement

In src/app/mcp/route.ts:

typescript
const raw = await request.text();
if (raw.length > 65536) return Response.json({ error: 'Request too large' }, { status: 413 });

raw.length checks UTF-16 code units rather than raw byte length (Buffer.byteLength(raw)). While adequate for preventing typical memory exhaustion at 64KB, byte-length checking is more consistent with HTTP body limits.

2. Clean Activity Count Label

In AgentList.tsx:

typescript
const label = row.action === 'posted' ? `Posted a meal${caption}` : row.action === 'read' ? `Read a meal${caption}` : row.action === 'corrected' ? `Corrected a meal${caption}` : `Read ${row.meal_count ?? 0} meals`;

If row.meal_count === 1, it renders "Read 1 meals". Using a pluralizer (e.g. 1 meal vs n meals) would improve polish.

Test Coverage & Positive Highlights

Strong cryptographic design: randomToken() uses crypto.getRandomValues with rejection sampling across 62 characters (no modulo bias). Plaintext tokens are never stored, only SHA-256 hashes.

Database-enforced security: The protect_agent_attribution trigger stops client roles from spoofing or altering agent_token_id.

Owner isolation: RLS policies on agent_tokens and agent_activity strictly bind read and update operations to auth.uid().

Tests: Comprehensive unit tests in tests/agent-tokens.test.mjs and transactional DB tests in tests/db/agent-tokens.test.mjs cover revocation, call limits, and boundary cases.

Show me the refactored rate limiting code
Check the remaining migration script issues
Explain the database trigger security design
Write test cases for the batch rate limiter
Review the REST interface error handling
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash