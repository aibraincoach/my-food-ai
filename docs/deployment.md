# Deployment

Observed 2026-11-04T13:49:35.672Z: `https://my-food-ai-ten.vercel.app` points to READY deployment `dpl_Df6AGNF8r9vBjiNF2Jh4ghNNYimM`, main `376e3306942161a5e659e8d99c85154c8ac26a35`; `/api/health` returns200. Fleet15 preview success is not a production deployment.

| Part | Where | Declared in |
| --- | --- | --- |
| Vercel functions | iad1 (Washington, D.C., USA, in Northern Virginia) | `vercel.json` `regions` |
| Supabase database | us-east-2 (Ohio) | Supabase project settings; chosen when the project is created, not changeable from the repository |
| Default function timeout | 300 s | Vercel project settings |
| Tick route | 300 s | `src/app/api/jobs/tick/route.ts` `maxDuration` |
| Feed route | 20 s | `src/app/api/feed/route.ts` `maxDuration` |

To reproduce: create the Supabase project in us-east-2, apply reviewed migrations according to [the migration rollout instructions](migrations.md), including the post-deployment activation gate for pending0055, import the repository in Vercel, and set the variables named in `.env.example`. The function region and route timeouts then come from the repository.
