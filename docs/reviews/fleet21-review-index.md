# Fleet 21 review provenance

`fleet21-review-status.json` records exact-head review history. Original entries are explicitly marked historical; appended remediation entries identify their fresh reviewed heads and evidence scope. Every entry records a reviewed head and source triage of that capture. Zero real findings after triage does not mean the reviewer returned no findings, or that runtime and production checks passed.

For #922, the d81ac4e entry covers only that earlier docs head. The separately preserved [bca0a1c receipt](mfa-pplx-pr922-bca0a1c.md) names full head bca0a1cb661d6b4ab3963cb9f42f997f455d0de5 and approves those documents. It does not cover later edits. A receipt committed afterwards necessarily names an ancestor; current-head reviews must be matched against the full SHA in the live PR receipt before any merge order. Never infer current-head approval from this manifest.

The independent source investigation found blockers on #911, #912 and #915 despite prior review receipts. Their old clearances are superseded for merge readiness. Fresh remediation captures and triage are recorded for #911 at 16348f08d970266777f4cc3d0f5127716d065037, #912 at 50ea5f705075741b04c605b23fb7d4306dc3bfab and #915 at 90819a1fd24f5b92673eb9a9126184783b99002b. Nonblocking observations are retained rather than called nonexistent. No review or this index authorizes a merge or production migration.

The retained runtime receipts remain builder-produced measurements independently inspected afterwards. No combined build, suite or runtime pass can be inferred from separate branch passes. See [validation corrections](../evidence/fleet21/validation-notes.md).

Later follow-up heads supersede the corresponding earlier remediation entries: #911 a151ef033c670613ccabbeb8fd6b39fc4e17b662; #914 6380874b77387ddee9d6feac59d7a5ed4775afdd; #916 5738da3a01c3c34cc06c7c285caeaef8ed8c4b55. Their fresh captures and triage are appended to the manifest; this does not waive their independent evaluation or merge hold. The current-head/merged-commit table is the updated evidence README.
