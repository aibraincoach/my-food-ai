# Deployment

Observed November4,2026,14:04:48UTC: `https://my-food-ai-ten.vercel.app` points to READY deployment `dpl_GdXzNdRfDJVVY6mNuADCL72qhBi7`, main `05a38bd3894a1186ce77e518d565d977a2246fb9`. Authorized #585/#587/#588/#589/#590 are deployed; #582/#583/#584/#586 remain open. Migrations0053–0055 are applied and read back. See [the closeout report](run15-report.md).

| Part | Where | Declared in |
| --- | --- | --- |
| Vercel functions | iad1 (Washington, D.C., USA, in Northern Virginia) | `vercel.json` `regions` |
| Supabase database | us-east-2 (Ohio) | Supabase project settings; chosen when the project is created, not changeable from the repository |
| Default function timeout | 300 s | Vercel project settings |
| Tick route | 300 s | `src/app/api/jobs/tick/route.ts` `maxDuration` |
| Feed route | 20 s | `src/app/api/feed/route.ts` `maxDuration` |

To reproduce: create the Supabase project in us-east-2, apply reviewed migrations according to [the migration rollout instructions](migrations.md), including the post-deployment activation gate for pending0055, import the repository in Vercel, and set the variables named in `.env.example`. The function region and route timeouts then come from the repository.
