# Deployment

> Owner override, November4 at16:15 WIB: the Vercel protection-bypass secret stays in place and is never revoked or listed for revocation. Preserve reviewer/coder access. This supersedes any older cleanup instruction; no revocation was performed. Before filing a reviewer/planner suggestion, the PM checks what access or functionality it would remove.

## Fleet14 production — November 4, 2026

Main a24587a1ec3b57a7b2bdfb5f69cce4e0e73602db is READY as dpl_24RqPXLfHT5iuV9ZJEnADjoNzgFS; the production alias is verified and health200. All seven feature PRs are merged, migration0052 applied/read back with service-only permissions. The whole deployed tree equals the603-test/39-DB tested tree. Deployment identity does not establish physical-phone acceptance. Fleet14 docs remain unmerged.

| Part | Where | Declared in |
| --- | --- | --- |
| Vercel functions | iad1 (Washington, D.C., USA, in Northern Virginia) | `vercel.json` `regions` |
| Supabase database | us-east-2 (Ohio) | Supabase project settings; chosen when the project is created, not changeable from the repository |
| Default function timeout | 300 s | Vercel project settings |
| Tick route | 300 s | `src/app/api/jobs/tick/route.ts` `maxDuration` |
| Feed route | 20 s | `src/app/api/feed/route.ts` `maxDuration` |

To reproduce: create the Supabase project in us-east-2, apply `supabase/migrations` in number order, import the repository in Vercel, and set the variables named in `.env.example`. The function region and route timeouts then come from the repository.
