# Fleet 11 cold tick comparison

## Fleet14 measured cold headers — November 4, 2026

Three eager preview deployments each returned x-tick-cold1. Seven production deployment observations produced six cold headers and15 warm reads; one deployment was already warm at the first observation. [Exact deployments/timings](run14-report.md). Five cold samples and ten warm samples are exceeded; no cold state is inferred from deployment creation. The physical-phone worker post remains unproved under #322.

Fresh preview deployments cut from the same main source, `f81987f`: one restores eager imports and one is a source-identical lazy form (empty deployment commit). No request was sent to either tick endpoint before the first curl below. Preview protection was bypassed using a temporary own-project token. These are first-observed request timings, not a platform-instrumented proof of a cold process or a repeated distribution.

Command: `curl --config <private-bypass-config> -sS -o <response> -w '%{http_code} %{time_total}' <fresh-preview>/api/jobs/tick`, three calls per deployment, one second apart.

| Form | Head | First request seconds | Second | Third |
| --- | --- | ---: | ---: | ---: |
| eager | `85b52cf2ca3f190f392dac82061f9c498b5b6b07` | 0.809013 | 0.230098 | 0.164041 |
| lazy | `b0a901a88f0a28f74a2e3f40fd79be54765663cc` | 0.531299 | 0.256762 | 0.178981 |

All six calls returned HTTP 200. The single first-request observation is lower with lazy loading; the warm samples overlap. [Immutable deployment IDs, times and response bodies](evidence/run11-tick/). Phone posting through the worker remains RT under #379. Both throwaway branches/deployments are measurement artifacts and never merge; cleanup is tracked in the execution report.
