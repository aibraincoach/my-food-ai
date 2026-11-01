# Production demo checklist

Historical checklist, retained from #235. The former unrun status is superseded by [the two functional runs](demo.md) and [verified timed rehearsal](demo-rehearsal.md). Hardware camera and phone-specific checks remain unproven; this checklist itself is not new execution evidence.

For each run, record the deployed main commit, time and pass/fail outcome for each step. Record concrete failures and open a separate fix PR for each change; never mark a partial sequence complete.

1. Sign in with the ordinary test account and open Home.
2. Open Capture. Confirm the live camera, flip and shutter on a real phone. Separately deny camera access and confirm the gallery/picker fallback. Use `eval/photos/01.jpg` when a camera photo is unavailable.
3. Post a meal. Measure from successful creation to its appearance as the first Home card: at most five seconds, with no reload. Wait for analysis to replace processing with no reload.
4. Open detail. Show outlines, food names, portions and nutrition. Confirm the displayed values describe consumed food and identify USDA FoodData Central as the nutrient source.
5. Correct a food or portion. Show both earlier and corrected entries in the thread; verify that totals and the stored card change.
6. Create a needs-input case, answer its question and confirm the completed meal enters Home. Separately discard an unwanted case.
7. Open Days and the day's story. Confirm meal slides and totals use the current item versions.
8. Return to Home, sign out and sign back in. Confirm the account's private data remains isolated.

Keep cleanup identifiers in a private local file and remove only the posts created for these runs. Optional push delivery is checked only on a subscription the owner created on their own device.

| Evidence | Run 1 | Run 2 |
| --- | --- | --- |
| Main commit | See recorded run1 in demo.md | See recorded run2 in demo.md |
| Run time | See demo.md | See demo.md |
| Full sequence | Functional checks with stated limits | Functional checks with stated limits |
| Failures and fix PRs | Preserved in demo.md | Preserved in demo.md |

The final demo worker concurrency remains **1** unless a completed production load test supports a change. See [load-test evidence](load-test.md) and [meal photo evaluation](eval.md). Page comparisons and the final test pass must be recorded after the last implementation item's code is written.
