Head at submission: e31a6e8bf0ce73be326e070c157aa9a59379de75
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 27.8s
Elapsed since tab open: 31.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/638

Answer
Links
Images
Share
11:10 AM

code review 
 aibraincoach/my-food-ai#638

Finished
17s

PR #638 (Fleet 18 item 7: home-once) consolidates Home server reads, adds a today_summary RPC and /api/today endpoint, and replaces constant 2-second feed polling with Realtime-aware exponential backoff. The overall direction is solid, though there are a few bugs in DesktopToday and redundant work in homeToday worth addressing.

Bugs in DesktopToday slow/error handling

Inverted slowTimer condition: In src/components/DesktopToday.tsx, if (!initial) load(); else slowTimer = setTimeout(...) only starts the 3-second slow timer when initial is already provided, meaning slow never triggers when initial is undefined and /api/today hangs.

Unnecessary effect churn: Including day in the useEffect dependency array causes all window event listeners (post-settled, post-deleted, post-restore, intake-changed) to tear down and re-register whenever day updates.

Unguarded retry buttons: The two "Try again" button onClick handlers duplicate the fetch('/api/today?...') call without an AbortController or unmount guard.

Redundant reads in homeToday

Sequential RPC and getDays calls: In src/lib/posts/home-today.ts, homeToday() awaits supabase.rpc("today_summary", { p_zone: zone }) and then sequentially awaits getDays(supabase, userId, zone, today, today).

Unused RPC fields: today_summary computes posted and pending counts, but homeToday() discards both and still relies on getDays() for posts, fibre_g, sugar_g, sodium_mg, and missing. Running both in parallel with Promise.all would cut latency, or getDays() alone could supply the view if pending is not needed.

Migration 0057 and SQL safety

Consistent null handling for macros: In supabase/migrations/0057_today_summary.sql, kcal returns null when known_cal = 0 and missing_cal > 0, whereas protein_g, carbs_g, and fat_g always return 0 via coalesce(sum(...), 0) even when all items lack nutrition data.

Good security posture: The function uses security invoker, pins search_path = public, pg_temp, scopes rows to auth.uid(), and includes a clean rollback script and disposable-DB test in tests/db/today-summary.test.mjs.

Feed polling and timezone refresh

Realtime-gated backoff: Replacing the fixed 2-second setInterval in src/components/Feed.tsx with scheduleDiscoverPoll (5s to 60s backoff, paused when feed-inserts is SUBSCRIBED or document.hidden is true) cleanly reduces background traffic. When the tab becomes visible again while Realtime is disconnected, focus triggers discover(true) but does not reset discoverBackoffMs or restart discoverPoll if the timer had stopped while hidden.

Calendar-date refresh guard: Updating src/components/LocalTimeZone.tsx to skip router.refresh() when dateInZone(now, local) === dateInZone(now, zone) avoids unnecessary RSC refreshes when timezone differences do not change the local date.

Show me how to fix the slowTimer bug
Rewrite homeToday to use Promise.all
Check migration 0057 for SQL safety
Review the Realtime backoff logic
Draft a comment for PR #638
Sources
⠏
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen