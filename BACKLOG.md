# My Food AI — Backlog†

Last edited: Tuesday 2026-11-17 at 21:54 WIB (UTC+07:00) by Claude, PM

For the owner (Tue Nov 17, 19:11 WIB): The PM cannot talk to the designer. The PM seat has no browser tool, so it cannot open the designer's chat in claude.ai and type into it. Five backlog items are waiting for the designer to choose a place, a look or an audit: the barcode prompt over the live camera (#453), what the card you swipe to on a drink's photo shows (#455), how much of an alcoholic drink was drunk (#457), what places that wait on the network show while they wait (#631), and the controls on Days, Search, Profile and the capture modes (#555). To unblock them, paste those five titles into the designer's chat and ask for a look for each, or give the PM seat a browser tool. Nothing else waits on you.

The only job of the PM is to maintain this backlog and keep it completely up to date. Failing to do so is immediately terminable.

## Backlog for GrokBot

### #1021 Check on production the card, first comment and day total of three re-matched meals

Three meals kept changed calorie totals after the team re-matched them, and nobody has yet looked at them on production.

The meals are f1439c72 (stored 564.85 kcal), e31fd9af (687.8 kcal) and 5711e19c (373.6 kcal). The changed totals are not proof that the numbers are right. Done when someone opens each meal on production and records the card's calories, the first model comment's calories, and that day's total, with the displayed rounding, and they agree with the stored values.

### #988 A drink whose matched record has no category is not counted as a drink

A drink whose USDA record has no beverage category can be left out of the drink totals.

The cola records behind #377 are the known case. Done when such a drink counts as a drink, with its caffeine, on the card and in the day total.

### #987 An estimated coffee or tea never stores caffeine

A coffee or tea whose numbers come from a model estimate shows no caffeine, because an estimate holds no caffeine value.

Caffeine comes only from a matched USDA record. The Oct 29 black coffee is the known case (#377). Done when an estimated coffee or tea stores a caffeine value, or the app says plainly that it is an estimate with no caffeine figure.

### #972 The capture sheet could load on the first tap

The capture sheet is bundled with the page, though most opens never use it, which adds to the first load.

Loading it on the first tap needs the service worker to keep the new file for offline use, so it is not a one-line change. Done when the capture sheet loads on first tap, still opens offline, and Home's first-load JavaScript is smaller.

### #970 Five different refusals of an added photo share one sentence

When a photo cannot be attached to a meal, the person always reads "The photo could not be attached.", whatever the cause.

Five refusals reach that one sentence (attach-photo.ts line 9). Done when each refusal says what happened and what the person can do.

### #969 An added-photo request that never answers leaves the chip on "Uploading" for good

A photo added to a meal can stay on "Uploading" forever, and the chip still says "Uploading N posts" when all of them have failed.

No request in the added-photo path has a time limit (pack-photo-upload.ts, upload-manager.ts line 271); the chip's title is in UploadChip.tsx line 30. Done when a request that never answers fails after a set time, the chip shows the failure, and its title does not claim uploading when every post has failed.

### #120 Home refreshes its whole server page every minute while it is visible

While Home is open, it reloads its whole server page once a minute and on every return to the tab, which costs reads and can make the page jump.

The refresh sits in PostReadinessListener.tsx (lines 79 to 80). The Fleet 24 audit found it. Done when Home refreshes only what changed, or only when a meal is waiting, and a Home open with only finished meals makes no minute refresh.

### #973 A meal with no photo shows two differently worded failure sentences

A meal with no photo that failed its first analysis can show two different sentences for the same failure.

The photo area reads "This meal could not be analysed." while the card reads its own failure sentence. Done when both places say the same thing.

### #968 The meal detail's "updating" poll does not wake when the person returns to the tab

On a meal's page, returning to the tab can leave the "updating" check waiting before it looks again.

The poll in OutlineOverlay.tsx (lines 181 to 190) has no listener for a return to the tab. #753 covers the same gap in the thread. Done when returning to the tab starts a check within one second.

### #456 A rum cocktail is logged with 15 mg caffeine

The tiki cocktail post states caffeine that the drink does not contain.

The drink card for the lime and rum tiki cocktail read "15 mg caffeine" next to 196 kcal, and the day's caffeine total read 110 mg. Fixed on main: the tiki cocktail (owner post 8535b793) now shows 196 kcal and 18 g alcohol with no caffeine on the meal page, and a glass of red wine shows 16 g alcohol and 128 kcal with no caffeine. The Nov 3 day total was not read. GitHub shows this issue closed. GrokBot, Nov 5: FAIL. Tiki cocktail 8535b793 shows 196 kcal and 18 g alcohol, but Show all lists Caffeine 15.4 mg and the Nov 3 day total shows Caffeine 95. PM ruling: the defect stands, even though the card no longer leads with caffeine. GrokBot, Nov 15: Show all still lists caffeine on the tiki cocktail 8535b793 (15.4 mg), 8b728c7e (15.4 mg) and 8ab2eccb (14 mg). Done when a cocktail or any drink with no caffeine source logs no caffeine, the card shows none, and the day's total leaves it out, checked on the tiki cocktail and a glass of wine.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of caffeine from the USDA but have no beverage category and no linked intake rows. The fix covers new and re-analysed posts only. A backfill fixed 8 posts, and 12 still fail the intake rules. GrokBot, Nov 15: the old colas now show caffeine on the card and in the day total, but the Oct 29 black coffee (post 4dfe4411) shows no caffeine anywhere and is listed at 112 kcal, which is far too high for black coffee. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

### #222 The feed fails to open, and photos and cards take too long to appear

The feed sometimes fails to open, and on a slow connection the first photo and the cards take too long to show. The goal is the feed and the first photo within two seconds at the slow-network test profile.

The original failures (3 server errors and 15 blank feeds in 100 opens on the largest test account, 146 posts) never reproduced on the earlier baseline, so their cause is not isolated. The stack for digest 3642131196 exists only in the Vercel console, because runtime logs return 403 for the coder. In emulation 100 of 100 cold opens succeeded with photos at 1.48 to 1.83 s, but on production the first feed photo measured 4.09 s and 4.05 s on a cold open with slow 4G at 390 wide. The sub-items #322, #323, #324, #520 and #372 each remove one piece of wasted work. GrokBot, Nov 5: FAIL. The first feed photo showed at 6.96 s, 8.49 s and 7.20 s on a cold slow-4G open at 390 wide, against about 4.05 s in Fleet 18 (see #372). GrokBot, Nov 15: 3.4 s on a judge account and 2.7 s on the owner account, still over 2 s. Done when a browser helper on production measures the first feed photo at 2 seconds or less on a cold open at the slow-network test profile.

### #512 The phone calendar can show the wrong month summary and jump when older months load

On the phone Days screen, the month name at the top can show the wrong month, and the screen can jump when an older month loads.

Two defects in a live change were reproduced with made-up test months, not on the owner's phone. First, the month name can keep showing October while November scrolls into view; this cannot appear on any production account today because two months fit on one screen, so it is proven only on the disposable stack with three seeded months. Second, scrolling while an older month loads makes the screen jump back to an old position. A third review finding was cut off and is unknown. Done when, on the disposable stack with three seeded months, the month name shows the month nearest the top of the screen while scrolling across the October and November boundary, and the screen stays still while an older month loads. Fleet 21 check, Nov 16: three months were already loaded with only 47 px of upward scroll, no boundary crossed the sticky line, and the header and insertion behaviour were not verified.

### #454 The Days page is not one continuous calendar

Days cuts the calendar into separate month blocks, which no calendar app does, so the user cannot scroll through time as one run of weeks.

On the phone, Days shows November 2026 and October 2026 as two separate blocks, each with its own heading, and the newest month sits on top. Days becomes one continuous calendar: the weeks run on from one to the next in time order with no break, the month name marks where each month starts, and Days opens with today in view. GrokBot, Nov 5: the phone Days page shows October running into November in one scrolling grid, but it did not open with today in view (todayInView false, October heading), and the sticky month name across the boundary is not proven. Done when scrolling Days moves through unbroken weeks from October into November, the month names mark where each month starts, and Days opens on today, in a phone-sized browser.

### #955 The meal header's date line can be clipped inside its fixed-height row

The date line under a meal's header can be cut off, so the person cannot read when the meal was eaten.

The header row is a fixed 52 px (PostDetailHeader.tsx lines 66 to 68). Issues #735 and #826 are about the servings editor, not this. Done when the whole date line shows at 390 wide and at the largest text size.

### #372 Feed photos are too large for a phone on mobile data

Feed photos are too large for a phone on mobile data, so the first photo is slow and the app spends more storage egress than it needs. A phone should receive a small copy sized for its screen.

The feed serves immutable WebP copies at 1920 px (default), 1040 px (2x) and 1560 px (3x) with a one-year cache header. On production the first feed photo appeared at 4.09 s and 4.05 s on a cold open with slow 4G at 390 wide, against a 2 s target. It was the 1560 copy, 50,076 bytes, rendered 390 by 520. One line in docs/media-loading.md still says "no-store". GrokBot, Nov 5: FAIL. On a cold open at slow 4G and 390 wide, three runs showed the first feed photo at 6.96 s, 8.49 s and 7.20 s (about 4.05 s in Fleet 18). The photo is v2-1560.webp, 91,542 bytes, cache-control private, max-age=31536000, immutable, with a natural width of 390 against a 390-wide card, a ratio of 1.0 where the done line needs 2. GrokBot, Nov 15: the first photo took 3.4 s on a judge account (78,522 bytes) and 2.7 s on the owner account (42,986 bytes), still over 2 s. Done when a browser helper on production records the bytes and the cache header of the first feed photo, the first photo shows within two seconds at the slow-network test profile, and the stored photo is at least twice as wide in pixels as the card it fills, for photos captured since the sharper camera (old 480 × 640 photos cannot meet it).

### #494 Opening a meal's detail takes 14 seconds

The owner reports 14 seconds from tapping a meal to its detail page opening. He calls it not acceptable.

The owner measured 14 seconds on an iPhone on mobile data in Indonesia; that cannot be re-measured. On production with slow 4G, a usable detail opens in 1.96 to 2.45 s on desktop and 1.64 to 1.74 s at 390 wide. The page makes 24 to 25 requests, eight repeated, and desktop downloads two 0.feed.jpg originals of about 480 to 496 KB although the feed copy is already on screen. GrokBot, Nov 5: desktop still downloads two 480 to 496 KB 0.feed.jpg originals, so the done line fails. The owner's 14 s on an iPhone cannot be re-measured and is no longer required. Done when the detail opens within two seconds at the slow-network test profile on desktop and at 390 wide, and the two large originals are not downloaded.

### #693 Voice input exists only in the comment box on a meal

The mic is the one place a user can speak instead of type, and it is buried: it appears only after opening a meal and starting a comment. A user who wants to say what they ate when posting cannot.

The owner ruled on Nov 14 that voice must be a first-class input, available wherever the user types. Checked in the code on main (96ecdcf): VoiceRecorder is mounted only in CommentComposer.tsx, and every transcription is a model call that counts against the hourly limit (#471). PM ruling: the mic sits inside the field, in the same place as the comment box mic, in the new-post caption, the drink description, search and the comment box (the app has no leftovers caption field). Done when, in a phone-sized browser on production, each of those four fields shows the mic, and a short recorded clip played into the microphone puts its words in the field. Fleet 21 independent source read, Nov 16 (investigators' report): PR 911 loses speech on submit. The field mic's activity callback is empty (VoiceButton.tsx line 8), so pressing Post while recording closes the composer and the unmount aborts the transcription. The access test stops before transcription and cannot catch it. Fleet 21, Nov 16 (PR 911): the mics are built; those in the text composer, the drink sheet, Search and the comment box were inspected. The mobile camera-caption mic was not verified and no speech clip was played. Fleet 21 independent source read of the fixed head 16348f08, Nov 16: speech lost on Post is fixed, but speech is still lost when a drink photo is being identified during a caption recording and the result is all drinks, because the composer then switches to the drink overview and the recorder's cleanup throws the unfinished speech away (ComposerDrinks.tsx line 23, LightComposer.tsx line 78, VoiceRecorder.tsx line 13). The new tests mock drink detection as inactive and never run the cleanup. Read from source, not reproduced in a browser.

### #688 The feed jumps to another meal because every card's first-run hint triggers a server action that remounts the feed in a loop

On the phone, while the user scrolls the feed, the screen suddenly jumps up to a different meal and keeps bouncing, so the user loses their place. The owner first saw it after swiping the photos of a meal that has a leftovers photo.

Fable reproduced it on production on Nov 5 in a 400 px window. The swipe is not the trigger: it also happens with no swipe and on a meal without leftovers. Every feed card mounts the "Was this estimate right?" hint, and FirstRunHint.tsx line 31 calls the getHintState server action on every mount, even when all hints are seen. That action uses the cookie-writing Supabase client (src/lib/profile/hints.ts line 11), so Next returns a 42 KB re-render of Home. The feed falls back to its loading state and remounts with page one, and the scroll position clamps from 6598 px to 3170 px. The remount mounts six more hints, which fire six more actions, about two per second until the queue drains. Loading page two mounts 20 cards at once, which starts the loop. A DOM observer, the resource timing log and a manual replay of the action all confirmed it. Not verified: Chrome's network panel listed the POSTs as 503 while timing and replays showed 200, so Fable treated the 503 as a tool artifact. Fable's smallest fix is a module-level map in FirstRunHint.tsx (ThumbsFeedback.tsx line 35 mounts the hint) that caches the lookup per page load, which cuts it to at most four actions at startup. A cleaner follow-up reads profiles.hints_seen with the browser Supabase client. Code is frozen until judging, so nothing is fixed. Done when scrolling the feed into page two on production in a phone-sized browser sends no repeated POSTs to "/", the scroll position never jumps, and swiping the photos of a meal with a leftovers photo moves only that meal's photos. Fleet 21, Nov 16 (local): no root POST while loading 80 meal elements; a scroll-position jump coincided with older rows loading, and the no-jump and leftovers-swipe conditions are not certified.

### #695 A fix for the cached expired feed-photo redirect has never been seen working on production

A change that stops a phone keeping an expired feed-photo link is on main. Nobody has seen it work on the live app, so a blurry or broken photo could still stick.

Before the fix, the feed photo route answered with a redirect to a signed link that expires in 60 seconds and marked that redirect immutable for a year. Related: #639. GrokBot, Nov 15: the redirect carries no long-lived cache header and feed photos loaded on the next visit; the busy-resizer case was only approximated. Done when GrokBot confirms on production that a feed photo requested while the resizer is busy loads correctly on the next visit.

### #575 A meal with unavailable nutrition does not say why

When a food shows nutrition as unavailable, an ordinary user cannot find out why. The owner could not learn why the macaroni failed without an agent reading the database traces.

The reason exists only in the model call log. For the macaroni post it said no matching generic fried-pasta record was present, and the plain name "macaroni" was never searched (#523). The closest-food label appears only when a close USDA record is found, so a food with no close record says nothing. GrokBot, Nov 5: FAIL on the done line. The owner's post with "Nutrition unavailable: watermelon chunks" shows the food name and no plain-language reason, and the macaroni post reads the same. Done when a meal with an unavailable value tells the user, in plain words and without database access, which food failed and why, checked on production with a meal known to be unavailable.

### #452 A plainly visible nutrition label is reported as not found

A photo of a pack whose nutrition table can be read is rejected with "No nutrition label found".

A photo of a Goldfish cracker pack failed: the label is in Indonesian and the whole table is in the frame, yet the app showed "No nutrition label found" with the buttons "Take the photo again" and "Type it instead". The label flow opens only after a barcode scan answers Not in the database, so a test needs such a barcode; an English label image is ready. A label with no printed weight cannot be saved, because the database rejected the serving unit; that is fixed in the database, but the pack-photo flow has not been re-proven. GrokBot, Nov 5: not run. The label flow opens only after a barcode miss, and no barcode field was reachable. An English label image is at f18/img/label-u.jpg. Done when that photo gives a card with the numbers printed on the label, and a label in English does too, in a phone-sized browser window.

### #570 A leftovers photo takes several seconds to post while a regular photo is fast

Posting a photo of leftovers takes several seconds to show, while a regular meal photo shows at once. The owner says the leftovers photo is not snappy and that this is not acceptable.

The owner timed adding a leftover at about 11 seconds on his phone. The leftovers path waits for image encoding, upload signing, two uploads in a row (about 1.3 and 1.2 seconds) and the attachment steps before it closes the camera; a regular post hands the work to the upload manager and closes at once. The logged staging-to-attachment time was about 4.9 seconds, so most of the 11 seconds is unexplained without a trace from the phone. Two causes are suspected: two photo-upload workflows, and one worker lane shared by analysis and maintenance. Observe first: on a phone over mobile data, time a regular photo and a leftovers photo from the tap to the post showing in the feed, and record where the extra seconds go. GrokBot, Nov 5: FAIL. On judge 1 in a phone-sized browser a regular photo closes its sheet in 72 ms and a leftovers attach closes in 5,049 ms. Done when a leftovers photo shows in the feed as quickly as a regular photo, timed in a phone-sized browser.

### #449 The food names do not show before the numbers on a new upload

A new upload shows no food names while its numbers are still being worked out.

Unproven. A rice-and-broccoli post reached ready with no food names shown while its numbers were pending (390x844, Fast 4G, account 1). The feed now polls pending items, so the claim may already be false. The claim is that the card discards food names the app has found while the numbers are still being worked out. Observe first: post a new photo on production and watch the card until the numbers arrive. GrokBot, Nov 5: on a new salad upload the card showed the caption and "Processing, traffic low" before any kcal, and once ready the names and numbers arrived together. The sampled polls neither show names while numbers are pending nor show names discarded, so the model-call log has to decide it. Done when a new upload shows the foods the app has found while the numbers are still being worked out, or the item is closed because the names already show.

### #351 The drink sheet's tiles have not been checked on the live app

The drink sheet shows tiles, and a change set their sizes and order. Ordering by use (#527) and the hold to pick a size are both in the code on main.

Issue #351 specifies six fixed tiles from the server, ordered by use with the most used first. Holding a tile for about 650 ms offers a size, such as a 240 ml cup or a 350 ml large coffee. In IntakeSheet.tsx on main (96ecdcf), six tiles are ordered by use and a 500 ms hold opens the sizes.  GrokBot, Nov 5: the drink sheet on production shows four tiles (Water glass 250 ml, Coffee cup 240 ml, Tea mug 300 ml, Water bottle 500 ml), not six. Holding a tile for about 700 ms opened no size picker. The code on main has both, so production differs from the code and the cause is unknown: a stale build (#598), hidden tiles, or how GrokBot held the tile. Done when the drink sheet on the live app shows six tiles with the most used first, and holding a tile offers its sizes.

### #936 Check on production that finished meals are not re-read when Home opens

After the fix for #520, a cold Home open of finished meals should not read them again. Fleet 21 first measured three extra reads, then later evidence measured none.

On production, with six finished meals, a 15-second open made no /api/feed?ids= request. A local run earlier showed three reads for other seeded meals, and later source reads blamed old off-page discovery ids and measured zero on a fresh profile. The two results are not yet reconciled. Done when a cold Home open on the owner's account and on a test account makes no /api/feed?ids= request, and the earlier three reads are explained.

### #938 Check on production that the desktop failed-upload chip shows its Remove button

On desktop the failed-upload chip cut off its own Remove button, so a person could not discard a failed added photo.

Fleet 21 recorded the failure locally and a later local repair on #912 measured the button contained and tappable. Production acceptance was not checked. The broader item #684 stays open. Done when, at 1280 wide on production, a failed added-photo upload shows its whole Remove button and tapping it removes the upload.

## Engineering backlog

### #999 The camera view goes black on the Photo screen, possibly because the barcode reader starts there

The owner opened New post on his iPhone in Photo mode and tried to take a photo. The picture area stayed black, so he could not take one. He later found that a QR reader may have started and blacked out the screen, even though he was on the regular Photo screen. A person who is not on the Barcode screen should never meet the barcode reader.

Owner, Tue Nov 17 at 10:48 WIB: the New post screen showed its Photo tab, the shutter button and the "What did you eat?" field, with a black picture area. The owner's own reading at 10:59 WIB is that a QR reader kicked in; the cause is not confirmed. At 10:49 WIB the same phone also showed "Safari can't open the page because the network connection was lost" for my-food-ai-ten.vercel.app, with 5G and three signal bars on screen; nobody has checked whether that is linked. The owner said he would kill the app and try again; the result is not yet known. No GitHub issue exists yet. Done when, on a phone, opening New post in Photo mode shows the live camera picture within a few seconds, the barcode reader does not run until the person opens the Barcode screen, and the shutter button takes a photo, both on a first open and after the app is killed and reopened.

### #1000 A person cannot merge two posts of the same meal into one

When a person posts the same meal twice by mistake, the app shows two posts and counts the food twice. A person may also want to join two posts on purpose. Today they cannot do either.

Owner, Tue Nov 17: this is a new feature, and he calls it tricky. It must work when someone wants to merge two posts and when two posts hold the same item because it was double posted. No design exists, and the rules for what the merged post keeps are not decided: its photos, caption, time, items, numbers and comments. No GitHub issue exists yet. Done when a person can pick two of their own posts and merge them into one, and the merged post shows once in the feed, on Days and in the day's totals, with no item counted twice.

### #212 Packaged food cannot be logged from the regular camera, and the scanner has never been tried on a phone

To log a packaged food, the user has to switch to a separate scanner, and that scanner has not been tested on a phone. The owner wants the regular camera to read a barcode and a nutrition label.

The design is to decode a barcode with deterministic code first, and to use the model only when no code is found or for a label. On Nov 1 a production check at phone width returned "not in database" for a valid barcode, and a label read by the model made a ready post whose stored nutrition matched. On Nov 2 on production, a Photo-mode shutter decoded an emulated UPC-A barcode to a Found result. The owner kept the issue open because the physical-phone check for both is unmet. Related: #452, where the label flow opens only after a barcode miss. Done when a real packaged product's barcode, photographed through the capture sheet on a phone, creates a post showing the product's name and nutrition, and a nutrition label photographed the same way does the same.

### #594 Let the user choose where a photo is saved: the in-app camera with manual saving, or the native camera with every photo saved

The app's own camera sends photos only to the app, so none reach the phone's camera roll, and the owner wants a choice.

The owner ruled that this is a switch in personal settings with a short explanation of each mode, so he can test both. Manual-save mode keeps the app's camera and shows a Save photo button that opens the share sheet. Native mode opens the phone's own camera, which may save to the camera roll by itself. Built: the switch on Profile (kept per device), native mode, Save photo through the share sheet and a file-download fallback. Browser checks pass. Not checked on a real phone: which actions the share sheet offers and whether a copy reaches the camera roll. On iPhone with iOS 16.2 or later, a share sheet opened by an app has no Save Image option (a known Apple bug), but pressing and holding a shown photo does offer it. How people share or save everything, or nothing, is not decided. Done when the owner rules whether native mode and Save photo are accepted without a phone check, because nobody can check the share sheet or the camera roll without a physical phone.

### #373 The app reads more from the production database than it needs

The app's reads drove egress to 8.66 GB and log ingestion to 1.10 GB in one billing cycle, against 5 GB and 1 GB on Supabase's free plan, and the project was depleting its Disk IO budget. The organization is now on Pro, which includes 250 GB of egress per cycle, but the same reads still cost bandwidth and database load while judges use the app.

The feed's database traffic per page open fell from 5.06 MB to 0.523 MB (89.7% less) by reading day totals once. The app and the worker reach Supabase through web requests, not database connections, so the connection-pool setting does not apply. Nobody can explain the historical 31 of 60 connections or the 70% memory use on the small instance, and log volume is known only in rows, not bytes. Done when the billed log bytes are attributed to their sources on the usage page and the memory use on the small instance is explained.

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

The app's sign-up and sign-in run on Vercel's servers and do not pass on the browser's address, so Supabase counts the app server's addresses (seven were seen, 36 of 75 sign-ups from one). A direct hammer from one machine was refused at request 31, but that did not test the app's own path. 75 sign-ups through the production form, one every 10 to 22 seconds, raised no rate-limit message, no 429 and no CAPTCHA; why none was refused is unexplained. Observe first: send sign-ups through the form faster than a browser can, then sign in from the owner's phone on mobile data, using throwaway @example.com accounts only. Done when a written report states which address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another.

### #687 The submission text omits voice transcription and says all AI calls use the Meta Model API, which is untrue when Muse Spark Open is on

The hackathon submission was sent at 08:59 WIB. Its description never mentions voice transcription, and it says all runtime AI calls use the Meta Model API. When a user turns on Muse Spark Open in Profile, food identification goes through Baseten instead. A judge who compares the submission with the README sees two accounts of the app.

Checked in the public repository at 96ecdcf (Nov 5, 08:46 WIB): voice is built. The route /api/transcribe calls muse-voice-transcribe-1.0, and VoiceRecorder is mounted in CommentComposer, so the mic sits in the comment box on a meal, not on the capture screen. The open path is built too: open-weights.ts, plus a Profile switch that appears only when IDENTIFY_OPEN_API_KEY is set. docs/open-weights.md says production holds that key and the switch persists (Fleet 10 check), and the owner's own-account look on #281 is still open. The owner believed both were removed, and the code contradicts that. PM, Nov 14 (Chrome, owner account, read-only): production shows the mic beside the comment box on a meal, and Profile shows the switch "Identify food with Muse Spark Open", set to Off. #657 covers the README's no-match wording. Whether the portal counts edits after 09:00 is unknown. Done when GrokBot confirms on production that the mic shows in a meal's comment box and the Profile switch shows, and the owner has checked the portal for the contributor list and decided whether to edit the description.

### #689 The last Fleet 18 remediation PRs (#667, #668, #670, #671, #672, #677 and #678) merged without a clean exact-head review

These PRs are on main, and the reviewer asked for changes at most of their merged heads. Two bugs were confirmed in them: the cover photo's cache lifetime (#668) and the seeded avatar subscription (#672). Fixes for both merged afterwards in #679 and #680.

The exact-head review rule was overridden to land them before the stop. #672 merged at the unreviewed head d50bdf79 with a hand-resolved conflict in PostDetailHeader.tsx, and #677 had no PPLX run. The coder reports #679 (photo cache counted from signing time, #668) and #680 (review findings on #678 and the seeded author identity, #672) merged at 08:30 and 08:32 WIB. The coder now reports (relayed by the owner, Nov 15) reviews at the merged head of #672, #677, #678 and #680 with the fixed runner, and valid head-matched receipts already held for #667, #668, #670, #671 and #679. No receipt contents have reached the PM. Production main is 96ecdcf, and code is frozen until judging, so a new finding cannot be fixed now. Done when the avatar route is checked on production for an account with an avatar (200, private cache) and for another signed-in user (404), PostDetailHeader.tsx is checked on production for the author avatar and the servings layout, and each unreviewed merged head has been reviewed with each real finding filed as its own item.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. A dormant hCaptcha widget is built. A direct hammer from one machine was refused at sign-up 31 and sign-in 32. The owner holds the site key and the secret; the secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT_PUBLIC_HCAPTCHA_SITE_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers both is refused.

### #578 The leftovers photo and the regular photo post through different code

The app has at least two code paths that post a photo, and the leftovers one is slower and blocks the camera. Other jobs may be done twice in different ways, and nobody has listed them.

The audit of main ranked 26 findings. The biggest: two photo-upload workflows (the leftovers path is slower and blocks the camera), several screens that each refresh when a meal finishes, the meal detail waiting for optional services, the same photo delivered under several addresses, and nutrition read twice by the feed. The smallest: the profile handle read by separate readers, serial drink lookups, a photo reloaded during matching, repeated queue counts and a repeated search interpretation. Rank 1 (the two upload workflows) is built; the other 25 await a decision. Done when each of the 26 findings is filed as its own item or closed with a reason.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature is in, one pass replaces the default README with a short start-here page. All working files stay in the repository, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed. Done when the README is the start-here page, and a search of the repository for host names, account identifiers and billing details finds only what the owner chose to keep. GitHub already shows this issue closed. It stays here until that is true.

### #553 Thumbs up and down look the same when turned off and thumbs down waits for the server

The thumbs turn themselves off while a vote saves and before the analysis exists, with no visible difference. Thumbs down opens nothing until the vote has saved.

This is the first case found for #217. The pressed look appears at once (first change 6 to 8 ms with 4x CPU) and thumbs down opens the reply at once. The turned-off look was not observed: the buttons were never disabled, and the rest look is the grey text-off. Four of eight entry paths took longer than 50 ms to show a change: phone photo 51.5 ms, desktop More 64.3 ms, Details 66.6 ms and Comment 64.3 ms. GrokBot, Nov 5 (Fleet 18 result): the pressed look shows in 6 to 8 ms with 4x CPU and thumbs down opens its reply at once. The turned-off look was never observed because the buttons never disabled. Done when a thumb shows its pressed look at once, looks different when turned off, and thumbs down opens at once, checked on production on a phone-sized screen with a slowed processor.

### #552 The buttons under each post are 24 px tall and show no pressed or turned-off state

The buttons under a post are too small to hit and look the same at rest, while saving and when turned off.

Design 7a gives every button a 44 px tap area and five looks: at rest, pressed, saving, turned off and failed. On production every button measures 44 by 44 (Details 53 by 44). The saving, failed and pressed looks were not captured. Thumbs down took 0.39 seconds to show a change and 0.86 seconds to get its reply. GrokBot, Nov 5 (Fleet 18 result, not re-run): every button measures 44 × 44 (Details 53 × 44). The saving and failed looks were never captured, and forcing them needs the coder. Done when each button matches 7a on production on a phone-sized screen.

### #579 Photos are captured at 480 × 640 and look blurry on high-density phones

The app stores each photo at 480 × 640 pixels, the size the browser chose for the live camera, and the feed shows a smaller 384 × 512 copy. On a phone with a three-times screen a full-width card needs about 1,170 pixels, so every photo looks soft. The owner finds the blur painful.

The live camera asks for the rear camera with no size and draws one video frame, so the stored original is 480 × 640 pixels (0.31 megapixels, 126,407 bytes). The feed shrinks it to a 384 × 512 copy (22,118 bytes) cached for a year, so a sharper copy needs a new address. Photos already captured stay at 480 × 640. A sharper photo costs more Storage egress (see #375). A sharper capture, a larger feed copy at a new address and full-resolution detail photos are on main; the bytes, the egress and a real camera's resolution have not been measured. Known risks: the preload can download the wrong photo size, and one failed image turns off sharper photos for later ones. Observe first: find what resolution the camera delivers in a phone-sized browser at 3x, and the bytes of a photo at each size. GrokBot, Nov 15: the shutter now captures at 2560 × 1920 and the stored photo is sharp. The first photo still takes 2.7 to 3.4 seconds on slow mobile data, against the two-second target. The 384 px feed copy (v1.webp) of the new 2560 × 1920 capture was served as a 1920 × 1440 JPEG with a one-year immutable cache, which suggests the resize failed on a large source. A real phone's camera was not tested. Done when a photo captured in a phone-sized browser at 3x is stored at a sharper resolution, the feed and the meal detail show it sharp on a 3x phone, the first photo still shows within two seconds on mobile data, and the bytes per photo before and after are written down.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs in #553 are the first case found. List every tappable control on each screen at phone size. For each, record the time from the tap to a visible change, whether it shows a pressed look at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. Measure in Chrome with a slowed processor, using the production sign-in from #196; the table built so far used unthrottled Firefox, so the slowed-processor condition is unmet. Done when the table lists every control with those four findings, and the slow or dead ones are fixed or filed as items.

### #571 A post started while another is going up breaks the other post with "The meal could not be saved"

Starting a second post while an earlier post is still going up can end with "The meal could not be saved.", and the owner has to press Post again to get the meal saved.

The owner's screenshot shows the toast "The meal could not be saved." over the feed, with the first post, "Beef noodle", showing a grey bar where the analysis would be. He posted one photo, photographed another food while the first was going up, and one of the two posts stopped working when the first finished; pressing Post again saved the meal. Which post stopped, and whether the two overlap in the capture sheet, the upload or the save, is not confirmed. The cause is unknown. Observe first: on a phone, start a second post while the first is still going up, and record which request raises the error and why. GrokBot, Nov 5: not reproduced as the owner saw it. An overlap on slow 4G showed no "could not be saved" toast and the second post closed in 107 ms, but /posts/<id> RSC fetches returned repeated 404s for one overlapping id, which the coder must look at. Fleet 21, Nov 16 (coder report, relayed by the planner): 16 not-found errors were seen on a meal's own address while the meal was still uploading, and the cause is not traced. Done when one post finishing never stops the screen of the other, and both meals save on the first press of Post, in a phone-sized browser.

### #683 Three merged fixes have never been seen working in a browser

The fixes for the meal bookmark on a failed analysis (#634), the upload chip and the meal-cover retry were reviewed in code and never run in a browser. A judge who taps them could meet a defect nobody has seen.

The coder reported this on Nov 5 and named the three fixes without PR numbers for the chip and the retry. The retry poll can also be cancelled by an in-flight load (PR #674), which is deferred. GrokBot, Nov 15: the upload chip works, and bookmarking and unbookmarking a ready meal works. Two bookmark defects: a bookmark on a "No food found" post shows filled but sends no request and cannot be unsaved, and a bookmark tapped while a post is queued reverts at about 120 s and is never saved even when the analysis finishes later. Posts that end as "No food found" also leave the Home feed and show only on Profile (see #615). GrokBot, Nov 15, second reading (12:20 to 12:46 WIB, same production build): a failed meal was made by replacing an uploaded photo's original with 4 KB of random bytes, and the post failed in about 20 s with "The analysis service refused this request. Try again." Tapping the bookmark on that failed meal shows "This meal did not finish analysis and cannot be saved." and sends no request, so the meal is never saved and never marked failed. On Home that message covers the failure text and the Try again button. The failed meal's page opens with "Nutrition could not be updated." and "The meal could not be updated." before any tap, and once showed a broken photo. Unsaving a saved failed meal was not reached, because a failed meal cannot be saved. A queued meal that finished within 2 minutes saved (200), unsaved (200) and stayed so after a reload. A queued meal that finished after 2 minutes reverted to empty at 120 s and no save request was sent; during that run the card's post id changed from 7a25457a to efde7a3d. On a "No food found" meal a second tap does nothing. The cover retry runs to a result: from Home the retry answered 204 at 1.2 s and the card showed Processing at 2.1 s, then returned to failed about 7 minutes later; from the meal page it answered 204 at 0.9 s and showed "Nutrition could not be updated." at 24 s. The cover photo has no retry of its own: a blocked photo shows broken with nothing offered. "Couldn't open this meal" never appeared. Other attempts to make a failed meal: a zero-byte file or a text file named .jpg shows "Upload failed. The server didn't respond." (misleading for a bad file) and posts nothing; a cut-off JPEG became a bread-only meal at 401 kcal; a 9000 × 9000 photo shrank to 962 KB and was analysed normally. Test data left on judge accounts: judge180119 has 0eee29a1, 467aeaa4, fe1abad8, bf3b89a2 and unpublished drafts b08f0e66 and 319e3909; judge291428 has 5ac2735a and efde7a3d. Related: #702. Done when, on production in a phone-sized browser, bookmarking a failed meal shows a plain message that it cannot be saved, without covering the failure text or the Try again button, and never marks the meal failed or saved (PM ruling, Nov 15: this matches #702's done line), a bookmark on a "No food found" meal or on a queued meal either saves or says why it cannot, and a failed meal's cover retry runs to a result, each reported by GrokBot with what it saw.

### #375 Storage egress is the largest source and was not cut

In the 24 hours before Run 8, Supabase Storage served 2.99 GB across 35,048 requests, almost all to browsers. The Run 8 cut measured the feed's posts reads, not Storage.

docs/egress.md says the bytes went to browser-like clients but not which files (feed photos, card images or originals) or which clients. In a later 24 hours, test automation accounted for 1.72 GB of the 1.77 GB of feed photo bytes and real mobile browsers for about 46 MB, so the split between test and real users is still a guess. Log volume was never measured in bytes. Done when Storage egress is broken down by file kind and by client (test automation or real users), log bytes are measured, and the largest real-user source is cut or shown to be small.

### #694 Many of the owner's meals show wrong nutrition numbers and nobody knows how many or why

The owner has logged food daily for days, his diet changed, and he reports that a lot of what the app shows is wrong. Nobody has measured how wrong or where the error comes from.

Known cases: the macaroni snack shows 38 kcal and 0 g fat from a cooked vegetable macaroni record (#523), squid matched to a tuna sushi record (#617), a consumed number from a half-eaten plate that nobody confirmed (#285), and 12 of the owner's 137 posts show a 0 g macro that nobody judged. A capable coder investigates read-only: pull the owner's ready posts, check each food's weight and kcal against its USDA record and the photo, and record for each wrong number which step caused it (the food identified, the record matched, the weight estimated or the stored value). Done when a written finding lists every one of the owner's posts whose numbers are wrong with its cause, ranks the causes by how many posts each one explains, and each cause is on the backlog as its own item.

### #285 The half-eaten plate may give the wrong consumed number

The app works out how much of a meal was eaten from a photo of the leftovers. The owner has already tested it on his phone, including today, and nobody has confirmed that the consumed number is right.

The owner's own leftovers posts are the data; he will not run more tests. A capable coder investigates read-only: pull the owner's leftovers posts from production, compare each consumed number with the before and after photos, and record where a wrong number goes wrong (the portion estimate, the not-eaten step or the stored value). Related: #570 and #578. Done when a written finding says, for each of the owner's leftovers posts, whether the consumed number is right and what caused any error, and any fix is on the backlog as its own item.

### #617 Squid and tuna are matched to the wrong food records

In the real food test, a photo of squid nigiri was matched to a USDA record described as "Sushi, topped with tuna". The test allows this kind of closest match, so a passing test does not show the match is right.

No fix has been tried. First step: look at which squid records were available, the matching trace, and the closest-food label. Done when a written finding says whether this match is acceptable and, if not, what should change.

### #523 A meal shows every nutrition value as unavailable

The meal "Spicy Indonesian macaroni" shows its calories, protein, carbs and fat as unavailable. The owner re-analysed it after the fix went live, and it is still broken. He says the app's food estimates are broken.

The first analysis searched the USDA database three times, rejected every record, and never tried the plain name "macaroni". Ruling: when the USDA has no record, the model must estimate, because an unavailable value is worse than a rough estimate. The closest-food fallback and the guard that stops re-analysing from reusing an empty result are both on main. 41 ready posts (95 item rows) had incomplete macros (docs/evidence/fix18/recompute-ids.json). The coder reports that at 09:11 WIB all 41 recompute jobs were done (the last at 08:59 WIB), that 40 posts now have complete nutrition including the macaroni post (86634d46), and that it closed the GitHub issue. One post, 6fad4a16, still lacks a value because its matched USDA record holds no number for that nutrient; whether to estimate it is undecided. The queue holds only three photo-cleanup jobs, which change no meal data. PM, Nov 14 (Chrome, owner account, read-only): the macaroni post 86634d46 shows 38 kcal, 1 g protein, 8 g carbs and 0 g fat, and its latest AI comment (Nov 4, 10:11 PM) names the closest USDA record, "Macaroni, vegetable, enriched, cooked". Two older comments on it still read unavailable. 0 g fat for a fried snack looks low. PM sweep, Nov 14 23:25 WIB, of all 137 posts the Home feed loaded on the owner account: two posts show "Nutrition unavailable" for one item while their totals show numbers (6fad4a16, the salami, which is the known exception, and f08e2e86, an unsalted butter packet, 541 kcal); 12 posts show a 0 g macro, and I did not judge which are real zeros (Hydro Coco Original at 0 g protein looks right); and post 6caf8906 (leftovers, 8:55 PM) reads "This photo could not be analysed. Try again". The macaroni fix reached the other posts. The coder decides f08e2e86 and 6caf8906. GrokBot, Nov 15, sweep of all 137 posts: the macaroni post now shows numbers and its AI comment names the closest USDA food. Still wrong: blank values on the butter post f08e2e86 and the Pocari post 89286fbf, a -1 g carbs value on post 38de279e, a leftovers post 189673aa that reads "unavailable kcal", sambal at 0 kcal in post 509ef9bc, bakpia e7e1782c at 0 g protein and fat, the pizza post 61b3a510 reading "unavailable kcal" for several minutes after two servings changes in a row (it recovered), and 28 meal pages that say "Nutrition unavailable", some of them when the calories and macros are known and only a minor nutrient such as sugar or fibre is missing (88d38425). Done when a browser helper confirms on the live app that the macaroni post shows numbers with a note naming the closest USDA food or saying the model estimated them, and that no ready post shows a value that is unavailable, zero or blank, except post 6fad4a16, which is listed with its reason.

### #703 Retrying a failed meal opening can leave an overlay covering the screen

If opening a meal fails and the user taps retry, and navigation then hangs or fails again, an overlay covers the screen and blocks every tap, with no timeout to clear it.

In src/components/PostOpenTransition.tsx, line 49. Retry sets the phase to opening but does not change the value the effect depends on, so the slow and fail timeouts are not scheduled again. Related: #635. Done when a second failure after a retry shows the failure message and removes the overlay, and a test covers it. Fleet 21 check, Nov 16: opening while offline did not produce the prescribed failure message, so retry was not verified.

### #708 Retaking a lost photo leaves the old failed upload on screen

Tapping retake opens the camera but does not remove the failed upload. After the new photo is taken the old failed entry is still there, and it comes back from the browser's stored drafts on every session.

In src/components/UploadChip.tsx, line 29: the retake handler only opens the camera. Related: #644. Done when taking the new photo removes the old failed upload, and a reload does not bring it back. Fleet 21 check, Nov 16: the fixture was not created within 60 seconds and a scoped retry reported "Control missing", so the retake, the intent count and the reload were not verified.

### #659 Review findings on the merged Fleet 18 PRs have not been checked on main

Codex and AGY reviewed the Fleet 18 PRs and raised problems in code that is now merged. The planner confirmed four of them on main 7d64f4c8; they are the four items below. The rest have not been checked.

Two blockers are planner-checked on main and not yet reproduced by a coder. On #647, useProfileIdentity in PostHandle.tsx binds the viewer's avatar and handle to every post header and not the author's, the avatar route reads with the viewer's token so another user's avatar fails, and the route sends a public one-year immutable cache header for an image only signed-in users should see. On #648, wording-inventory.mjs embeds the HEAD short hash so its check can never pass after a commit, and docs/wording/inventory.md was generated before 66 files changed. Eleven other findings were reproduced and are filed as the items below; two were dismissed with proof (the #633 recompute upsert and the #633 rice-with-protein composition). Still unchecked: the #641 portion_unit "serving" that the database does not accept; on #638, Feed discovery polling that stops when the tab is hidden; on #639, NeedsInputStrip never finding new questions after an empty first poll, and RealtimePost not refreshing on visibility; the #637 Thread retry polling; and the #643 header text cut off. Done when each unchecked finding is reproduced or dismissed with proof, the blockers on #647 and #648 are each checked on main, and each one reproduced is filed as its own item.

### #937 Opening an uploading meal's address returns repeated not-found errors

While a meal is still uploading, requests for its own address are answered not found, over and over.

Fleet 21 check K15 saw sixteen not-found answers from detail prefetches while two meals uploaded; both meals still reached ready. What a person sees and the cause are not known. Done when the cause is found and an uploading meal's address produces no not-found request, or the errors are shown to be harmless and why.

### #990 Revisit the stored numbers: the meals that pass every rule, the other accounts, and saved meals

Meals that pass every rule can still be wrong, and other accounts and saved meals hold numbers too.

This is the last step of the revisit, after #989. Done when a sample of passing meals is checked against an independent estimate, and the other accounts and saved meals are re-analysed or listed with their reason.

### #1018 A test of the composer drinks route fails when it runs across an hour boundary

A test in the full suite can fail at the turn of the hour, so a clean run is not always clean.

The test checks that the hourly drink-identify usage counter reads 1, and it read 0 on main in the Fleet 27 baseline, which started just before 13:00 UTC. The cause is unproven. Done when the test no longer depends on the clock hour, and it passes when run across an hour boundary.

### #1022 A 30-character meal header is cut off at phone width

A long name in a meal's header does not fit on a phone, so the person cannot read all of it.

The Fleet 27 check reproduced it at 390 wide with a 30-character name: the header scrolled 318 px inside a 219 px space and ended in an ellipsis. It was observed, and nobody has decided that the name should wrap. Done when a 30-character header either wraps or shows its whole name at 390 wide, and the owner agrees with the choice.

## Backlog for Designer

### #453 The barcode prompt is printed over the live camera picture

On the Barcode screen, the line "Point at the barcode. It reads on its own." runs across the camera picture and cannot be read against a busy shelf.

No design exists yet for where this line sits, so the designer chooses its place. Done when the prompt is readable over any camera picture, in a phone-sized browser.

### #455 The card you swipe to on a drink's photo shows a number and not what the drink is

Swiping right on a drink's photo opens a card with one big millilitre number, so the card does not say what the drink is or why it exists.

The swiped card for the tiki cocktail shows "220 ml" in large type, a line of text and "1,200 ml consumed today" split into drinks and food. A card for a drink should lead with its kind as a picture: a coffee cup for coffee with its caffeine, a water cup for water with one cup for every 250 ml drunk, and a cocktail glass or a wine glass for those with their alcohol, and the day's drinks drawn as the same cups. This is built on main. GitHub shows this issue closed, and it stays here until its done condition is met. Owner, Nov 15, 10:52 PM WIB: the card slide of "Fancy Highball at the JW" (a whisky highball with chips and crackers) leads with a large "503 kcal" and shows no cocktail glass or any other picture of the drink. The done line below covers cards that hold only liquid; whether a meal that mixes food and a drink gets the picture is not decided. Done when a coffee, a 500 ml water (two cups), a cocktail and a glass of wine each show their own picture on the swiped card, and a card that holds only liquid reads as a drink at a glance, in a phone-sized browser.

### #457 An alcoholic drink shows its alcohol but not how much was drunk

A drink post shows its alcohol but not how many drinks or how many millilitres were drunk, so the user cannot tell how much they have drunk.

The tiki cocktail post shows "220 g" on the photo and 196 kcal, 0 g protein, 17 g carbs and 0 g fat, with no alcohol anywhere. For a drink with alcohol, the post should show how much was drunk (a count and millilitres), the grams of alcohol and the standard drinks. The drink's liquid does not add to the water total, and Today shows the day's alcohol so far. Ruling: the US 14 g standard drink stays, so a 500 ml pint at 5% (20 g of alcohol) reads 1.4. Built on main; GitHub shows this issue closed. Owner, Nov 15, 10:52 PM WIB (iPhone, owner account): his post "Fancy Highball at the JW" (Sat Nov 14, 9:36 PM; potato chips 40 g, cheese crackers 30 g, whisky highball 240 g, lemon twist 5 g; 503 kcal, 6 g protein, 40 g carbs, 20 g fat) shows no alcohol anywhere on its photo slide, its card slide or its caption line, no grams of alcohol and no standard drinks. The card says only "Drank in this meal: 240 ml Whisky highball". The caption's "more" and Details were not opened. Done when a photographed cocktail and a typed beer each show how much was drunk (a count and millilitres) and their alcohol, on the post and in Today, and neither adds to the water tile, in a phone-sized browser.

### #631 Every place that waits on the network shows nothing while it waits

A screen or action that waits on the network can sit empty or frozen for seconds, and the customer cannot tell whether the app is working. The owner wants a visible waiting state anywhere a network problem is possible, so the customer's expectation is managed and nobody is annoyed.

The owner's desktop Home took about 20 seconds to fill the Today column and the Posted today list (see #599). The designer's audit found every control drawn at rest only: no waiting, slow or failed state exists in the design for whole regions or for actions. Observe first: list every region and action that waits on the network (the Home right column, the feed, Days, Search, Profile, the meal detail, saving a post, barcode and label lookups, the drink sheet) and record what each shows while it waits, after a failure and after a timeout. Done when each of them shows a loading placeholder or spinner at once, shows a plain message with a retry after a failure or a timeout, never shows an empty or half-drawn region as if it were final, and is checked on production with the network throttled at 390x844 and at 1280x800.

### #555 The controls on Days, Search, Profile and the capture modes have not been audited

The Round 7 control table covers the feed, the post and the capture sheet. Days, Search, Profile and the Text, Photo and Barcode modes are not in it.

The designer has not read their controls yet. Add them to the table from #217 with its four findings: time to a visible change, pressed look, jump or flicker, and double tap. Done when every control on those screens is in the table and the dead ones are fixed or filed as items.

## In flight

### #323 Every protected page checks sign-in twice (part of #222)

The app checks that the user is signed in when a protected page is requested, and checks again when the home page loads. That is two round trips to the sign-in service on every page open, on top of the slow start of the server function.

The server checks sign-in once per page, and a forged request header is still refused. The browser makes zero sign-in calls on Home, Days and Profile, but server recordings still show 7, 9 and 14 checks per page open. The likeliest cause is that the guard checks every background prefetch and refresh request, not only the page, and each card carries several links. This is probably the server half of #222. GrokBot, Nov 5: the browser made 0 auth/v1 calls on a cold Home open. The server-side checks need the coder's log. Done when one page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page. Fleet 21, Nov 16 (local, ten-second windows): /user calls were 115 on Home, 10 on Days and 18 on Profile, against a target of one; no call was attributed to its source.

### #628 The Fleet 17 check script passes when its checks fail and leaves a test row behind

The test script scripts/run17-checks.mjs can finish successfully even when a check fails, and it leaves test data on production.

The script scripts/run17-checks.mjs now exits with an error when a check fails, and the leftover push row on test account 2 is removed. Still broken: the dismiss step must target only this post's own question; the fake push subscription must be removed at the end of every full beer run; the tap step fails on a "-0" coordinate (BiDi error: Expected "x" to be a finite number, got the string "-0"); the answer step must wait for the strip row. The post-close run fails with Page.navigate and Page.enable timeouts on headless Chromium on the host, and the beer run fails with the strip row missing or never settling; the post-close failure looks like a host problem, not a product regression, but that is not proven. BiDi sessions on that host hit a session cap. Done when the script exits with an error when any check fails, the dismiss step targets only this post's own question, the fake push subscription is removed at the end of every run, the tap step handles "-0", the answer step waits for the strip row, and the post-close and beer commands each exit 0 on a stable browser setup with their receipts on main. Fleet 21, Nov 16: the script repairs are built (PR 918) and both commands still fail; the errors and receipts are preserved.

### #615 A posted beer disappears and a clarification card takes its place

The owner posted a beer and the post vanished from the feed. A card asking a question appeared in its place. A post must stay on screen from the tap, with the calories of the drink as stated, and the question must reach the owner as a notification.

When the caption and the photo disagree, the model asks a question. The app used to mark the post "needs input", and every feed read hid posts in that state. Ruling: the post shows as posted with the drink as stated, and the question sits in the Home strip and arrives as a notification. The strip's X dismisses the question and never deletes the post. "No food found" still holds the post. The post now stays in the feed with its question beside it (column posts.question). Not yet observed: the notification (a headless browser cannot see it), and the X. A salad photo captioned "A pint of Bintang beer" stayed in the feed as a drink (18 g alcohol, 1.3 standard drinks, 203 kcal) and raised no question, so no strip row appeared. GrokBot, Nov 5: judge 2 posted a rice photo captioned "A pint of Bintang beer". The post stayed in the feed as a drink (18 g alcohol, 1.3 standard drinks, 203 kcal) and Days for Nov 5 counted 203 kcal and 1 post. No clarification strip appeared, so the strip, the X and the notification could not be tested, and a headless browser cannot see the notification. The model accepts the caption as it did in Fleet 18, so the mismatch has to be forced on the disposable stack. Done when, on the live app with test account 2, a beer caption over a mismatching photo keeps the post in the feed with its calories, the strip row shows, the server log shows it sent "Your meal needs a reply", the X dismisses the row on the same screen without a reload, and the post stays. Also check that the beer counts in the day's kcal on Days. Fleet 21, Nov 16: the beer command exited 1 ("The beer post never settled with a question") and no batch completed; Home's question strip did not appear for the fixture meal despite its database state.

### #684 A failed leftovers upload cannot be dismissed and stays on screen every time the app is reopened

On the owner's phone, adding a leftovers photo to a meal failed with "Upload failed. The photo could not be attached." The failure leaves a "Leftovers: Not posted yet" card in the feed and a red chip at the bottom reading "Leftovers, Not saved · Try again". The user cannot dismiss either one, and both come back after closing and reopening the app, so the screen stays broken.

The owner's screenshots (Fri Nov 6, 2:40 PM and 2:43 PM WIB, iPhone on 5G) show the failed card in the Today feed under his 2:35 PM post. It says "Not posted yet. The photo is kept on this phone." and offers only Try again. The chip sits over the post and the floating tab bar and covers the nutrition numbers. The owner reports that closing and reopening the app does not clear it. A third screenshot, Tue Nov 10 at 12:18 PM WIB, shows the same red chip still over the Today feed four days after the first failure, so the stuck state does not expire. Owner, Nov 15, 10:50 PM WIB (iPhone, 5G): a screenshot of the Fri Nov 6 2:35 PM post shows the same "Leftovers, Not saved · Try again" chip nine days later, sitting over the post's nutrition numbers and above the tab bar. He reports that pressing Try again only brings back an error and the leftovers never save. The error text was not captured. This looks like the same family as #644 (a failed attachment upload that nothing removes), but that is not confirmed. Not known: what failed the first time, whether Try again works, and where the phone keeps the failed upload. Related items: #570, #578, #644 and #625. GrokBot's leftovers attach on a judge account on Nov 5 closed in 5,049 ms and did not fail, so this is not reproduced. Observe first: read the owner's failed attachment job and its error from the jobs table and the model-call log (read-only), then fail a leftovers upload on a judge account on purpose and look for what the phone stores. Done when the error behind this failure is written down, a leftovers photo saves on the first try or on Try again in a phone-sized browser, a failed upload can be dismissed or removed by the user and stays gone after the app is reopened, and the chip does not cover the post's nutrition numbers. Fleet 21 independent source read, Nov 16 (investigators' report): PR 912 puts Remove in a fixed-height row (h-14) inside an overflow-hidden container (UploadChip.tsx line 30), so the source supports the clipping. Nobody repeated the browser measurement. Fleet 21, Nov 16 (coder, local, PR 912): the phone's new Remove button works and stays gone after a reload. On desktop the sidebar chip ends at y=364 and Remove begins at y=374.13, so Remove is clipped; it was left unfixed under the plan's rule. The original failure cause is not found and the chip over the nutrition numbers is not addressed. Merged in #912 on Nov 16 (coder report). Fleet 21 independent source read of the fixed head 50ea5f70, Nov 16: the clipping is fixed (UploadChip.tsx line 30 now uses a minimum height); the retained Firefox receipt shows the chip ending at 422.25 px with Remove at 411.70 px at 1280 wide, and 748 px with 737.45 px at 390 wide; no fresh browser run. Owner, Tue Nov 17, 1:24 PM WIB (iPhone, 5G): a Home screenshot shows the same "Leftovers, Not saved · Try again" chip, now with Remove beside it, floating over his 1:15 PM post ("Pork crackling and pasta and more pork. Oink.", 730 kcal) and covering that post's caption and nutrition line above the tab bar. He could not add the leftovers photo to this new meal either, so the failure repeats on a new meal and is not specific to the Nov 6 post. The error text was not captured.

### #989 Revisit the stored numbers: re-analyse the meals that fail a rule

The owner considers the app's stored calorie and nutrition numbers wrong. The first step is to find the meals that fail a rule and re-analyse them.

Fleet 25 measures how many meals fail (#694) and re-analyses four. This item is the next fleet: re-analyse every meal that fails a rule, with a rate limit and a bounded cost, checking each against its matched record. Done when every meal that fails a rule has been re-analysed and passes it, or is listed with its reason.

## Interdit (Not part of Hackathon)

### #114 Facebook Login in production mode

Public sign-in with Facebook needs the app submitted for Meta app review, which takes longer than the event.

Blocked by Meta app review. Development mode works for the developer's own and test accounts, which is enough for the demo. While a Facebook app is in Development mode only people with a role on the app can sign in, and everyone else sees an "App Not Setup" error (Supabase docs). Instagram has no sign-in for consumer apps: Meta shut the Instagram Basic Display API on Dec 4, 2024 and tells developers to use Facebook Login. No Instagram button is added. The button stays grayed out and inert until review passes (#316). Done when Meta app review passes and the button is enabled.

### #115 Dark mode

The app has no dark mode.

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components. Done when the ten screens are built and a dark set of the colour tokens is designed.

### #218 Hydration as a share of daily intake

The owner wants the app eventually to show how much of the user's daily intake is hydration.

Blocked until after the hackathon, and blocked by the claims rule: the app shows no percentage that reads as progress, and a share of intake is a percentage. The owner decides whether this one figure may break that rule. Done when the owner has lifted the rule for this figure and its design is drawn.

### #940 Flickr-style web addresses throughout the app

The app's addresses do not tell a person what they are looking at, so people cannot guess, edit or share them the way they can on Flickr. The owner wants addresses where the path names the thing (a person, a meal, a day), so finding and sharing data works by reading and editing the address.

Blocked until the owner has finished researching what the real planner must be told: which pages get such an address, what each address shows a signed-out visitor, and how it fits the public photo addresses (/p/…, #915). Today's pages use /posts/<id>, /days/<date> and /profile. Done when the owner has written the address pattern and a planner brief lists every page and what its address returns.

### #941 An agent holding an API key cannot read its owner's data through a plain web address

A person can create an API key, but there is no way for a client such as ChatGPT to use it. The owner wants a person to hand the key to ChatGPT and have it fetch that person's data from an address such as /agent/<the key>/<what it wants>, and wants instructions for MCP clients behind a plain link on the website.

Blocked until the owner has finished researching what the real planner must be told. The documentation half overlaps #924 (no guide for reaching the MCP server). The research must settle: whether a key in the address is acceptable (addresses end up in logs, browser history and referrer headers), what each key may read and whether it is read-only, how a key is revoked, and whether ChatGPT can send the fixed Authorization: Bearer header the server accepts today (not checked). Done when the owner has decided the access design, a planner brief says what to build, and the website carries a link to the instructions.

---

† What this backlog is. The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This Doc is private between the PM and the owner, and the coder cannot open it. The coder reads BACKLOG.md, which the owner copies from this Doc. Every item has its own GitHub issue. An item leaves this list when its work is merged. Production proof of a merged fix is a new item in Backlog for GrokBot; the "Interdit (Not part of Hackathon)" section holds items that cannot be worked on and says why. Each section is for one role or one state: Backlog for GrokBot and Engineering backlog (open work), ordered within a section by the pass that will work them together, not by issue number or date. In flight holds the items a dispatch has sent to the coder that have not merged: an item moves there when it is dispatched and leaves the list when its work is merged.

Every item is a title line and two paragraphs. The title line carries the item's own GitHub issue number. (1) The title says in plain words what is wrong, as a GitHub issue title does. (2) The first paragraph is the problem statement, which any person can read. (3) The second paragraph holds the context we have learned that helps solve it. It can be technical. It never holds a dump of logs, review history or merged-change detail. It ends with "Done when" and a condition a person can check. Write short sentences in the active voice, as the Google developer documentation style guide asks, and spell out any term a reader outside the project would not know. An item missing a part is not on the backlog.
