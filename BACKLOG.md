# My Food AI — Backlog†

Last edited: Monday 2026-11-02 at 17:04 WIB (UTC+07:00) by Claude, PM

## Backlog

## For the owner

### #288 The open-weights trial (#281) has a Modal token

The open-weights trial cannot start because the coder has no credential for the host that serves the model.

Modal approved $100 of hackathon credit for the owner and hosts a Muse Spark Open endpoint billed per token. MODAL\_TOKEN\_ID and MODAL\_TOKEN\_SECRET exist neither in the coder's environment nor in production. Baseten and Fireworks list $100 each for selected participants, and the owner's selection is unconfirmed. The credential reaches the coder privately and never appears in the repository, an issue or this backlog. Done when the coder confirms the trial can authenticate to the host.

### #285 The owner's own checks before the recording

Several things only the owner can do stand between the app and the recording on Nov 4.

They are the phone checklist (#280, including a real half-eaten plate); choosing the account to record on (the second test account has 5 posts and no unavailable foods, the owner's has 20 with 5 unavailable); accepting or rejecting the breakfast and curry totals (#189); deciding what the video shows from round 3 and Run 5, such as a drink, saved meals, a not-eaten plate or a scan; and reading the README before recording. Done when each is done or ruled out.

### #286 Rulings waiting on the owner

Four rulings are open and each blocks work.

Whether the open-weights trial (#281) is built before the Nov 3 23:59 WIB freeze or left; what a judge who taps the Facebook button sees (#114); whether PR #270, which holds documents only, is merged; and whether the not-eaten plate is in the video. Done when each ruling is recorded here.

## For the designer

### #289 Frames for logging a drink by photo, by tap or by caption

The card for a drink does not show a can of cola's caffeine, and logging a drink does not feel smooth.

The owner photographed a can of Coca-Cola on Nov 2. It counted as caffeine, but its card shows none. He does not want people pushed down one flow: a photo of a coffee, a photo of a glass of water, a tap on the drink sheet and a caption must each work. A photo of water is estimated and added to hydration, and a photo of a caffeine-forward drink is estimated, added and shows its caffeine on the card. He names High Coffee as a reference for logging caffeine smoothly and WaterMinder for logging liquids. Records only, past tense, no targets, no ring or percentage. Done when frames at 390x844 are delivered for the drink card with its caffeine, a photo of water, a photo of a can, a quick tap and the drink sheet.

### #290 Frames for the capture sheet's modes with Barcode as an obvious choice

People cannot tell that the app scans barcodes, because the Barcode choice is easy to miss.

The owner ruled on Oct 29 to keep a Barcode toggle. On Nov 2 he asked for the modes to be reached by swiping, with Barcode an obvious option, so that the feature is advertised without forcing anyone down it; a photo is still a photo (#212). Done when frames at 390x844 are delivered for the capture sheet showing the swipe between modes, Barcode selected, and a first-time hint.

### #291 Frames for removing and redoing

A user cannot take back something added to a post, and nothing shows how to remove a post.

The owner asked on Nov 2 about deleting an item and its result so people can redo it, both small (a leftovers photo or a correction added by mistake) and large (a whole post). #174 adds Delete to the post menu. Done when frames at 390x844 are delivered for deleting a post with its confirmation, removing a leftovers photo or a correction from a post, and the post after either.

## Straight to engineering

## Build the designer's frames

### #212 The regular camera reads a barcode and a nutrition label

A user has to switch to a separate scanner to log a packaged food, and the scanner has not been tried on a phone.

The scanner was merged in PR #165 on the Search tab and is untested on a phone. The owner ruled on Oct 29 that a photo is a photo, whether it shows food, a barcode or a package's nutrition label, so the capture sheet identifies which whether or not the Barcode toggle of frame 2i is used; the owner ruled to keep the toggle so users can see that a scanner exists. On Nov 2 the owner added that Barcode must stay an obvious choice on the capture sheet, reached by swiping between modes, so that people learn scanning exists and are not pushed down that route; a photo is still a photo, and a barcode photographed in Photo mode is still read. The owner prefers a deterministic read: decode the barcode from the image first and look the digits up, and use the model only when no code is found and for the label. A barcode becomes a post whose card identifies the product with its nutrition and the pack photo; a label is read into the same kind of card. The look comes from frame 2i and the designer's frames for the label and the correction. First try the existing scanner on a phone with a real pack and report what it reads. Done when a real pack's barcode, photographed through the capture sheet on a phone, posts a card with the product's name and nutrition, and a nutrition label does the same.

## Analysis pipeline and worker

### #189 A meal's estimate matches what was eaten

The owner logged Japanese toast, a small slice of ham, a small salad, one scrambled egg and a coffee, and the app showed 725 kcal. It put the toast at 348 kcal, the ham at 50 g even after a correction, and the coffee at 180 g.

The owner's breakfast showed 725 kcal on Oct 29 because the salad, coffee and egg matched dressing, soymilk and ketchup. Matching has been fixed since (#197, #236, #246 to #255). On Nov 1 the same breakfast and curry on production match every food, but the totals differ between runs. The coder explained both: the breakfast came to 290.8 kcal and then 272.8 kcal because the 50 g scrambled egg picked a different reference (92.5 kcal, then 74.5 kcal); the curry came to 971.2 kcal and then 1,229.5 kcal because the cutlet, sauce and rice portions rose and the cutlet's reference changed. A fresh estimate does not repeat exactly, while Saved meals and Log again copy stored quantities and nutrition. The issue was closed by a keyword without the owner's acceptance and was reopened on Oct 31. Done when the owner accepts the totals and the weights of the meal logged again for a slice of toast, a small slice of ham and a coffee.

### #226 Japanese dishes match the right foods in the food database

Common Japanese dishes are matched to the wrong foods, so their calories and macros are wrong.

The coder's check of Oct 29 found the tonkatsu matched to a sauce, the Japanese curry sauce to dried persimmons and cooked white rice to glutinous rice. The fixes (#236, #250 to #255) retrieve more candidates, include Survey and FNDDS foods, refine repeated searches and stop rejecting compatible generic references, with no food-name special cases. On Nov 1 the same meal on production matches a cutlet (FDC 2705869), a curry sauce (FDC 2710178) and plain cooked rice (FDC 2708403). A food with no good match still shows its nutrition as unavailable. Done when the owner accepts the totals.

### #227 A photo that does not upload never becomes a post without one

A post made with a photo can reach the server with no photo and be analysed as text only, and nobody is told.

The owner photographed his meal and posted it on Oct 29 at 17:20 JST from his phone, on a slow roaming connection in Japan. The coder's check on production at 18:30 JST found no photo row and no photo in storage for that post, an analysis request with text and no image, no segmentation call and no storage request for a photo upload; the post's only image is the generated results card. The cause is not known: the camera image may never have been attached, or the upload may have failed on the slow connection while the post went ahead. On Nov 1 a two-photo post failed with a 409 on its upload reservation. Nearby production logs show a reservation statement timeout that the route hides behind a generic 409, but the request carried no correlation evidence, so the cause is not proven. The failed submission created no post and kept both photos at first; a later navigation discarded the draft, which is held only in memory, and nobody has shown that retrying the original operation is safe. Observe first: post from the capture sheet with a photo on a throttled connection and with the connection cut during the upload, and report what the app sends. Done when a post made with a photo either has its photo stored or shows the user that the upload failed and keeps the photo for a retry, and never becomes a caption-only post silently.

### #228 A meal summary's numbers are the calculated totals

Written text on a card could state calorie or macro numbers that differ from the calculated totals.

A ChatGPT code review of Oct 29 claimed the model-written summary is checked for wording but not compared with the calculated totals, and that a formatter working from the totals already exists; nobody has verified this. First read the summary code and try to produce a summary whose number differs from the totals, then report. If it can differ, publish only nutrition text formatted from the totals, leave the caption's own numbers (such as "two eggs") alone, and make every screen that shows these numbers agree after rounding. Done when a model summary saying 900 kcal against calculated totals of 600 kcal publishes 600 everywhere, or the report shows it cannot happen.

### #230 A coffee with no nutrition does not blank a breakfast, and toast does not match persimmons

The breakfast logged again on Oct 30 still matched wrong foods and showed no total.

The Oct 30 re-log matched the toast to dried Japanese persimmons, the salad to a fast-food side salad and the black coffee to an entry with no nutrition, so the total was unknown. The cause is shared with the Japanese-dish and totals items. On Nov 1 the breakfast on production matches a plain food for all five items, with no food unavailable, and totals 290.8 kcal in one run and 272.8 kcal in another. Done when the owner accepts the breakfast total.

### #272 The food matcher gives the same answer for the same words

The same words for a food can match different references from one call to the next, and one miss turns a whole meal's total into unavailable.

The coder's probes of Nov 2 (report of 14:05 WIB) kept the matcher's reason for every match and found that identical lowercase input selected different references across calls, so the variation is in the choice and not only in capital letters. The dipping sauce matched "Dip, NFS" at 432 kcal per 100 g, about 130 kcal for 30 g. Earlier the planner reported that a cheeseburger with lettuce, tomato, onion and pickle matched in one answer and not in another, so a total of 1,296 kcal became unavailable with a known subtotal of 467 kcal. No fix has been made. Done when the same words give the same match on repeated calls, or the owner decides to keep the variation and keep these foods out of the demo.

### #273 Meals logged on production show zero calories

The owner's latest meals on production show 0 kcal instead of the nutrition of the foods in them.

The owner reported this on Nov 1 at 17:45 WIB, after the speed fix (#256) and the matching fixes. After #269 and #266 were deployed the coder rechecked his meals on production: they hold item rows, and the bare zeros did not reproduce, so the original cause is unproven. The coder fixed three zero-display defects: a positive value under 1 kcal rounded to zero (it now reads "<1 kcal"), an empty total became zero, and a Days total started from zero when a food's nutrition was unknown. Both shrimp rice noodle rolls and a pastry still show nutrition as unavailable, and no nutrition was invented. Done when the owner's meals on production show their calories or name the foods that could not be totalled, and no meal shows a bare zero for foods that have nutrition.

### #139 A held worker lease renews for its full time

A worker that renews its lease does not actually extend it, so a long job can lose the lease while it is still running.

The coder found this in the lease SQL; a 300-second time-to-live against about 60 seconds of work hides it today. Fix the renewal and add a test. Done when a lease held past its first term is still held and a test proves it.

### #65 The pipeline's tests run against an offline fake Meta Model API

Nothing exercises the analysis pipeline without a live key and live credit.

Meta's workshop repository ships a scripted offline model for its tests: a real OpenAI client whose requests never leave the machine and are answered from recorded outputs, including recorded SAM outputs, and which can be told to refuse a request with a 400. Add a fake of the Meta Model API behind the same client, selected by a base-URL variable (MODEL\_API\_BASE\_URL, which the workshop's client also reads), that answers the SAM, Spark identify, Spark correct and transcribe calls from recorded fixtures and can be told to return a 400, a 429 or a 503. Done when the path from a posted meal to ready, a correction, a 400 failing a job at once and a 429 retrying all run in the test suite with no network and no key.

### #66 The Meta Model API client sets its retries and timeout explicitly

A brief rate limit from the Meta Model API should not cost a job attempt, and today that depends on defaults nobody set.

Meta's workshop client sets four retries and a 180-second timeout on the OpenAI SDK client, and the SDK waits as long as the API asks on a 429 or a 503. Set the retry count and the timeout on our client explicitly, in one file, within the serverless function's time limit, so the worker's own retry delay only handles failures that outlast the SDK's. Done when the settings sit in one file and a test through the fake API shows a 429 that carries a wait is retried inside one job attempt.

## Logging and editing meals

### #174 Delete a post

A post cannot be deleted.

Cal AI's post menu has Delete Food. Add "Delete" to the post menu with a confirmation that removes the post and its media. Done when a deleted post is gone from the feed, Days, Search and storage.

### #223 A post's caption can be edited

A user cannot change the caption of a post, so a stray character stays on the card for good.

The owner reported this on Oct 29 at 17:29 JST: his caption ends in a stray "R" that he does not want. The post menu has no edit for the caption, and the comment-or-correct thread of #14 changes the items, not the caption. Add "Edit caption" to the post menu; editing the caption does not re-run the estimate or change the items. Done when a caption edited from the post menu shows its new text on the feed card, post detail, Days and Search after a reload.

### #274 Uploading a photo shows its progress

When a user posts a photo, nothing on the screen shows that the upload is under way, so people cannot tell whether anything is happening.

The owner asked for this on Nov 1: a progress bar during the upload so people know the app is working. The bar shows the upload only, never nutrition, goals or any score, because the claims rule bans bars that read as progress toward a goal. The designer delivered frames 4l to 4o at 390x844 on Nov 2: the composer while a photo uploads, the feed card while it uploads, a failed upload with Try again, and a floating chip above the bottom bar when the user is on another screen. The bar shows only how far the upload has got, with no percentage or time estimate. It sits next to #227, which keeps a failed upload from becoming a post without a photo. Done when a post with a photo on a slow connection shows a progress bar from the start of the upload until it finishes, and the bar is gone once the post appears.

### #275 A post uploads in the background while the user keeps using the app

The app feels slow and clunky, and a user who posts a meal should be able to carry on using the app while the photo uploads and the analysis runs.

The owner asked for this on Nov 2. What happens today when a person taps Post is not known: whether the capture sheet waits for the upload, whether the feed card appears at once, and whether an upload survives leaving the screen or a reload (a draft is held only in memory today, see #227). Observe first on a throttled phone-sized screen and report each. This sits with #217, #222 and the upload progress item; the progress bar, the failed-upload look and the chip shown on another screen are drawn in the designer's frames 4l to 4o. Done when a user who taps Post can leave the capture sheet at once and keep using the app while the upload and analysis finish, a failed upload is shown and can be retried, and the coder has reported what each case above did before the change.

### #292 A photo of a drink adds its volume to hydration and shows its caffeine

A photographed can of cola counts as caffeine but its card shows none, and logging a drink is not as smooth as it should be.

The owner reported this on Nov 2. Whether the photo path and the drink sheet store the same record is not known, so observe first. A photo of water must be estimated and added to hydration, and a photo of a caffeine-forward drink must be estimated, added and show its caffeine, however it was logged. It waits for the designer's drink frames. Done when a photo of a glass of water adds to hydration, a photo of a can of cola adds its volume and shows its caffeine on the card, and the same drink logged from the sheet reads the same.

### #293 A user can remove a photo or correction they added and redo it

A user who adds a leftovers photo or a correction by mistake cannot take it back.

The owner asked on Nov 2 about redoing both small additions and whole posts. #174 covers deleting a post. Observe what removal exists today for an added photo or a correction. A correction replaces items and keeps the old ones as history, so removal has to return the post's numbers to what they were and still show in the thread. It waits for the designer's frames. Done when a user can remove a leftovers photo or a correction from a post, the post's numbers return to what they were before it, and the removal shows in the thread.

### #294 The app's words read naturally everywhere

The leftovers label reads awkwardly, and nobody has reviewed the words in the rest of the app.

The owner said on Nov 2 that "leftovers (not eaten)" is janky (see #277). The planner reviews the app's terms with AGY as a second opinion and lists each term, where it appears and a recommended replacement. The terms include the leftovers label, "Consumed", "Log again", "Saved meals", "Additional food", the needs-input question and the Days names. Every rule stays: consumed past tense, no target, goal, ring or percentage, and no "left" as a word for a remaining amount. Done when the list is reviewed, the owner has ruled on each term, and the wording is changed everywhere it appears.

## Meal screens and feed

### #192 The photo does not reload while a post is being processed

While a post is being processed, its photo flickers, flashes and reloads over and over. It looks broken.

The owner reported this on Oct 29 while using the app. A planner report of Oct 27, written on the #38 head, said each card subscribes to its row and polls every 3 seconds while the post is unsettled; whether that, the realtime event or the refresh after posting re-creates the photo is not known, so verify it first and confirm the cause by observation. Fix it so the image loads once and the rest of the card updates around it. Done when a post made on production shows its photo with no flicker or reload from posting until it is ready.

### #107 Every card has a visible way to open post detail

A new user has to guess that tapping a card's text opens the meal's detail view. Nothing on the card says so.

The detail view is where the SAM outlines, the full nutrition table and item editing live, so a user who never finds it never sees where the numbers came from. Add a "Details ›" control on every card, and make the photo and the analysis block tappable too. Done when a new user opens detail without being told how.

### #175 Days shows days that hold only water or caffeine

A day on which only water or caffeine was logged shows nothing on Days.

Water and caffeine are intake entries and are allowed; weight and exercise are not. Done when such a day appears on Days with a marker.

### #224 Times on a card are in the user's own time zone

A post shows its time twice in two different zones, one labelled UTC and one in local time.

The owner's screenshot of Oct 29 at 17:29 JST shows the card header "CONSUMED · 8:20 AM UTC" above a caption stamped 5:20 PM for the same post; he is in Japan. Show every time in the device's time zone: card header, post detail, the thread and the Days stories. Done when a post made at 5:20 PM in Japan reads 5:20 PM everywhere a time shows, and no screen labels a time UTC.

### #215 Thumbs up and down respond at the tap

The thumbs-up and thumbs-down buttons look dead when tapped, the change shows up some time later, and they feel clunky.

The owner reported this on Oct 29 while using the app. The cause is not known; a likely one is that the button waits for the server before it shows anything, but verify that by observation. Fix it so the button shows its pressed state at the tap, settles when the verdict is saved, and shows an error and reverts if the save fails. Done when a tap on either thumb changes the button visibly before the server answers on production, the saved verdict survives a reload, and a failed save is shown.

### #29 Rendered results-card image added to each post's carousel

Not every post has a photo, and a photo post loses its numbers once the analysis is one line of small type.

When the worker sets a post to ready, generate a results card image from the stored items and totals: a clean square card with the item names, portions and totals in the app's type and colours. For a photo post the card is appended as the next slide of the carousel, after the photo or photos. For a caption-only post the card is the post's image, so every post has something to show in the feed and the profile grid. Render the card from data with code (server-side HTML or SVG to PNG), not with an image-generation model: this build is limited to the Meta Model API models SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, and a rendered card cannot misspell a number. Store it as a post\_media row with a kind column (photo or card, added in a new migration), regenerate it when a correction supersedes the items, and keep every rule from the analysis block: consumed wording only, no goal, no rings or percentages. Done when a logged photo shows the photo and then the card as swipeable slides, a caption-only post shows the card as its image, and a correction changes the numbers on the card.

### #283 A saved card image shows its whole footer

A results card saved as a PNG cuts off its footer.

The coder found this on Nov 2 while checking saved cards after PR #271 (his report of 14:44 WIB). Which footers clip, on which cards, and whether the card image shown in the feed clips too are not known. Observe first, then fix. Done when a saved card's PNG shows its footer in full for a meal with one photo and for a meal with leftovers photos.

### #18 Days stories row and month grid of past posts

A user cannot look back over what they ate on earlier days.

The row at the top of Home is seven day bubbles, today on the right, each showing the day's first photo or a blank ring if nothing was eaten. Tapping a day plays that day's posts full screen in sequence with tap-to-advance and swipe-left/right between days, and the last card shows "Consumed on Tuesday: 1,840 kcal" with the macro line. A sum of what was eaten is a record, not a goal; no comparison to any other day, no average, no target. The Days tab in the bottom bar opens a month grid that scrolls back. Done when a week with three logged days plays as three stories and the bubbles match.

### #20 Profile grid of the user's post thumbnails with sign out

Profile gives a user no overview of their own posts.

Show a grid of post thumbnails, newest first, three across; tapping one opens the detail. Above it the handle and a Sign out button. Nothing else: no weight, no streak, no badge, no count of anything beyond posts. Done when the grid loads the user's posts and nothing on the screen suggests progress toward anything.

### #216 Sign out finishes

Tapping Sign out on Profile shows "Signing out…" and never completes, so the user stays signed in.

The owner reported this on Oct 29 at 15:09 on production, in desktop Chrome, on an account he had just created; signing out of his earlier account had worked a few minutes before. The cause is not known, so first observe whether the sign-out request is sent, whether it fails, and whether the page is waiting on something else, before changing anything. Done when Sign out on Profile signs the user out and returns to the sign-in page on production, on a newly created account and on an older one, and a failure shows a message instead of waiting forever.

### #221 The installed app keeps its sign-in on every phone

The owner installed the app on two phones, and when he opened it on another phone he was not signed in.

The owner reported this on Oct 29. The cause is not known: a phone that never signed in must sign in once, but an installed home-screen app may also lose a session that the browser kept. First observe by installing on a second device, signing in, closing the app and reopening it, and report what happens. Done when a user who signs in on a phone is still signed in after closing and reopening the installed app, and the same account signs in on a second phone.

### #222 Photos and cards load fast

Photos and cards take a long time to appear, so the app feels slow.

The owner reported this on Oct 29 while using the app. The cause is not known, so measure first: the size and format of what a card downloads, whether the feed uses thumbnails, whether images are cached between visits, and the time to the first picture on a phone. The owner reported on Nov 2 at about 17:00 WIB that ten seconds after opening the app nothing had shown up, and said waiting that long is not acceptable; the device and the connection are not known, so measure a cold open first. Done when the first photo of the feed shows within two seconds on a phone over mobile data, the feed shows something within two seconds of opening the app, and the sizes and times before and after are in docs.

## Match the frames

### #2 Shell screen matches the designer's frame and installs as a PWA

The bottom bar and the three placeholder tabs (Search, Days, Profile) render unstyled, and the app cannot be installed to a phone.

The frame, the bottom bar and the five routes are merged and live. Restyle the bar and the three placeholder tabs from the designer's frame using the theme tokens and shared components, and add the PWA remainder: a manifest named "My Food AI" with the designer's icons, a service worker that caches the shell and serves navigations network-first, and the meta tags iPhone Safari needs to install it. No onboarding, no interstitials, no splash beyond the browser's. Done when the bar and the placeholder tabs match the frame at 390 px wide in light mode and the PWA installs on a phone.

### #3 Sign-in and sign-up screens match the designer's frames

The sign-in page and the sign-up page render unstyled.

Restyle both from the designer's frames using the theme tokens and shared components: the brand mark, the email, handle and password fields, the primary button, the line that switches between the two screens, and the Facebook button only under the existing flag. Done when both pages match the frames at 390 px wide in light mode, built from tokens and shared components, and signing in and signing up still work.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

Supabase Auth limits requests per IP address and supports the hCaptcha and Cloudflare Turnstile CAPTCHAs (Supabase docs), and some of its limits can be changed in the dashboard. Nobody has recorded what the production project has set, whether a CAPTCHA is on, or whether a new account's posts, which spend Meta credits, are limited. Observe first: report the Auth limits the production project has set, the CAPTCHA state, what a script that sends sign-ups and sign-ins faster than a person receives, and how many posts a new account can make. Done when those are reported and a script that hammers sign-up and sign-in is refused.

### #11 Home screen matches the designer's frames

Home renders unstyled.

Restyle it from the frames using the theme tokens and shared components: the title bar, the seven day bubbles as an empty row drawn from today's date, the card at rest, the expanded analysis block, the shimmer with its traffic line, the no-food card, the could-not-be-analysed card, the caption-only card drawn with the results card component, and the empty state with the one-time tooltip over the +. The analysis block from #12 is on main, and this item restyles it to the frame. Done when every state matches the frames at 390 px wide in light mode from tokens and shared components, and a new post still fills in without a refresh.

### #6 Capture screen matches the designer's frame

The capture sheet renders unstyled.

Restyle it from the frame using the theme tokens and shared components: the dark sheet, the top bar, the camera area, the shutter and gallery buttons, the thumbnail strip, the caption field, the location line as static copy, and the Post button. After a successful post the sheet sends a post-created event before it closes, which later items listen for. Done when the sheet matches the frame at 390 px wide and a post still completes.

### #108 The app fits an iPhone screen when installed to the home screen

Installed to an iPhone home screen, the app collides with the system: the clock overlaps content and the bottom bar is clipped.

The owner's screenshot shows the clipped bar. The installed app does not respect the status bar, the notch or the home indicator. Set viewport-fit=cover and pad the header, the bottom bar and every sheet with env(safe-area-inset-\*). Done when nothing overlaps the clock or the home indicator at 390x844 and 430x932.

### #193 Page looks for every screen against the designer's frames

No screen has been compared with the designer's frames, and the intake control and the barcode scanner have no frame at all.

Capture every screen at 390x844 on production and list the differences per screen, and check the intake and barcode copy against the banned wording (past tense, no budget, no progress, no "left"). Done when the differences are listed per screen and the fixes are merged.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196; the owner adds what he feels on his phone, because emulation cannot show that. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items, and the owner's own list has no open entry.

## Late features

### #22 Web Push when an analysis is ready or a question is waiting

When the user has left the app, the only way they learn the analysis landed is a push notification.

Register a Web Push subscription on first post (not at sign-up), store it keyed by user, and send "Your meal is ready" with the post thumbnail when the worker sets ready; send the question text when it sets needs\_input. iOS requires the PWA to be installed to the home screen for push, so the subscription prompt appears only when installed. PR #94 is merged, so the subscription and both notifications are in the code. A notification arriving on a real phone with the app in the background has not been shown. Done when a post placed, then the app backgrounded, produces a notification that opens the post.

### #23 One-time hint tooltips for the + sheet, the thread and the thumbs

The three things a new user has never seen are the + sheet, the thread label and the thumbs, and nothing tells them what these are.

On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Done when a fresh account sees exactly three tooltips across its first session.

### #168 Desktop browser layout

The app is a phone-width column and is awkward in a desktop browser.

At 1024 px and wider, use a centred feed column, replace the bottom bar with a side or top navigation, open post detail beside the feed, support keyboard navigation, and capture by webcam or file upload. The designer delivered desktop frames 4a to 4f at 1280x800 on Nov 2: the feed with post detail beside it and J and K to move between posts, capture by webcam, capture by file upload, Days, Search and Profile, with a sidebar that lists the keyboard keys. Their PNG export is pending. Done when the feed, detail, capture, Days, Search and Profile are usable with a mouse and keyboard at 1280x800 and 1920x1080 with no horizontal scroll.

### #169 Agent surface: an MCP server and documented HTTP API

Agents cannot log or read meals; the app has no programmatic interface.

Add a streamable-HTTP MCP at /mcp with log\_meal, list\_meals, get\_meal and correct\_meal, authenticated by a per-user revocable token created from a "Connect an agent" row on Profile and rate-limited. Records only, past tense, no targets, no weight or exercise tools. The designer delivered frames 4g to 4k at 390x844 on Nov 2: the Profile row, creating a token, the token shown once, a connected agent with its past-tense activity log, and revoking it. Their PNG export is pending. The server and API need no frame. Done when an MCP client logs a caption-only "coffee" with a past eaten-at and reads it back, a second user's token cannot read it, a revoked token is refused, and docs/agents.md documents setup.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

The owner ruled on Oct 31 that this waits until the fleet work is done and is not part of Run 4. What is known: the bonus names Muse Spark Open and Muse Glimmer; Modal approved $100 of hackathon credit for the owner and hosts a Muse Spark Open endpoint billed per token; no Modal credential exists in the coder's environment or in production (MODAL\_TOKEN\_ID and MODAL\_TOKEN\_SECRET are the missing names). The model names are hardcoded in the Meta client and the ten-photo harness cannot choose a model host, so a trial needs a throwaway clone that swaps only the identify-and-portions call and leaves SAM and transcription on the Meta API. Runtime models stay Meta models only. The trial compares the ten meal photos and one "I ate half the rice" caption against the current path with the USDA lookup unchanged, spends at most 5 US dollars, and changes nothing in production. Credits to collect first: Modal's $100 is approved; Baseten and Fireworks list $100 each for selected participants, and the owner's selection is unconfirmed. A throwaway clone proves the model only; a qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Done when the results are in docs and the owner decides whether any open-model feature ships before the Nov 3 freeze.

## Submission

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

The coder's read-only assessment of main on 2026-10-28 found no committed secret, and the owner ruled that nothing is removed or scrubbed during the build. After the last feature merges, one pass replaces the default README with a short start-here page and the owner records which working files (the agents' contracts, the Wall of Stupid file, the review policy and the review tools) stay on main. Done when the README is the start-here page, the owner has recorded which files stay, and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep.

### #287 The README shows judges the three Meta models, the technical depth and what the app does not do

A judge reads the repository and watches the video, and the README does not yet put in front of them the evidence the four scoring criteria ask for.

The Guide's section 8 scores Impact 30%, Use of Meta AI Tooling 25%, Demo 25% and Technical Depth 20% (from the hackathon rules reference; the PM has not read the Guide first-hand). The README should name SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0 with the job each does and where its model ID is logged. It should summarise what was built from Oct 26 to Nov 4 with the evidence that already exists: the test count, the ten-photo evaluation with its stated limits, the real-model gates, the worker timing and the item history that keeps every correction. It should say plainly that the app records what was eaten and never advises, sets no targets and makes no health claims, because the hackathon's anti-project list names nutrition coaching. It states only what the coder's reports prove and carries no private account detail. Done when the README has those parts, each claim links to its evidence, and the owner has read it before the recording.

### #282 The live app keeps working while judges use it

Judging runs Nov 4 to Nov 8, and if the Meta API credits run out first, a judge who posts a meal sees a failed analysis.

The owner was told the $150 hackathon credits do not extend through judging and that spend alerts are not hard caps. Nobody has seen the balance, the end date, or what the drains, gates and re-logs have used; the 16-food gate alone made 38 model calls and 69,169 output tokens. USDA FoodData Central limits requests to 1,000 an hour. The twenty-post drain made 94 USDA requests, 4.7 per meal, so the limit allows roughly 200 meals an hour; the sushi photo needs up to 36 requests when cold. When USDA answers 429 the worker retries at 30 and 60 seconds, ignores Retry-After, and then fails the post (the planner's reading of the coder's report of Nov 2). The owner's console of Nov 2 shows $134.29 of free credits remaining and two payment methods on file, so usage after the free credits end should bill a card instead of failing; that is not yet confirmed, and the end date of the free credits is not shown. Done when a post made while the Meta Model API refuses a call, or while USDA answers 429, shows the user a clear message and can be retried, and a USDA 429 waits as USDA asks.

## Blocked

### #114 Facebook Login in production mode

Public sign-in with Facebook needs the app submitted for Meta app review, which takes longer than the event.

Blocked by Meta app review. Dev mode works for the developer's own and test accounts, which is enough for the demo. The owner wants the Facebook button on the sign-in page for show and does not intend it to go live for the hackathon. Facebook Login is the Meta sign-in that exists and Supabase supports it. While a Facebook app is in Development mode only people with a role on the app can sign in, and everyone else sees an "App Not Setup" error (Supabase docs), so a judge who taps the button would see an error. Instagram has no sign-in for consumer apps: Meta shut the Instagram Basic Display API on Dec 4, 2024 and tells developers to use Facebook Login for authentication, and its newer Instagram login serves business and creator accounts. No Instagram button is added, and no separate Meta-account sign-in was found. Whether the button shows today, and what a person without a role sees when tapping it, is not known. Done when the coder reports what the button shows and does today and the owner has decided what a judge who taps it sees.

### #115 Dark mode

The app has no dark mode.

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

### #218 Hydration as a share of daily intake

The owner wants the app eventually to show how much of the user's daily intake is hydration.

Blocked until after the hackathon, and blocked by the claims rule: the app shows no percentage that reads as progress, and a share of intake is a percentage. The owner decides whether this one figure may break that rule. Done when the owner has lifted the rule for this figure and its design is drawn.

---

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. An item stays until its issue is closed by a merged pull request; the Blocked section holds items that cannot be worked on and says why. Designer items come first, and engineering items are grouped by the pass that will work them together, not by issue number or date.

Every item is a title line and two paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the three parts. The three parts are: (1) a title a person can read; (2) a first paragraph in plain language that states the problem; (3) a second paragraph with the minimum context a person needs to solve the problem unaided, meaning what investigation, work or the owner's observations have established, ending in a done condition. Neither paragraph is a dump of everything known. An item without all three parts is not on the backlog.
