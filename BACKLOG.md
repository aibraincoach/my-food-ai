# My Food AI — Backlog†

Last edited: Wednesday 2026-11-04 at 14:08 WIB (UTC+07:00) by coder, owner-requested reconciliation

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

The submission needs the public repository, the video link and a list of everyone who worked on it. Judges stop watching at three minutes, and the video must show the feature working with live Meta model calls and say which open Meta model it uses and where it runs, Muse Spark Open on Baseten (Cerebral Valley, Nov 3). Every feature built is in the video, the not-eaten plate included. Post the video to X as soon as it exists: the Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8. Whether the post must exist before the submission deadline is unconfirmed. Fleet 12's remaining PRs merge as soon as each holds a counting receipt, and nothing waits on a clock before recording starts. No merges or deploys run from the start of recording until the submission is in. Done when a video under three minutes is on X and the submission is in.

### #379 Phone checks of the installed app over mobile data

Every Run 7 and Run 8 timing check ran in emulation. No physical phone has tested the feed, the photos, installation or posting.

Check on each of the owner's three phones, installed from the home screen, over mobile data: the feed and the first photo show within two seconds (#222, #305); the last feed shows at once and fresh posts appear without jumping (#304); a warm revisit reuses cached photos and the photos look acceptable (#305); the camera, the keyboard and a post from the phone work, with the right photo kept (#6); a post completes through the worker (#322); the capture sheet closes within one second of the tap (#370). Done when each check passes on each of the three phones and each failure is reported to the coder with its number.

### #60 A judge-facing pass makes the public repository start-here ready

The public repository now has a start-here README, but the owner's final review of what it exposes is not recorded.

GitHub marks #60 closed. The README and public visibility are verified; all working contracts, the Wall and review tools remain. The owner still needs to confirm the keep list after the final feature changes. Done when the owner has confirmed the page and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep.

### #370 The camera view stays open for a long time after a photo is taken

The capture sheet closes optimistically now; its tap-to-close time and uploaded photo sizes have not been measured on the owner's phones.

Fleet 12 merged #505 with a processing card during upload. One247ms tab-close trial passed, but it did not prove durable posted-flag acknowledgement; #543 tracks that gap. GitHub marks #370 closed, while #379 retains owner phone acceptance. Record tap-to-close, new-card timing and uploaded bytes over mobile data. Done when the sheet closes within one second on a throttled connection, the post appears at the top in processing state, and a failed upload is shown on that post.

### #348 A photographed drink's card was not proven on production

The card for a photographed drink was closed without the production check its done condition asked for.

The Fleet 10 report says the selected drink card on screen remains unproven. Done when a photographed drink shows the right drink card on production, on the owner's three phones.

### #351 The drink tile sizes and order were closed on a local test only

The tile sizes and order on the drink sheet were not checked on production.

Only a local test backs the closure. Done when the drink sheet shows its tiles in the right sizes and order on production, on the owner's three phones.

### #449 The food names do not show before the numbers on a new upload

Early food names now pass local checks, but the owner has not confirmed them on three phones.

Fleet 12 merged #534 with pending-name preservation and failed-read/status handling. GitHub marks #449 closed; no three-phone receipt is recorded. Done when a new upload shows the foods the app has found while the numbers are still being worked out, on the owner's three phones.

### #453 The barcode prompt is printed over the live camera picture

The barcode prompt has a contrast treatment, but the owner has not checked its readability over a real shelf on three phones.

The earlier owner report described words blending into packs and price labels. A merged contrast treatment has coder-local evidence, while GitHub marks #453 closed. Done when the prompt is readable over any camera picture on the owner's three phones.

### #454 The Days page is not one continuous calendar

A continuous calendar is implemented, but its real-phone month transition, month markers and opening-on-today behavior are unconfirmed.

The calendar implementation and Fleet 12's #539 anchoring/retry repairs are merged. Local prepend/retry checks passed, but the October/November boundary was not fully observed; #512 remains open for the summary/anchor condition. GitHub marks #454 closed. Done when scrolling Days moves through unbroken weeks from October into November, month names mark where each month starts, and Days opens on today, on the owner's three phones.

### #455 The card you swipe to on a drink's photo shows a number and not what the drink is

Drink pictures are implemented, but no acceptance on the owner's three phones proves every required card looks like its drink.

Merged drink-card work has coder-local evidence, while GitHub marks #455 closed. The owner's earlier tiki card led with220ml instead of its kind. Done when coffee shows its cup and caffeine,500ml water shows two250ml cups, a cocktail and wine show their own glass and alcohol, the day's drinks use the same cups, and a liquid-only card reads as a drink at a glance, on all three phones.

### #457 An alcoholic drink shows its alcohol, not its liquid

Alcohol display is implemented, but the owner has not confirmed the cocktail and typed beer on three phones.

Fleet 12 merged #533's alcohol and caffeine handling; historical stored rows were not changed by that run. GitHub marks #457 closed. Done when a photographed cocktail and typed beer show grams of alcohol and standard drinks in place of the liquid amount, Today includes the day's alcohol, and neither drink adds to the water tile, on the owner's three phones.

### #458 The text box on New post is hidden behind the keyboard

Phone layout has been changed to keep the caption and Post visible with the keyboard, but the owner's three phones have not confirmed it.

Merged keyboard/layout work has local evidence only. The owner previously typed with the caption box hidden on an iPhone; GitHub marks #458 closed without a physical-phone receipt in this reconciliation. Done when the caption box is fully visible above the open keyboard together with Post and nothing overlaps it, on all three phones.

## Engineering backlog

### #471 The recording account can hit the hourly model cap on camera

A recording with several photos on one account can run into the model's hourly limit while the video runs.

Photo drink identification adds one model call per staged photo, counted against the account's hourly cap, and the last audit on production got "You have made a lot of requests this hour." Done when a recording-length session of several photos on one account runs with no cap message, or the account's cap is raised before recording.

### #512 The phone calendar can show the wrong month summary and jump when older months load

On the phone Days screen, the sticky month summary can stay on the wrong month, and the scroll position can jump when an older month loads.

Reviewer findings on merged PR #482, both reproduced by the coder in isolated component checks with synthetic months, not on the owner's device. The sticky summary can stay on the previous month while November scrolls in (src/components/PhoneCalendar.tsx lines 27 to 38). The anchoring that keeps the view still when an older month loads restores a stale scroll position if the user scrolls while the request is pending (lines 18 to 22 and 40 to 46). The review reported a third issue, but its text was cut off. Observe first: scroll Days across the October and November boundary, and scroll while an older month loads. Done when the summary names the month nearest the top and the view stays still while an older month loads.

### #294 The app's words read naturally everywhere

The owner has not signed off the complete list of app terms.

Fleet 12 merged #538 with revised UI wording, including Leftovers and the display-only needs-input question. Local checks do not establish the owner's complete terminology ruling, although GitHub marks #294 closed. The planner reviews Leftovers, Consumed, Log again, Saved meals, Additional food, the needs-input question and the Days names with AGY as a second opinion. Preserve consumed past tense and the bans on goals, targets, rings, percentages and remaining-amount "left". Done when the reviewed list and owner rulings are recorded and the chosen wording is used everywhere.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

Lazy job-module loading is merged through #334, and Fleet 12 merged #536's x-tick-cold header and cold log line. First-request preview timings and warm rapid calls are not proof of a cold process. No production header/log value or physical-phone worker post receipt was obtained. Done when a production cold tick is identified and timed before/after with the times in docs, and a post from a real phone completes through the worker.

### #323 Every protected page checks sign-in twice (part of #222)

The middleware calls Supabase to verify the user. The home page then calls Supabase to verify the user again. That is two round trips on every page open, on top of the cold function boot.

Run 8 merged one sign-in check per page: the server makes one Auth call, and a forged header is refused. Recorded browser windows still contained 10 and six /auth/v1/user requests, so the whole opening is not yet attributed. API authentication stays intact. Fleet 11 could not close it: minute totals from the logs cannot isolate one opening. Measure with spans tied to one navigation, and count the middleware call, the server helper call and the browser call. Done when a page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page.

### #494 Opening a meal's detail takes 14 seconds

The owner reports 14 seconds from tapping a meal to its detail page opening. He calls it not acceptable.

The owner reported it on Nov 4 at about 07:38 WIB. He measured on an iPhone with the app installed from the home screen, on XL Axiata Prioritas 5G in Indonesia. He gave no meal URL because the installed app shows none. The coder's Chromium audit on production (docs/detail-open-audit.md in PR #475) found useful content at 0.9 to 3.4 seconds, the original photo decoded at 1.2 to 3.7 seconds, 24 to 25 requests with eight repeated, and a 142 KB original downloaded although the feed copy was on screen. It did not measure the iPhone on XL Axiata, so the 14 seconds is unexplained. The audit items below name three suspects: no loading screen on the tap, the same meal read twice, and the full original photo downloaded again. Nobody has timed the detail on current main. Observe first: time the tap to a usable detail on a phone over mobile data and on desktop, and record where the seconds go (server render, database reads, photo download). Done when the detail opens within two seconds on the owner's phone over mobile data, and the report states where the 14 seconds went.

### #373 The app reads more from the production database than it needs

The app's reads drove egress to 8.66 GB and log ingestion to 1.10 GB in one billing cycle, against 5 GB and 1 GB on Supabase's free plan, and the project was depleting its Disk IO budget. The organization is now on Pro, which includes 250 GB of egress per cycle, but the same reads still cost bandwidth and database load while judges use the app.

Run 8 cut the feed's Supabase traffic per opening from 5.06 MB to 0.523 MB, 89.7%, by reading day totals once. The app and the worker use Supabase's HTTPS APIs, not SQL connections, so the pooler setting does not apply. Managed services (PostgREST, Storage, Realtime) account for many of the connections the Infrastructure page counts, and the historical 31 of 60 is unexplained, as is the 70% RAM on the Micro instance. Log-ingestion bytes are unattributed, since only row counts exist. Done when the billed log-ingestion bytes are attributed to their sources on the usage page and the RAM use on the Micro instance is explained.

### #375 Storage egress is the largest source and was not cut

In the 24 hours before Run 8, Supabase Storage served 2.99 GB across 35,048 requests, almost all to browsers. The Run 8 cut measured the feed's posts reads, not Storage.

docs/egress.md attributes the bytes to browser-class agents but not to which files (feed JPEGs, card PNGs or originals) or which clients. Much of it may be the coder's own 100-opening measurement runs. Log-ingestion bytes were never measured; only row counts were. Done when Storage egress is broken down by file kind and by client (test automation or real users), log-ingestion bytes are measured, and the largest real-user source is cut or shown to be small.

### #324 Home computes the day totals twice on every open (part of #222)

The server renders the row of day bubbles with totals for the last 5 days. The browser feed then computes totals again for the feed's days. Today's totals are queried twice on every home open.

Run 8 merged one shared server read of today's totals. Final browser windows still made one or two day-total reads, so a single read across the server and the browser together is unproved. Fleet 11 could not close it for the same reason. Measure with spans tied to one navigation, and count every read that returns today's totals, batch reads included. Done when a home open queries today's totals once across the server and the browser together.

### #452 A plainly visible nutrition label is reported as not found

A photo of a pack whose nutrition table can be read is rejected with "No nutrition label found".

Fleet 13 merged #548. A readable panel without a usable serving weight now has its own recovery message, and the prompt does not use a whole multi-piece pack's weight for one piece. Six real-model fixtures and both local viewport checks passed. The Goldfish photo was unavailable, so its cause remains unproved. Done when that photo gives a card with the numbers printed on the label, and a label in English does the same, on the owner's three phones.

### #451 Every barcode scan comes back as not in the database

The owner has scanned several packs on a phone and every scan has failed: the scanner reads the code and the lookup finds no product.

Before #480, lookup asked USDA FDC Branded only; Open Food Facts now supplies the Oreo code 7622300761363 and a second pack in coder production checks. Fleet 13 merged #546 so provider outages return the retry state, and filed #557 for incomplete saved corrections. #451 is reopened because no owner three-phone receipt exists. Done when this pack gives a product card with its name and nutrition, a second pack from the same shelf does too, and the source explanation is recorded, on the owner's three phones.

### #523 A meal shows every nutrition value as unavailable

A meal analysed on Nov 4 at 9:53 AM, "Spicy Indonesian macaroni", shows its calories, protein, carbs and fat as unavailable. The owner says the app's food estimates are broken now.

Fleet 13 merged #549: after strict USDA searches fail, it searches the bare food noun and can select the closest generic USDA record, naming that record in the summary. Model-made estimates are not used. All 17 provider fixtures passed; disposable real-provider re-analysis saved nutrition and a named-source comment. The owner's production post 86634d46-b0e3-421a-9b67-1a4e8f5e8e78 was not changed. Done when its re-analysis shows nutrition from the closest USDA record, labelled with that record's name, or says plainly why none qualifies, and the owner accepts the reference.

### #525 The meal detail photo is cropped and does not show the whole image

The whole-photo fix has passed local checks, but the owner has not confirmed it on a phone.

Fleet 13 merged #556: detail uses the whole photo with matching mask and pointer transforms. Portrait, square and landscape checks passed at 390x844 and 1280x800, including real image-area editor taps. The old portrait crop was inferred as about 54% on phone and 20% on desktop; the local new view crops none. Done when the owner confirms the whole image and correct outline positions on a phone as well as desktop.

### #222 The feed fails to open, and photos and cards take too long to appear

On a large account the feed sometimes shows an error or never appears. When it opens, photos and cards take a long time to show, so the app feels broken and slow.

Run 8 merged the cold-open fixes (#322, #323, #324, #326). In emulation, 100 of 100 browser openings passed and the five final cold photos took 1.48 to 1.83 seconds. The original failures (3 server errors and 15 blank feeds in 100 openings on the largest test account, 146 posts) never reproduced on Run 7's baseline, so their cause is not isolated; the worker's empty-claim loop is a suspect (separate item). The runtime logs return 403 for the coder, so the stack for digest 3642131196 exists only in the Vercel console. Done when the feed and the first photo show within two seconds on the owner's phone over mobile data.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

Use Muse Spark Open (meta-models/muse-spark-open-1026) through Baseten's OpenAI-compatible endpoint, https://inference.baseten.co/v1, for the identify-and-portions call. The key works only with that model and never goes in the repository, an issue or this backlog. Confirm the coder can sign in to Baseten with the key before the trial. The model always reasons, so check output caps that include reasoning. The Meta client hardcodes model names, and the ten-photo harness cannot choose a model host. Trial first in a throwaway clone that swaps only that call, and spend at most 5 US dollars. SAM and transcription stay on the Meta API, and the USDA lookup is unchanged. Compare the ten meal photos and one caption, "I ate half the rice", against the current path. A qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Cerebral Valley answered on Nov 3 that Muse Spark Open counts however it runs, including through Baseten. Done when a real, switchable path on main runs the identify-and-portions step on Muse Spark Open through Baseten, the model ID is logged, the results against the ten photos are in docs, and the owner has switched it on in Profile, logged a meal, and seen the Muse Spark Open line in that meal's post detail on production.

### #520 Every Home open reads the first feed page twice

The first feed page is now shared locally, but production reads for one complete Home opening have not been counted.

Fleet 12 merged #528. Its matching-owner Home reuses the server page without a second client first-page fetch in local checks; the owner-change guard fetches the new owner correctly. Production counts tied to one opening were not measured. Related: #373 and #498. Done when one Home opening reads the first feed page once and the production before/after request counts are recorded.

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

Unverified planner finding. The app's sign-up and sign-in run as server actions on Vercel, and the middleware refreshes sessions from Vercel. The Run 8 hammer was refused at request 31, but it called Supabase directly from the coder's machine, so it did not test the app's path (docs/auth-protection.md). Nobody has checked which IP address Supabase records for a server-action sign-in, or whether the server client forwards the user's address. Observe first: send 35 sign-ups through the production sign-up form from one machine, then sign in from a second machine. Use throwaway @example.com accounts only. Done when the report states which IP address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another.

### #372 Feed photos are too large for a phone on mobile data

Feed-photo resizing and caching are implemented, but no owner-phone check proves first-photo speed or acceptable quality over mobile data.

The small authenticated feed-photo route is merged; the old 152,193-byte/no-cache observation describes the previous path. Earlier matched needs-input photos fell from 497,591 to 63,720 bytes, and natural feed revisits reused cached photos. These are distinct experiments, not a billed-egress reduction. Done when the first feed photo appears within two seconds over mobile data and the owner confirms acceptable photo quality on the phones.

### #306 Every tap that saves shows its result at once

Some taps that save something look dead until the server answers, so the app feels slow.

The bookmark, Save meal, Log again and Edit caption have optimistic implementations from earlier merged work. The owner's newer #553 reports that thumbs-down still waits, and #217/#555 have uncompleted control coverage. GitHub marks #306 closed; treat those owner reports as unresolved evidence, not proof that every save is instant. Done when each listed tap changes the screen before the server answers on a throttled connection, survives reload and shows a failed save.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of USDA caffeine, but they have null beverage categories and no linked item-intake rows. #346 fixes new and re-analysed posts only, and no historical backfill ran. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items.

### #456 A rum cocktail is logged with 15 mg caffeine

The owner reported caffeine on a drink with no caffeine source; no updated owner-card receipt confirms that the historical tiki post is correct.

Fleet 12 merged #533 with caffeine-source exclusions and measured-zero handling; drink-rule tests passed. Stored historical rows were not changed or re-analysed. GitHub marks #456 closed, but the owner's tiki and wine checks are not recorded. Done when a cocktail or any drink with no caffeine source logs no caffeine, the card shows none, and the day's total leaves it out, checked on the tiki cocktail and a glass of wine.

### #499 Several pages export an instant flag that nothing reads

Several pages export a flag called instant set to false, and nothing reads it. Every reader has to wonder what it does.

Fleet 12 checked this premise and found Next reads export const instant under cacheComponents, so the original claim that nothing reads it is false. The issue remains open for a disposition; the dispatched plan explicitly kept the flag. Done when the owner or planner resolves the unsupported removal request using that reader evidence.

### #542 Pressing Space on a focused button in desktop capture takes a photo

On the desktop capture window, Space on a focused "Allow camera" or "Choose a file" button runs the photo shortcut instead of the button.

Found by the coder after #504 merged. The global Space handler (CaptureSheet.tsx, line 446 at the merged head) skips inputs, textareas, selects and contenteditable, but not buttons. It prevents the default activation and calls takePhoto. Done when focused buttons keep native Space activation and the shortcut applies only outside interactive controls, verified on both buttons.

### #543 Post closes before its posted-flag write is confirmed

A tapped Post can still be lost if the tab closes in the short time before IndexedDB confirms the write.

Found after #505 merged. uploadManager.post queues persist(entry) without awaiting it, so the sheet can close first. One four-photo trial with the tab closed 247 ms after Post kept the post, which does not prove the gap is closed. Done when the posted flag is acknowledged before the sheet closes, checked with a slow and a failed IndexedDB write.

### #544 The open model's format fallback can restart the 75-second budget

With Muse Spark Open on, a late structured-format rejection followed by a hanging retry can take up to 150 seconds before Meta answers.

Found after #507 merged. Each send() in createOpenResponse gets its own 75-second timeout, and a 400 or 422 format rejection runs send(false) and then send(true). The hanging-first-request check passed (75,003 ms, then ready at 76,397 ms). Done when both format attempts share one 75-second deadline.

### #557 An incomplete saved label can hide a barcode provider outage

A barcode lookup can report that a product is missing when a provider is down and the account holds an incomplete saved label correction.

Fleet 13's review of #546 found that both provider catch branches accept a correction with source label and per-100 nutrition, but mergeProduct also needs a product name and serving unit to use that correction without a provider result. The database permits either field to be null. This is a source-confirmed edge case; no production failure is claimed. Done when an incomplete saved label cannot suppress a provider error, a complete saved label still works during an outage, and a regression covers both cases.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. Run 8 merged a dormant hCaptcha widget and token path (#336). Called directly from the coder's machine, Supabase refused the hammer at sign-up 31 and sign-in 32, and the 31 throwaway accounts were deleted. The owner holds the site key and the secret. The secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT\_PUBLIC\_HCAPTCHA\_SITE\_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers sign-up and sign-in is refused.

## Engineering backlog - design

### #550 The desktop feed fills the whole window and the Today column is missing

On desktop the feed runs edge to edge and the photo touches the window edge. The Today column does not appear.

The Round 6 design (6a) and the code on main both centre a 500 px feed column beside a 280 px Today column. Main's code cannot produce the owner's screenshot, so production may not be running main, or something on the live page overrides the width. Check which commit production serves, then the feed width in DevTools. Done when production shows the centred 500 px feed with the Today column as 6a draws it, checked on the live page at 1280x800.

### #551 A stray note about unavailable food floats above the first post on desktop

A line of text sits above the first post on desktop with nothing above it. The design never put it there.

DayHeader.tsx line 27 adds an unavailable-food note under each day header. On desktop the day header is hidden and the note is not. Delete the note and the "\*" on day totals, on phone and desktop. Each post's own summary line already names the unavailable food. Done when neither appears on either layout and production is checked.

### #552 The buttons under each post are 24 px tall and show no pressed or turned-off state

The buttons under a post are too small to hit and look the same at rest, while saving and when turned off.

Design 7a (Round 7) gives 44 px tap areas and every state: rest, pressed, saving, turned off and failed. Done when each button matches 7a on production at 390x844.

### #553 Thumbs up and down look the same when turned off and thumbs down waits for the server

The thumbs turn themselves off while a vote saves and before the analysis exists, with no visible difference. Thumbs down opens nothing until the vote has saved.

This is the first case the owner found for #217. Done when a thumb shows its pressed state at once, looks different when turned off, and thumbs down opens at once, checked on production at 390x844 with the processor slowed.

### #554 Tapping a meal shows nothing until the server answers

Comment, Details, tapping the photo, "more" and Post in the capture sheet wait for the server before anything changes on screen.

Design 7b (Round 7) shows the screen at once, using the photo already on screen while the details load. Done when each of these taps shows a visible change at once, with no layout jump when the details arrive.

### #555 The controls on Days, Search, Profile and the capture modes have not been audited

The Round 7 control table covers the feed, the post and the capture sheet. Days, Search, Profile and the Text, Photo and Barcode modes are not in it.

The designer has not read their controls yet. Add them to the table with the four findings of #217: time to a visible change, pressed state, jump or flicker, and double tap. Done when every control on those screens is in the table and the dead ones are fixed or filed as items.

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
