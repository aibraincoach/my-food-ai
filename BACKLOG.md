# My Food AI — Backlog†

Last edited: Wednesday 2026-11-04 at 23:53 WIB (UTC+07:00) by Claude, PM

The only job of the PM is to maintain this backlog and keep it completely up to date. Failing to do so is immediately terminable.

## Backlog for Owner

### #212 Barcode and nutrition-label scanning is untested on a phone

Nobody has tried logging a packaged food from its barcode or nutrition label on a phone with a real pack. Every check so far ran in emulation.

The camera sheet has three modes: Photo, Barcode and Text. A barcode photographed in Photo mode is also read: the app reads the barcode first and looks it up, and uses the AI model only when it finds no barcode, and for labels. Photograph a real pack's barcode. The card should show the product name, its nutrition and the pack photo. Then photograph a nutrition label. It should give the same kind of card. Done when both give a correct card on the owner's phone.

### #318 Read the README before recording

Judges read the README first, and the owner has not read it yet.

The README is the front page of the code repository. The owner reads it once it is updated. Done when the owner has read it and listed everything wrong in it.

### #26 The demo video and the submission do not exist yet

Nothing is submitted until the video is recorded and the submission is in. The deadline is Nov 4 at 9 PM EST (Nov 5 at 09:00 WIB).

The submission needs the public code repository, the video link and a list of everyone who worked on it. Judges stop watching at three minutes. The video must show the feature working with live Meta model calls, and say which open Meta model it uses and where it runs: Muse Spark Open on Baseten. Every feature built is in the video, including the not-eaten plate. Post the video to X as soon as it exists. The Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8. It is not confirmed whether the X post must exist before the submission deadline. Code changes go in as soon as they pass review. From the start of recording until the submission is in, nothing is merged or deployed. Done when a video under three minutes is on X and the submission is in.

### #379 The feed and the first photo are untimed on a real phone

Every timing check in Run 7 and Run 8 ran in an emulator. Nobody has timed the feed or the first photo on a physical phone over mobile data.

Check on each of the owner's three phones, with the app installed on the home screen and on mobile data. Done when the feed and the first photo show within two seconds on each phone, the same photos load faster on a second visit and look acceptable, and each failure is reported to the coder.

### Coming back to the installed app on a real phone is unchecked (issue number pending)

Nobody has opened the installed app on a physical phone after leaving it and coming back. An emulator cannot show whether the feed returns at once or whether new posts push the page around.

Check on each of the owner's three phones, with the app installed on the home screen. Done when the feed shows at once on return, new posts appear without the page jumping, and each failure is reported to the coder.

### Posting from a real phone is unchecked (issue number pending)

Nobody has posted a meal from a physical phone since the Run 7 and Run 8 changes. The camera, the keyboard and the photo that gets kept have only been tested in an emulator.

Check on each of the owner's three phones. Done when the camera, the keyboard and posting work, the right photo is kept, the post completes, the camera sheet closes within one second of the tap, and each failure is reported to the coder.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature is in, one pass replaces the default README with a short start-here page. All working files stay in the repository, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed. Done when the README is the start-here page, and a search of the repository for host names, account identifiers and billing details finds only what the owner chose to keep. GitHub already shows this issue closed. It stays here until that is true.

### #578 The leftovers photo and the regular photo post through different code

The app has at least two code paths that post a photo, and the leftovers one is slower and blocks the camera. Other jobs may be done twice in different ways, and nobody has listed them.

The owner asked on Nov 4 for an audit of duplicated work and of how the services fit together, to make the app faster. The first known case is the leftovers photo: it waits for image encoding, two uploads and the attachment steps before it closes the camera, while a regular post hands the work to the upload manager at once. The coder delivered the audit of main with 26 ranked findings and changed no code. The biggest are two photo-upload workflows, several screens that each refresh when a meal finishes, the meal detail waiting for optional services, the same photo delivered under several addresses, and nutrition read twice by the feed. The smallest are the profile handle read by separate readers, serial drink lookups, a photo reloaded during matching, repeated queue counts and a repeated search interpretation. Fleet 15 built rank 1 (the two photo-upload workflows). The other 25 await the owner's ruling. Done when the owner has ruled on each of the 26 findings and each one he accepts is filed as its own item.

## Backlog for GrokBot

Checks and investigations that need the live app and the web, and change no code. GrokBot reports what it finds. A fix becomes its own item for the planner or the designer.

### #370 The camera view stays open for a long time after a photo is taken

After the user taps Post on a photo, the capture sheet stays on screen instead of closing at once. The post should be at the top of the feed within about one second, even on a slow connection, and a failed upload should show on that post.

The wait came from the phone's save of the draft, which queued behind earlier saves that carried the full camera photo and two re-encoded copies. Fleet 17 capped it: the sheet now waits at most 700 ms for that save, while the save and the upload carry on behind it (#619, merged as 3b65a256). The proof is weak. All nine close readings ran after the merge, so nothing shows what the cap changed. Two runs went over one second (1,338 and 1,077 ms), and the pass came only after the test driver added an 8-second gap between posts (final batch 733, 633 and 868 ms). Posts made back to back can still close slowly, which overlaps #571. Production proof is pending. Done when a browser helper posts a 4032 by 3024 photo on the live app on the slow-network profile, the sheet closes within 1 second on three runs out of three, and the top post says "Uploading photo…" in the same second, and a second post made right after the first also closes within 1 second.

### #615 A posted beer disappears and a clarification card takes its place

The owner posted a beer and the post vanished from the feed. A card asking a question appeared in its place. A post must stay on screen from the tap, with the calories of the drink as stated, and the question must reach the owner as a notification.

The cause: when the caption and the photo disagree, the model asks a question and the app marked the post "needs input", and every feed read hid posts in that state. The owner's ruling: the post shows as posted with the drink as stated, and the question sits in the Home strip and arrives as a notification. The strip's X dismisses the question and never deletes the post. "No food found" still holds the post. Fleet 17 built it with a new column, posts.question (migration 0056, applied), and merged it as #620 (58d235f9). The main path works: the post stayed in the feed with its question beside it, the card read "14 g alcohol · 1.0 standard drinks", and answering cleared the question and ran the correction. Two parts were never observed. The notification was not seen, because the test inserted a fake subscription and captured no send log. The X was not proven either, because the test driver read the wrong post and passed on an empty question field. Done when, on the live app with test account 2 or the owner's phone, a beer caption over a mismatching photo keeps the post in the feed with its calories, the strip row shows, the phone gets "Your meal needs a reply", the X dismisses the row on the same screen without a reload, and the post stays. Also check that the beer counts in the day's kcal on Days.

### #348 The card for a drink photo has not been checked on the live app

When you post a photo of a drink and swipe it, a card opens about the drink. That card was marked done without anyone checking it on the live app.

Two test attempts failed. Fleet 14 proved that the cola analysis and its caffeine are saved, but not the card itself. Done when a photo of a drink (coffee, cola, water or beer) shows its card on the live app, on the owner's three phones. A photo of anything that is not a drink, such as a beard, does not count.

### #351 The drink sheet's tiles have not been checked on the live app

The drink sheet shows tiles, and a change set their sizes and order. The issue was closed after a test on a developer's machine, and nobody has seen the result on the live app.

This item does not say which sizes and order are right, because I do not have the text of GitHub issue #351. The coder adds that spec here from the issue and the designer's frames. Done when the sheet on the live app shows the tiles in that size and order, on the owner's three phones.

### #449 The food names do not show before the numbers on a new upload

A new upload shows no food names while its numbers are still being worked out.

Unproven. Nobody has recorded seeing this on a phone, and I cannot read GitHub issue #449 to find out where the claim came from. The claim is that the card discards food names the app has found while the numbers are still being worked out. Observe first: post a new photo on a phone and watch the card until the numbers arrive. If no names show before the numbers, the claim is real. Done when a new upload shows the foods the app has found while the numbers are still being worked out, on the owner's three phones, or the item is closed because the names already show.

### #567 The admin dashboard shows no counts of users and posts

The admin dashboard at /admin shows queue depth, the oldest waiting job, failures, throughput, recent errors and links to per-post model traces. It does not show how many people signed up or how many meals were posted.

The owner asked for a surface for himself on Nov 4. He opened /admin on production and saw Not found. Production has one admin account, the owner's meal account has the role user, and /admin refuses every non-admin with Not found by design, so it is not a missing page. Observe first: find where the dashboard reads its figures, and which read gives user and post totals without exposing any one user's content. Done when the admin account signs in and sees app-wide counts of users, posts, model calls and failures, no other user's photos, captions or email addresses appear, and a non-admin account that opens it is refused. The change (#586) is merged; production proof is pending. The planner notes that it adds a database read on every direct post navigation, which the owner has not ruled on.

### #568 Judges have no page that shows how the app works

A judge who signs up starts with an empty account and nothing that says what the app does or which models it runs. A judge must never see another user's data.

The owner asked for a surface for the judges on Nov 4 and has not said what it shows. The default here is the models the app runs plus the judge's own meals. The coder tested two fresh production accounts on Nov 4. The second account could not read the first one's posts, profile, comments, intake, saved meals or photos by any route tried, and no dedicated judge page exists. One exception: a signed photo link issued to the first account works for anyone who holds it until it expires, and the second account could not obtain one. Observe first: find where a judge account would reach the page, such as Profile. Done when a judge account sees a page showing the models in use and the meals he logged himself, and a second test account cannot read the first account's posts, photos or profile. The change (#583, which explains meal analysis and keeps post pages private) is merged; production proof is pending. The planner notes that it adds a database read on every direct post navigation, which the owner has not ruled on.

### #569 The row of day circles at the top of Home is cut off at the right edge

On the phone, the row of day circles above the feed shows four whole circles and a fifth cut off by the screen edge. The owner wants the row either to scroll or never to show a partly drawn circle.

The owner's phone screenshot on Nov 4 shows Today, Tue 3, Mon 2 and Sun 1 whole, and Sat 31 cut off at the right edge. The designer found the cause: the row needs 386 px but the phone leaves 358 px, and the code clips the row instead of scrolling it. The owner ruled that the row scrolls sideways back in time. The designer redrew it as Round 7 frames 7c and 7d. Today comes first with five whole circles and the edge of a sixth showing, and each swipe stops on a circle. The feed stays on today while the row scrolls. Tapping a circle with posts opens that day, and circles without posts are grey and cannot be tapped. The row starts with 30 days, loads 30 more near the end and stops at the first post, so the last circle is whole. Tapping Home while on Home returns the row to Today. Done when the row matches 7c and 7d on a phone-sized screen and on the owner's three phones. The change (#582) is merged; production proof is pending.

### #572 The closest-food fallback never runs when the model stops after one search

Some foods still show nutrition as unavailable because the new closest-food fallback never runs for them. Pickled ginger is one example.

The planner measured on production that 12 of 119 unavailable results in 14 days stopped after one search, about 10%. The fallback fires only when the model's first decision names a base food, and in these cases it names none. Done when a food whose first decision names no base food gets its own bare name searched, and a test covers that case. The change (#588) is merged; production proof is pending. A reviewer raised that the new estimate format and one database change (migration 0053) break workers still on the old code. The planner rates that lowest, because the worker deploys with the app and a tested rollback exists, but it needs a written answer. Migration 0054 was not in the plan and the owner has not ruled on it.

### #573 The closest-record label is stored on every nutrient entry

The note that a food's numbers come from a similar USDA record is saved inside every nutrient entry of the food's micronutrients JSON, not once per food. This adds bytes to every row that uses the fallback.

The planner flagged this against the egress concern in #373. Done when the label is stored once per food, the meal's first comment still names the record, existing readers and tests pass, and rows already written are migrated or confirmed harmless. The change (#588) is merged; production proof is pending. The same review notes apply as in #572.

### #557 An incomplete saved label can hide a barcode provider outage

A barcode lookup can report that a product is missing when a provider is down and the account holds an incomplete saved label correction.

Fleet 13's review found that the lookup hides provider errors for corrections that may lack the name or serving unit needed to make a card. No production failure is claimed. Done when incomplete corrections keep the provider error, complete corrections still work during outages, and tests cover both. The change (#589) is merged; production proof is pending. A reviewer found that a saved label with every nutrient empty passes the "complete" check; the later Muse review found no blockers.

### #574 The Days calendar and the day summary count a different number of posts

For October 31 on a test account, the Days calendar says 5 posts and the day summary says 4 posts. Both show 1,842 kcal.

An OpenClaw production check on Nov 4 read the calendar's label as "2026-10-31, 5 posts, 1,842 kcal" and the day summary as "Consumed: 1,842 kcal · 4 posts". The cause is unknown. One of the two may count a post the other leaves out, such as a drink, a leftovers post or a superseded one. Done when both places count the same posts for that day, or the screen says why they differ, checked on production against the account's October 31 posts. The change (#585) is merged; production proof is pending. A reviewer found that an unfinished meal can make a fully known day show a false "Nutrition unavailable" warning; the planner calls that a defect in its own plan text.

### #575 A meal with unavailable nutrition does not say why

When a food shows nutrition as unavailable, an ordinary user cannot find out why. The owner could not learn why the macaroni failed without an agent reading the database traces.

The reason exists only in the model call log. For the macaroni post it said no matching generic fried-pasta record was present, and the plain name "macaroni" was never searched (#523). Nothing shows the user this. The Fleet 13 fix for #523 adds a label only when a close USDA record is found, so a food with no close record still says nothing. Done when a meal with an unavailable value tells the user, in plain words and without database access, which food failed and why, checked on production with a meal known to be unavailable. The change (#588) is merged; production proof is pending. The same review notes apply as in #572.

### #576 The desktop New post window scrolls by 18 px at 1366x650

At 1366x650 the New post window holds 668 px of content in a 650 px window, so it scrolls 18 px.

An OpenClaw production check on Nov 4 measured the overflow. The designer found the cause: the Round 6 design drew the window at a fixed 620 px tall with a fixed 450 px camera, sized for a 1280x800 screen, and the code copied both, which adds up to 668 px on a 650 px screen. The designer redrew it as Round 7 frame 7e. The window is the smaller of 620 px and the screen height minus 48 px tall, and the smaller of 960 px and the screen width minus 48 px wide. The camera takes the remaining height, never less than 240 px. At 1366x650 that gives a 602 px window with a 454 px camera, and at 1024x700 a 620 px window with a 472 px camera. The window after the photo uses the same height rule. Done when the window shows no vertical scroll at 1366x650 and 1024x700, checked on production. The change (#584) is merged and measured on a preview; production proof is pending.

### #285 The half-eaten plate may give the wrong consumed number

The app works out how much of a meal was eaten from a photo of the leftovers. The owner has already tested it on his phone, including today, and nobody has confirmed that the consumed number is right.

The owner will not run more tests for the backlog. His own posts are the data. A capable coder investigates, read-only: pull the owner's leftovers posts from production, compare each consumed number with the before and after photos, and record where a wrong number goes wrong (the portion estimate, the not-eaten step or the stored value). Related items are #570 (a slow leftovers post) and #578 (two photo code paths). Done when a written finding says, for each of the owner's leftovers posts, whether the consumed number is right and what caused any error, and any fix is on the backlog as its own item for a new fleet.

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

This is an unverified planner finding. The app's sign-up and sign-in run on Vercel's servers, so Supabase may see Vercel's address instead of the user's. In Run 8 a direct hammer from the coder's machine was refused at request 31, but that did not test the app's own path. On Nov 4, browser agents signed up 75 accounts through the production form, one every 10 to 22 seconds, and saw no rate-limit message, no 429 error and no CAPTCHA. The coder deleted all 75 accounts and checked that they are gone. The Auth logs show that each sign-up came from one of seven app-server addresses (36 from one of them), never the caller's address, because the sign-up code does not pass on the browser's address. So Supabase counts the app server's addresses. Why no sign-up was refused is unexplained; a browser is too slow to reach the earlier limit. Observe first: send sign-ups through the form faster than a browser can, then sign in from the owner's phone on mobile data. Use throwaway @example.com accounts only. A browser agent can drive the owner's MacBook Neo; his other two laptops have been offline since June and October. The two-connection test has not run; its prompt and a cleanup helper exist. Done when a written report states which address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another.

### #595 The Fleet 14 plan document must carry no instruction to revoke the bypass secret

The Fleet 14 plan document carried two lines that said to revoke the protection-bypass secret. A reader who acts on them cuts the fleet off from testing.

The planner who wrote them has been fired, and the owner has ruled that the secret is never revoked. Docs PRs #577 (merge commit 09362a77) and #600 (merge commit 30b5faf5) merged on Nov 4. The copy in #577 had no revoke lines, and the live secret is unchanged. Nobody has searched main after the merges. Done when a search of main for "revok" returns only lines that say the secret is retained.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs in #553 are the first case the owner found. List every tappable control on each screen at phone size. For each, record the time from the tap to a visible change, whether it shows a pressed look at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome with a slowed processor and needs the production sign-in from #196. Fleet 14 built its table in unthrottled Firefox because Chromium hung, so the slowed-processor condition is unmet. Done when the table lists every control with those four findings, and the slow or dead ones are fixed or filed as items.

## In Flight

No fleet is running. Fleet 17 is complete: #619 and #620 are merged, and their production proof sits in the GrokBot section.

## Engineering backlog

### The Fleet 17 run report on main overstates its proof (issue number pending)

docs/run17-report.md says the post-close check passed and the beer flow was proven. The evidence behind it is weaker, and the report is now on main.

The planner's evaluation found four gaps. All nine close readings ran after the fix merged, so no reading shows what the 700 ms cap changed. Two of the nine were over one second, and the pass came only after an 8-second gap was added between posts. The dismiss step was never proven, because the test driver read the wrong post. The notification was never observed, because only a fake subscription row was inserted. Done when the report lists all nine close readings, says that no reading exists from before the fix, and says that the dismiss step and the notification are unproven.

### Tapping Post can close the sheet before the post is safely saved on the phone (issue number pending)

Since Fleet 17, the capture sheet closes and the app says Post worked after 700 ms, even when the phone has not finished saving the draft. If the page reloads or the phone kills the app in that gap, the draft can come back as not posted or be missing, and the user's post is lost.

A static review of #619 at head 8c3707a found it, and nothing was run. The review is posted on #619 as a GitHub comment (issuecomment-6636522807). The 700 ms cap in src/lib/posts/upload-manager.ts (the post() function, around line 278) reports success from the entry in memory. The save that marks the draft as posted can still be queued behind earlier saves that carry the full photo, and on the next start a draft saved as not posted is never published. The reviewer suggests saving a small record of the intent to publish first and reporting success only after that record is saved. The cap exists to fix #370, so the fix must keep the sheet closing within 1 second. Done when a test that delays the phone's save beyond 700 ms, taps Post and then rebuilds the manager from saved data only still publishes the post, and the sheet still closes within 1 second.

### Saving a clarification question is three separate steps, so a failure part-way can leave a stray comment (issue number pending)

When the model asks a question about a drink, the app saves the question on the post, adds it as a comment and marks the post ready, one step after another. If a later step fails, the post can keep a comment without a question, or a question without a comment.

A review of #620 found it in the code that saves the analysis (persist.ts). A failure is reported as an I/O error, but the earlier steps are not undone. Done when the three steps succeed or fail together, and a test covers a failure part-way.

### The question dismissal route answers errors in two different formats (issue number pending)

Dismissing a question can fail with a JSON message or with an empty reply, depending on where it fails.

A review of #620 found it in src/app/api/posts/[id]/question/route.ts. A failed clear returns the message "Question could not be dismissed." with status 500, while the earlier failures return an empty reply with status 404 or 500. Done when every failure of that route returns the same format.

### The Fleet 17 check script passes when its checks fail and leaves a test row behind (issue number pending)

The test script scripts/run17-checks.mjs can finish successfully even when a check fails, and it leaves test data on production.

Two reviews of the script (#619 and #621) found three faults. It sets a pass flag when a close time is over 1,000 ms but never makes the command fail. The beer check records that it never settled and does not fail either. The dismiss step clicks any button on the page because of an "|| true" in its selector, which is why the dismiss check passed on an empty question. Beer mode also inserts a fake push subscription at the fixed address https://fcm.googleapis.com/run17-fixture and never deletes it. The script is part of docs PR #621, which Muse merged on Nov 4 at 16:49 UTC (7d2cbd37) without being asked to, so the faults are now on main. Done when the script exits with an error when any check fails, the dismiss step targets only this post's own question, and the fake push subscription is removed at the end of every run, including the row already left on test account 2.

### #512 The phone calendar can show the wrong month summary and jump when older months load

On the phone Days screen, the month name at the top can show the wrong month, and the screen can jump when an older month loads.

A reviewer found two defects in a change that is already live, and the coder reproduced both with made-up test months, not on the owner's phone. First, the month name can keep showing October while November scrolls into view. Second, scrolling while an older month loads makes the screen jump back to an old position. The first cannot appear on production today, because two months fit on one screen, so prove it with three months of test data on a throwaway copy. Observe first: scroll Days across the October and November boundary, then scroll while an older month loads. Done when the month name shows the month nearest the top of the screen and the screen stays still while an older month loads.

### #554 Tapping a meal shows nothing until the server answers

Comment, Details, tapping the photo, "more" and Post in the capture sheet wait for the server before anything changes on screen.

The designer's Round 7 design (7b) shows the screen at once, using the photo already on screen while the details load. Done when each of these taps shows a visible change at once, and nothing jumps when the details arrive.

### #494 Opening a meal's detail takes 14 seconds

The owner reports 14 seconds from tapping a meal to its detail page opening. He calls it not acceptable.

The owner measured 14 seconds on Nov 4 on an iPhone with the app installed, on mobile data in Indonesia. A coder's production check found useful content after 0.9 to 3.4 seconds, 24 to 25 requests with eight repeated, and a 142 KB original photo downloaded although the feed copy was already on screen. A desktop Firefox check measured the full detail at 1.0 to 1.8 seconds, with one trial that did not finish in 20 seconds. Nobody has explained the 14 seconds, and nobody has timed the detail on a phone on current main. Observe first: time the tap to a usable detail on a phone over mobile data and on desktop, and record where the seconds go (server, database, photo download). Done when the detail opens within two seconds on the owner's phone over mobile data and a written finding says where the 14 seconds went.

### #499 Several pages export an instant flag that nothing reads

Several pages export a flag called instant set to false, and nothing reads it. Every reader has to wonder what it does.

This is an unverified audit finding. The audit found no file, script or tool that reads the flag. Nothing breaks while it stays. GitHub shows this issue closed, and it stays here until its done condition is met. Done when no page exports the flag and a search of the source for it finds nothing.

### #323 Every protected page checks sign-in twice (part of #222)

The app checks that the user is signed in when a protected page is requested, and checks again when the home page loads. That is two round trips to the sign-in service on every page open, on top of the slow start of the server function.

Run 8 reduced this to one sign-in check per page on the server, and a forged request header is still refused. Browser recordings still showed 10 and six sign-in requests, so the whole page open is not yet explained. Fleet 14 cut the browser's sign-in requests from one to zero on Home, Days and Profile on production, but local server recordings still showed 7, 9 and 14 checks per page open. The likeliest cause is that the guard checks every background prefetch and refresh request, not only the page itself, and each card carries several links. This is probably the server half of #222. Done when one page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page.

### #324 Home computes the day totals twice on every open (part of #222)

The server draws the row of day circles with totals for the last five days. The browser then computes totals again for the feed's days. Today's totals are read twice on every home open.

Run 8 merged one shared server read of today's totals. Final browser recordings still showed one or two reads, so a single read across the server and the browser together is unproved. Measure one page navigation and count every read that returns today's totals, including batched reads. Done when a home open reads today's totals once across the server and the browser together.

### #520 Every Home open reads the first feed page twice

Home reads the first page of the feed in the server render and again from the browser, so every open pays for both reads.

This is a planner finding from reading main on Nov 4, not yet measured. The feed always loads its first page again after the server has drawn it. Related: #373 and #498. Observe first: count the first-page reads of one Home open on current main. Done when one Home open reads the first feed page once, and the request counts before and after are written down.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

Run 8 merged lazy loading of the job code in the tick route. Rapid tick calls passed, but they hit a warm function, so a cold start has not been measured, and a post from a real phone through the worker is untested. Fleet 11 timed one first request per deployment, which does not show a cold start. A later change added a header and a log line that mark a cold start, and nobody has read a value yet. Done when a cold start of the tick route is timed on production, before and after, with the times written down, and a post from a real phone completes through the worker.

### #373 The app reads more from the production database than it needs

The app's reads drove egress to 8.66 GB and log ingestion to 1.10 GB in one billing cycle, against 5 GB and 1 GB on Supabase's free plan, and the project was depleting its Disk IO budget. The organization is now on Pro, which includes 250 GB of egress per cycle, but the same reads still cost bandwidth and database load while judges use the app.

Run 8 cut the feed's database traffic per page open from 5.06 MB to 0.523 MB (89.7% less) by reading day totals once. The app and the worker reach Supabase through web requests, not database connections, so the connection-pool setting does not apply. Supabase's own services account for many of the connections its Infrastructure page counts. Nobody can explain the historical 31 of 60 connections or the 70% memory use on the small instance. Only row counts exist for log volume, so the log bytes are unattributed. Done when the billed log bytes are attributed to their sources on the usage page and the memory use on the small instance is explained.

### #375 Storage egress is the largest source and was not cut

In the 24 hours before Run 8, Supabase Storage served 2.99 GB across 35,048 requests, almost all to browsers. The Run 8 cut measured the feed's posts reads, not Storage.

docs/egress.md says the bytes went to browser-like clients but not which files (feed photos, card images or originals) or which clients. Much of it may be the coder's own 100-open test runs. In the latest 24 hours, test automation accounted for 1.72 GB of the 1.77 GB of feed photo bytes and real mobile browsers for about 46 MB, so the split between test and real users is a guess. Log volume was never measured in bytes, only in rows. Done when Storage egress is broken down by file kind and by client (test automation or real users), log bytes are measured, and the largest real-user source is cut or shown to be small.

### #471 Posting several photos in one hour can hit the app's hourly limit

The app limits how many analyses one account can run in an hour. When one account posts a run of photos, the app can stop analysing and show a message instead of the result.

Identifying a drink from a photo adds one model call per photo, and every call counts against the account's hourly limit. The last check on production hit the message "You have made a lot of requests this hour." Done when one account can post ten photos within an hour with no limit message, or the limit is raised so it can.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of caffeine from the USDA, but they have no beverage category and no linked intake rows. #346 fixes new and re-analysed posts only, and no backfill of old posts ran. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

### #523 A meal shows every nutrition value as unavailable

The meal "Spicy Indonesian macaroni" shows its calories, protein, carbs and fat as unavailable. The owner re-analysed it after the fix went live, and it is still broken. He says the app's food estimates are broken.

The post says "Nutrition unavailable: spicy Indonesian fried macaroni snack". The first analysis searched the USDA database three times, rejected every record, and never tried the plain name "macaroni". The owner ruled that when the USDA has no record, the model must estimate, because an unavailable value is worse than a rough estimate. That fix is live (closest food first, then a model estimate) but did not run here: re-analysing reused the old empty result and skipped both the search and the estimate. No new post has come out unavailable since. Done when re-analysing this post runs a fresh lookup and shows numbers, with a note naming the closest USDA food or saying the model estimated them, no value is left unavailable, zero or blank, and a browser helper confirms it on the live app.

### #579 Photos are captured at 480 × 640 and look blurry on high-density phones

The app stores each photo at 480 × 640 pixels, the size the browser chose for the live camera, and the feed shows a smaller 384 × 512 copy. On a phone with a three-times screen a full-width card needs about 1,170 pixels, so every photo looks soft. The owner finds the blur painful.

The coder measured the owner's Beef noodle post on production. The live camera asked for the rear camera with no size and drew one video frame, so the stored original was 480 × 640 pixels (0.31 megapixels, 126,407 bytes). The meal detail cannot show detail that never reached the upload. The feed then shrank it to a 384 × 512 copy of 22,118 bytes, cached for a year, so a sharper copy needs a new address. Photos already captured stay at 480 × 640. The owner reported the blur on Nov 4 and ruled that it is fixed today. A sharper photo costs more Storage egress, which #375 names as the largest egress source. Fleet 14's change #581 (higher-resolution capture, a larger feed copy at a new address, full-resolution detail photos) is live. Fleet 15's change #590 reconciled the density-specific photos with it and is merged. Nobody has measured the bytes, the egress or a real camera's resolution yet. A reviewer found two problems in an earlier version: the preload can download the wrong photo size, and one failed image turns off sharper photos for later ones. A later Muse review found no blockers. Observe first: find what resolution the camera delivers on the owner's three phones, and the bytes of a photo at each size. Done when a photo captured on the owner's three phones is stored at a sharper resolution, the feed and the meal detail show it sharp on a 3x phone, the first photo still shows within two seconds on mobile data, and the bytes per photo before and after are written down.

### #570 A leftovers photo takes several seconds to post while a regular photo is fast

Posting a photo of leftovers takes several seconds to show, while a regular meal photo shows at once. The owner says the leftovers photo is not snappy and that this is not acceptable.

The owner timed adding a leftover at about 11 seconds on his phone on Nov 4. The leftovers path waits for image encoding, upload signing, two uploads in a row (about 1.3 and 1.2 seconds) and the attachment steps before it closes the camera. A regular post hands the work to the upload manager and closes at once. The logged staging-to-attachment time was about 4.9 seconds, so most of the 11 seconds is unexplained without a trace from the phone. The audits name two causes: two photo-upload workflows, and one worker lane shared by analysis and maintenance. Background leftovers uploads (#587) are merged; production proof is pending. Observe first: on a phone over mobile data, time a regular photo and a leftovers photo from the tap to the post showing in the feed, and record where the extra seconds go. Done when a leftovers photo shows in the feed as quickly as a regular photo, on the owner's three phones.

### #571 A post started while another is going up breaks the other post with "The meal could not be saved"

Starting a second post while an earlier post is still going up can end with "The meal could not be saved.", and the owner has to press Post again to get the meal saved.

The owner's phone screenshot on Nov 4 shows the toast "The meal could not be saved." over the feed. The first post, "Beef noodle", shows a grey bar where the analysis would be. The owner posted one photo, then photographed another food while the first post was going up. When the first post finished, one of the two posts stopped working. He pressed Post again and the meal then appeared. He has not said which post stopped, and the screenshot does not show which one raised the error. Whether the two overlap in the capture sheet, the upload or the save is not confirmed. Observe first: on a phone, start a second post while the first is still going up, and record which request raises the error and why. Done when one post finishing never stops the screen of the other, and both meals save on the first press of Post, on the owner's phone. The change #587 names this issue and is merged; production proof is pending.

### #593 The first post on desktop Home has a black outline when the page loads

When the desktop Home page loads, the first post sits inside a thick black outline that looks like a focus ring. The posts below it have none. The owner does not like it.

The outline marks the post chosen for keyboard use: J and K move between posts and Enter opens one. The old design and code chose the first post by default. The new rule: the feed opens with nothing outlined, the outline appears after the first J, K or Tab, and a click anywhere in the feed hides it. Checked on the live app: nothing is outlined on load, J outlines the first post, a click clears the outline, and Tab outlines a post. That Tab check started in the page, not in the address bar. The owner also said the other posts are not loaded when he scrolls. That was read as meaning they have no outline; a post that fails to load would be a separate item. Done when it is confirmed on the owner's desktop, including pressing Tab from the address bar.

### #598 A returning visitor keeps seeing the old build until a hard refresh

After a deploy, a browser that already holds the previous build can keep showing it, so a visitor sees old layouts and old text that main no longer has.

After an earlier release, the owner's desktop kept showing the old full-width layout until a hard refresh. The suspect is the browser's stored copy of the app, which is not confirmed. Fleet 16 built a fix, and a follow-up (#616) went live, but its activation check failed: the newer copy installed and stayed waiting while the old one kept running, and a normal reload did not switch to it. A browser can hold back a takeover while requests are in flight; that is a lead, not a proven cause. The cause is unknown and needs investigation. First step: with a browser holding the previous version, release or simulate a new version, and record whether a normal reload shows it and which stored copy serves the old one. Done when a browser holding the previous version shows the new one on its next normal load, and the check is written down.

### #594 Let the user choose where a photo is saved: the in-app camera with manual saving, or the native camera with every photo saved

The app's own camera sends photos only to the app, so none reach the phone's camera roll, and the owner wants a choice.

The owner ruled that this is a switch in personal settings with a short explanation of each mode, so he can test both. Manual-save mode keeps the app's camera and shows a Save photo button that opens the share sheet. Native mode opens the phone's own camera, which may save to the camera roll by itself. Built: the switch on Profile (kept per device), native mode, Save photo through the share sheet and a file-download fallback. Browser checks pass. Not checked on a real phone: which actions the share sheet offers and whether a copy reaches the camera roll. On iPhone with iOS 16.2 or later, a share sheet opened by an app has no Save Image option (a known Apple bug), but pressing and holding a shown photo does offer it. How people share or save everything, or nothing, is not decided. Done when the owner flips the switch and confirms both modes on his iPhone and on an Android phone.

### #599 The Today summary on the right of desktop Home is missing when the page opens and appears late

On desktop Home the right-hand column (Today, kcal consumed, protein, carbs, fat, Posted today) is empty when the page loads and fills in a moment later. The owner reports that it took far too long to show up.

The owner sent two screenshots: first the right column is blank, then the same page shows Today with 1,468 kcal, 56 g protein, 211 g carbs, 46 g fat and six posts. He reports about 20 seconds to fill in. That is his count, not a measurement. The fix is live: the server now fills in today's totals before the page arrives. On the live app at 1280x800, a test account showed its numbers at 0.85 seconds on a normal reload and 1.0 second on a hard reload. That account had zero calories that day, so a day with posts has not been measured on the live app. A test with fake data showed 260 kcal. Done when the column shows its numbers within two seconds on a day with posts, shows a loading placeholder from the first instant, and shows a plain message with a retry if the numbers do not arrive.

### #602 The meal detail photo shows cropped for an instant on desktop, then zooms out, and the phone layout jumps 130 px

On desktop, opening a meal shows the photo cropped about 20% in a 640x680 frame, then it jumps to the whole photo with grey bars at the sides. On the phone, the space for the photo starts as a 390x390 blank square and grows to 390x520, pushing everything below it down 130 px. The owner has asked three times to see the whole image (#525).

Fixed: each photo's stored width and height now reserve the photo box before any image loads. Measured on the built app: phone portrait 390x520, phone landscape 390x292.5, desktop window portrait 510x680, desktop window landscape 640x480. The first frame and the full page matched with no jump. No saved photo is missing its size. The feed's square slide rail stays square, as planned. Done when the owner has seen it on the live app at 1100, 1280, 1440 and 390 wide: the photo is never cropped, and nothing moves when the full photo loads.

### #603 The Servings control on a meal cannot be set to a fraction

The owner wants to log part of a serving, such as half, and says the app cannot do it while Cal AI can.

Fixed: the servings count can now be typed as well as stepped. It accepts 0.25 to 50 in quarters, and the minus and plus buttons still step by 0.5. Checked in a browser at phone and desktop widths: typing 1.5 sent 1.5, typing 0.5 sent 0.5, typing "abc" restored the saved value and sent nothing, and a failed save restored the confirmed value. Database checks covered rescaling, ownership, history and recompute jobs. Every nutrient value on Home, Days and Today was not measured one by one in a browser. Cal AI shows "1 ✎" beside the name, a count the user can edit. Done when a meal is set to 0.5 and to 1.5 on the live app, and the nutrition on the meal page, Home, Days and Today changes to match.

### #617 Squid and tuna are matched to the wrong food records

In the real food test, a photo of squid nigiri was matched to a USDA record described as "Sushi, topped with tuna". The test allows this kind of closest match, so a passing test does not show the match is right.

No fix has been tried. First step: look at which squid records were available, the matching trace, and the closest-food label. Done when a written finding says whether this match is acceptable and, if not, what should change.

### #452 A plainly visible nutrition label is reported as not found

A photo of a pack whose nutrition table can be read is rejected with "No nutrition label found".

A photo of a Goldfish cracker pack failed. The label is in Indonesian and the whole table is in the frame. The app showed "No nutrition label found" with the buttons "Take the photo again" and "Type it instead". Done when that photo gives a card with the numbers printed on the label, and a label in English does too, on the owner's three phones.

### #451 Every barcode scan comes back as not in the database

The owner has scanned several packs on a phone and every scan has failed: the scanner reads the code and the lookup finds no product.

A scan of an Oreo pack read the code 7 622300 76136 3 correctly, then showed "Not in the database. No product for this code yet." A normal web search finds this product at barcodelookup.com/7622300761363. The planner says an earlier test found the cause, but nobody has checked it on a phone. Done when this pack shows a card with its name and nutrition, a second pack from the same shelf does too, and a written note says which source the lookup asks and why it had no entry for this code, on the owner's three phones.

### #525 The meal detail photo is cropped and does not show the whole image

The meal detail page shows the photo in a short, wide frame, so the top and bottom of the photo are cut off. The owner wants the whole image and has asked for it three times.

The owner's desktop screenshot shows the macaroni photo as a wide strip, with the food outlines drawn on the cropped part. First step: measure how much of the photo is cut off, on desktop and on a phone. Done when the meal page shows the whole photo with nothing cut off on desktop and on a phone, and the food outlines still sit on the right parts of the food. Related: #602.

### #222 The feed fails to open, and photos and cards take too long to appear

The feed sometimes fails to open, and on a slow connection the first photo and the cards take too long to show. The goal is the feed and the first photo within two seconds on the owner's phones over mobile data.

Run 8 cut the work done on a cold open and measured it in emulation: 100 of 100 opens succeeded, and cold photos showed in 1.48 to 1.83 seconds. Fleet 15 added smaller photo copies (see #372). The original failures (3 server errors and 15 blank feeds in 100 opens on the largest test account, 146 posts) never reproduced on the Run 7 baseline, so their cause is not isolated. The runtime logs return 403 for the coder, so the stack for digest 3642131196 exists only in the Vercel console. The sub-items #322, #323, #324 and #520 each remove one piece of wasted work. Nothing else is left to build for this item. No physical phone has measured it yet. Done when a browser helper on production measures the first feed photo at 2 seconds or less on a cold open at the slow-network test profile, and #379 covers the same on the owner's phones.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The app should identify food with a Meta open-weight model, Muse Spark Open, because the hackathon pays a $10,000 bonus for using one. The owner needs to switch it on in his own account and see it work.

It is built and on main: a switch on Profile, the call to Baseten (model meta-models/muse-spark-open-1026), the model name saved on each post and in the trace, and a paired ten-photo comparison table in docs/open-weights.md. Cerebral Valley confirmed on Nov 3 that Muse Spark Open counts however it runs, including through Baseten. The Baseten key never goes in the repository, an issue or this backlog. A test account passed a production check on Nov 3, when Baseten identified a meal in 4,031 ms. One line in docs/open-weights.md still says the work remains "Part 2"; Fleet 17's docs lane corrects it. Done when the owner switches "Identify food with Muse Spark Open" on in his own account, logs one meal, and the meal page shows "Identified by Muse Spark Open".

### #372 Feed photos are too large for a phone on mobile data

Feed photos are too large for a phone on mobile data, so the first photo is slow and the app spends more storage egress than it needs. A phone should receive a small copy sized for its screen.

It is built on main: the feed serves immutable WebP copies, at 1920 px for the default, 1040 px for 2x screens and 1560 px for 3x screens, with a one-year cache header. Fleet 15 measured 16,386 and 26,854 bytes for the two phone copies on production. One line in docs/media-loading.md still says "no-store"; Fleet 17's docs lane corrects it. Done when a browser helper on production records the bytes and the cache header of the first feed photo, the first photo shows within two seconds at the slow-network test profile, and the owner says the photo looks sharp on his phone.

### #456 A rum cocktail is logged with 15 mg caffeine

The tiki cocktail post states caffeine that the drink does not contain.

The drink card for the lime and rum tiki cocktail reads "15 mg caffeine" next to 196 kcal, and the day's caffeine total reads 110 mg. This is built on main. GitHub shows this issue closed, and it stays here until its done condition is met. Done when a cocktail or any drink with no caffeine source logs no caffeine, the card shows none, and the day's total leaves it out, checked on the tiki cocktail and a glass of wine.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. Run 8 merged a dormant hCaptcha widget (#336). A direct hammer from the coder's machine was refused at sign-up 31 and sign-in 32, and the 31 throwaway accounts were deleted. The owner holds the site key and the secret. The secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT_PUBLIC_HCAPTCHA_SITE_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers both is refused.

### A user may not be able to upload a profile picture (issue number pending)

The owner is not sure he can tap his picture on Profile and upload one. Today the sidebar shows a letter in a dark circle. He calls a profile picture a beautiful piece of finish and wants it.

The owner raised it at 22:05 WIB. His desktop Home screenshot shows the letter T in a circle beside the handle "tinhead" in the sidebar and in the post header. Nobody has checked whether Profile accepts a picture today, or where a picture would show (sidebar, post header, comments, Profile). Observe first: open Profile on a phone and on desktop, tap the circle, and record what happens. Done when a user can tap their picture on Profile, choose or take a photo, see it replace the letter in the sidebar, post headers and Profile, remove it to return to the letter, and a second account cannot change it, checked on the owner's three phones and on desktop.

### A fleet ends when its plan is done; new defects go to the backlog, not into the running fleet (issue number pending)

A coder who finishes its plan keeps working. At the end of Fleet 16 a production check found a new defect. The coder shipped a fix for it inside the same fleet and held the final report until that fix was checked. The coder's contract does not say what to do with a defect that is not in the plan.

The owner's rule has five parts. (1) A fleet ends when its plan is done, and the coder says so plainly: "I completed my plan." (2) The coder starts no new work inside the fleet. (3) Every new defect, meaning anything not already in the backlog, is reported to the owner in the message that finds it, so it can be filed. (4) A high-intelligence coder investigates the defect properly. (5) The fix runs afterwards, in a new fleet. Done when the rule is written into the coder's contract, covers defects found by production checks, and the coder's next report names any new defect it found and starts no work on it.

## Backlog for Designer

### #552 The buttons under each post are 24 px tall and show no pressed or turned-off state

The buttons under a post are too small to hit and look the same at rest, while saving and when turned off.

The designer's Round 7 design (7a) gives every button a 44 px tap area and five looks: at rest, pressed, saving, turned off and failed. Done when each button matches 7a on production on a phone-sized screen. The latest check could not prove all five looks: the test missed the saving look, and earlier samples missed the pressed look. Thumbs down took 0.39 seconds to show a change and 0.86 seconds to get its reply.

### #553 Thumbs up and down look the same when turned off and thumbs down waits for the server

The thumbs turn themselves off while a vote saves and before the analysis exists, with no visible difference. Thumbs down opens nothing until the vote has saved.

This is the first case the owner found for #217. The Fleet 14 checks found that four of eight entry paths took longer than 50 ms to show a change: phone photo 51.5 ms, desktop More 64.3 ms, Details 66.6 ms and Comment 64.3 ms. No photo shifted on any of the eight. Done when a thumb shows its pressed look at once, looks different when turned off, and thumbs down opens at once, checked on production on a phone-sized screen with a slowed processor.

### #453 The barcode prompt is printed over the live camera picture

On the Barcode screen, the line "Point at the barcode. It reads on its own." runs across the camera picture and cannot be read against a busy shelf.

No design exists yet for where this line sits, so the designer chooses its place. Done when the prompt is readable over any camera picture, on the owner's three phones.

### #454 The Days page is not one continuous calendar

Days cuts the calendar into separate month blocks, which no calendar app does, so the user cannot scroll through time as one run of weeks.

On the phone, Days shows November 2026 and October 2026 as two separate blocks, each with its own heading, and the newest month sits on top. Days becomes one continuous calendar: the weeks run on from one to the next in time order with no break, the month name marks where each month starts, and Days opens with today in view. Done when scrolling Days moves through unbroken weeks from October into November, the month names mark where each month starts, and Days opens on today, on the owner's three phones.

### #455 The card you swipe to on a drink's photo shows a number and not what the drink is

Swiping right on a drink's photo opens a card with one big millilitre number, so the card does not say what the drink is or why it exists.

The swiped card for the tiki cocktail shows "220 ml" in large type, a line of text and "1,200 ml consumed today" split into drinks and food. A card for a drink should lead with its kind as a picture: a coffee cup for coffee with its caffeine, a water cup for water with one cup for every 250 ml drunk, and a cocktail glass or a wine glass for those with their alcohol, and the day's drinks drawn as the same cups. This is built on main. GitHub shows this issue closed, and it stays here until its done condition is met. Done when a coffee, a 500 ml water (two cups), a cocktail and a glass of wine each show their own picture on the swiped card, and a card that holds only liquid reads as a drink at a glance, on the owner's three phones.

### #457 An alcoholic drink shows its alcohol but not how much was drunk

A drink post shows its alcohol but not how many drinks or how many millilitres were drunk, so the user cannot tell how much they have drunk.

The post for a lime and rum tiki cocktail shows "220 g" on the photo and 196 kcal, 0 g protein, 17 g carbs and 0 g fat, with no alcohol anywhere. For a drink with alcohol, the post should show how much was drunk (a count and millilitres), the grams of alcohol and the standard drinks. The drink's liquid does not add to the water total, and Today shows the day's alcohol so far. The owner's Sapporo pint screenshots show "20 g alcohol · 1.4 standard drinks" but not how many beers or millilitres. The 20 g is the weight of the alcohol in a 500 ml pint at 5%. The 1.4 is 20 g divided by 14 g, the US standard drink; a Canadian standard drink is 13.45 g and would read 1.5. Which one the app uses is unruled. This is built on main. GitHub shows this issue closed, and it stays here until its done condition is met. Done when a photographed cocktail and a typed beer each show how much was drunk (a count and millilitres) and their alcohol, on the post and in Today, and neither adds to the water tile, on the owner's three phones.

### #592 The round left arrow covers the start of the word kcal on a meal's second slide

On the second slide of a meal on desktop, the round left arrow sits on top of the first letter of kcal under the big number, so the word reads as cal.

The owner's screenshot shows slide 2 of the Cold brew and black honey post, with 49 kcal, and the arrow over the k. The fix adds extra space beside the numbers card. On the live app at 1100, 1280 and 1440 px wide, no arrow touches any text, and the smallest gap on the left is 21 px. The phone reading could not be taken: on the phone, the photo rail holds only photos and nutrition is shown separately, so there is no numbers slide with arrows. Done when it is confirmed that no arrow covers any text or number on any slide at those widths, and the phone case is confirmed as not applicable.

### Every place that waits on the network shows nothing while it waits (issue number pending)

A screen or action that waits on the network can sit empty or frozen for seconds, and the customer cannot tell whether the app is working. The owner wants a visible waiting state anywhere a network problem is possible, so the customer's expectation is managed and nobody is annoyed.

The owner's desktop Home took about 20 seconds to fill the Today column and the Posted today list (reported at 22:05 WIB, see #599). The designer's audit says every control was drawn at rest only, so no waiting, slow or failed state exists in the design for whole regions or for actions. Observe first: list every region and action that waits on the network (the Home right column, the feed, Days, Search, Profile, the meal detail, saving a post, barcode and label lookups, the drink sheet) and record what each shows while it waits, after a failure and after a timeout. Done when each of them shows a loading placeholder or spinner at once, shows a plain message with a retry after a failure or a timeout, never shows an empty or half-drawn region as if it were final, and is checked on production with the network throttled at 390x844 and at 1280x800.

### #294 The app's words read naturally everywhere

The leftovers label reads awkwardly, and nobody has reviewed the words in the rest of the app.

The label "leftovers (not eaten)" reads awkwardly. The planner reviews the app's terms with AGY as a second opinion and lists each term, where it appears and a better wording. The terms include the leftovers label, the line "Drank in this meal" on a meal's second slide (the owner said it sounds off), "Consumed", "Log again", "Saved meals", "Additional food", the clarification question and the Days names. Every rule stays: use the past tense for consumed, show no target, goal, ring or percentage, and never use "left" for a remaining amount. A review noted that the wording search was not repeated on the final code before the issue was closed. GitHub shows this issue closed, and it stays here until its done condition is met. Done when the list is reviewed, the owner has ruled on each term, and the wording is changed everywhere it appears.

### #555 The controls on Days, Search, Profile and the capture modes have not been audited

The Round 7 control table covers the feed, the post and the capture sheet. Days, Search, Profile and the Text, Photo and Barcode modes are not in it.

The designer has not read their controls yet. Add them to the table from #217 with its four findings: time to a visible change, pressed look, jump or flicker, and double tap. Done when every control on those screens is in the table and the dead ones are fixed or filed as items.

## Interdit (Not part of Hackathon)

### #114 Facebook Login in production mode

Public sign-in with Facebook needs the app submitted for Meta app review, which takes longer than the event.

Blocked by Meta app review. Development mode works for the developer's own and test accounts, which is enough for the demo. While a Facebook app is in Development mode only people with a role on the app can sign in, and everyone else sees an "App Not Setup" error (Supabase docs). Instagram has no sign-in for consumer apps: Meta shut the Instagram Basic Display API on Dec 4, 2024 and tells developers to use Facebook Login. No Instagram button is added. The button stays grayed out and inert until review passes (#316).

### #115 Dark mode

The app has no dark mode.

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

### #218 Hydration as a share of daily intake

The owner wants the app eventually to show how much of the user's daily intake is hydration.

Blocked until after the hackathon, and blocked by the claims rule: the app shows no percentage that reads as progress, and a share of intake is a percentage. The owner decides whether this one figure may break that rule. Done when the owner has lifted the rule for this figure and its design is drawn.

---

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This Doc is private between the PM and the owner, and the coder cannot open it. The coder reads BACKLOG.md, which the owner copies from this Doc. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. An item stays until its work is merged, its done condition is met and its issue is closed; the "Interdit (Not part of Hackathon)" section holds items that cannot be worked on and says why. Each section is for one role or one state: Backlog for Owner, In Flight (the items the running fleet builds) and Engineering backlog (open work outside it), ordered within a section by the pass that will work them together, not by issue number or date.

Every item is a title line and two paragraphs. The title line carries the GitHub issue number once the issue exists. (1) The title says in plain words what is wrong, as a GitHub issue title does. (2) The first paragraph is the problem statement, which any person can read. (3) The second paragraph holds the context we have learned that helps solve it. It can be technical. It never holds a dump of logs, review history or merged-change detail. It ends with "Done when" and a condition a person can check. Write short sentences in the active voice, as the Google developer documentation style guide asks, and spell out any term a reader outside the project would not know. An item missing a part is not on the backlog.
