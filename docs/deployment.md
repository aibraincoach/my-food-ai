# Deployment

| Part | Where | Declared in |
| --- | --- | --- |
| Vercel functions | iad1 (Washington, D.C., USA, in Northern Virginia) | `vercel.json` `regions` |
| Supabase database | us-east-2 (Ohio) | Supabase project settings; chosen when the project is created, not changeable from the repository |
| Default function timeout | 300 s | Vercel project settings |
| Tick route | 300 s | `src/app/api/jobs/tick/route.ts` `maxDuration` |
| Feed route | 20 s | `src/app/api/feed/route.ts` `maxDuration` |

To reproduce: create the Supabase project in us-east-2, apply `supabase/migrations` in number order, import the repository in Vercel, and set the variables named in `.env.example`. The function region and route timeouts then come from the repository.

## Verified production — November 4, 2026

Observed 2026-11-04T07:02:53Z: main 299f13a49af5320cb81d4cdf4e9de14263214a96 is READY as deployment dpl_2CxQa5FWdy2GPTuZ2cqTZxcVm9nD; my-food-ai-ten.vercel.app points to it and alias assignment is complete. #545 is the old-fleet docs merge in that revision; Fleet 13 code already merged before it. Migrations 0050/0051 were applied and read back during Fleet 13, not during this reconciliation. #558 remains an unmerged document branch. Deployment identity is not proof of physical-phone behavior.
