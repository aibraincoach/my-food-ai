# Run 8 tick startup

The production registry uses fixed lazy module imports. Tick can inspect the queue without importing any job; only a dispatched job loads its module. `runJob`, drain and test-supplied tables retain their behavior.

The planned `grep -c "pngjs\|web-push" .next/server/app/api/jobs/tick/route.js` reports **0 on main and 0 on this change**. The bundled entrypoint delegates to chunks, so this count does not establish dependency loading. Both builds passed. No improvement is inferred from this grep.

A direct Node/tsx import checkpoint compares the original main registry with the lazy registry in separate processes. This is local module initialization, not a cold Vercel invocation; measurements and Vercel timings are recorded below as they become available.

The existing registry test prohibited every dynamic import, contrary to this plan. It now checks that imports use six fixed literal module paths and that drain contains no dynamic import. Its unknown-kind, inherited-kind, frozen-table and test-supplied dispatch assertions are retained.

## Preview cold calls

Pending deployment and six observations: first requested tick after deployment, followed by five requests separated by fifteen-minute idle gaps. These are wall-clock observations, not a guaranteed cold-instance classifier. Production has its own six-call series after merge. Calls may drain eligible work through the existing tick route; no additional job is created for this measurement.

## Local import checkpoint

```json
{"kind":"main","ms":928.051111,"pngjs":22,"webPush":7}
{"kind":"head","ms":28.84728700000001,"pngjs":0,"webPush":0}
```
