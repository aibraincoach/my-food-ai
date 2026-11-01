# Timed production rehearsal, Nov 1

The shortest **fully checked, uncut screen rehearsal** observed in this follow-up took **51.287 seconds** on production runtime `44576592955ce576b2a66f875518d18a4ebb8bd4`, READY before the run. It ran at 01:12:27–01:13:18 UTC on 2026-11-01. This is an observed example, not a worst-case promise or a finished narrated submission video.

The recording uses a real browser at 390×844, the configured #203 test-account sign-in helper, and actual gallery files through capture. It includes a five-second spoken-introduction allowance, actual upload/analysis/correction waits and navigation. There is no audio track. The human password-entry path, hardware camera and owner’s mobile network are not represented by this timing; those remain in the [phone checklist](phone-acceptance.md).

There were no edits, accelerated waits, fabricated responses, seeded outcomes, direct database writes, manual ticks or manual job retries. The two fresh photo posts each made actual SAM and identify calls on this runtime; neither used a copied prior analysis. The recording preserves real inter-frame intervals when encoded at 15 fps. Its encoded duration rounds to approximately 51.3 seconds.

| Elapsed seconds | Visible step |
| ---: | --- |
| 0.000 | Empty sign-in page; five-second introduction allowance begins |
| 6.000 | Configured test helper sign-in reached the feed |
| 10.082 | Licensed spaghetti photo published through capture |
| 24.432 | Ready meal visible in the feed |
| 25.222 | Detail photo and SAM outline controls visible; outlines toggled |
| 27.669 | Plain-language correction submitted: spaghetti was 150 grams |
| 33.637 | Thread scrolled so original 314 kcal, user correction and revised 236 kcal were all visible together |
| 40.029 | Second real capture published: pancake photo with conflicting grilled-salmon caption |
| 46.354 | Genuine needs-input strip for that new post visible |
| 51.282 | Days shown after a visible hold; recording stopped at 51.287 |

Initial post `c069f60e-5ef8-4082-89b1-a199cc23f2d6` retained the original estimated 200 g row, superseded it with 150 g, and kept all three thread entries. Its initial analysis finished in 14.229 seconds and correction in 4.678 seconds, each on attempt one with no error. Display rounding changed 314 kcal to 236 kcal. Portions are estimates; this does not establish nutritional ground truth.

Question post `e43ac7dc-128a-4032-b530-f5463a37618b` finished its analysis job on attempt one, stored no invented meal items, and actually asked whether the user ate the caption’s grilled salmon or the photographed pancakes. This was a newly generated question, not an older strip already on the account. The script shows the strip as the submission outline requires; answering and discarding were exercised in the [earlier functional runs](demo.md), not counted as extra features inside this short rehearsal.

## Recording verification and limits

After recording, database reads verified both jobs, the correction, immutable item history and the genuine question. The captured thread frame was checked visually: both numerical versions and the user correction fit inside the viewport. The final frame was also checked to confirm Days had rendered, rather than counting a loading route as completion.

Earlier attempts are retained as development evidence and excluded from the accepted time. Three partial attempts encountered native-driver navigation/menu timing and never completed the whole flow. Two later candidates measured 64.227 and 50.316 seconds and did reach Days, but review of their frames showed the final correction body below the viewport. They therefore do not qualify as the shortest complete visual demonstration. The accepted run explicitly scrolls the thread before continuing. These recovery attempts did not require an application code change.

The first test account's Days screen also contains a very long list of historical unavailable-food names. It crowds that account's calendar. This observation remains visible in the accepted recording and is not called a polished layout. A separate candidate on the second configured account showed a clean calendar. No historical record was deleted merely to improve the footage.

The accepted local recording is `production-demo-verified-uncut.mp4` under the performance evidence directory, alongside `run6/timeline.json`, `run6/ui-evidence.json`, `run6/stored-proof.json`, `run6/recording.json`, `run6/thread-versions.png` and `run6/days-finish.png`. The owner receives its exact local path in the coder report. It is a rehearsal artifact; the submission video still needs the owner's narration and real-device recording choices.

[Sanitized timestamp and database evidence](performance/2026-11-01-demo-evidence.md).
