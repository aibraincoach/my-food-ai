# Fleet 16 review-route evidence

Each submission is exactly `code review https://github.com/aibraincoach/my-food-ai/pull/<number>`. Original/repaired runner errors are automation failures; no PPLX quota exhaustion is asserted.

## PR #605

Fleet 16 review-route evidence · head at that attempt 8df64f968ebce17842fb2d6c4beeb52958b3ee94

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/605

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: 8df64f968ebce17842fb2d6c4beeb52958b3ee94
Model proof: model_preference = gemini38flash
Elapsed since Enter: 68.9s
Elapsed since tab open: 126.0s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/605

Automation capture deadline: 126.0s since tab open (limit 120s), 68.9s since Enter


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #606

Fleet 16 review-route evidence · head at that attempt 5f6871f47d843f766e636dae2e7d21abe4a5d8d3

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/606

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: 5f6871f47d843f766e636dae2e7d21abe4a5d8d3
Model proof: model_preference = gemini38flash
Elapsed since Enter: 52.1s
Elapsed since tab open: 123.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/606

Automation capture deadline: 123.5s since tab open (limit 120s), 52.1s since Enter


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #607

Fleet 16 review-route evidence · head at that attempt 422ae2ffc89ecd9f883b09b2e299cb5900de8862

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/607

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: 422ae2ffc89ecd9f883b09b2e299cb5900de8862
Model proof: model_preference = gemini38flash
Elapsed since Enter: 44.3s
Elapsed since tab open: 121.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/607

Automation capture deadline: 121.2s since tab open (limit 120s), 44.3s since Enter


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #608

Fleet 16 review-route evidence · head at that attempt 142b42874fd4f62028701eb887ae29254ffd5a53

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/608

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: 142b42874fd4f62028701eb887ae29254ffd5a53
Model proof: model_preference = gemini38flash
Elapsed since Enter: 37.5s
Elapsed since tab open: 121.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/608

Answer
Links
Images
Share
7:33 AM

code review 
 aibraincoach/my-food-ai#608

Finished
21s
Review result

Changes requested. I found two correctness issues in PR #608 at commit 142b428. The new guard is applied to both ordinary matching and the closest-generic fallback, but its exclusion parsing can allow incompatible references through.

1. [P2] Multiword components collapse to the same first word

Location: src/lib/fdc/exclusions.ts:2–6

The regex captures only the first

You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol

The autogenerated PPLX receipt is INVALID and does not count: incomplete answer, footer identifies GPT-6.1 Sol although request proof is gemini38flash. Its partial multiword-exclusion finding is being investigated. No merge gate pass.

Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #609

Fleet 16 review-route evidence · head at that attempt 1794affa85fd8f68bbf5c4c0e636fc92716caf22

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/609

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: 1794affa85fd8f68bbf5c4c0e636fc92716caf22
Model proof: model_preference = gemini38flash
Elapsed since Enter: 38.8s
Elapsed since tab open: 120.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/609

Answer
Links
Images
Share
7:33 AM

code review 
 aibraincoach/my-food-ai#609

Working
38s
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #610

Fleet 16 review-route evidence · head at that attempt 994a11b48cb696d3c2f35039abd07651d375bbe1

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/610

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: 994a11b48cb696d3c2f35039abd07651d375bbe1
Model proof: model_preference = gemini38flash
Elapsed since Enter: 40.4s
Elapsed since tab open: 120.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/610

Answer
Links
Images
Share
7:33 AM

code review 
 aibraincoach/my-food-ai#610

Finished
25s
Review verdict

Approve, with a small testing

You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #611

Fleet 16 review-route evidence · head at that attempt 4f8c2a10c6feaf05ab44dce212a8baf3abe65048

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/611

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: 4f8c2a10c6feaf05ab44dce212a8baf3abe65048
Model proof: model_preference = gemini38flash
Elapsed since Enter: 40.3s
Elapsed since tab open: 120.7s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/611

Answer
Links
Images
Share
7:33 AM

code review 
 aibraincoach/my-food-ai#611

Finished
21s
Review: changes requested

I found two layout regressions

You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #612

Fleet 16 review-route evidence · head at that attempt f3efb1769d210f39f2cac001b803449116a3ea15

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/612

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: f3efb1769d210f39f2cac001b803449116a3ea15
Model proof: model_preference = gemini38flash
Elapsed since Enter: 39.5s
Elapsed since tab open: 121.9s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/612

Answer
Links
Images
Share
7:33 AM

code review 
 aibraincoach/my-food-ai#612

Working
31s
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #613

Fleet 16 review-route evidence · head at that attempt e28aae131ef00432568aff24447462928dd2f2ad

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/613

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: e28aae131ef00432568aff24447462928dd2f2ad
Model proof: model_preference = gemini38flash
Elapsed since Enter: 34.4s
Elapsed since tab open: 120.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/613

Answer
Links
Images
Share
7:33 AM

code review 
 aibraincoach/my-food-ai#613

Working
32s
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #614

Fleet 16 review-route evidence · head at that attempt 5896834c0d872d509fdce433bb03e50fd8d6840a

Exact intended/submitted text: code review https://github.com/aibraincoach/my-food-ai/pull/614

Route 1: original runner reported No input found during live page inspections. Live route-2 inspection in the same authenticated Firefox showed a signed-in Perplexity composer, not Cloudflare; the removed #ask-input selector was the cause. A temporary runner using the actual contenteditable textbox submitted the same exact prompt; current capture follows.

Head at submission: 5896834c0d872d509fdce433bb03e50fd8d6840a


No input found during live page inspections (11.4s); inspect browser/authentication


Route 4: live SSH to the other OCI host succeeded; running its expected runner path returned Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs' (MODULE_NOT_FOUND). That host has no Firefox or authenticated profile.

Moving to AGY fallback per Fleet 16 plan; no counting PPLX review claimed.


## PR #616 · final head6109ab1688d68f77e33743ac56ec60f1afd05148

Exact submitted prompt: `code review https://github.com/aibraincoach/my-food-ai/pull/616`.

PPLX runner on the same authenticated Firefox, with the repaired contenteditable selector: complete review, captured request model_preference=gemini38flash; no blocking issues. Counting receipt and zero-finding triage are under docs/reviews/mfa-pplx-pr616-6109ab1*.md. The follow-up composer label is preserved verbatim and not substituted for the runner's required network proof.

Route4 was also attempted live via SSH: `node /home/opc/Projects/my-food-ai/tools/pplx-review.mjs --tabs 1 https://github.com/aibraincoach/my-food-ai/pull/616 --out /tmp/run16-pplx-reviews`. Exact error: `Error: Cannot find module '/home/opc/Projects/my-food-ai/tools/pplx-review.mjs'`, `MODULE_NOT_FOUND`. No remote prompt was submitted. Raw stderr: route4-pr616.log. No AGY fallback needed on this head because its PPLX runner review counted.
