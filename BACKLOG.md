# My Food AI — Backlog†

Last edited: Wednesday 2026-11-04 at 10:54 WIB (UTC+07:00) by Claude, PM

The only job of the PM is to maintain this backlog and keep it completely up to date. Failing to do so is immediately terminable.

## Backlog for Owner

### #212 Barcode and nutrition-label scanning is untested on a phone

Nobody has tried logging a packaged food from its barcode or nutrition label on a phone with a real pack. Every check so far ran in emulation.

The capture sheet swipes between Photo, Barcode and Text (PR #298). A barcode photographed in Photo mode is also read: the app decodes the barcode from the image first and looks up the digits, and uses the model only when it finds no barcode and for labels. Photograph a real pack's barcode through the capture sheet; the card should show the product's name, its nutrition and the pack photo. Then photograph a nutrition label; it should give the same kind of card. Done when both give a correct card on the owner's phone.

### #285 Test the half-eaten plate again on a phone

The app works out how much was eaten from a leftovers photo. Nobody has confirmed on a phone that the consumed number is right.

Photograph a meal before and after eating it, then check the consumed number. If it is wrong, report it to the coder. The video includes the not-eaten plate, so this has to work first. Done when a fresh before-and-after test gives the right consumed number. If it does not, the plate stays out of the video.

### #318 Read the README before recording

Judges read the README first, and the owner has not read it yet.

The README (#287) is written in Run 7. Read it after it merges. Done when the README is read and everything wrong in it is listed.

### #26 The demo video and the submission do not exist yet

Nothing is submitted until the video is recorded and the submission is in. The deadline is Nov 4 at 9 PM EST (Nov 5 at 09:00 WIB).

The submission needs the public repository, the video link and a list of everyone who worked on it. Judges stop watching at three minutes, and the video must show the feature working with live Meta model calls and say which open Meta model it uses and where it runs, Muse Spark Open on Baseten (Cerebral Valley, Nov 3). Every feature built is in the video, the not-eaten plate included. Post the video to X as soon as it exists: the Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8. Whether the post must exist before the submission deadline is unconfirmed. Fleet 12 stops at 17:00 WIB on Nov 4, and whatever has not merged by then stays open. No merges or deploys run from the start of recording until the submission is in. Done when a video under three minutes is on X and the submission is in.

### #379 Phone checks of the installed app over mobile data

Every Run 7 and Run 8 timing check ran in emulation. No physical phone has tested the feed, the photos, installation or posting.

Check on each of the owner's three phones, installed from the home screen, over mobile data: the feed and the first photo show within two seconds (#222, #305); the last feed shows at once and fresh posts appear without jumping (#304); a warm revisit reuses cached photos and the photos look acceptable (#305); the camera, the keyboard and a post from the phone work, with the right photo kept (#6); a post completes through the worker (#322); the capture sheet closes within one second of the tap (#370). Done when each check passes on each of the three phones and each failure is reported to the coder with its number.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature merges, one pass replaces the default README with a short start-here page (#287). All working files stay on main, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed or scrubbed. Done when the README is the start-here page and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep. Fleet 10 closed the issue and Fleet 11 ran the search, so the owner's keep list is what remains.

## In Flight

### #494 Opening a meal's detail takes 14 seconds

The owner reports 14 seconds from tapping a meal to its detail page opening. He calls it not acceptable.

The owner reported it on Nov 4 at about 07:38 WIB. He measured on an iPhone with the app installed from the home screen, on XL Axiata Prioritas 5G in Indonesia. He gave no meal URL because the installed app shows none. The coder's Chromium audit on production (docs/detail-open-audit.md in PR #475) found useful content at 0.9 to 3.4 seconds, the original photo decoded at 1.2 to 3.7 seconds, 24 to 25 requests with eight repeated, and a 142 KB original downloaded although the feed copy was on screen. It did not measure the iPhone on XL Axiata, so the 14 seconds is unexplained. The audit items below name three suspects: no loading screen on the tap, the same meal read twice, and the full original photo downloaded again. Nobody has timed the detail on current main. Observe first: time the tap to a usable detail on a phone over mobile data and on desktop, and record where the seconds go (server render, database reads, photo download). Done when the detail opens within two seconds on the owner's phone over mobile data, and the report states where the 14 seconds went.

### #473 The desktop Today column may not shrink at 1100 px wide

The Today column beside the feed may keep a fixed width where it should shrink, so Home overflows sideways on a narrower window.

In PR #462 the Today column sets a fixed width of 280 px and also a flexible width, and the review flagged that the fixed width may win. Nobody has checked the column at 1100 px. Done when Home at 1100 by 800 shows the feed and the Today column with no sideways scrolling.

### #373 The app reads more from the production database than it needs

The app's reads drove egress to 8.66 GB and log ingestion to 1.10 GB in one billing cycle, against 5 GB and 1 GB on Supabase's free plan, and the project was depleting its Disk IO budget. The organization is now on Pro, which includes 250 GB of egress per cycle, but the same reads still cost bandwidth and database load while judges use the app.

Run 8 cut the feed's Supabase traffic per opening from 5.06 MB to 0.523 MB, 89.7%, by reading day totals once. The app and the worker use Supabase's HTTPS APIs, not SQL connections, so the pooler setting does not apply. Managed services (PostgREST, Storage, Realtime) account for many of the connections the Infrastructure page counts, and the historical 31 of 60 is unexplained, as is the 70% RAM on the Micro instance. Log-ingestion bytes are unattributed, since only row counts exist. Done when the billed log-ingestion bytes are attributed to their sources on the usage page and the RAM use on the Micro instance is explained.

### #375 Storage egress is the largest source and was not cut

In the 24 hours before Run 8, Supabase Storage served 2.99 GB across 35,048 requests, almost all to browsers. The Run 8 cut measured the feed's posts reads, not Storage.

docs/egress.md attributes the bytes to browser-class agents but not to which files (feed JPEGs, card PNGs or originals) or which clients. Much of it may be the coder's own 100-opening measurement runs. Log-ingestion bytes were never measured; only row counts were. Done when Storage egress is broken down by file kind and by client (test automation or real users), log-ingestion bytes are measured, and the largest real-user source is cut or shown to be small.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

Run 8 merged lazy loading of the job modules in the tick route. Rapid tick calls passed, but they hit a warm function, so a cold start is unmeasured (docs/tick-cold.md), and a post from a real phone through the worker is untested. Fleet 11 timed one first request per deployment, which does not establish a cold start, and reopened the issue. Lazy loading is delivered by #334. Done when a cold start of the tick route is timed on production, before and after, with the times in docs, and a post from a real phone completes through the worker.

### #323 Every protected page checks sign-in twice (part of #222)

The middleware calls Supabase to verify the user. The home page then calls Supabase to verify the user again. That is two round trips on every page open, on top of the cold function boot.

Run 8 merged one sign-in check per page: the server makes one Auth call, and a forged header is refused. Recorded browser windows still contained 10 and six /auth/v1/user requests, so the whole opening is not yet attributed. API authentication stays intact. Fleet 11 could not close it: minute totals from the logs cannot isolate one opening. Measure with spans tied to one navigation, and count the middleware call, the server helper call and the browser call. Done when a page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page.

### #324 Home computes the day totals twice on every open (part of #222)

The server renders the row of day bubbles with totals for the last 5 days. The browser feed then computes totals again for the feed's days. Today's totals are queried twice on every home open.

Run 8 merged one shared server read of today's totals. Final browser windows still made one or two day-total reads, so a single read across the server and the browser together is unproved. Fleet 11 could not close it for the same reason. Measure with spans tied to one navigation, and count every read that returns today's totals, batch reads included. Done when a home open queries today's totals once across the server and the browser together.

### #471 The recording account can hit the hourly model cap on camera

A recording with several photos on one account can run into the model's hourly limit while the video runs.

Photo drink identification adds one model call per staged photo, counted against the account's hourly cap, and the last audit on production got "You have made a lot of requests this hour." Done when a recording-length session of several photos on one account runs with no cap message, or the account's cap is raised before recording.

### #452 A plainly visible nutrition label is reported as not found

A photo of a pack whose nutrition table can be read is rejected with "No nutrition label found".

The photo of a Goldfish cracker pack, with the label printed in Indonesian and the table fully in the frame, gave "No nutrition label found" with "Take the photo again" and "Type it instead". Done when that photo gives a card with the numbers printed on the label, and a label in English does the same, on the owner's three phones.

### #468 Big numbers lose their thousands separator on the desktop Days and Today

The same total reads "34,811" in one place and "34811" in another on the desktop screens.

In the PR #460 screenshots, the Days panel shows "Consumed: 34811 kcal" while its calendar cell shows "34,811", and the Today column uses the same formatter, so it would show "2118" beside the feed's "2,118". Done when every kcal total on desktop Days and Today is written the way the feed writes it.

### #469 The desktop Home and New post are likely to break below 1280 by 800

The layout was only tested at 1280 by 800, and the CSS suggests two other sizes break.

Between 1024 and 1147 px wide, the feed and the Today column need 844 px of room and the layout gives them less, so the Today column should overflow or force sideways scrolling. The New post window is a fixed 620 px tall with padding, so a laptop browser about 650 px high, such as 1366 by 768, clips the top or the shutter. This comes from reading the CSS and was not run. Done when Home and New post are checked at 1024 by 700 and 1366 by 650 and nothing is clipped or scrolls sideways.

### #470 On desktop, adding a photo to an existing post has no file picker

Adding a photo to an existing post, including a not-eaten plate, gives a desktop user no way to choose a file.

That flow keeps the old window, where "Choose from library" is hidden on desktop, so without a webcam the user sees only the camera area and nothing says that drag and drop or paste works. This predates PR #460. Done when, on desktop with no webcam, a photo can be added to an existing post from a file picker.

### #370 The camera view stays open for a long time after a photo is taken

After a photo is taken, the camera view stays on screen for a long time before the post shows in the feed. People will not wait that long.

The capture sheet sends its post-created event and closes only after a successful post, so it waits on the upload and the server. The owner reports the wait on his phone. Observe first: time the tap to the sheet closing and to the new post showing, on a phone over mobile data, and record the size in bytes of each photo the phone uploads. Then close the sheet at the tap and show the new post at the top of the feed in its processing state while the upload finishes. Done when the sheet closes within one second of the tap on a throttled connection, the post appears at the top of the feed in its processing state, and a failed upload is shown on that post.

### #222 The feed fails to open, and photos and cards take too long to appear

On a large account the feed sometimes shows an error or never appears. When it opens, photos and cards take a long time to show, so the app feels broken and slow.

Run 8 merged the cold-open fixes (#322, #323, #324, #326). In emulation, 100 of 100 browser openings passed and the five final cold photos took 1.48 to 1.83 seconds. The original failures (3 server errors and 15 blank feeds in 100 openings on the largest test account, 146 posts) never reproduced on Run 7's baseline, so their cause is not isolated; the worker's empty-claim loop is a suspect (separate item). The runtime logs return 403 for the coder, so the stack for digest 3642131196 exists only in the Vercel console. Done when the feed and the first photo show within two seconds on the owner's phone over mobile data.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

Use Muse Spark Open (meta-models/muse-spark-open-1026) through Baseten's OpenAI-compatible endpoint, https://inference.baseten.co/v1, for the identify-and-portions call. The key works only with that model and never goes in the repository, an issue or this backlog. Confirm the coder can sign in to Baseten with the key before the trial. The model always reasons, so check output caps that include reasoning. The Meta client hardcodes model names, and the ten-photo harness cannot choose a model host. Trial first in a throwaway clone that swaps only that call, and spend at most 5 US dollars. SAM and transcription stay on the Meta API, and the USDA lookup is unchanged. Compare the ten meal photos and one caption, "I ate half the rice", against the current path. A qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Cerebral Valley answered on Nov 3 that Muse Spark Open counts however it runs, including through Baseten. Done when a real, switchable path on main runs the identify-and-portions step on Muse Spark Open through Baseten, the model ID is logged, the results against the ten photos are in docs, and the owner has switched it on in Profile, logged a meal, and seen the Muse Spark Open line in that meal's post detail on production.

### #294 The app's words read naturally everywhere

The leftovers label reads awkwardly, and nobody has reviewed the words in the rest of the app.

The label "leftovers (not eaten)" reads awkwardly. The planner reviews the app's terms with AGY as a second opinion and lists each term, where it appears and a recommended replacement. The terms include the leftovers label, "Consumed", "Log again", "Saved meals", "Additional food", the needs-input question and the Days names. Every rule stays: consumed past tense, no target, goal, ring or percentage, and no "left" as a word for a remaining amount. Done when the list is reviewed, the owner has ruled on each term, and the wording is changed everywhere it appears.

### #348 A photographed drink's card was not proven on production

The card for a photographed drink was closed without the production check its done condition asked for.

The Fleet 10 report says the selected drink card on screen remains unproven. Done when a photographed drink shows the right drink card on production, on the owner's three phones.

### #351 The drink tile sizes and order were closed on a local test only

The tile sizes and order on the drink sheet were not checked on production.

Only a local test backs the closure. Done when the drink sheet shows its tiles in the right sizes and order on production, on the owner's three phones.

### #495 Tapping a meal shows nothing until the whole detail loads

A tap on a meal card looks dead until the server finishes the whole detail. On phone and on desktop, no loading screen appears, so the tap gives no feedback until the server answers.

Unverified audit finding, read at head 618cf7e, which is older than main. The audit assumed a viewer in Jakarta. The judges are in North America. The phone page (src/app/posts/\[id\]/page.tsx) has no loading screen. The home page passes the desktop detail with no placeholder around it (src/app/(tabs)/page.tsx, src/components/DesktopWorkspace.tsx), so the dialog cannot open until the server finishes. The audit proposes a loading screen for the phone page and a placeholder with a photo and item-row skeleton on desktop. That would also let the browser prefetch the shell. Observe first: re-read those files on current main, and time the tap to the first visible change on a throttled connection. Done when a tap on a meal card shows a skeleton within one second on phone and on desktop, on a throttled connection, and the full detail replaces it when it loads.

### #496 Opening a meal's detail reads the same meal twice

Opening a meal's detail reads the post, its items and its media twice, so every open pays about double the database work before anything shows.

Unverified audit finding, read at head 618cf7e. The audit says the detail component fetches the full detail and the feed card for the same meal in parallel (src/components/PostDetail.tsx, src/lib/posts/items.ts, src/lib/posts/feed.ts, src/lib/nutrition/totals.ts). The items read is three queries (current items, nutrition rows, parent items), so items alone cost six round trips. The card adds two revision calls and a saved-meal query. The audit counts about fifteen database round trips per detail open. It proposes one detail loader that reads the post, items, media, saved state and revision data once. A smaller version shares the reads within one request. Observe first: count the database requests of one detail open on current main. Done when one detail open reads each of post, items, media, saved state and revision data once, and the request count before and after is in docs.

### #497 Opening a meal's detail downloads the full original photo again

Opening a meal's detail downloads the full original photo although a small copy is already on screen from the feed. The browser cannot reuse what it already holds, so every open pays a large download.

Unverified audit finding, read at head 618cf7e. The audit says the detail image uses a fresh signed address minted at every render, which skips the five-minute address cache the feed uses, and that it points at the original file and not the cached feed copy (src/components/OutlineOverlay.tsx, src/lib/posts/items.ts, src/app/api/media/feed/\[owner\]/\[post\]/\[media\]/v1.webp/route.ts). It proposes showing the cached feed copy first, then the original after it loads or on zoom, and keeping the original for the outline editor. Nobody has measured the original photo sizes. Related: #372. Done when a detail open shows the cached feed copy at once, the original loads only after it or on zoom, and the bytes downloaded per detail open before and after are in docs.

### #498 The feed reads once per meal and fires about 100 requests on a cold load

A first load or a deep scroll of the feed fires about 100 browser requests for one 20-post page, because each meal costs its own set of reads.

Unverified audit finding, read at head 618cf7e. Per meal, the audit lists two revision calls, a media query, a saved-meal query and the three-query item read (src/lib/posts/feed.ts). The home mitigations cover repeat visits to the top of the feed only: the first six posts render on the server, six posts stay in a browser cache, photo addresses are stable, and the first photo preloads. The audit proposes batching the per-meal reads the way the days reader now uses one joined query. Related: #222 and #373. Observe first: count the requests of a cold 20-post feed on current main. Done when a cold 20-post feed page makes a fixed small number of reads instead of one set per meal, and the request count before and after is in docs.

### #508 A new upload's failure reason can be blanked when the pending-items read finds no row

A new upload that failed can lose its failure reason, so the card shows no explanation.

Reviewer finding on merged PR #476, confirmed by the coder on Nov 4: a no-row pending read returns null and the caller overwrites the valid reason, reproduced with an isolated read result. The new pending-items read returns a null failure reason when it finds no row, and the card takes that null over a valid reason (src/lib/posts/feed.ts getPendingItems, src/components/Feed.tsx lines 491 to 495). The reviewer suggests keeping the card's own failure reason and treating "no row" as an explicit result. Observe first: reproduce a failed new upload on current main. Done when a failed new upload keeps and shows its failure reason, including when the pending-items read returns no row.

### #509 A label with a portion size but only per-100 values can log the wrong numbers

A nutrition label that prints a portion size but lists only per-100 g or per-100 ml values can be logged on the wrong basis, for example 400 kcal for a 30 g serving.

Reviewer finding on merged PR #478. The coder confirmed that a reading of 30 g and 400 kcal passes validation and logs 400 instead of 120. No live model call has shown the model producing that reading. The prompt has no rule for this layout (src/lib/prompts/spark/label.ts line 1). The reviewer suggests choosing the printed column first, then taking its basis, and adding a fixture for this case. Observe first: read a label of this layout and record the numbers. Done when that label logs numbers on the right basis, and the English per-serving label and the Indonesian label still read correctly.

### #510 Open Food Facts liquids are saved with a mass unit

A barcode product whose quantity reads "500ml", "1L" or "330mL" is classified as grams, so a liquid can save with a mass unit.

Reviewer finding on merged PR #480, confirmed by the coder on Nov 4: "500ml", "1L" and "330mL" become grams, while "500 ml" becomes millilitres. The unit test needs a word boundary before the unit, so a number joined to its unit fails it (src/lib/fdc/open-food-facts.ts lines 26 to 30). Observe first: run those three quantities through the mapper. Done when "500ml", "1L" and "330mL" each map to a millilitre basis and a test pins all three.

### #511 Typing a caption can lose the selected photo

On the phone composer, typing a caption and then leaving the box can leave the wrong photo selected.

Reviewer finding on merged PR #483, reproduced by the coder in a production local draft: photo 2 was visible at scroll position 210, and after the caption took and lost focus the strip returned to photo 1. While the caption has focus, the composer unmounts the photo carousel, and the scroll-restore effect does not run again when it returns, so the selected photo is not restored (src/components/LightComposer.tsx line 89 and the effect near lines 36 to 40). Observe first: select the second of several photos, focus the caption, then leave it. Done when the same photo stays selected after the caption loses focus.

### #512 The phone calendar can show the wrong month summary and jump when older months load

On the phone Days screen, the sticky month summary can stay on the wrong month, and the scroll position can jump when an older month loads.

Reviewer findings on merged PR #482, both reproduced by the coder in isolated component checks with synthetic months, not on the owner's device. The sticky summary can stay on the previous month while November scrolls in (src/components/PhoneCalendar.tsx lines 27 to 38). The anchoring that keeps the view still when an older month loads restores a stale scroll position if the user scrolls while the request is pending (lines 18 to 22 and 40 to 46). The review reported a third issue, but its text was cut off. Observe first: scroll Days across the October and November boundary, and scroll while an older month loads. Done when the summary names the month nearest the top and the view stays still while an older month loads.

### #513 A herbal tea cocktail keeps matched caffeine

A "herbal tea cocktail" keeps matched caffeine.

Reviewer finding on merged PR #481. The coder confirmed the herbal tea case: the matched 15 mg is kept. The second reported case did not reproduce: a measured zero stays zero. Any standalone "tea" counts as a caffeine source, so "herbal tea cocktail" keeps its matched caffeine. (src/lib/intake/alcohol.ts lines 3 and 13, src/lib/intake/drinks-from-items.ts lines 45 to 47, src/lib/intake/identify-drinks.ts lines 24 to 28). Done when an alcoholic "herbal tea cocktail" logs no caffeine.

### #514 Saved meals, Log now, opens the browser error page when offline

Tapping Log now in Saved meals while offline sends the user to the browser's error page, so the app and its feedback disappear.

The coder confirmed the symptom on Nov 4 while checking a reviewer's report. The ordinary Log again path is fine: a failed save shows as a failed card in the feed. The saved-meal path closes its sheet and navigates home once the copy returns, and the navigation fails offline. Done when Log now while offline keeps the user in the app and shows the failed save on a card or in a message.

### #515 An alcohol amount over 500 g fails the whole post

A drink whose rounded alcohol amount is above 500 g makes the intake sync reject the row, and the post fails with no retry.

The coder confirmed this edge case on Nov 4 while checking a reviewer's report. A rounded intake amount above 500 reaches the limit that migration 0047 sets, and the analysed-post path treats the rejection as a failure that cannot be retried. Nobody created a production fixture to reproduce it. Done when an alcohol amount above 500 g no longer fails the post, and a test pins that case.

### #516 Log again can post the same meal twice on a rapid double tap

Tapping Log again's post button twice in quick succession may post the meal twice.

Unverified reviewer finding on merged PR #487, with blockers (AGY, full coverage). The sheet no longer waits for the copy, so its busy and lock state clears at once (src/components/LogAgainSheet.tsx line 23, src/lib/posts/upload-manager.ts lines 192 to 193). The reviewer also says a failed copy no longer rejects, so the sheet's error handler never runs, and the sheet closes and navigates before the copy finishes, so its error toast never shows. The coder saw an ordinary failure show as a failed card in the feed. Observe first: double tap Log again on current main on a throttled connection. Done when a rapid double tap posts one meal, and a failed save shows to the user.

### #517 The phone calendar may retry its older-month load in a loop after a failure

When loading an older month fails, the phone calendar may retry again and again while the end of the list stays in view.

Unverified reviewer finding on merged PR #482, with a blocker (AGY, full coverage). The inline function passed as onOlder changes on every render (src/components/DaysView.tsx line 190). When the load fails, the new function re-runs the observer while the sentinel is still in view, so the load repeats. Related: the calendar item above. Observe first: make the older-month request fail on current main and count the requests. Done when a failed older-month load makes at most one retry per user action, and the request count is in docs.

### #518 A failed pending-items read stops a new upload card from updating

On a new upload, if the pending-items read throws, for example on a timeout, the card's status stops updating until a later read succeeds.

Planner finding from reading main on Nov 4, not yet reproduced. In UploadHydratedCard (src/components/Feed.tsx), a throw from getPendingItems falls into the existing catch, so the call that applies the fresh card is skipped. Related: the failure-reason item above. Observe first: make that read time out on current main and watch the card. Done when a failed pending-items read still updates the card's status, and the card keeps its last good food names.

### #519 Cached nutrition-card images expire before the feed cache does

Reopening the app one to 24 hours after the last visit can show broken nutrition-card images until the fresh read replaces them.

Planner finding from reading main on Nov 4, not yet reproduced. Card slides use signed addresses that last 3,600 seconds (src/lib/posts/feed.ts), while the feed cache keeps them for 24 hours (feed-cache.ts). Photos use permanent addresses and are fine. Observe first: reopen the app two hours after a visit and look at the card slides. Done when a reopen between one and 24 hours after the last visit shows no broken card image.

### #520 Every Home open reads the first feed page twice

Home reads the first page of the feed in the server render and again from the browser, so every open pays for both reads.

Planner finding from reading main on Nov 4, not yet measured. The client component always calls its load function after the server render (src/components/Feed.tsx). Related: #373 and #498. Observe first: count the first-page reads of one Home open on current main. Done when one Home open reads the first feed page once, and the request count before and after is in docs.

### #521 Nothing tells the user when Muse Spark Open fails and Meta answers

When the Baseten call fails, the post's detail line says Muse Spark 1.3 and gives no sign that Muse Spark Open was requested.

Planner finding from reading main on Nov 4. The line is truthful about the model that answered. Related: #281. Done when a post whose open-model call failed says so in its detail, in the app's usual wording.

### #522 A backdated post shows above today's posts while it uploads

A post dated earlier than today appears at the top of the feed while it uploads, then moves into its own day when it is ready.

Planner finding from reading main on Nov 4, not yet reproduced. Done when a backdated post appears in its own day while it uploads.

## Engineering backlog

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

Unverified planner finding. The app's sign-up and sign-in run as server actions on Vercel, and the middleware refreshes sessions from Vercel. The Run 8 hammer was refused at request 31, but it called Supabase directly from the coder's machine, so it did not test the app's path (docs/auth-protection.md). Nobody has checked which IP address Supabase records for a server-action sign-in, or whether the server client forwards the user's address. Observe first: send 35 sign-ups through the production sign-up form from one machine, then sign in from a second machine. Use throwaway @example.com accounts only. Done when the report states which IP address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another.

### #372 Feed photos are too large for a phone on mobile data

A feed photo downloads at a size far larger than a phone card shows, so the first photo arrives late and every revisit pays for it again.

The sampled feed image is 152,193 bytes and its response carries no Cache-Control header (docs/media-loading.md). Several cards cost megabytes on mobile data, and the cold first photo measured 2.10 s against the 2 s target. The feed photo route (src/app/api/media/feed/\[owner\]/\[post\]/\[media\]/v1.webp/route.ts) reads the original from Storage on every request. Find the largest size a feed card needs on a phone and serve that instead of the original. Keep the original where post detail needs it. Done when the bytes per feed photo before and after are in docs, the first photo of the feed shows within two seconds on mobile data, and the photos look the same on a phone.

### #306 Every tap that saves shows its result at once

Some taps that save something look dead until the server answers, so the app feels slow.

The thumbs (#215) are one case. The bookmark, Save meal, Log again and Edit caption (#223) may also wait for the server; observe which do. Each should show its new state at the tap, settle when the save lands, and show an error and revert if it fails. #217 measures every control; this item fixes the ones that wait. Done when each of those taps changes the screen before the server answers on a throttled connection, the saved state survives a reload, and a failed save is shown.

### #282 The live app keeps working while judges use it

Judging runs Nov 4 to Nov 8, and if the Meta API credits run out first, a judge who posts a meal sees a failed analysis.

USDA FoodData Central allows 1,000 requests an hour. A meal takes about 4.7 requests, so the app handles roughly 200 meals an hour, and the sushi photo needs up to 36 requests when cold. When USDA answers 429, the worker retries at 30 and 60 seconds, ignores Retry-After and then fails the post. The 16-food gate alone made 38 model calls and 69,169 output tokens. Done when a post made while the Meta Model API refuses a call, or while USDA answers 429, shows the user a clear message and can be retried, and a USDA 429 waits as USDA asks.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of USDA caffeine, but they have null beverage categories and no linked item-intake rows. #346 fixes new and re-analysed posts only, and no historical backfill ran. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items.

### #449 The food names do not show before the numbers on a new upload

A new upload shows no food names while its numbers are still being worked out.

On a new upload, the card's reader drops the pending food names, so #307 fails there. Done when a new upload shows the foods the app has found while the numbers are still being worked out, on the owner's three phones.

### #451 Every barcode scan comes back as not in the database

The owner has scanned several packs on a phone and every scan has failed: the scanner reads the code and the lookup finds no product.

The scanner read 7 622300 76136 3 from an Oreo pack and showed "Not in the database. No product for this code yet." The owner finds the same code with an ordinary web search, at barcodelookup.com/7622300761363. Done when this pack gives a product card with its name and nutrition, a second pack from the same shelf does too, and the planner has recorded which source the lookup asks and why it had no entry for this code, on the owner's three phones.

### #453 The barcode prompt is printed over the live camera picture

On the Barcode screen, the line "Point at the barcode. It reads on its own." runs across the camera picture and cannot be read against a busy shelf.

With the camera pointed at a shelf of packs and price labels, the line sits on top of them and the words blend into the picture. Done when the prompt is readable over any camera picture, on the owner's three phones.

### #454 The Days page is not one continuous calendar

Days cuts the calendar into separate month blocks, which no calendar app does, so the user cannot scroll through time as one run of weeks.

On the phone, Days shows November 2026 and October 2026 as two separate blocks, each with its own heading, and the newest month sits on top. Days becomes one continuous calendar: the weeks run on from one to the next in time order with no break, the month name marks where each month starts, and Days opens with today in view. Done when scrolling Days moves through unbroken weeks from October into November, the month names mark where each month starts, and Days opens on today, on the owner's three phones.

### #455 The card you swipe to on a drink's photo shows a number and not what the drink is

Swiping right on a drink's photo opens a card with one big millilitre number, so the card does not say what the drink is or why it exists.

The swiped card for the tiki cocktail shows "220 ml" in large type, a line of text and "1,200 ml consumed today" split into drinks and food. A card for a drink leads with its kind as a picture: a coffee cup for coffee with its caffeine, a water cup for water with one cup for every 250 ml drunk, and a cocktail glass or a wine glass for those with their alcohol, and the day's drinks are drawn as the same cups. Done when a coffee, a 500 ml water (two cups), a cocktail and a glass of wine each show their own picture on the swiped card, and a card that holds only liquid reads as a drink at a glance, on the owner's three phones.

### #456 A rum cocktail is logged with 15 mg caffeine

The tiki cocktail post states caffeine that the drink does not contain.

The drink card for the lime and rum tiki cocktail reads "15 mg caffeine" next to 196 kcal, and the day's caffeine total reads 110 mg. Done when a cocktail or any drink with no caffeine source logs no caffeine, the card shows none, and the day's total leaves it out, checked on the tiki cocktail and a glass of wine.

### #457 An alcoholic drink shows its alcohol, not its liquid

A cocktail post shows how much liquid it holds and nothing about the alcohol, so the user cannot tell how much they have drunk.

The post for a lime and rum tiki cocktail shows "220 g" on the photo and 196 kcal, 0 g protein, 17 g carbs and 0 g fat under it, with no alcohol anywhere. For a drink that holds alcohol, the post shows the grams of alcohol and the standard drinks in place of the liquid amount, the drink's liquid is not added to the water total, and Today shows the day's alcohol so far. Done when a photographed cocktail and a typed beer each show their alcohol on the post and in Today, and neither adds to the water tile, on the owner's three phones.

### #458 The text box on New post is hidden behind the keyboard

On New post on the phone, the caption box is not visible when the keyboard is open, so the user types without seeing the words.

On an iPhone with the keyboard up, the screen shows the photo and the Post button and no caption box. After a tap into the caption, the page scrolls so the box sits under the photo with the "Another photo" and "Search foods" buttons and other rows crowded around it. Done when, with the keyboard open, the caption box is fully visible above the keyboard together with the Post button, and nothing overlaps it, on the owner's three phones.

### #499 Several pages export an instant flag that nothing reads

Several pages export a flag called instant set to false, and nothing reads it. Every reader has to wonder what it does.

Unverified audit finding, read at head 618cf7e. The audit found no source file, script or tool that reads the flag (src/app/posts/\[id\]/page.tsx and other pages). Nothing breaks while it stays. Done when no page exports the flag and a search of the source for it returns nothing.

### #523 A meal shows every nutrition value as unavailable

A meal analysed on Nov 4 at 9:53 AM, "Spicy Indonesian macaroni", shows its calories, protein, carbs and fat as unavailable. The owner says the app's food estimates are broken now.

The owner's screenshot of the post (86634d46-b0e3-421a-9b67-1a4e8f5e8e78 on production) shows a comment that reads "Nutrition unavailable: spicy Indonesian fried macaroni snack", and a model line that reads "Identified by Muse Spark 1.3". Judging runs from Nov 4, so a general fault would hit every judge's meal. The coder found on Nov 4 that the matcher rejected every retrieved reference after three searches (the full name, "fried +macaroni" and "fried +pasta") and never tried the bare name "macaroni". No lookup failed, nothing hit a rate limit, and nothing points to a Fleet 11 regression. Fresh USDA requests for "macaroni" and "macaroni cooked" returned records (357 kcal per 100 g, and Pasta, cooked, 157 kcal per 100 g), which are not confirmed equivalents of a fried snack. Of 15 posts in the last 24 hours, five had at least one unavailable field, and only this one had every value unavailable; the others were composite dishes the matcher rejected. The app has no fallback when USDA has no match: it shows unavailable and invents no value, and the Open Food Facts fallback covers barcode scans only. The owner asked for a fallback. The candidate is to search USDA for the closest generic food before saying unavailable. A model estimate needs the owner's ruling. Done when, after the matcher's strict searches fail, it tries the bare food name, and a re-analysed post of this food shows nutrition from the closest USDA record, labelled with that record's name, or says plainly why none qualifies.

### #524 Sugar shows as unavailable when USDA holds it as Sugars, Total

A meal can show its sugar as unavailable although USDA's record holds the value under "Sugars, Total".

Confirmed by the coder on Nov 4 while auditing the macaroni post. A pineapple's record held nutrient 1063, "Sugars, Total", stored at 8.55 g, but the sugar column reads only nutrient 2000. Calories were unaffected. Done when a food whose USDA record holds 1063 and not 2000 shows its sugar, and a test pins that case.

### #525 The meal detail photo is cropped and does not show the whole image

The meal detail page shows the photo in a short, wide frame, so the top and bottom of the photo are cut off. The owner wants the whole image and has asked for it three times.

The owner's screenshot on desktop shows the macaroni photo as a wide strip with the outline masks drawn on the cropped part. The detail photo is drawn to fill its frame (OutlineOverlay.tsx), and the outline masks use the photo's stored width and height. Observe first: measure the frame and the photo on desktop and on phone, and record how much of the photo is cut off. Done when the detail page shows the whole photo with nothing cut off on desktop and on phone, and the outline masks still sit on the right parts of the food.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. Run 8 merged a dormant hCaptcha widget and token path (#336). Called directly from the coder's machine, Supabase refused the hammer at sign-up 31 and sign-in 32, and the 31 throwaway accounts were deleted. The owner holds the site key and the secret. The secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT\_PUBLIC\_HCAPTCHA\_SITE\_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers sign-up and sign-in is refused.

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

Every item is a title line and two paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the three parts. The three parts are: (1) a title a person can read; (2) a first paragraph that states the problem in plain language and in enough depth that a person could fix it; (3) a second paragraph with all the context that helps a person solve the problem, meaning what investigation, work or the owner's observations have established, ending in a done condition. Neither paragraph is a dump of everything known. Write short sentences in the active voice, as the Google developer documentation style guide asks. An item without all three parts is not on the backlog.
