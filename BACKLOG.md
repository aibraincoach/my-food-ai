# My Food AI — Backlog†

Last edited: Wednesday 2026-11-04 at 21:03 WIB (UTC+07:00) by Claude, PM

The only job of the PM is to maintain this backlog and keep it completely up to date. Failing to do so is immediately terminable.

## Backlog for Owner

### #591 Confirm the desktop layout and see one real labelled estimate

The owner has not yet checked the new desktop layout on his own window, and he has not seen a labelled nutrition estimate on a real meal.

Fleet 14 shipped a structural fix for the full-width feed, but nobody reproduced its cause. The estimate path has only run against an empty USDA on a disposable stack, and the cendol fixture matched a gelatin dessert. In the owner's full-width desktop window, run `document.querySelector('[data-shell]')!==null` in the console and note whether it is true. Re-analyse the macaroni post, and analyse one exotic food. Done when the owner has said whether the console check is true, his window shows the centred 500 px feed with the Today column, and he has seen one labelled estimate on a real meal.

Blast radius: Judges on desktop would meet a broken or full-width layout on first load. The check costs the owner minutes and touches no code or process.

### #452 A plainly visible nutrition label is reported as not found

A photo of a pack whose nutrition table can be read is rejected with "No nutrition label found".

The photo of a Goldfish cracker pack, with the label printed in Indonesian and the table fully in the frame, gave "No nutrition label found" with "Take the photo again" and "Type it instead". Done when that photo gives a card with the numbers printed on the label, and a label in English does the same, on the owner's three phones.

Blast radius: A judge who scans a pack label gets a failure on a headline feature, in the demo and on a phone. The fix sits in the label read path, so it needs its own check on real packs.

### #451 Every barcode scan comes back as not in the database

The owner has scanned several packs on a phone and every scan has failed: the scanner reads the code and the lookup finds no product.

The scanner read 7 622300 76136 3 from an Oreo pack and showed "Not in the database. No product for this code yet." The owner finds the same code with an ordinary web search, at barcodelookup.com/7622300761363. The planner reports that Fleet 13's test confirmed the cause; the phone check remains. Done when this pack gives a product card with its name and nutrition, a second pack from the same shelf does too, and the planner has recorded which source the lookup asks and why it had no entry for this code, on the owner's three phones.

Blast radius: Every barcode scan fails, so the packaged-food path is unusable in the demo and for judges. The cause is unknown, so the fix may reach the scanner, the lookup or the providers.

### #525 The meal detail photo is cropped and does not show the whole image

The meal detail page shows the photo in a short, wide frame, so the top and bottom of the photo are cut off. The owner wants the whole image and has asked for it three times.

The owner's screenshot on desktop shows the macaroni photo as a wide strip with the outline masks drawn on the cropped part. The detail photo is drawn to fill its frame (OutlineOverlay.tsx), and the outline masks use the photo's stored width and height. Observe first: measure the frame and the photo on desktop and on phone, and record how much of the photo is cut off. Done when the detail page shows the whole photo with nothing cut off on desktop and on phone, and the outline masks still sit on the right parts of the food.

Blast radius: Judges see a cropped photo on the page they open most, which reads as unfinished on desktop. The fix touches the detail layout that Fleet 14 just changed, so it needs a desktop check from 1100 to 1440 px.

### #212 Barcode and nutrition-label scanning is untested on a phone

Nobody has tried logging a packaged food from its barcode or nutrition label on a phone with a real pack. Every check so far ran in emulation.

The capture sheet swipes between Photo, Barcode and Text (PR #298). A barcode photographed in Photo mode is also read: the app decodes the barcode from the image first and looks up the digits, and uses the model only when it finds no barcode and for labels. Photograph a real pack's barcode through the capture sheet; the card should show the product's name, its nutrition and the pack photo. Then photograph a nutrition label; it should give the same kind of card. Done when both give a correct card on the owner's phone.

Blast radius: A broken packaged-food path would be found first by a judge. Waiting damages nothing, but the result feeds #451 and #452.

### #285 Test the half-eaten plate again on a phone

The app works out how much was eaten from a leftovers photo. Nobody has confirmed on a phone that the consumed number is right.

Photograph a meal before and after eating it, then check the consumed number. If it is wrong, report it to the coder. The video includes the not-eaten plate, so this has to work first. Done when a fresh before-and-after test gives the right consumed number. If it does not, the plate stays out of the video.

Blast radius: A wrong consumed number is a wrong number on a judge's meal, in a flow the demo may show. Nothing changes in code until the owner reports a failure.

### #318 Read the README before recording

Judges read the README first, and the owner has not read it yet.

The README (#287) is written in Run 7. Read it after it merges. Done when the README is read and everything wrong in it is listed.

Blast radius: A README that misdescribes the app is the first thing a judge reads. The check changes no code.

### #26 The demo video and the submission do not exist yet

Nothing is submitted until the video is recorded and the submission is in. The deadline is Nov 4 at 9 PM EST (Nov 5 at 09:00 WIB).

The submission needs the public repository, the video link and a list of everyone who worked on it. Judges stop watching at three minutes, and the video must show the feature working with live Meta model calls and say which open Meta model it uses and where it runs, Muse Spark Open on Baseten (Cerebral Valley, Nov 3). Every feature built is in the video, the not-eaten plate included. Post the video to X as soon as it exists: the Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8. Whether the post must exist before the submission deadline is unconfirmed. PRs merge as soon as each holds a counting receipt, and nothing waits on a clock before recording starts. No merges or deploys run from the start of recording until the submission is in. Done when a video under three minutes is on X and the submission is in.

Blast radius: Without the video and the submission there is no entry, so this is the largest business risk on the list. It needs the owner's time and depends on no code.

### #379 Phone checks of the installed app over mobile data

Every Run 7 and Run 8 timing check ran in emulation. No physical phone has tested the feed, the photos, installation or posting.

Check on each of the owner's three phones, installed from the home screen, over mobile data: the feed and the first photo show within two seconds (#222, #305); the last feed shows at once and fresh posts appear without jumping (#304); a warm revisit reuses cached photos and the photos look acceptable (#305); the camera, the keyboard and a post from the phone work, with the right photo kept (#6); a post completes through the worker (#322); the capture sheet closes within one second of the tap (#370). Done when each check passes on each of the three phones and each failure is reported to the coder with its number.

Blast radius: Every timing claim so far came from emulation, so a slow phone would surprise us in the recording or in front of a judge. The checks change no code but may open new items.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature merges, one pass replaces the default README with a short start-here page (#287). All working files stay on main, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed or scrubbed. Done when the README is the start-here page and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep. Fleet 10 closed the issue and Fleet 11 ran the search, so the owner's keep list is what remains. GitHub shows this issue closed (the coder's read at 17:51 WIB); it stays here until its done condition above is met.

Blast radius: A repository that still shows the default README costs the judges' first impression and may fail the public-repository requirement. The change is docs only and endangers no code.

## In Flight

### #550 The desktop feed fills the whole window and the Today column is missing

On desktop the feed runs edge to edge and the photo touches the window edge. The Today column does not appear.

The Round 6 design (6a) and the code on main both centre a 500 px feed column beside a 280 px Today column. Production deploys from main. An OpenClaw check on Nov 4 found the Today column present at 1024 to 1366 px wide, so the owner's screenshot may predate a deploy. The feed's own width was not measured. Measure the feed column on the live page at 1280x800. Fleet 14 shipped a structural fix, but nobody reproduced the cause (a service-worker shell is the guess), because the browser driver failed both times. The designer reported at 16:46 WIB that the owner's screenshot still shows the old full-width feed and the asterisk footnote, neither of which is in main at a24587a, so the page came from an older build. The designer names a stale service-worker cache as the first suspect and a production deployment behind main as the second. The coder's 15:59 report says production matched main at a24587a, with the alias verified and the deployed files equal to the tested tree. At 16:47 WIB the owner hard-refreshed his desktop window and it showed the centred feed with the Today column, so the old page came from a cached build. Done when production shows the centred 500 px feed with the Today column as 6a draws it, checked on the live page at 1280x800.

Blast radius: Judges on desktop see a broken layout on first load. The fix reaches the shared desktop shell that every desktop screen uses. If a stale service worker is the cause, every returning visitor, judges included, can be served an old build after each deploy.

### #512 The phone calendar can show the wrong month summary and jump when older months load

On the phone Days screen, the sticky month summary can stay on the wrong month, and the scroll position can jump when an older month loads.

Reviewer findings on merged PR #482, both reproduced by the coder in isolated component checks with synthetic months, not on the owner's device. The sticky summary can stay on the previous month while November scrolls in (src/components/PhoneCalendar.tsx lines 27 to 38). The anchoring that keeps the view still when an older month loads restores a stale scroll position if the user scrolls while the request is pending (lines 18 to 22 and 40 to 46). The review reported a third issue, but its text was cut off. Fleet 14 could not show the sticky label switching to November on production, because the whole two-month grid fits the viewport. No production account can show it, so prove it with three seeded months on the disposable stack. Observe first: scroll Days across the October and November boundary, and scroll while an older month loads. Done when the summary names the month nearest the top and the view stays still while an older month loads.

Blast radius: The wrong month label confuses a judge scrolling Days on a phone, and the jump loses their place. The fix sits in the scroll code of PhoneCalendar.tsx, where a mistake can break scrolling for the whole page.

### #552 The buttons under each post are 24 px tall and show no pressed or turned-off state

The buttons under a post are too small to hit and look the same at rest, while saving and when turned off.

Design 7a (Round 7) gives 44 px tap areas and every state: rest, pressed, saving, turned off and failed. Done when each button matches 7a on production at 390x844. The coder's 17:44 WIB report says the five-state acceptance is unproved: the processing capture missed processing and found a ready row, earlier pressed-state samples were missed, and one induced failure held OPTIONS requests. Thumbs down measured 386.6 ms to its frame and 862.7 ms to its reply.

Blast radius: Small tap targets and no pressed state make every post feel dead on a phone, the device judges use. The fix touches the action row under every post on phone and desktop.

### #553 Thumbs up and down look the same when turned off and thumbs down waits for the server

The thumbs turn themselves off while a vote saves and before the analysis exists, with no visible difference. Thumbs down opens nothing until the vote has saved.

This is the first case the owner found for #217. The coder's Fleet 14 acceptance checks reported that entry timings fail the plan's gate, and that report names #553. Done when a thumb shows its pressed state at once, looks different when turned off, and thumbs down opens at once, checked on production at 390x844 with the processor slowed. The coder's 17:44 WIB report says the strict 50 ms gate failed on four of eight local entry paths: phone photo 51.5 ms, desktop More 64.3 ms, Details 66.6 ms and Comment 64.3 ms. All eight kept zero photo-top shift.

Blast radius: A vote that shows no response reads as a broken app and invites double taps. The fix touches the vote state and its server save, so double votes need a test.

### #554 Tapping a meal shows nothing until the server answers

Comment, Details, tapping the photo, "more" and Post in the capture sheet wait for the server before anything changes on screen.

Design 7b (Round 7) shows the screen at once, using the photo already on screen while the details load. Done when each of these taps shows a visible change at once, with no layout jump when the details arrive.

Blast radius: Every meal tap feels dead until the server answers, the slowest-feeling moment in the app. The fix changes navigation and history on phone and desktop, where a mistake can break Back.

### #494 Opening a meal's detail takes 14 seconds

The owner reports 14 seconds from tapping a meal to its detail page opening. He calls it not acceptable.

The owner reported it on Nov 4 at about 07:38 WIB. He measured on an iPhone with the app installed from the home screen, on XL Axiata Prioritas 5G in Indonesia. He gave no meal URL because the installed app shows none. The coder's Chromium audit on production (docs/detail-open-audit.md in PR #475) found useful content at 0.9 to 3.4 seconds, the original photo decoded at 1.2 to 3.7 seconds, 24 to 25 requests with eight repeated, and a 142 KB original downloaded although the feed copy was on screen. It did not measure the iPhone on XL Axiata, so the 14 seconds is unexplained. The audit items below name three suspects: no loading screen on the tap, the same meal read twice, and the full original photo downloaded again. Nobody has timed the detail on a phone on current main. Fleet 14 (production a24587a, unthrottled Firefox, not a phone) measured the first detail frame at 10 to 25 ms and completed detail replacements at 1,030 to 1,787 ms in five trials. One desktop trial did not finish within 20 seconds, a follow-up finished by 2.5 seconds, and no cause is known. Every successful detail trace shows two completed original-image GETs of 110 to 240 KB, which the first frame hides but does not remove. Chromium hung on the coder's host, so nothing was measured with the processor slowed or on Fast 3G, and that condition is unmet. Observe first: time the tap to a usable detail on a phone over mobile data and on desktop, and record where the seconds go (server render, database reads, photo download). Done when the detail opens within two seconds on the owner's phone over mobile data, and the report states where the 14 seconds went. The Fleet 14 coder's 17:44 WIB report says the 14-second opening was not reproduced or fully explained. A Muse efficiency audit of main 299f13a that the owner relayed at 19:25 WIB (read-only, nothing measured live, not verified by the PM) says the detail photo downloads the full original on every open even with no outlines to show (OutlineOverlay.tsx:31-37), signs one address per outline instead of one batch (items.ts:126-135), and reloads the whole meal on every thread event (Thread.tsx).

Blast radius: The owner measured 14 seconds on his phone, so a judge's first meal tap could take as long and read as a crash. The cause is unknown, so work on the suspects can spend time without removing the delay.

### #499 Several pages export an instant flag that nothing reads

Several pages export a flag called instant set to false, and nothing reads it. Every reader has to wonder what it does.

Unverified audit finding, read at head 618cf7e. The audit found no source file, script or tool that reads the flag (src/app/posts/\[id\]/page.tsx and other pages). Nothing breaks while it stays. Done when no page exports the flag and a search of the source for it returns nothing. GitHub shows this issue closed (the coder's read at 17:51 WIB); it stays here until its done condition above is met.

Blast radius: Dead flags mislead coders and reviewers and cost planning time, but nothing breaks for users. Removing them risks deleting one that something does read.

### #323 Every protected page checks sign-in twice (part of #222)

The middleware calls Supabase to verify the user. The home page then calls Supabase to verify the user again. That is two round trips on every page open, on top of the cold function boot.

Run 8 merged one sign-in check per page: the server makes one Auth call, and a forged header is refused. Recorded browser windows still contained 10 and six /auth/v1/user requests, so the whole opening is not yet attributed. API authentication stays intact. Fleet 11 could not close it: minute totals from the logs cannot isolate one opening. Measure with spans tied to one navigation, and count the middleware call, the server helper call and the browser call. Fleet 14 cut the browser Auth GETs from one to zero across Home, Days and Profile on production, but local server windows still recorded 7, 9 and 14 verifications per page open. The likeliest cause is that the middleware verifies every prefetch and refresh request, not only the document, and each card carries several links. This is also the probable server half of #222. Done when a page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page.

Blast radius: Extra Auth calls slow every protected page and add Supabase egress. The fix sits in the middleware that guards every protected page, so a mistake can let an unsigned request in or lock out signed-in users.

### #324 Home computes the day totals twice on every open (part of #222)

The server renders the row of day bubbles with totals for the last 5 days. The browser feed then computes totals again for the feed's days. Today's totals are queried twice on every home open.

Run 8 merged one shared server read of today's totals. Final browser windows still made one or two day-total reads, so a single read across the server and the browser together is unproved. Fleet 11 could not close it for the same reason. Measure with spans tied to one navigation, and count every read that returns today's totals, batch reads included. Done when a home open queries today's totals once across the server and the browser together.

Blast radius: Duplicate day-total reads add load and egress to every Home open. The fix touches the totals shown on Home, so a mistake shows wrong calories to a judge.

### #520 Every Home open reads the first feed page twice

Home reads the first page of the feed in the server render and again from the browser, so every open pays for both reads.

Planner finding from reading main on Nov 4, not yet measured. The client component always calls its load function after the server render (src/components/Feed.tsx). Related: #373 and #498. Observe first: count the first-page reads of one Home open on current main. Done when one Home open reads the first feed page once, and the request count before and after is in docs.

Blast radius: A second first-page read doubles feed traffic on every Home open. The fix changes how Home seeds its feed, where a mistake can show an empty or stale feed.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

Run 8 merged lazy loading of the job modules in the tick route. Rapid tick calls passed, but they hit a warm function, so a cold start is unmeasured (docs/tick-cold.md), and a post from a real phone through the worker is untested. Fleet 11 timed one first request per deployment, which does not establish a cold start, and reopened the issue. PR #536 adds an x-tick-cold header and a tick cold log line, and no value has been read yet. Lazy loading is delivered by #334. Done when a cold start of the tick route is timed on production, before and after, with the times in docs, and a post from a real phone completes through the worker.

Blast radius: The tick route runs on every open, focus and once a minute, so a slow cold start reaches every user. The fix changes how job modules load, where a mistake can stop the worker from running jobs.

### #373 The app reads more from the production database than it needs

The app's reads drove egress to 8.66 GB and log ingestion to 1.10 GB in one billing cycle, against 5 GB and 1 GB on Supabase's free plan, and the project was depleting its Disk IO budget. The organization is now on Pro, which includes 250 GB of egress per cycle, but the same reads still cost bandwidth and database load while judges use the app.

Run 8 cut the feed's Supabase traffic per opening from 5.06 MB to 0.523 MB, 89.7%, by reading day totals once. The app and the worker use Supabase's HTTPS APIs, not SQL connections, so the pooler setting does not apply. Managed services (PostgREST, Storage, Realtime) account for many of the connections the Infrastructure page counts, and the historical 31 of 60 is unexplained, as is the 70% RAM on the Micro instance. Log-ingestion bytes are unattributed, since only row counts exist. Done when the billed log-ingestion bytes are attributed to their sources on the usage page and the RAM use on the Micro instance is explained.

Blast radius: Database egress was 8.66 GB in one billing cycle against a 5 GB allowance, which is a cost and availability risk. Cuts touch read paths across the app, so each needs a regression check.

### #375 Storage egress is the largest source and was not cut

In the 24 hours before Run 8, Supabase Storage served 2.99 GB across 35,048 requests, almost all to browsers. The Run 8 cut measured the feed's posts reads, not Storage.

docs/egress.md attributes the bytes to browser-class agents but not to which files (feed JPEGs, card PNGs or originals) or which clients. Much of it may be the coder's own 100-opening measurement runs. In the latest 24 hours, automation accounted for 1.72 GB of the 1.77 GB of feed-source bytes and real mobile browsers for about 46 MB, split by user-agent, so the attribution is a guess. Log-ingestion bytes were never measured; only row counts were. Done when Storage egress is broken down by file kind and by client (test automation or real users), log-ingestion bytes are measured, and the largest real-user source is cut or shown to be small.

Blast radius: The largest egress source is unattributed, and automation moved most of the measured bytes, so our own measurement runs consume the budget they measure. A cut to feed photos changes what every user downloads.

### #471 The recording account can hit the hourly model cap on camera

A recording with several photos on one account can run into the model's hourly limit while the video runs.

Photo drink identification adds one model call per staged photo, counted against the account's hourly cap, and the last audit on production got "You have made a lot of requests this hour." Done when a recording-length session of several photos on one account runs with no cap message, or the account's cap is raised before recording.

Blast radius: A recording account that hits the hourly model cap fails mid-video, which would ruin the submission demo. A fix that raises or bypasses the cap touches the rate-limit code that protects the model bill.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196. Fleet 14 built its control table in unthrottled Firefox because Chromium hung, so the slowed-processor condition is unmet. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items.

Blast radius: Dead-feeling controls cost judges' trust on every screen. The audit changes no code, but its findings fan out into new items and fixes across screens.

### #555 The controls on Days, Search, Profile and the capture modes have not been audited

The Round 7 control table covers the feed, the post and the capture sheet. Days, Search, Profile and the Text, Photo and Barcode modes are not in it.

The designer has not read their controls yet. Add them to the table with the four findings of #217: time to a visible change, pressed state, jump or flicker, and double tap. Done when every control on those screens is in the table and the dead ones are fixed or filed as items.

Blast radius: Unaudited controls on Days, Search, Profile and the capture modes may hide dead taps the owner has not found. The audit changes no code, but it adds items.

### #294 The app's words read naturally everywhere

The leftovers label reads awkwardly, and nobody has reviewed the words in the rest of the app.

The label "leftovers (not eaten)" reads awkwardly. The planner reviews the app's terms with AGY as a second opinion and lists each term, where it appears and a recommended replacement. The terms include the leftovers label, the line Drank in this meal on a meal's second slide (the owner said at 16:49 WIB that it sounds off), "Consumed", "Log again", "Saved meals", "Additional food", the needs-input question and the Days names. Every rule stays: consumed past tense, no target, goal, ring or percentage, and no "left" as a word for a remaining amount. A review noted that the wording search was not repeated against final main before the issue was closed. Done when the list is reviewed, the owner has ruled on each term, and the wording is changed everywhere it appears. GitHub shows this issue closed (the coder's read at 17:51 WIB); it stays here until its done condition above is met.

Blast radius: Awkward labels read as unpolished across the app. A wording change touches many files and the tests that name the labels, so a missed instance leaves two names for one thing.

### #348 A photographed drink's card was not proven on production

The card for a photographed drink was closed without the production check its done condition asked for.

The Fleet 10 report says the selected drink card on screen remains unproven. Fleet 14 proved cola analysis and caffeine persistence, but the rendered second-slide drink card is still unproven after two failed driver attempts. Done when a photographed drink shows the right drink card on production, on the owner's three phones.

Blast radius: A wrong or missing drink card shows judges a wrong number on a photographed drink. The check changes no code unless it fails.

### #351 The drink tile sizes and order were closed on a local test only

The tile sizes and order on the drink sheet were not checked on production.

Only a local test backs the closure. Done when the drink sheet shows its tiles in the right sizes and order on production, on the owner's three phones.

Blast radius: Wrong tile sizes or order on the drink sheet look broken in the demo. The earlier closure rested on a local test alone, so a fix risks repeating that gap.

### #449 The food names do not show before the numbers on a new upload

A new upload shows no food names while its numbers are still being worked out.

On a new upload, the card's reader drops the pending food names, so #307 fails there. Done when a new upload shows the foods the app has found while the numbers are still being worked out, on the owner's three phones.

Blast radius: A new upload shows no food names until the numbers are ready, so it looks stuck on the first screen a judge sees. The fix touches the card reader every post uses.

### #453 The barcode prompt is printed over the live camera picture

On the Barcode screen, the line "Point at the barcode. It reads on its own." runs across the camera picture and cannot be read against a busy shelf.

With the camera pointed at a shelf of packs and price labels, the line sits on top of them and the words blend into the picture. Done when the prompt is readable over any camera picture, on the owner's three phones.

Blast radius: An unreadable barcode prompt makes the scanner look broken, which compounds #451. The fix is styling on one screen and touches nothing else.

### #454 The Days page is not one continuous calendar

Days cuts the calendar into separate month blocks, which no calendar app does, so the user cannot scroll through time as one run of weeks.

On the phone, Days shows November 2026 and October 2026 as two separate blocks, each with its own heading, and the newest month sits on top. Days becomes one continuous calendar: the weeks run on from one to the next in time order with no break, the month name marks where each month starts, and Days opens with today in view. Done when scrolling Days moves through unbroken weeks from October into November, the month names mark where each month starts, and Days opens on today, on the owner's three phones.

Blast radius: A calendar cut into month blocks reads as a bug to anyone used to a calendar app. The fix changes the Days layout and shares scroll code with #512, so the two items overlap.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of USDA caffeine, but they have null beverage categories and no linked item-intake rows. #346 fixes new and re-analysed posts only, and no historical backfill ran. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

Blast radius: Old cola posts show no caffeine, so a day's total can read wrong. A fix that backfills records edits production rows, so it needs a safe way to undo it.

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

Unverified planner finding. The app's sign-up and sign-in run as server actions on Vercel, and the middleware refreshes sessions from Vercel. The Run 8 hammer was refused at request 31, but it called Supabase directly from the coder's machine, so it did not test the app's path (docs/auth-protection.md). A browser agent reported that on Nov 4 between 13:12 and 13:27 WIB it signed up 35 accounts through the production form, one about every 22 seconds. It saw no rate-limit message, no 429 and no CAPTCHA, and it skipped the second-network sign-in because it had no second network. The question is still open, since the earlier direct hammer was refused at request 31 at a faster pace. A second browser run between 14:57 and 15:06 WIB sent 40 more sign-ups about 10 seconds apart, and none was refused. A browser cannot sign up fast enough to reach the earlier limit. The coder deleted all 75 probe accounts and verified them absent. The coder read the Auth logs for all 75 sign-ups: each recorded one of seven app-server addresses, one of them for 36 sign-ups, and never the caller's address, because the sign-up server action does not forward the browser's address. So Supabase counts the app server's addresses. Why no sign-up was refused is unexplained. Observe first: send sign-ups through the form faster than a browser can, then sign in from the owner's phone on mobile data. Use throwaway @example.com accounts only. The owner's Chrome Remote Desktop list shows his Calgary MacBook Pro last online on Oct 24 and his MacBook Air on Jun 10, so neither can be driven. A browser agent can drive his MacBook Neo, and on his phone's hotspot or on the phone itself over mobile data it counts as a second connection. Done when the report states which IP address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another. The coder's 17:44 WIB report says the external two-connection probe was not run; the prompt and a cleanup helper exist.

Blast radius: If Supabase counts the app server's addresses as one caller, one abusive visitor could block sign-in for every judge at once and stop the demo. The test creates accounts on production, so it needs throwaway accounts and cleanup.

### #523 A meal shows every nutrition value as unavailable

A meal analysed on Nov 4 at 9:53 AM, "Spicy Indonesian macaroni", shows its calories, protein, carbs and fat as unavailable. The owner says the app's food estimates are broken now.

The owner's screenshot of the post (86634d46-b0e3-421a-9b67-1a4e8f5e8e78 on production) shows a comment that reads "Nutrition unavailable: spicy Indonesian fried macaroni snack", and a model line that reads "Identified by Muse Spark 1.3". Judging runs from Nov 4, so a general fault would hit every judge's meal. The coder found on Nov 4 that the matcher rejected every retrieved reference after three searches (the full name, "fried +macaroni" and "fried +pasta") and never tried the bare name "macaroni". No lookup failed, nothing hit a rate limit, and nothing points to a Fleet 11 regression. Fresh USDA requests for "macaroni" and "macaroni cooked" returned records (357 kcal per 100 g, and Pasta, cooked, 157 kcal per 100 g), which are not confirmed equivalents of a fried snack. Of 15 posts in the last 24 hours, five had at least one unavailable field, and only this one had every value unavailable; the others were composite dishes the matcher rejected. The app has no fallback when USDA has no match: it shows unavailable and invents no value, and the Open Food Facts fallback covers barcode scans only. The owner asked for a fallback. The candidate is to search USDA for the closest generic food before saying unavailable. The owner has ruled: when no USDA record is available, the model makes the estimate. In the owner's words, a zero value, an unavailable value or a no-op is death in this business, and it is worse than a bad estimate. Done when, after the matcher's strict searches fail, it tries the bare food name, and a re-analysed post of this food shows nutrition from the closest USDA record, labelled with that record's name, or, when no record qualifies, from a model estimate. No value is left unavailable, zero or blank.

Blast radius: A meal that shows every value as unavailable gives a judge an empty result on the core feature. The cause spans the model, the USDA match and the fallback, so the fix reaches the whole analysis path.

### #579 Photos are captured at 480 × 640 and look blurry on high-density phones

The app stores each photo at 480 × 640 pixels, the size the browser chose for the live camera, and the feed shows a smaller 384 × 512 copy. On a phone with a three-times screen a full-width card needs about 1,170 pixels, so every photo looks soft. The owner finds the blur painful.

The coder measured the owner's Beef noodle post on production at a24587a. The live camera path asks for the rear camera with no width or height and draws one video frame, and the stored originals are 480 × 640, 0.31 megapixels (126,407 bytes), so the meal detail cannot show detail that never reached the upload. The phone's feed copy is byte for byte the same file, so it saves nothing. The feed route then shrinks it to a 384 × 512 WebP of 22,118 bytes. Feed copies are cached for a year with the immutable flag, so a sharper derivative needs a new path or a cache bust. The phone detail upgrades only the first meal photo, not the leftovers original. Photos already captured stay at 480 × 640. The owner reported the blur on Nov 4 at about 15:46 WIB. A sharper photo costs more Storage egress, which #375 names as the largest egress source. The owner ruled at 15:56 WIB on Nov 4 that this is fixed today. Observe first: find what resolution the camera can deliver on the owner's three phones, and the bytes of a photo at each size. Done when a photo captured on the owner's three phones is stored at a sharper resolution, the feed and the meal detail show it sharp on a three-times phone, the first photo still shows within two seconds on mobile data, and the bytes per photo before and after are in docs. The Fleet 14 coder's 17:44 WIB report says the code is delivered by PR #581, merged at 16:59 WIB and deployed (production main 376e3306): higher-resolution capture requests, a larger feed copy under a new v2 URL, and full-resolution detail photos. Fixture v2 copies measured 26,428 to 257,098 bytes, and an existing production photo's v2 copy measured 60,016 bytes at 1080 × 810; none of these is a physical-camera size or a mobile-data timing. Photos already captured stay at 480 × 640. The Fleet 15 plan was written against a24587a, before #581, and its lane A pull request (run15/photos) was opened at about 17:35 WIB, so the two must be reconciled before lane A merges. Pull request #590 ("Density-specific photos, reconciled with #581"; the head is now 69a216b9 after the fixes, and everything below dates from the earlier head aa4b31ce) is not merged. A Muse review (muse-spark-1.3-contributor) at head 69a216b956be40f9dc434cdf379b328864f64421 found zero blockers and verified the earlier findings fixed; no bytes or egress have been measured for it, so no number is stated (the owner's report at 20:39 WIB; not verified by the PM). The planner reports at 19:16 WIB that the #581 files are untouched on it and both photo fallbacks were seen working at device pixel ratio 3, that no bytes or egress have been measured for it, and that #581's own receipt shows its v2 responses eight to twelve times the size of v1; the coder's table says it is reconciled with #581, which the PM has not checked. A PPLX review by GPT-6.1 Sol was posted at 19:11 WIB asking for changes: the HTTP image preload can download the wrong photo size, and one failed image disables sharper photos for later ones. The captured review text is cut off near the end, the coder has not checked the finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: Blurry photos make the whole feed look low quality on the phones judges use. The fix changes capture constraints and every new photo's size, so upload time, storage and egress rise, and old posts stay at 480 × 640.

### #578 The leftovers photo and the regular photo post through different code

The app has at least two code paths that post a photo, and the leftovers one is slower and blocks the camera. Other jobs may be done twice in different ways, and nobody has listed them.

The owner asked for a DRY audit and a service-level architecture audit at 15:42 WIB on Nov 4, aimed at making the app faster. The first known case is the leftovers photo: the coder reported that it waits for image encoding, two uploads and the attachment steps before it closes the camera, while a regular post hands the work to the upload manager at once. The coder delivered the audit of main at a24587a with 26 ranked findings and changed no code. Fix sizes describe scope, not time. The top ranks are two photo-upload workflows (large), several components that each refresh on one meal completion (large), the meal detail waiting for optional services (medium), the same photo delivered under several identities (medium to large) and nutrition read twice by feed hydration (large). The smallest fixes are the profile handle read by separate readers (rank 26, small), serial drink nutrition lookups (rank 16, small to medium), a photo reloaded in prior matching (rank 14, small to medium), repeated queue counts (rank 25, small to medium) and a repeated search interpretation (rank 24, small to medium). Done when the owner has ruled on each of the 26 findings and each one he accepts is filed as its own item. Fleet 15 lane B builds rank 1 (the two photo-upload workflows); the other 25 await the owner's ruling.

Blast radius: Two photo paths drift apart, so every fix to one misses the other, which is why leftovers is slow. Merging them touches the post path every photo uses, so a mistake can lose or duplicate posts, and the audit's 26 findings reach the same code.

### #567 The admin dashboard shows no counts of users and posts

The admin dashboard at /admin shows queue depth, the oldest waiting job, failures, throughput, recent errors and links to per-post model traces. It does not show how many people signed up or how many meals were posted.

The owner asked for a surface for himself at 15:26 WIB on Nov 4. The owner opened /admin on production at 15:27 WIB and saw Not found. The coder reported on Nov 4 that production has one admin account, the owner's meal account has the role user, and /admin refuses every non-admin with that Not found by design, so it is not a missing page. Observe first: find where the dashboard reads its figures and what read gives user and post totals without exposing any one user's content. Done when the admin account signs in and sees app-wide counts of users, posts, model calls and failures, no other user's photos, captions or email addresses appear on it, and a non-admin account that opens it is refused. Pull request #583 (head e7db5cee, "Judge page and private-post access") is green and unmerged. Relayed by the planner at 19:16 WIB: the fleet also found and fixed a foreign post link that answered 200 with a not-found body, and this PR adds a database read on every direct post navigation, which the owner has not ruled on. A PPLX review by Gemini 3.8 Flash was posted at 19:11 WIB: no blockers, but the answer's final summary section came back empty. The coder has not checked any finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: Without counts the owner cannot see how many judges signed up or posted. The page is admin-only, so a new surface must not leak other users' data.

### #568 Judges have no page that shows how the app works

A judge who signs up starts with an empty account and nothing that says what the app does or which models it runs. A judge must never see another user's data.

The owner asked for a surface for the judges at 15:26 WIB on Nov 4 and has not said what it shows. The default here is the models the app runs plus the judge's own meals. The coder tested two fresh production accounts on Nov 4. The second account could not read the first one's posts, profile, comments, intake, saved meals or photos through any route tried, and no dedicated judge page exists. One exception: a signed photo URL issued to the first account works for anyone who holds it until it expires, and the second account could not obtain one. Observe first: find where a judge account would reach the page, such as Profile. Done when a judge account sees a page showing the models in use and the meals he logged himself, and a second test account cannot read the first account's posts, photos or profile. Pull request #583 (head e7db5cee, "Judge page and private-post access") is green and unmerged. Preview check relayed by the planner at 19:16 WIB (coder-tested, not production): a second account cannot open the first account's post or photo. The planner also says this PR adds a database read on every direct post navigation, which the owner has not ruled on. A PPLX review by Gemini 3.8 Flash was posted at 19:11 WIB: no blockers, but the answer's final summary section came back empty. The coder has not checked any finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: A judge who starts with an empty account may not see what the app does or which models it runs, so the entry reads thinner than the build. A judge page must not expose other users' data.

### #569 The row of day circles at the top of Home is cut off at the right edge

On the phone, the row of day circles above the feed shows four whole circles and a fifth cut off by the screen edge. The owner wants the row either to scroll or never to show a partly drawn circle.

The owner's phone screenshot at 2:34 PM on Wed Nov 4 shows Today, Tue 3, Mon 2 and Sun 1 whole, and Sat 31 cut off at the right edge. The designer reported the cause: the rings use five 66 px columns with 14 px gaps, which need 386 px, and the phone leaves 358 px after the side padding, while DayRings.tsx clips the row instead of scrolling it. The owner ruled that the row scrolls sideways back in time. The designer redrew it as Round 7 frames 7c and 7d and updated the Round 3 and Round 5 phone frames. Today comes first with five whole rings and the edge of a sixth showing, and each swipe stops on a ring. The feed stays on today while the row scrolls. Tapping a ring with posts opens that day, and rings without posts are grey and cannot be tapped. The row starts with 30 days, loads 30 more near the end and stops at the first post, so the last ring is whole. Tapping Home while on Home returns the row to Today. The designer's spec for DayRings.tsx is in the Round 7 hit list. Done when the row matches 7c and 7d at 390x844 and on the owner's three phones. Pull request #582 (head dc07c47f, "Scrolling day rings") is green and unmerged. Preview check relayed by the planner at 19:16 WIB (coder-measured, not production): the sixth ring peeks where design 7c puts it and the row snaps on 72 px. A PPLX review by Gemini 3.8 Flash was posted at 19:11 WIB: approved, with three optional cleanups. The coder has not checked any finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: A cut-off row hides that the days scroll, on the first screen of the app. The redesign changes the Home header on the phone, so it can move the feed and the Today layout.

### #570 A leftovers photo takes several seconds to post while a regular photo is fast

Posting a photo of leftovers takes several seconds to show, while a regular meal photo shows at once. The owner says the leftovers photo is not snappy and that this is not acceptable.

The owner reported it on Nov 4 at about 14:46 WIB from his phone. The owner timed adding a leftover at about 11 seconds on his phone at about 14:52 WIB. The coder read production records for that post. The leftovers path waits for image encoding, upload signing, two uploads one after the other (about 1.3 s and 1.2 s), the attachment reservation and the attachment completion before it closes the camera, while a regular post hands the work to the upload manager and closes at once. The owner wants the leftovers photo to post in the background the same way, and believes the two paths are separate functions. The logged time from staging to attachment was about 4.9 seconds, so most of the 11 seconds is unaccounted for without a device trace. The queue wait before processing (24.9 s) and the processing (12.5 s, of which a 9.9 s model call) delay the updated result, not the camera. The coder's audit of main at a24587a names two causes: two photo-upload workflows (rank 1, a large fix) and one worker lane shared by analysis and maintenance (rank 11, a large fix), which explains the queue wait. Observe first: on a phone over mobile data, time a regular photo and a leftovers photo from the tap to the post showing in the feed, and record where the extra seconds go. Done when a leftovers photo shows in the feed as quickly as a regular photo, on the owner's three phones. Pull request #587 ("Background leftovers uploads"; the head is now 2195a5cd after the fixes, and everything below dates from the earlier head 03b29aef) is not merged. A Muse review (muse-spark-1.3-contributor) at head 2195a5cd5c4d6b66d81b33c3eb710fb2c95c498f found zero blockers and verified the earlier findings fixed (the owner's report at 20:39 WIB; not verified by the PM). A Muse efficiency audit of main 299f13a that the owner relayed at 19:25 WIB (read-only, nothing measured live, not verified by the PM) names the same cause as this item: the leftovers photo does its whole chain of re-encode, sign, two uploads and the attach request before the sheet closes (CaptureSheet.tsx:293-302). It also says that after the meal is ready a second remainder job downloads the full leftovers original (worker/jobs/remainder.ts:35-37), which this pull request does not name. Baseline relayed by the planner at 19:16 WIB (coder-measured on the preview, not production): a new post sheet closes in under 400 ms, the leftovers sheet takes 1.7 s, and the processing-meal bookmark reproduced the toast in the owner's screenshot. A PPLX review by GPT-6.1 Sol was posted at 19:11 WIB asking for changes: an expired upload stage is never re-uploaded, and a failed local save can queue the same photo twice. The captured review text is cut off near the end, the coder has not checked the finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: An 11-second leftover post makes the half-eaten-plate flow, a headline feature, feel broken. The fix reaches the upload path shared with regular posts, so it overlaps #578.

### #571 A post started while another is going up breaks the other post with "The meal could not be saved"

Starting a second post while an earlier post is still going up can end with "The meal could not be saved.", and the owner has to press Post again to get the meal saved.

The owner's phone screenshot at 2:19 PM on Wed Nov 4 shows the toast "The meal could not be saved." with a Dismiss button over the feed. The first post in the feed, "Beef noodle", shows a grey placeholder bar under its caption where the analysis would be. The owner reports posting one photo, then taking a photo of another food while the first post was going up. When the first post completed, the interface stopped working for one of the two posts. The owner pressed Post again and the meal then appeared in the feed. The owner has not said which of the two posts stopped working, and the screenshot does not show which raised the error, and whether the two overlap in the capture sheet, the upload or the save is not confirmed. Observe first: on a phone, start a second post while the first is still going up, and record which request raises the error and why. Done when one post finishing never stops the screen of the other, and both meals save on the first press of Post, on the owner's phone. The coder's 19:10 WIB table of the nine Fleet 15 code pull requests (#582 to #590, all green, none merged, each needing an external review at its head) does not name this item; its pull request is not identified. The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: A second post can break the first with an error toast, which loses a user's meal. The fix changes the shared pending-save logic that Fleet 14 just rewrote.

### #572 The closest-food fallback never runs when the model stops after one search

Some foods still show nutrition as unavailable because the new closest-food fallback never runs for them. Pickled ginger is one example.

The planner measured in production that 12 of 119 unavailable results in 14 days stopped after one search, about 10%. The fallback (PR #549) fires only when the model's first decision names a base food, and in these cases it names none. Done when a food whose first decision names no base food gets its own bare name searched, and a regression test covers that case. Pull request #588 ("Nutrition fallback, reasons, migrations 0053/0054"; the head is now 223bf70e after the fixes, and everything below dates from the earlier head 5b785d4a) is not merged. A Muse review (muse-spark-1.3-contributor) at head 223bf70eb7b682a1a06a7d6bdcf33c79b9d36212 found zero blockers and verified the earlier findings fixed (the owner's report at 20:39 WIB; not verified by the PM). The planner says at 19:16 WIB that migration 0054 was not in the plan and the owner has not ruled on it, and that the old-worker finding is the one it weighs lowest (the worker deploys with the app and a tested rollback file exists) but still needs a written answer on the PR. A PPLX review by GPT-6.1 Sol was posted at 19:11 WIB asking for changes: the new estimate format and migration 0053 break workers still on the old code. The captured review text is cut off near the end, the coder has not checked the finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: Some foods show unavailable nutrition because the fallback never runs, which is an empty result on a core feature. The fix changes the model search loop, so it can raise model calls and cost per meal.

### #573 The closest-record label is stored on every nutrient entry

The note that a food's numbers come from a similar USDA record is saved inside every nutrient entry of the food's micronutrients JSON, not once per food. This adds bytes to every row that uses the fallback.

The planner flagged it against the egress concern in #373. Done when the label is stored once per food, the meal's first comment still names the record, existing readers and tests pass, and rows already written are migrated or confirmed harmless. Pull request #588 ("Nutrition fallback, reasons, migrations 0053/0054"; the head is now 223bf70e after the fixes, and everything below dates from the earlier head 5b785d4a) is not merged. A Muse review (muse-spark-1.3-contributor) at head 223bf70eb7b682a1a06a7d6bdcf33c79b9d36212 found zero blockers and verified the earlier findings fixed (the owner's report at 20:39 WIB; not verified by the PM). The planner says at 19:16 WIB that migration 0054 was not in the plan and the owner has not ruled on it, and that the old-worker finding is the one it weighs lowest (the worker deploys with the app and a tested rollback file exists) but still needs a written answer on the PR. A PPLX review by GPT-6.1 Sol was posted at 19:11 WIB asking for changes: the new estimate format and migration 0053 break workers still on the old code. The captured review text is cut off near the end, the coder has not checked the finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: A label saved in every nutrient entry adds bytes to every read, which feeds the egress problem of #373. Moving it touches stored rows, so existing posts need a migration or a check that they are harmless.

### #557 An incomplete saved label can hide a barcode provider outage

A barcode lookup can report that a product is missing when a provider is down and the account holds an incomplete saved label correction.

Fleet 13's review found that the resolver suppresses provider errors for corrections that may lack the name or serving unit needed to produce a card. No production failure is claimed. Done when incomplete corrections preserve the provider error, complete corrections still work during outages, and regression tests cover both. Pull request #589 ("Saved-label outage handling"; the head is now 911c33ba after the fixes, and everything below dates from the earlier head 9ff72811) is not merged. A Muse review (muse-spark-1.3-contributor) at head 911c33bac2853c88ad1e9ead20302fef0a414f2e found zero blockers and verified the earlier finding fixed (the owner's report at 20:39 WIB; not verified by the PM). A PPLX review by GPT-6.1 Sol was posted at 19:11 WIB asking for changes: a saved label with every nutrient empty passes the "complete" check. The captured review text is cut off near the end, the coder has not checked the finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: A barcode lookup can say a product is missing when a provider is down, which sends users to type it in. The fix changes the resolver's error handling for every barcode lookup.

### #574 The Days calendar and the day summary count a different number of posts

For October 31 on a test account, the Days calendar says 5 posts and the day summary says 4 posts. Both show 1,842 kcal.

An OpenClaw production check on Nov 4 read the calendar's accessibility label as "2026-10-31, 5 posts, 1,842 kcal" and the day summary as "Consumed: 1,842 kcal · 4 posts". The cause is unknown. One of the two may count a post the other leaves out, such as a drink, a leftovers post or a superseded one. Done when both places count the same posts for that day, or the screen says why they differ, checked on production against the account's October 31 posts. Pull request #585 ("Ready/unfinished meal counts"; the head is now 5887f56e after the fixes, and everything below dates from the earlier head dc60980f) is not merged. A Muse review (muse-spark-1.3-contributor) at head 5887f56e6ceb92cece48192a8b56d2f7b9e6a2fc found zero blockers and verified the earlier finding fixed (the owner's report at 20:39 WIB; not verified by the PM). Preview check relayed by the planner at 19:16 WIB (coder-measured, not production): Days shows four posts and one not finished, with the same kilocalories in both payloads. The planner says the false-warning case is a defect in its own plan text, and that the fleet also found and fixed a missing unfinished count on the phone day story. A PPLX review by GPT-6.1 Sol was posted at 19:11 WIB asking for changes: an unfinished meal can make a fully known day show a false "Nutrition unavailable" warning. The coder has not checked the finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: Two screens give different post counts for one day, so a judge sees numbers that disagree. The fix touches the calendar and day-summary data paths, which overlap the day totals of #324.

### #575 A meal with unavailable nutrition does not say why

When a food shows nutrition as unavailable, an ordinary user cannot find out why. The owner could not learn why the macaroni failed without an agent reading the database traces.

The reason exists only in the model call log. For the macaroni post it read that no compatible generic fried-pasta record was present, and the plain name "macaroni" was never searched (#523). Nothing shows the user this. The Fleet 13 fix for #523 adds a label only when a close USDA record is found, so a food with no close record still says nothing. Done when a meal with an unavailable value tells the user, in plain words and without database access, which food failed and why, checked on production with a meal known to be unavailable. Pull request #588 ("Nutrition fallback, reasons, migrations 0053/0054"; the head is now 223bf70e after the fixes, and everything below dates from the earlier head 5b785d4a) is not merged. A Muse review (muse-spark-1.3-contributor) at head 223bf70eb7b682a1a06a7d6bdcf33c79b9d36212 found zero blockers and verified the earlier findings fixed (the owner's report at 20:39 WIB; not verified by the PM). The planner says at 19:16 WIB that the fleet found and fixed migration 0052 never refreshing a stale "unavailable" summary on re-analysis, that migration 0054 was not in the plan and the owner has not ruled on it, and that the old-worker finding is the one it weighs lowest (the worker deploys with the app and a tested rollback file exists) but still needs a written answer on the PR. A PPLX review by GPT-6.1 Sol was posted at 19:11 WIB asking for changes: the new estimate format and migration 0053 break workers still on the old code. The captured review text is cut off near the end, the coder has not checked the finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: A meal with no numbers and no reason looks like a broken app. Showing the reason needs its source stored, which adds a field to the meal data.

### #576 The desktop New post window scrolls by 18 px at 1366x650

At 1366x650 the New post window holds 668 px of content in a 650 px window, so it scrolls 18 px.

An OpenClaw production check on Nov 4 measured the overflow. The shutter itself sits fully in view, and the bounds of the footer row were not captured. The designer reported the cause: Round 6 frame 6c drew the window at a fixed 620 px tall with a fixed 450 px camera, sized for a 1280x800 screen, and CaptureSheet.tsx copied both, which adds up to 668 px at 650. The designer redrew it as Round 7 frame 7e and put the fix in the hit list. The window is min(620 px, screen height minus 48) tall and min(960 px, screen width minus 48) wide. The mode strip and the shutter row keep their sizes. The camera takes the remaining height, never less than 240 px, and the picture fills it. At 1366x650 that gives a 602 px window with a 454 px camera, and at 1024x700 a 620 px window with a 472 px camera. The window that replaces it after the photo uses the same height rule. Done when the window shows no vertical scroll at 1366x650 and 1024x700, checked on production. Pull request #584 (head 7279ca38, "Desktop capture sizing") is green and unmerged. Preview check relayed by the planner at 19:16 WIB (coder-measured, not production): the desktop capture window measures 602x454 at 1366x650 and 620x472 at 1024x700, with no scroll. A PPLX review by Gemini 3.8 Flash was posted at 19:11 WIB: approved, with three optional cleanups. The coder has not checked any finding against the source, and the model differs from REVIEW\_POLICY.md (the owner ruled to post it). The coder reports at 20:40 WIB that Fleet 15's fixes, reviews and combined tests are complete; the PM accepted migration 0054 and the extra database read in #583 at 20:42 WIB, and the merges wait on the planner's evaluation of the final heads.

Blast radius: A window that scrolls 18 px on a common laptop height looks sloppy in the desktop recording. The fix changes the window size rule that both the New post and after-photo windows use.

### #592 The round left arrow covers the start of the word kcal on a meal's second slide

On the second slide of a meal on desktop, the round left arrow sits on top of the first letter of kcal under the big number, so the word reads as cal.

The owner's screenshot at 16:49 WIB shows slide 2 of 2 of the Cold brew and black honey post, with 49 kcal, and the arrow over the k. Nobody has checked other widths or other slides. Observe first: check the arrows on every slide type at 1100, 1280 and 1440 px and on a phone. Done when no arrow covers any text or number on any slide at those widths.

Blast radius: Judges see a card that looks broken on the first screen of desktop Home. The arrows belong to the carousel that every post card uses, so a fix can move them on every card.

### #593 The first post on desktop Home has a black outline when the page loads

When the desktop Home page loads, the first post sits inside a thick black outline that looks like a focus ring. The posts below it have none. The owner does not like it.

The owner reported it on Nov 4 at 16:48 WIB, with a screenshot of my-food-ai-ten.vercel.app after a hard refresh. The outline runs around the whole first card, from the account line to the caption. The designer reported at 16:49 WIB that the outline marks the post selected for keyboard use, where J and K move between posts and Enter opens one. The designer drew Round 6 frame 6a with the first post already outlined, and DesktopWorkspace.tsx marks the first post as selected by default, so the code matches the design. The designer has removed the outline from 6a. The new rule is that the feed opens with nothing outlined, the outline appears after the first J, K or Tab, and a click anywhere in the feed hides it again. The owner also said the other posts are not loaded when he scrolls; the PM read that as them having no outline, and a post that fails to load would be a separate item. Done when the feed opens with nothing outlined, the outline appears after the first J, K or Tab, and a click anywhere in the feed hides it, checked on the live page at 1280x800 and confirmed by the owner.

Blast radius: Judges see it on the first screen of desktop Home, so it reads as a glitch. A fix touches the focus styling and keyboard navigation of the feed, so removing it carelessly can hide the focus ring from keyboard users.

### #598 A returning visitor keeps seeing the old build until a hard refresh

After a deploy, a browser that already holds the previous build can keep showing it, so a visitor sees old layouts and old text that main no longer has.

The owner's desktop window kept showing the old full-width feed and the asterisk footnote after Fleet 14 deployed, while the coder's 15:59 report says production matched main at a24587a. A hard refresh at 16:47 WIB showed the new layout. The designer suspects the service worker or the browser cache; that is unconfirmed. Observe first: with a browser that holds the previous build, deploy or simulate a new build and record whether a normal reload shows it, and which cache serves the old one. Done when a browser that holds the previous build shows the new build on its next normal load, and the check is recorded.

Blast radius: Every returning visitor, judges included, can see an old build after each deploy, so a judge could grade a build that no longer exists. A change to how the service worker or the cache updates touches every page and photo load, so a mistake can break caching for everyone.

### #594 Let the user choose where a photo is saved: the in-app camera with manual saving, or the native camera with every photo saved

The app's own camera sends photos only to the app, so none reach the phone's camera roll, and the owner wants a choice.

The owner ruled at 16:57 WIB that this should be an option with two modes, and at 16:59 WIB that it is a toggle under personal settings, with a short explanation of each mode beside it, so he can test both modes himself without anyone running code for him. In manual-save mode the app keeps its built-in camera and shows a Save photo button that calls the share sheet; the owner accepts manual saving for now. In save-everything mode the app uses the phone's native camera, which saves to the camera roll by itself. The owner also wants, later, a way for people to share or save everything, or nothing; how is not decided. Known limit: on iPhone with iOS 16.2 or later the share sheet opened by code has no Save Image option (WebKit bug 255544, still open); pressing and holding a shown photo does offer it. Not verified on current iOS. Observe first: test the share sheet on the owner's iPhone and on an Android phone. Done when personal settings has a toggle with the explanation, a photo taken in each mode can be saved to the camera roll, and the owner flips the toggle and confirms both modes on his phone.

Blast radius: The native camera replaces the in-app capture, so the photo path into the analysis changes for everyone who picks it, and a mistake could stop meals from being logged. Judges see only the default mode, so the default must stay the one that works today.

### #599 The Today summary on the right of desktop Home is missing when the page opens and appears late

On desktop Home the right-hand column (Today, kcal consumed, protein, carbs, fat, Posted today) is empty when the page loads and fills in a moment later. The owner reports that it took far too long to show up.

The owner sent two screenshots at 17:13 WIB of my-food-ai-ten.vercel.app on desktop. In the first, the feed shows the Cold brew and black honey post and the right column is blank. In the second, the same page shows Today with 1,468 kcal, 56 g protein, 211 g carbs, 46 g fat and six posts under Posted today. The delay between the two was not timed and the cause is not known. The owner's browser may also hold an old build (see the stale-build item), which is not ruled out. Observe first: on the live page at 1280x800, time from the page opening to the right column showing its numbers, with a normal reload and with a hard refresh, and record which request it waits on. Done when the right column shows its numbers within two seconds of the page opening on the owner's desktop, and the check is recorded. The Fleet 14 coder reproduced a wide shell without the Today column on the old deployment under injected page and worker latency, and the correct narrow feed without it. That is a mechanism; it is not shown to be the cause of the owner's screenshot.

Blast radius: Judges open desktop Home first, so a blank column reads as a broken app. The column reads the same day totals as Home and Days, so a fix that changes how they load can change the numbers in other places.

### #602 The meal detail photo shows cropped for an instant on desktop, then zooms out, and the phone layout jumps 130 px

On desktop, opening a meal shows the photo cropped about 20% in a 640x680 frame, then it jumps to the whole photo with grey bars at the sides. On the phone, the space for the photo starts as a 390x390 blank square and grows to 390x520, pushing everything below it down 130 px. The owner has asked three times to see the whole image (#525).

The measurements are in the item above, taken on the live app on Nov 4 after #581. The cause on desktop is the quick preview frame from #564, which crops to fill before the full file replaces it; the phone jump is the frame being a different shape from the photo. Done when, at 1100, 1280, 1440 and 390 wide, the photo is never cropped and nothing below it moves when the full photo loads, and the owner has seen it on the live app.

The designer reported at 19:02 WIB (not verified by the PM) that the same two defects are in the design file as frame 7f of Round 7, and gave the cause and the fix. Cause: in PostOpenFrame.tsx the first desktop frame crops the photo to fill a box about 640x680, and the detail view that loads next shows the whole photo in the same box, so the photo zooms out and grey bars appear (a 3:4 photo at 680 px tall is 510 px wide). On the phone the code learns the photo's shape only after the image loads, so the box starts square and grows 130 px. Fix as designed: save each photo's width and height at upload and send them with the post; every photo box (feed, first frame, detail, phone and desktop) takes its shape from those numbers before any image loads; the whole photo always shows with no cropping and no bars; height is capped at 680 px on desktop and 80% of the screen height on the phone; on desktop the photo column narrows to the photo's width (this post's window would be 510 + 360 px wide); the quick preview and the full file use the same box and fit. The plan does not say what happens to posts made before the width and height were saved.

Blast radius: The meal page is the first thing judges open from the feed. The frame is shared with the quick preview, so a change to its shape can affect every meal's first view and the photo swap on desktop.

### #603 The Servings control on a meal cannot be set to a fraction

The owner wants to log part of a serving, such as half, and says the app cannot do it while Cal AI can.

The owner sent a phone screenshot at 18:53 WIB of his post "Doughlab "Gold Digger"" (695 kcal, 7 g protein, 89 g carbs, 37 g fat). Under "Consumed - all nutrients" the row reads "Servings", a minus sign, 1, and a plus sign. What the control accepts today has not been checked in the code or the app; the owner's report is that it cannot hold a fraction. Reference: the owner's Cal AI screenshots (67 PNGs, Cal\_AI\_screenshots.zip, analysed on Oct 26; IMG\_2455 to 2458 and 2461 are missing from the zip). A PM session on Oct 29 listed servings as a gap: Cal AI's entry shows "1 ✎" beside the name (IMG\_2465), a servings count the user can edit, and our spec had no servings multiplier for the whole meal. The saved teardown (claude/cal-ai-flow-teardown.md) is no longer in the project, and the PM has not re-opened the screenshots this session, so whether Cal AI's pill accepts fractions is the owner's report, not checked here. The source is the owner's copy of the zip, or the designer's. Done when a meal's servings can be set to a fraction such as 0.5 and 1.5, the calories, protein, carbs, fat and all other nutrient values scale to match on the meal page, Home, Days and the Today totals, and the owner has seen it on the live app.

Blast radius: Servings change the numbers a meal contributes to every total, so a mistake could make Home, Days and Today disagree or show a wrong day total in the demo. If servings are saved, a fraction may need a change to how they are stored.

### #580 The native control audit found nine undersized controls

Nine controls in the app are smaller than they should be, so they are hard to hit with a thumb on a phone.

The coder reported this on Nov 4 from the Fleet 14 acceptance checks, run in Firefox without the processor slowed, and gave the list of the nine controls in his 17:44 WIB report: bottom-bar + (34 × 34 px), search input (294 × 21), capture Photo tab (78.88 × 36), Text tab (66.12 × 36), Barcode tab (113.38 × 36), caption textarea (358 × 42), drink description input (260 × 21), caption More (37.18 × 19.6) and saved-meal Log now (79.12 × 34). Observe first: measure the nine controls named above on a phone and confirm their sizes. Done when each of the nine is named, resized or filed as its own item, and a second audit finds none undersized.

Blast radius: Mis-taps on a phone cost judges patience on every screen where one of the nine sits. The fix touches shared controls, so a size change can shift layouts that Fleet 14 just set.

### #595 The Fleet 14 plan document must carry no instruction to revoke the bypass secret

The committed plan on the run14/docs branch (docs/plan-run14.md) carried two lines that said to revoke the protection-bypass secret, in item 6.1 and in the cleanup section. A reader who acts on them cuts the fleet off from testing.

The planner who wrote them has been fired, and the owner has ruled that the secret is never revoked. The planner's working copy no longer has the lines, and the coder reports the committed copy in docs PR #577 no longer has them. The Fleet 15 planner read origin/run14/docs at head 3bb83ed8 on Nov 4 at 10:52 UTC: a search for revok returns three lines, all retain statements, and item 6.1 step 2 now says the secret is retained. The coder's 17:44 WIB handover says revocation instructions were removed from the cleanup instructions and the affected documents at head eeba864c of docs PR #577, which is open, draft, green and unmerged, and that the live secret is unchanged. Done when the owner merges or closes #577 and no instruction to revoke the secret remains on the branch (the coder said at 19:18 WIB that #600 is a separate docs PR beside #577, not a replacement).

Blast radius: A reader who follows the lines revokes the secret, which locks reviewers and coders out of testing protected deployments and stalls verification before the deadline. The change is docs only and touches no code.

### #596 A Caesar salad photo matched a no-dressing Caesar record

In the real-model food test, one of 18 cases picked a USDA record for a Caesar salad without dressing, so the numbers leave out the dressing the meal has.

Fleet 14's real-model food gate passed 17 of 18 cases, and this is the retained failure. Observe first: run the case again and record which record the model chose and why. Done when the Caesar case matches a record that includes dressing, and the other 17 cases still pass.

Blast radius: A wrong calorie number on a common food is the error a judge would notice. A change to the match rule affects results for every meal, so all 18 gate cases must rerun.

### #597 Five new lint warnings sit in merged Fleet 14 code

The lint run went from six warnings to eleven, and the five new ones are in code that has merged.

Fleet 14's validation reported 0 errors and 11 warnings, six existing and five new. Done when lint reports no more than the six existing warnings and the test suite still passes.

Blast radius: Warnings break neither users nor the build, but they hide real warnings in review. A cleanup touches merged code, so it takes a pull request and a review for no user-visible gain.

## Engineering backlog

### #601 Measure the meal detail photo on the live app in a signed-in browser, at four window widths (needs a browser)

No one has yet measured how the meal detail photo is shown on the live app after the sharper-photos change (#581), so whether the owner's cropped-photo report (#525) still happens is not known.

The Opus investigation at 18:13 WIB could not do this because its Chrome connection dropped and the live app needs a sign-in. By reading the code only, it found that once a meal has fully opened the whole photo is shown uncut, and that the placeholder frame shown for an instant on desktop (from #564) crops a portrait 3:4 photo by about 20% of its height at 680 px tall and about 29% at 700 px. Nothing has been seen on screen. A browser-capable helper outside the code base (the owner is handing this to Grok) opens the live app signed in, opens one meal that has a photo, and at window widths 1100, 1280, 1440 and 390 (phone) records, both in the first instant and after the page has finished loading, the photo frame's width and height, the photo's shown width and height, and whether any of the photo is cut off, with a screenshot each. Done when the one missing reading (the phone's blank square in the first instant) is captured and the owner has seen the recorded readings below.

Result, reported by the owner at 18:40 WIB from the Grok run on the post "Cold brew and black honey" (the photo file is 480x640, portrait; a hidden browser read sizes and took eight screenshots; nothing on the site was changed). Desktop, first instant: the photo is cropped to fill its frame, 628x680 at 1100 wide (157 px of height lost, about 19%) and 640x680 at 1280 and 1440 (173 px lost, about 20%). That matches the code reading. Desktop, after loading: the whole photo, 510x680, with grey bars at the sides (about 59 px each at 1100, 65 px each at 1280 and 1440), nothing cut off. The picture zooms out from cropped to whole when the quick preview is swapped for the full file. Phone (390 wide): never cut off, 390x520 once loaded, but the space starts as a 390x390 blank square and grows 130 px when the photo loads, pushing everything below it down. Not captured: the phone's blank square in a screenshot (the first-instant shot was taken half a second after the tap and already showed the photo), and the 1280 screenshot's left bar looked wider than the right, which is not measured (the sizes above work out even). Everything loaded within 10 seconds at every size. On desktop the post opens as a pop-up over Home; on the phone it opens as a full page.

Blast radius: None to the app, since this only observes. The readings decide whether #525 needs a code fix, so a wrong reading could leave a cropped photo in the judges' first look at a meal.

### #370 The camera view stays open for a long time after a photo is taken

After a photo is taken, the camera view stays on screen for a long time before the post shows in the feed. People will not wait that long.

The capture sheet sends its post-created event and closes only after a successful post, so it waits on the upload and the server. The owner reports the wait on his phone. Observe first: time the tap to the sheet closing and to the new post showing, on a phone over mobile data, and record the size in bytes of each photo the phone uploads. Then close the sheet at the tap and show the new post at the top of the feed in its processing state while the upload finishes. Done when the sheet closes within one second of the tap on a throttled connection, the post appears at the top of the feed in its processing state, and a failed upload is shown on that post.

Blast radius: A camera that stays open after a photo makes posting feel slow in every demo. The fix changes when the capture sheet closes, where a mistake can lose a post whose write has not finished.

### #222 The feed fails to open, and photos and cards take too long to appear

On a large account the feed sometimes shows an error or never appears. When it opens, photos and cards take a long time to show, so the app feels broken and slow.

Run 8 merged the cold-open fixes (#322, #323, #324, #326). In emulation, 100 of 100 browser openings passed and the five final cold photos took 1.48 to 1.83 seconds. The original failures (3 server errors and 15 blank feeds in 100 openings on the largest test account, 146 posts) never reproduced on Run 7's baseline, so their cause is not isolated; the worker's empty-claim loop is a suspect (separate item). The runtime logs return 403 for the coder, so the stack for digest 3642131196 exists only in the Vercel console. Done when the feed and the first photo show within two seconds on the owner's phone over mobile data.

Blast radius: A feed that fails or stays blank on a large account is the first thing a judge sees. The causes are not isolated, so work on suspects can spend time without a fix.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

Use Muse Spark Open (meta-models/muse-spark-open-1026) through Baseten's OpenAI-compatible endpoint, https://inference.baseten.co/v1, for the identify-and-portions call. The key works only with that model and never goes in the repository, an issue or this backlog. Confirm the coder can sign in to Baseten with the key before the trial. The model always reasons, so check output caps that include reasoning. The Meta client hardcodes model names, and the ten-photo harness cannot choose a model host. Trial first in a throwaway clone that swaps only that call, and spend at most 5 US dollars. SAM and transcription stay on the Meta API, and the USDA lookup is unchanged. Compare the ten meal photos and one caption, "I ate half the rice", against the current path. A qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Cerebral Valley answered on Nov 3 that Muse Spark Open counts however it runs, including through Baseten. Done when a real, switchable path on main runs the identify-and-portions step on Muse Spark Open through Baseten, the model ID is logged, the results against the ten photos are in docs, and the owner has switched it on in Profile, logged a meal, and seen the Muse Spark Open line in that meal's post detail on production.

Blast radius: The $10,000 bonus depends on this path working, and a slow or failing open model delays every analysis when it is on. It adds an outside provider the app does not control.

### #372 Feed photos are too large for a phone on mobile data

A feed photo downloads at a size far larger than a phone card shows, so the first photo arrives late and every revisit pays for it again.

The sampled feed image is 152,193 bytes and its response carries no Cache-Control header (docs/media-loading.md). Several cards cost megabytes on mobile data, and the cold first photo measured 2.10 s against the 2 s target. The feed photo route (src/app/api/media/feed/\[owner\]/\[post\]/\[media\]/v1.webp/route.ts) reads the original from Storage on every request. Find the largest size a feed card needs on a phone and serve that instead of the original. Keep the original where post detail needs it. Done when the bytes per feed photo before and after are in docs, the first photo of the feed shows within two seconds on mobile data, and the photos look the same on a phone.

Blast radius: Oversized feed photos slow the first photo on mobile data and feed the egress problem. A smaller copy changes the image every user sees, so quality drops unless it is handled with #579.

### #455 The card you swipe to on a drink's photo shows a number and not what the drink is

Swiping right on a drink's photo opens a card with one big millilitre number, so the card does not say what the drink is or why it exists.

The swiped card for the tiki cocktail shows "220 ml" in large type, a line of text and "1,200 ml consumed today" split into drinks and food. A card for a drink leads with its kind as a picture: a coffee cup for coffee with its caffeine, a water cup for water with one cup for every 250 ml drunk, and a cocktail glass or a wine glass for those with their alcohol, and the day's drinks are drawn as the same cups. Done when a coffee, a 500 ml water (two cups), a cocktail and a glass of wine each show their own picture on the swiped card, and a card that holds only liquid reads as a drink at a glance, on the owner's three phones. GitHub shows this issue closed (the coder's read at 17:51 WIB); it stays here until its done condition above is met.

Blast radius: A card that shows only 220 ml does not say what the drink is, which reads as an unfinished feature in the drink flow. The fix is limited to that card.

### #456 A rum cocktail is logged with 15 mg caffeine

The tiki cocktail post states caffeine that the drink does not contain.

The drink card for the lime and rum tiki cocktail reads "15 mg caffeine" next to 196 kcal, and the day's caffeine total reads 110 mg. Done when a cocktail or any drink with no caffeine source logs no caffeine, the card shows none, and the day's total leaves it out, checked on the tiki cocktail and a glass of wine. GitHub shows this issue closed (the coder's read at 17:51 WIB); it stays here until its done condition above is met.

Blast radius: A rum cocktail with 15 mg caffeine is a wrong number a judge could catch, and it pollutes the day's caffeine total. A fix changes the drink analysis rules, so other drinks' numbers can move.

### #457 An alcoholic drink shows its alcohol, not its liquid

A cocktail post shows how much liquid it holds and nothing about the alcohol, so the user cannot tell how much they have drunk.

The post for a lime and rum tiki cocktail shows "220 g" on the photo and 196 kcal, 0 g protein, 17 g carbs and 0 g fat under it, with no alcohol anywhere. For a drink that holds alcohol, the post shows the grams of alcohol and the standard drinks in place of the liquid amount, the drink's liquid is not added to the water total, and Today shows the day's alcohol so far. Done when a photographed cocktail and a typed beer each show their alcohol on the post and in Today, and neither adds to the water tile, on the owner's three phones. GitHub shows this issue closed (the coder's read at 17:51 WIB); it stays here until its done condition above is met.

Blast radius: An alcoholic drink that shows grams and no alcohol hides the figure a user wants. The fix changes how drinks display units, so other drink cards can shift.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. Run 8 merged a dormant hCaptcha widget and token path (#336). Called directly from the coder's machine, Supabase refused the hammer at sign-up 31 and sign-in 32, and the 31 throwaway accounts were deleted. The owner holds the site key and the secret. The secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT\_PUBLIC\_HCAPTCHA\_SITE\_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers sign-up and sign-in is refused.

Blast radius: Unprotected sign-up lets a script create accounts in bulk and guess passwords, which could fill the database, drain quota or lock out judges. Turning on CAPTCHA adds a step to every sign-up, so judges feel it.

## Engineering backlog - design

## Interdit (Not part of Hackathon)

### #114 Facebook Login in production mode

Public sign-in with Facebook needs the app submitted for Meta app review, which takes longer than the event.

Blocked by Meta app review. Development mode works for the developer's own and test accounts, which is enough for the demo. While a Facebook app is in Development mode only people with a role on the app can sign in, and everyone else sees an "App Not Setup" error (Supabase docs). Instagram has no sign-in for consumer apps: Meta shut the Instagram Basic Display API on Dec 4, 2024 and tells developers to use Facebook Login. No Instagram button is added. The button stays grayed out and inert until review passes (#316).

Blast radius: Only people outside development mode cannot use Facebook sign-in, and nothing else depends on it. It does not touch the build.

### #115 Dark mode

The app has no dark mode.

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

Blast radius: Without dark mode, users on dark devices see a light app. It is out of scope and touches nothing in the build.

### #218 Hydration as a share of daily intake

The owner wants the app eventually to show how much of the user's daily intake is hydration.

Blocked until after the hackathon, and blocked by the claims rule: the app shows no percentage that reads as progress, and a share of intake is a percentage. The owner decides whether this one figure may break that rule. Done when the owner has lifted the rule for this figure and its design is drawn.

Blast radius: Showing hydration as a share of intake risks a claim the app cannot support, which touches the claims rule and the business's credibility. It stays out until after the hackathon.

---

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This Doc is private between the PM and the owner, and the coder cannot open it. The coder reads BACKLOG.md, which the owner copies from this Doc. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. An item stays until its work is merged, its done condition is met and its issue is closed; the "Interdit (Not part of Hackathon)" section holds items that cannot be worked on and says why. Each section is for one role or one state: Backlog for Owner, In Flight (the items the running fleet builds) and Engineering backlog (open work outside it), ordered within a section by the pass that will work them together, not by issue number or date.

Every item is a title line and three paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the four parts. The four parts are: (1) a title a person can read; (2) a first paragraph that states the problem in plain language and in enough depth that a person could fix it; (3) a second paragraph with all the context that helps a person solve the problem, meaning what investigation, work or the owner's observations have established, ending in a done condition. (4) a third paragraph that begins with the words Blast radius and says what harm the problem could do, and what harm a fix could do, to our development, coding, process, planning and business, and how far that harm reaches. No paragraph is a dump of everything known. Write short sentences in the active voice, as the Google developer documentation style guide asks. An item without all four parts is not on the backlog.
