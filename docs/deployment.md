# Deployment

> Owner override, November4 at16:15 WIB: the Vercel protection-bypass secret stays in place and is never revoked or listed for revocation. Preserve reviewer/coder access. This supersedes any older cleanup instruction; no revocation was performed. Before filing a reviewer/planner suggestion, the PM checks what access or functionality it would remove.

## Fleet14 production — November 4, 2026

Latest runtime, observed10:02UTC: main376e3306942161a5e659e8d99c85154c8ac26a35 is READY as dpl_Df6AGNF8r9vBjiNF2Jh4ghNNYimM after#581. Alias identity, health200 and an authenticated v2 image200 were verified. #579 has23 final targeted test passes and two complete external reviews; its whole tree was not rerun through the original603-test suite. [Validation](evidence/issue579/validation.md), [production proof](evidence/issue579/production.json). The paragraph below records the original seven-PR Fleet14 deployment.

## Fleet 15 production — November 4, 2026



Observed November4,2026,14:04:48UTC: `https://my-food-ai-ten.vercel.app` points to READY deployment `dpl_GdXzNdRfDJVVY6mNuADCL72qhBi7`, main `05a38bd3894a1186ce77e518d565d977a2246fb9`. Authorized #585/#587/#588/#589/#590 are deployed; #582/#583/#584/#586 remain open. Migrations0053–0055 are applied and read back. See [the closeout report](run15-report.md).

Main a24587a1ec3b57a7b2bdfb5f69cce4e0e73602db is READY as dpl_24RqPXLfHT5iuV9ZJEnADjoNzgFS; the production alias is verified and health200. All seven feature PRs are merged, migration0052 applied/read back with service-only permissions. The whole deployed tree equals the603-test/39-DB tested tree. Deployment identity does not establish physical-phone acceptance. Fleet14 docs remain unmerged.

To reproduce: create the Supabase project in us-east-2, apply reviewed migrations according to [the migration rollout instructions](migrations.md), including the post-deployment activation gate for pending0055, import the repository in Vercel, and set the variables named in `.env.example`. The function region and route timeouts then come from the repository.
