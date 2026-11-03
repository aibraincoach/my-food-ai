# Run 8 tick startup

The production registry uses fixed lazy module imports. Tick can inspect the queue without importing any job; only a dispatched job loads its module. `runJob`, drain and test-supplied tables retain their behavior.

The planned `grep -c "pngjs\|web-push" .next/server/app/api/jobs/tick/route.js` reports **0 on main and 0 on this change**. The bundled entrypoint delegates to chunks, so this count does not establish dependency loading. Both builds passed. No improvement is inferred from this grep.

A direct Node/tsx import checkpoint compares the original main registry with the lazy registry in separate processes. This is local module initialization, not a cold Vercel invocation; measurements and Vercel timings are recorded below as they become available.

The existing registry test prohibited every dynamic import, contrary to this plan. It now checks that imports use six fixed literal module paths and that drain contains no dynamic import. Its unknown-kind, inherited-kind, frozen-table and test-supplied dispatch assertions are retained.

## Preview cold calls

The owner replaced fifteen-minute idle gaps with **one-second gaps** during the run. The six-call preview and final production series below are rapid repeated observations; they do not classify or establish cold instances. No fifteen-minute wait was launched.

| Call | Preview total ms | Production total ms |
| --- | ---: | ---: |
| 1 | 729.3 | 322.5 |
| 2 | 339.9 | 195.1 |
| 3 | 207.2 | 282.8 |
| 4 | 251.6 | 109.5 |
| 5 | 210.3 | 126.9 |
| 6 | 153.6 | 176.2 |

Every call returned 200. Preview queue was two future jobs/running zero; final production queue/running were both zero. Production revision is `6996817cec6aaf865357e9fee6550abf27cdfd0f`. Owner-authenticated page and model/worker behavior were checked separately. [Final report](run8-final-report.md).

## Local import checkpoint

```json
{"kind":"main","ms":928.051111,"pngjs":22,"webPush":7}
{"kind":"head","ms":28.84728700000001,"pngjs":0,"webPush":0}
```
