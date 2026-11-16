Triage reviewer: Codex source verification; head 5738da3a01c3c34cc06c7c285caeaef8ed8c4b55
Real, nonblocking trade-off: the short Home page performs one preceding ID-only discovery query. It preserves commit ordering without assuming application/database clock alignment, and replaces repeated full-card hydration of older off-page meals. Production latency impact is not measured.
Not real as a new current defect: JSON.stringify revision comparison already existed, and the RPC returns a stable two-field shape. Hypothetical future key-order changes are outside this patch.
Validation:32targeted cases plus the selected real-reader fence case pass; revision and discovery controls fail without their fixes; a fresh Firefox profile shows six ready cards and zero feed/ID requests in15.012seconds. Existing processing/realtime/focus recovery tests remain passing. The earlier dirty-profile observation is not a passing check.
No production request-count claim or merge authority follows from the review. New full head requires its own independent read and exact-head PM order.
Blocking findings: 0
Real findings: 1 (nonblocking observations retained)
