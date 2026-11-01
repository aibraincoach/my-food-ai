# My Food AI — Backlog†

Last edited: Sunday 2026-11-01 at 09:38 WIB (UTC+07:00) by Claude, PM

## Backlog

## For the designer

### Frames for the desktop browser layout

The app has frames only for a 390 px phone, so the desktop version (#168) cannot be built.

\#168 asks for a centred feed column at 1024 px and wider, a side or top navigation in place of the bottom bar, post detail beside the feed, keyboard navigation, and capture by webcam or file upload. The same rules apply as on the phone: consumed wording, and no target, percentage, ring or the word "left". Done when frames at 1280x800 are delivered for the feed with post detail beside it, capture by webcam or file upload, Days, Search and Profile.

### Frames for connecting an agent

The agent surface (#169) lets an agent log and read meals, but a user has no screen to connect one.

\#169 creates a per-user token from a "Connect an agent" row on Profile, and the user can revoke it. The row, creating a token, seeing it and revoking it have no frame. The MCP server and HTTP API need no frame. Records only, past tense, no targets. Done when frames at 390x844 are delivered for the Profile row, creating a token, a connected agent and revoking it.

### Frames for the upload progress bar

Nobody has drawn what a user sees while a photo uploads, so the progress bar cannot be built to a frame.

The owner asked on Nov 1 for a progress bar during upload so people know the app is working (see the engineering item on uploading a photo). It shows the upload only, never nutrition, goals or any score. Done when frames at 390x844 are delivered for the capture sheet and the feed card while a photo uploads, and for a failed upload.

## Build the designer's frames

### #212 The regular camera reads a barcode and a nutrition label

A user has to switch to a separate scanner to log a packaged food, and the scanner has not been tried on a phone.

The scanner was merged in PR #165 on the Search tab and is untested on a phone. The owner ruled on Oct 29 that a photo is a photo, whether it shows food, a barcode or a package's nutrition label, so the capture sheet identifies which whether or not the Barcode toggle of frame 2i is used; the owner ruled to keep the toggle so users can see that a scanner exists. The owner prefers a deterministic read: decode the barcode from the image first and look the digits up, and use the model only when no code is found and for the label. A barcode becomes a post whose card identifies the product with its nutrition and the pack photo; a label is read into the same kind of card. The look comes from frame 2i and the designer's frames for the label and the correction. First try the existing scanner on a phone with a real pack and report what it reads. Done when a real pack's barcode, photographed through the capture sheet on a phone, posts a card with the product's name and nutrition, and a nutrition label does the same.

### #213 Corrections to a barcode's product are kept

A barcode can come back from the food database with the wrong language or wrong values, and the user cannot fix it for the next scan.

Many barcodes return names in Spanish or another language. The owner wants a correction to a scanned product (name, amount, nutrition) stored against that barcode in our database and used the next time the barcode is scanned. Whether a correction applies to every user or only to its author is not decided, so the first step is to propose which and why. Done when a corrected name on a barcode appears on the next scan of the same barcode.

### #214 A drink post's card shows the day's hydration, including water from food

A drink becomes a post, but its card does not tell the user how much they have drunk in the day.

The owner ruled on Oct 29 that every drink becomes a post and that its card shows the hydration consumed that day, in past tense and as a record with no target, comparison or percentage, counting the water in food as well as in drinks. The food database lists a water amount for most foods, but how much of a day's food water to count has not been settled, so the first step is to propose it. Done when a water post's card shows the day's hydration from drinks and food in ml, and a food post adds its water to that total.

### #219 A way home from every screen

From several screens a user cannot get back to Home, because the bottom bar is not shown everywhere.

The designer's round 3 frames 3a and 3p show a floating pill bar on Feed, Search, Days, Profile and Post detail, with Home first. Full-screen modals show a back control at the top left, and bottom sheets keep the pill visible behind a scrim, so a tap on it closes the sheet and goes home. Build to those frames. Done when the pill shows on those five screens, every other surface has the way home the frames name, and a tap on the pill closes a sheet and navigates.

### #220 A short nutrition summary with the rest behind an expand

The nutrition information on a meal is very long, and a user wants only the few figures everyone looks at.

The designer's round 3 frames 3a, 3b and 3c show the feed card with one summary line, and post detail with a four-cell summary of calories, protein, carbs and fat, then a "Show all" row that opens the full table. #13 specifies the full table, and every figure stays one tap away. Build to those frames, in consumed wording with no target or percentage. Done when the feed card and post detail match the frames and every other figure is behind the expand.

## Analysis pipeline and worker

### #189 A meal's estimate matches what was eaten

The owner logged Japanese toast, a small slice of ham, a small salad, one scrambled egg and a coffee, and the app showed 725 kcal. It put the toast at 348 kcal, the ham at 50 g even after a correction, and the coffee at 180 g.

The owner's breakfast showed 725 kcal on Oct 29 because the salad, coffee and egg matched dressing, soymilk and ketchup. Matching has been fixed since (#197, #236, #246 to #255). On Nov 1 the same breakfast and curry on production match every food, but the totals differ between runs. The breakfast came to 290.8 kcal and then 272.8 kcal, because the scrambled egg picked a different reference. The curry came to 971.2 kcal and then 1,229.5 kcal, because its portions changed. Portions are model estimates and generic references do not establish the exact recipe. The issue was closed by a keyword without the owner's acceptance and was reopened on Oct 31. Done when the owner accepts the totals and the weights of the meal logged again for a slice of toast, a small slice of ham and a coffee.

### #226 Japanese dishes match the right foods in the food database

Common Japanese dishes are matched to the wrong foods, so their calories and macros are wrong.

The coder's check of Oct 29 found the tonkatsu matched to a sauce, the Japanese curry sauce to dried persimmons and cooked white rice to glutinous rice. The fixes (#236, #250 to #255) retrieve more candidates, include Survey and FNDDS foods, refine repeated searches and stop rejecting compatible generic references, with no food-name special cases. On Nov 1 the same meal on production matches a cutlet (FDC 2705869), a curry sauce (FDC 2710178) and plain cooked rice (FDC 2708403). A food with no good match still shows its nutrition as unavailable. Done when the owner accepts the totals.

### #227 A photo that does not upload never becomes a post without one

A post made with a photo can reach the server with no photo and be analysed as text only, and nobody is told.

The owner photographed his meal and posted it on Oct 29 at 17:20 JST from his phone, on a slow roaming connection in Japan. The coder's check on production at 18:30 JST found no photo row and no photo in storage for that post, an analysis request with text and no image, no segmentation call and no storage request for a photo upload; the post's only image is the generated results card. The cause is not known: the camera image may never have been attached, or the upload may have failed on the slow connection while the post went ahead. Observe first: post from the capture sheet with a photo on a throttled connection and with the connection cut during the upload, and report what the app sends. Done when a post made with a photo either has its photo stored or shows the user that the upload failed and keeps the photo for a retry, and never becomes a caption-only post silently.

### #228 A meal summary's numbers are the calculated totals

Written text on a card could state calorie or macro numbers that differ from the calculated totals.

A ChatGPT code review of Oct 29 claimed the model-written summary is checked for wording but not compared with the calculated totals, and that a formatter working from the totals already exists; nobody has verified this. First read the summary code and try to produce a summary whose number differs from the totals, then report. If it can differ, publish only nutrition text formatted from the totals, leave the caption's own numbers (such as "two eggs") alone, and make every screen that shows these numbers agree after rounding. Done when a model summary saying 900 kcal against calculated totals of 600 kcal publishes 600 everywhere, or the report shows it cannot happen.

### #230 A coffee with no nutrition does not blank a breakfast, and toast does not match persimmons

The breakfast logged again on Oct 30 still matched wrong foods and showed no total.

The Oct 30 re-log matched the toast to dried Japanese persimmons, the salad to a fast-food side salad and the black coffee to an entry with no nutrition, so the total was unknown. The cause is shared with the Japanese-dish and totals items. On Nov 1 the breakfast on production matches a plain food for all five items, with no food unavailable, and totals 290.8 kcal in one run and 272.8 kcal in another. Done when the owner accepts the breakfast total.

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

### #172 Saved meals and Log again

Habits repeat, and today every repeat is logged again from scratch.

Cal AI has saved foods and a Copy To action. Add a bookmark on post detail that saves a meal, the saved meals as the fifth entry of the + (the owner ruled on Oct 29 that all saved foods go there, replacing an entry of the user's own), and "Log again" in the post menu to copy a meal to a chosen time. The owner wants the bookmark to work like Instagram's save, so a user who eats tuna every day taps the saved tuna instead of scanning it each time. The designer is drawing the frames (#198), and the item is not built before they exist. Done when a saved coffee logs in two taps at Now and at an earlier time through the picker.

### #173 Add a photo to an existing post

A post cannot take a second photo. That matters most when a meal is only partly eaten: a whole chocolate cake is photographed, part of it is eaten, and the app has no way to record that the second photo shows what remains.

The owner asked for this on Oct 29 and wants it unmistakable which photo is which. Add "Add photo" to the post menu and a + at the end of the card's carousel, reached by swiping right on the card; the photo joins the carousel and triggers a re-estimate as a thread reply. Only the second photo can be marked "Not eaten" with a toggle: the app then records what was eaten as the first photo's items minus the items in the marked photo, shown as Consumed, and keeps both estimates in the thread. The app never shows the word "left", so the label is "Not eaten". The look comes from the designer's frame. Done when a second photo appears in the carousel, a photo marked Not eaten lowers the consumed totals by the items it shows, the first photo cannot be marked, and the thread shows both estimates.

### #174 Delete a post

A post cannot be deleted.

Cal AI's post menu has Delete Food. Add "Delete" to the post menu with a confirmation that removes the post and its media. Done when a deleted post is gone from the feed, Days, Search and storage.

### #223 A post's caption can be edited

A user cannot change the caption of a post, so a stray character stays on the card for good.

The owner reported this on Oct 29 at 17:29 JST: his caption ends in a stray "R" that he does not want. The post menu has no edit for the caption, and the comment-or-correct thread of #14 changes the items, not the caption. Add "Edit caption" to the post menu; editing the caption does not re-run the estimate or change the items. Done when a caption edited from the post menu shows its new text on the feed card, post detail, Days and Search after a reload.

### Uploading a photo shows its progress

When a user posts a photo, nothing on the screen shows that the upload is under way, so people cannot tell whether anything is happening.

The owner asked for this on Nov 1: a progress bar during the upload so people know the app is working. The bar shows the upload only, never nutrition, goals or any score, because the claims rule bans bars that read as progress toward a goal. No designer frame exists for it yet. It sits next to #227, which keeps a failed upload from becoming a post without a photo. Done when a post with a photo on a slow connection shows a progress bar from the start of the upload until it finishes, and the bar is gone once the post appears.

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

The owner reported this on Oct 29 while using the app. The cause is not known, so measure first: the size and format of what a card downloads, whether the feed uses thumbnails, whether images are cached between visits, and the time to the first picture on a phone. Done when the first photo of the feed shows within two seconds on a phone over mobile data, and the sizes and times before and after are in docs.

## Match the frames

### #2 Shell screen matches the designer's frame and installs as a PWA

The bottom bar and the three placeholder tabs (Search, Days, Profile) render unstyled, and the app cannot be installed to a phone.

The frame, the bottom bar and the five routes are merged and live. Restyle the bar and the three placeholder tabs from the designer's frame using the theme tokens and shared components, and add the PWA remainder: a manifest named "My Food AI" with the designer's icons, a service worker that caches the shell and serves navigations network-first, and the meta tags iPhone Safari needs to install it. No onboarding, no interstitials, no splash beyond the browser's. Done when the bar and the placeholder tabs match the frame at 390 px wide in light mode and the PWA installs on a phone.

### #3 Sign-in and sign-up screens match the designer's frames

The sign-in page and the sign-up page render unstyled.

Restyle both from the designer's frames using the theme tokens and shared components: the brand mark, the email, handle and password fields, the primary button, the line that switches between the two screens, and the Facebook button only under the existing flag. Done when both pages match the frames at 390 px wide in light mode, built from tokens and shared components, and signing in and signing up still work.

### #11 Home screen matches the designer's frames

Home renders unstyled.

Restyle it from the frames using the theme tokens and shared components: the title bar, the seven day bubbles as an empty row drawn from today's date, the card at rest, the expanded analysis block, the shimmer with its traffic line, the no-food card, the could-not-be-analysed card, the caption-only card drawn with the results card component, and the empty state with the one-time tooltip over the +. The analysis block from #12 is on main, and this item restyles it to the frame. Done when every state matches the frames at 390 px wide in light mode from tokens and shared components, and a new post still fills in without a refresh.

### #6 Capture screen matches the designer's frame

The capture sheet renders unstyled.

Restyle it from the frame using the theme tokens and shared components: the dark sheet, the top bar, the camera area, the shutter and gallery buttons, the thumbnail strip, the caption field, the location line as static copy, and the Post button. After a successful post the sheet sends a post-created event before it closes, which later items listen for. Done when the sheet matches the frame at 390 px wide and a post still completes.

### #108 The app fits an iPhone screen when installed to the home screen

Installed to an iPhone home screen, the app collides with the system: the clock overlaps content and the bottom bar is clipped.

The owner's screenshot shows the clipped bar. The installed app does not respect the status bar, the notch or the home indicator. Set viewport-fit=cover and pad the header, the bottom bar and every sheet with env(safe-area-inset-\*). Done when nothing overlaps the clock or the home indicator at 390x844 and 430x932.

### The installed app is accepted on two real phones

Nothing has been proven on a phone: not the installed app, the camera, the notification or the iPhone fit, and the demo video is shot on a phone.

Items #221, #222, #22 and #108 and the camera checks all wait on this. The coder's checklist is docs/phone-acceptance.md. In order: on phone A over mobile data with the screen recording, open the installed app and check that sign-in persisted (#221), the time to the first photo (#222, two seconds) and the clock, notch and bottom bar (#108). Photograph a meal with the real camera and check live preview, flip, shutter, caption and a reachable Post control with the keyboard open. Turn on notifications, post a meal and lock the phone, then check that the notification arrives and opens the post (#22). On phone B, sign in, close and reopen the installed app (#221). Force-close phone A, reopen it and repeat the image timing. Done when each check has a recorded result and every failure is filed as an item.

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

At 1024 px and wider, use a centred feed column, replace the bottom bar with a side or top navigation, open post detail beside the feed, support keyboard navigation, and capture by webcam or file upload. It waits for the designer's desktop frames. Done when the feed, detail, capture, Days, Search and Profile are usable with a mouse and keyboard at 1280x800 and 1920x1080 with no horizontal scroll.

### #169 Agent surface: an MCP server and documented HTTP API

Agents cannot log or read meals; the app has no programmatic interface.

Add a streamable-HTTP MCP at /mcp with log\_meal, list\_meals, get\_meal and correct\_meal, authenticated by a per-user revocable token created from a "Connect an agent" row on Profile and rate-limited. Records only, past tense, no targets, no weight or exercise tools. The Profile row waits for the designer's frames; the server and API do not. Done when an MCP client logs a caption-only "coffee" with a past eaten-at and reads it back, a second user's token cannot read it, a revoked token is refused, and docs/agents.md documents setup.

### A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

The owner ruled on Oct 31 that this waits until the fleet work is done and is not part of Run 4. What is known: the bonus names Muse Spark Open and Muse Glimmer; Modal approved $100 of hackathon credit for the owner and hosts a Muse Spark Open endpoint billed per token; no Modal credential exists in the coder's environment or in production (MODAL\_TOKEN\_ID and MODAL\_TOKEN\_SECRET are the missing names). The model names are hardcoded in the Meta client and the ten-photo harness cannot choose a model host, so a trial needs a throwaway clone that swaps only the identify-and-portions call and leaves SAM and transcription on the Meta API. Runtime models stay Meta models only. The trial compares the ten meal photos and one "I ate half the rice" caption against the current path with the USDA lookup unchanged, spends at most 5 US dollars, and changes nothing in production. Credits to collect first: Modal's $100 is approved; Baseten and Fireworks list $100 each for selected participants, and the owner's selection is unconfirmed. A throwaway clone proves the model only; a qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Done when the results are in docs and the owner decides whether any open-model feature ships before the Nov 3 freeze.

## Submission

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

The coder's read-only assessment of main on 2026-10-28 found no committed secret, and the owner ruled that nothing is removed or scrubbed during the build. After the last feature merges, one pass replaces the default README with a short start-here page and the owner records which working files (the agents' contracts, the Wall of Stupid file, the review policy and the review tools) stay on main. Done when the README is the start-here page, the owner has recorded which files stay, and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep.

### #26 Demo video under three minutes and the submission write-up

The submission needs a public repo, a video, and a write-up that names what was built during the event.

The owner records the video on Nov 4; the write-up goes in README.md. Script: open on the Cal AI timeline ("50 screens and 22 minutes before my first log, 11:45 to 12:07"), cut to sign-in → camera → post in ten seconds, show the SAM outlines on the detail, make a correction and show the thread keeping both versions, show the needs-input strip, close on Days. The write-up states everything was built Oct 26 to Nov 4 on the Meta Model API with SAM 3.1 and Muse Spark 1.3, lists the three Meta model calls, and says what the app does not do. The Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8, so the video goes on X as soon as it exists; whether the post must exist before the submission deadline is unconfirmed. No merges or deploys from the start of recording until the submission is in. The owner chooses the account to record on before recording; the first test account holds many test posts, including meals with unavailable foods. Done when the video is under three minutes and the write-up is in README.md.

### The live app keeps working while judges use it

Judging runs Nov 4 to Nov 8, and if the Meta API credits run out first, a judge who posts a meal sees a failed analysis.

The owner was told the $150 hackathon credits do not extend through judging and that spend alerts are not hard caps. Nobody has seen the balance, the end date, or what the drains, gates and re-logs have used; the 16-food gate alone made 38 model calls and 69,169 output tokens. Done when the balance and end date are known and either a payment method is attached or a fallback is chosen.

## Blocked

### #114 Facebook Login in production mode

Public sign-in with Facebook needs the app submitted for Meta app review, which takes longer than the event.

Blocked by Meta app review. Dev mode works for the developer's own and test accounts, which is enough for the demo.

### #115 Dark mode

The app has no dark mode.

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

### #218 Hydration as a share of daily intake

The owner wants the app eventually to show how much of the user's daily intake is hydration.

Blocked until after the hackathon, and blocked by the claims rule: the app shows no percentage that reads as progress, and a share of intake is a percentage. The owner decides whether this one figure may break that rule. Done when the owner has lifted the rule for this figure and its design is drawn.

---

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is generated from the same open issues, so the coder and the planner read the same list. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. An item stays until its issue is closed by a merged pull request; the Blocked section holds items that cannot be worked on and says why. Designer items come first, and engineering items are grouped by the pass that will work them together, not by issue number or date.

Every item is a title line and two paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the three parts. The three parts are: (1) a title a person can read; (2) a first paragraph in plain language that states the problem; (3) a second paragraph with the minimum context a person needs to solve the problem unaided, meaning what investigation, work or the owner's observations have established, ending in a done condition. Neither paragraph is a dump of everything known. An item without all three parts is not on the backlog.
