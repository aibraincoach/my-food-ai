# My Food AI — Backlog†

Last edited: Saturday 2026-10-31 at 09:54 MYT (UTC+08:00) by Codex, reconciling the owner-supplied 09:45 MYT backlog

## Backlog

## For the designer

### #195 The second photo can show what was not eaten

A user who photographs a whole cake and then eats part of it cannot say that the second photo shows what remains.

The owner wants it very clear which photo is the not-eaten one: a toggle on the second photo only, or a + at the end of the carousel reached by swiping right on the card. The app never shows the word "left", so the label reads "Not eaten". Design the + in the carousel, the toggle on and off, the label on the slide, and how the card shows what was consumed. Done when frames at 390x844 for adding the second photo, the toggle states and a card with a not-eaten slide are delivered.

### #198 Frames for saved meals and Log again

Saved meals and Log again cannot be built because no frame shows them.

#172 adds a bookmark on post detail that saves a meal, a list of saved meals and "Log again" in the post menu to copy a meal to a chosen time. The + now spins out five entries (frames 2c and 2d), so the designer decides where saved meals sit beside them. Done when frames at 390x844 are delivered for the bookmark on post detail, the saved-meals list, and "Log again" with its time choice.

### #210 Frames for a nutrition label and for correcting a scanned product

Frame 2i draws a barcode found, but no frame shows a nutrition label read, a barcode not found or a way to correct a scanned product.

The owner ruled on Oct 29 to keep the Photo | Barcode toggle of frame 2i, so a user can see that a scanner exists, while the camera also identifies a barcode or a label in Photo mode without the toggle being used. Draw, in the style of frame 2i, the card for a nutrition label read, the card for a barcode not found, and the correction of a scanned product, because many barcodes come back with names in another language such as Spanish. Done when frames at 390x844 are delivered for a nutrition label read, a barcode not found and the correction.

### #211 Frames for the day's hydration on a drink post's card

A drink becomes a post, but no frame shows what its card says.

The owner ruled on Oct 29 that a drink post's card shows how much hydration the user has consumed all day, from drinks and from the water in food. It is a record in past tense, for example "Consumed today: 1,450 ml", with no target, comparison or percentage. Done when frames at 390x844 are delivered for the card of a water post, a coffee post and a food post that adds hydration.

### #219 A way home from every screen

From several screens a user cannot get back to Home, because the bottom bar is not shown everywhere.

The owner reported this on Oct 29: the bottom bar does not appear on every surface, so there is no way home from them. #187 fixed this for Days only. Decide for post detail, the capture sheet, Search, the Days story and every other surface whether it shows the bar or a visible way home, and draw it. Done when frames at 390x844 show a way home on every screen.

### #220 A short nutrition summary with the rest behind an expand

The nutrition information on a meal is very long, and a user wants only the few figures everyone looks at.

The owner said on Oct 29 that the nutrition view is far too big: show calories, protein, carbs and fat first and put everything else behind an expand. #13 specifies the full table with every micronutrient in one view; every figure stays one tap away for judges and for editing. Draw the summary, the expanded state and how both sit on the card and on post detail, in consumed wording with no target or percentage. Done when frames at 390x844 are delivered for the summary and the expanded table.

## Build the round 2 frames

### #185 Days are NOT separated in the feed

The feed is one unbroken run of cards, so a user cannot see where one day ends and the next begins.

The designer's round 2 frames 2a and 2b show the feed with a header for each day: the name ("Today", "Yesterday", then the weekday and date), the day's total as a record in the form "Consumed: 2,118 kcal" with no comparison, average or target, the header pinned while its posts scroll, and an empty header for a day with no post. Build the feed to those frames. Done when the feed shows a header per day as in the frames, Today and Yesterday are named, a day with one post and an empty day between posted days both appear, and the header stays pinned while its posts scroll. Oct 30 production check passed.

### #186 The + button spins out its entries

The + button only opens the camera, but a meal can be logged by camera, by text, as a drink or as a coffee.

The designer's frames 2c and 2d are delivered. This item is built together with #191 in one pull request and closes with it. That pull request (#202) is merged to main; the entries that open the text, drink and coffee sheets depend on #205 and #206. Done when #191 is done and the + matches frames 2c and 2d. Oct 30 production check passed (fan circles 52 px, Saved dashed).

### #191 The + button offers camera, text, drink and coffee entries

The + button opens only the camera, so logging by text, a drink or a coffee takes extra steps.

Caption-only posts already work, and water and caffeine intake logging is on main (#111). The designer's frames 2c and 2d show the + opening into camera, text, drink, coffee and a fifth entry, overridden by the owner's later ruling to be the dashed Saved placeholder, with the motion in the designer's note. Each entry opens its own capture directly: text opens the capture sheet without the camera, and drink and coffee open the intake sheet of #188. Done when each of the four entries logs a post starting from the +, the dashed Saved placeholder opens empty text capture until #172 and #198 deliver saved meals, and the + matches frames 2c and 2d. Oct 30 production check passed: camera, text, drink and coffee each logged a post.

### #187 The Days screen is easy to use and easy to leave

From the Days tab it is unclear how to get back to the main screen: there is no back button, an earlier month is reached only by scrolling to the bottom, and tapping a day opens a story viewer with no obvious way out.

The designer's round 2 frames 2e, 2f and 2g show Days as a column of months, newest first, with each day's kcal inside its cell, a visible "Feed" control to go back, a "Go to" menu for earlier months, and a story that opens over the month and closes three ways ("‹ October", the ×, and a swipe down) into the tapped day's cell. Build Days to those frames. Done when Days shows two months per screen, earlier months arrive by scrolling and through the menu, "Feed" and the Home tab return to the feed, a tapped day opens as the last card of its story, and "‹ October", the × and a swipe down each leave it with the month behind (PR #204 is merged to main; the Oct 30 production check passed).

### #188 The intake control follows its frame

Water and caffeine intake was built before the designer drew it, and the built version does not match the frame: the intake control is a row on Home.

Frame 2h is a sheet opened from the + with Water, Coffee and Other tabs, amount cells, a "Drank today" list and a "Post · …" button. The owner ruled on Oct 29 that the row on Home goes and that each drink is a post in the feed; what the post's card says is the hydration item below. Done when the Drink and Coffee entries of the + open the intake sheet on the matching tab and each logs a post, the row on Home is gone, and the sheet matches frame 2h. Oct 30 production check passed.

### #212 The regular camera reads a barcode and a nutrition label

A user has to switch to a separate scanner to log a packaged food, and the scanner has not been tried on a phone.

The scanner was merged in PR #165 on the Search tab and is untested on a phone. The owner ruled on Oct 29 that a photo is a photo, whether it shows food, a barcode or a package's nutrition label, so the capture sheet identifies which whether or not the Barcode toggle of frame 2i is used; the owner ruled to keep the toggle so users can see that a scanner exists. The owner prefers a deterministic read: decode the barcode from the image first and look the digits up, and use the model only when no code is found and for the label. A barcode becomes a post whose card identifies the product with its nutrition and the pack photo; a label is read into the same kind of card. The look comes from frame 2i and the designer's frames for the label and the correction. First try the existing scanner on a phone with a real pack and report what it reads. Done when a real pack's barcode, photographed through the capture sheet on a phone, posts a card with the product's name and nutrition, and a nutrition label does the same.

### #213 Corrections to a barcode's product are kept

A barcode can come back from the food database with the wrong language or wrong values, and the user cannot fix it for the next scan.

Many barcodes return names in Spanish or another language. The owner wants a correction to a scanned product (name, amount, nutrition) stored against that barcode in our database and used the next time the barcode is scanned. Whether a correction applies to every user or only to its author is not decided, so the first step is to propose which and why. Done when a corrected name on a barcode appears on the next scan of the same barcode.

### #214 A drink post's card shows the day's hydration, including water from food

A drink becomes a post, but its card does not tell the user how much they have drunk in the day.

The owner ruled on Oct 29 that every drink becomes a post and that its card shows the hydration consumed that day, in past tense and as a record with no target, comparison or percentage, counting the water in food as well as in drinks. The food database lists a water amount for most foods, but how much of a day's food water to count has not been settled, so the first step is to propose it. Done when a water post's card shows the day's hydration from drinks and food in ml, and a food post adds its water to that total.

## Analysis pipeline and worker

### #189 A meal's estimate matches what was eaten

The owner logged Japanese toast, a small slice of ham, a small salad, one scrambled egg and a coffee, and the app showed 725 kcal. It put the toast at 348 kcal, the ham at 50 g even after a correction, and the coffee at 180 g.

The coder's investigation of Oct 29 (comment on #189) found three wrong FDC matches: the salad matched a green-goddess dressing, the coffee matched soymilk at 180 g, and the egg matched ketchup. The toast was 120 g (two slices) with correct arithmetic, and the database shows the ham at 5 g after his correction, not 50 g. The correction thread did not rematch FDC, so the total stayed 725 kcal. PR #197 matches foods by item name and tightens the identify prompt for thin ham, one toast slice, one egg, black coffee and undressed salad; the same meal re-logged under the test account comes to about 248 kcal, with the toast still at 120 g. PR #197 was merged and deployed on Oct 29 at 16:44 JST, and a meal made after it still matched wrong foods (see the item on Japanese dishes below). Done when it is deployed and the owner accepts the weights of the meal logged again for a slice of toast, a small slice of ham and a coffee. The issue was closed by the keyword of the merged PR #197 without the owner's acceptance and was reopened on Oct 31. The Oct 30 re-log on production failed: the toast matched dried Japanese persimmons (FDC 169942), the salad matched a fast-food side salad (FDC 172074), and the black coffee matched a branded entry with no nutrition, so the meal's total shows unknown (the known items sum to 257.6 kcal). The portions were sensible. Filed as #230.

### #225 One food with no nutrition match does not blank a meal's totals

A meal in which one food has no nutrition values shows "— kcal" and dashes for the whole meal, so the numbers of the other foods are hidden too.

The owner's post of Oct 29 at 17:20 JST (tonkatsu, Japanese curry sauce and rice) showed no totals. The coder found on production at 18:30 JST that the tonkatsu matched a food-database sauce measured in millilitres, that the nutrition code will not convert millilitres to the estimated 220 g without a density and so stores nulls, and that the meal sum passes one null on to the total. The curry and the rice have values, so the known foods can be summed. Show the sum of the foods that have values, name the food that could not be totalled, and show that food's row as unknown. Done when a meal with one unmatched food shows the sum of the others and names the one left out, and no card shows a bare dash for a meal in which any food has values.

### #226 Japanese dishes match the right foods in the food database

Common Japanese dishes are matched to the wrong foods, so their calories and macros are wrong.

The coder's production check of Oct 29 at 18:30 JST, on a post made at 17:20 JST after #197 was deployed at 16:44 JST, found the tonkatsu matched to a vegetable-and-fruit tonkatsu sauce, the Japanese curry sauce matched to Japanese dried persimmons (822 kcal for 300 g) and cooked white rice matched to glutinous rice. #189 is therefore not done. A ChatGPT code review of Oct 29 claimed the food search returns its top-ranked result whenever any result exists, with no way to reject all of them; verify that yourself and report what you find. Find how each name reaches the food search and why the right foods lose, using that post as the failing case. Fix the cause by letting the search reject every poor result: allow one improved search from the caption and the item name, then keep the food with its nutrition marked unavailable, and do not accept a result measured in millilitres for a food estimated in grams without a supported conversion. Do not add these three names as special cases. Done when the same meal logged again on production matches a cutlet, a curry sauce and plain cooked rice, a food with no good match shows its nutrition as unavailable instead of a wrong number, and the owner accepts the totals.

### #227 A photo that does not upload never becomes a post without one

A post made with a photo can reach the server with no photo and be analysed as text only, and nobody is told.

The owner photographed his meal and posted it on Oct 29 at 17:20 JST from his phone, on a slow roaming connection in Japan. The coder's check on production at 18:30 JST found no photo row and no photo in storage for that post, an analysis request with text and no image, no segmentation call and no storage request for a photo upload; the post's only image is the generated results card. The cause is not known: the camera image may never have been attached, or the upload may have failed on the slow connection while the post went ahead. Observe first: post from the capture sheet with a photo on a throttled connection and with the connection cut during the upload, and report what the app sends. Done when a post made with a photo either has its photo stored or shows the user that the upload failed and keeps the photo for a retry, and never becomes a caption-only post silently.

### #228 A meal summary's numbers are the calculated totals

Written text on a card could state calorie or macro numbers that differ from the calculated totals.

A ChatGPT code review of Oct 29 claimed the model-written summary is checked for wording but not compared with the calculated totals, and that a formatter working from the totals already exists; nobody has verified this. First read the summary code and try to produce a summary whose number differs from the totals, then report. If it can differ, publish only nutrition text formatted from the totals, leave the caption's own numbers (such as "two eggs") alone, and make every screen that shows these numbers agree after rounding. Done when a model summary saying 900 kcal against calculated totals of 600 kcal publishes 600 everywhere, or the report shows it cannot happen.

### #229 A non-admin request for a trace page returns 404

A user who is not an admin and opens a trace page gets a page that answers success instead of not found.

The coder's Oct 30 production check of #67 had a second test account request a trace page: the answer was HTTP 200 with not-found content and no trace, where 404 is required. The database access is right for both accounts. Done when the same request returns 404 on production.

### #230 A coffee with no nutrition does not blank a breakfast, and toast does not match persimmons

The breakfast logged again on Oct 30 still matched wrong foods and showed no total.

The re-log on production matched the toast to dried Japanese persimmons, the salad to a fast-food side salad and the black coffee to a branded entry with null nutrition, so the meal's total was unknown. The comment on #189 holds the item names, weights, FDC ids and calories. It shares its cause with the items on Japanese dishes and on totals above. Done when the same breakfast logged again matches plain foods and shows a total of the known items with the coffee named as unknown.

### #139 A held worker lease renews for its full time

A worker that renews its lease does not actually extend it, so a long job can lose the lease while it is still running.

The coder found this in the lease SQL; a 300-second time-to-live against about 60 seconds of work hides it today. Fix the renewal and add a test. Done when a lease held past its first term is still held and a test proves it.

### #177 The worker keeps running until the queue is empty

Posts wait in the queue and never finish when the worker stops, until someone triggers it by hand.

The production load test of Oct 28 stopped processing after about 330 seconds: 11 of 20 posts stayed queued, with their jobs due, at attempt 0 and with no worker lease held, until a manual call to the jobs tick route restarted the worker. Issue #177 is open with no fix PR as of the coder's report on Oct 29. The cause is not established. Done when twenty posts made over two minutes on production all reach ready with nobody calling the tick route.

### #190 Production evaluation of ten real meal photos

There is no measured result yet for how well the app finds the items in a real meal.

The ten licensed meal photos, their expected items and the eval script are merged (PR #78), but the script has not run against production. Run it as the test account, commit the table to docs/eval.md and link it from the README. Done when the table shows for every photo which items were found, missed or invented.

### #24 Meta API rate-limit check and twenty-post load test

Nobody knows whether the Meta Model API's per-minute limit survives the judges' burst of live posts.

$150 of credit is irrelevant if the limit bites. Read the limits on Meta's pricing and rate-limits page and write them in docs/load-test.md, then run twenty posts through the queue in two minutes and record wait times and any 429s. Worker concurrency is already a setting (bounded 1 to 4), and the results block in docs/load-test.md still reads "Not run yet". Done when the numbers are in docs/load-test.md and the demo plan picks a concurrency that holds. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #65 The pipeline's tests run against an offline fake Meta Model API

Nothing exercises the analysis pipeline without a live key and live credit.

Meta's workshop repository ships a scripted offline model for its tests: a real OpenAI client whose requests never leave the machine and are answered from recorded outputs, including recorded SAM outputs, and which can be told to refuse a request with a 400. Add a fake of the Meta Model API behind the same client, selected by a base-URL variable (MODEL\_API\_BASE\_URL, which the workshop's client also reads), that answers the SAM, Spark identify, Spark correct and transcribe calls from recorded fixtures and can be told to return a 400, a 429 or a 503. Done when the path from a posted meal to ready, a correction, a 400 failing a job at once and a 429 retrying all run in the test suite with no network and no key.

### #66 The Meta Model API client sets its retries and timeout explicitly

A brief rate limit from the Meta Model API should not cost a job attempt, and today that depends on defaults nobody set.

Meta's workshop client sets four retries and a 180-second timeout on the OpenAI SDK client, and the SDK waits as long as the API asks on a 429 or a 503. Set the retry count and the timeout on our client explicitly, in one file, within the serverless function's time limit, so the worker's own retry delay only handles failures that outlast the SDK's. Done when the settings sit in one file and a test through the fake API shows a 429 that carries a wait is retried inside one job attempt.

### #67 Each post keeps a trace of its model calls, readable on the admin page

A judge looking at the app sees only the end result, not what the model was asked or what it returned.

Meta's workshop ships an Agent Console that shows every turn: what the model was asked, what it returned, the tokens used and which checks passed. Record, in a new table that only admins can read, one row per call a post made (SAM, Spark identify, Spark correct, FDC lookup, transcribe) with the time, the duration, the tokens, the request text without the image, the returned text, and the FDC id where one matched. Show a post's trace on the admin page and never in the user's app. Done when a post made on production has a trace listing each call it made, and a non-admin cannot read the table. Production authorization reads public.profiles.role, not ADMIN_EMAIL or a Vercel admin variable. The owner-designated account now has the admin role; its identity remains private. The remaining proof is a production trace plus non-admin table isolation and page refusal. Oct 30 production check: the trace and database access passed (three rows for one photo post; a second account read none). The admin browser check subsequently passed at 390x844 using a temporary admin role on the first configured test account; its original user role was immediately restored. A non-admin request returned HTTP 200 with not-found content instead of 404 (#229). The trace gap was checked on Oct 31: the photo post had three items, one external FDC lookup, and two older cache hits. Cache hits return before trace recording; copied nutrition can bypass a lookup entirely.

## Logging and editing meals

### #106 Log from the camera roll and set the time a meal was eaten

Meals get logged late. A coffee is remembered hours afterwards and a photo is often taken earlier, but capture accepts only the live camera and stamps the time of posting.

The owner asked for this after logging coffee hours late; Cal AI uses a time chip that opens a wheel picker. Add "Choose from library" to the capture sheet for one or several photos, and a "When" row set to Now that opens a time picker; a caption-only post such as "coffee" can be given a past time. Eaten-at defaults to the photo's capture time when the browser provides it, and post detail gets an edit-time control. The feed, Days and Search order by eaten-at. Done when a post logged now with a time of 8:30 this morning appears at 8:30 on today's bubble. Oct 30 production check passed: the time shows under Today and on post detail, the bubble is marked, and saving 07:30 moved the post past an 08:00 meal. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #172 Saved meals and Log again

Habits repeat, and today every repeat is logged again from scratch.

Cal AI has saved foods and a Copy To action. Add a bookmark on post detail that saves a meal, a list of saved meals in the + sheet, and "Log again" in the post menu to copy a meal to a chosen time. The designer is drawing the frames, and the item is not built before they exist. Done when a saved coffee logs in two taps at Now and at an earlier time through the picker.

### #173 Add a photo to an existing post

A post cannot take a second photo. That matters most when a meal is only partly eaten: a whole chocolate cake is photographed, part of it is eaten, and the app has no way to record that the second photo shows what remains.

The owner asked for this on Oct 29 and wants it unmistakable which photo is which. Add "Add photo" to the post menu and a + at the end of the card's carousel, reached by swiping right on the card; the photo joins the carousel and triggers a re-estimate as a thread reply. Only the second photo can be marked "Not eaten" with a toggle: the app then records what was eaten as the first photo's items minus the items in the marked photo, shown as Consumed, and keeps both estimates in the thread. The app never shows the word "left", so the label is "Not eaten". The look comes from the designer's frame. Done when a second photo appears in the carousel, a photo marked Not eaten lowers the consumed totals by the items it shows, the first photo cannot be marked, and the thread shows both estimates.

### #174 Delete a post

A post cannot be deleted.

Cal AI's post menu has Delete Food. Add "Delete" to the post menu with a confirmation that removes the post and its media. Done when a deleted post is gone from the feed, Days, Search and storage.

### #223 A post's caption can be edited

A user cannot change the caption of a post, so a stray character stays on the card for good.

The owner reported this on Oct 29 at 17:29 JST: his caption ends in a stray "R" that he does not want. The post menu has no edit for the caption, and the comment-or-correct thread of #14 changes the items, not the caption. Add "Edit caption" to the post menu; editing the caption does not re-run the estimate or change the items. Done when a caption edited from the post menu shows its new text on the feed card, post detail, Days and Search after a reload.

## Meal screens and feed

### #192 The photo does not reload while a post is being processed

While a post is being processed, its photo flickers, flashes and reloads over and over. It looks broken.

The owner reported this on Oct 29 while using the app. A planner report of Oct 27, written on the #38 head, said each card subscribes to its row and polls every 3 seconds while the post is unsettled; whether that, the realtime event or the refresh after posting re-creates the photo is not known, so verify it first and confirm the cause by observation. Fix it so the image loads once and the rest of the card updates around it. Done when a post made on production shows its photo with no flicker or reload from posting until it is ready.

### #107 Every card has a visible way to open post detail

A new user has to guess that tapping a card's text opens the meal's detail view. Nothing on the card says so.

The detail view is where the SAM outlines, the full nutrition table and item editing live, so a user who never finds it never sees where the numbers came from. Add a "Details ›" control on every card, and make the photo and the analysis block tappable too. Done when a new user opens detail without being told how. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #109 Today's day bubble shows a marker when a post exists today

Today's day bubble looks the same as an empty day although a post exists today.

The cause is not known yet. Find why and fix it. Done when a day with a post shows the marker and a day without one does not. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #175 Days shows days that hold only water or caffeine

A day on which only water or caffeine was logged shows nothing on Days.

Water and caffeine are intake entries and are allowed; weight and exercise are not. Done when such a day appears on Days with a marker.

### #224 Times on a card are in the user's own time zone

A post shows its time twice in two different zones, one labelled UTC and one in local time.

The owner's screenshot of Oct 29 at 17:29 JST shows the card header "CONSUMED · 8:20 AM UTC" above a caption stamped 5:20 PM for the same post; he is in Japan. Show every time in the device's time zone: card header, post detail, the thread and the Days stories. Done when a post made at 5:20 PM in Japan reads 5:20 PM everywhere a time shows, and no screen labels a time UTC.

### #13 Post detail with SAM outlines, full nutrition table and item editing

Judges need to see where every number came from, and a user needs to fix what the model got wrong.

The detail view shows the photo full width with each item's SAM mask drawn as a coloured outline; a toggle hides and shows the outlines. Below, the full nutrition table: calories, protein, carbs, fat, fibre, sugar, sodium, then every micronutrient present. Tapping an outline selects the item and opens an edit sheet: rename (with FDC search), change portion, remove, or Add item for something SAM missed (draw a box or just type it). Every user edit writes a new `post_items` row with source user and the old row is kept with a superseded flag, so the model's original is never lost. Done when a judge can tap an outline, change a portion, and watch the totals update while the original estimate remains visible in the thread. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #14 Comment-or-correct thread that re-runs the analysis and keeps every version

Corrections are the product's memory and must never overwrite what the model first said.

Under each post is a thread labelled "Comment or correct". The first entry is the model's analysis summary, author model. A user reply in plain language ("that was two eggs not three") is stored as author user, then the worker re-runs naming and nutrition with the thread as context and posts its revised summary as the next model entry, updating `post_items` through the supersede mechanism above. `post_comments` has no update or delete policy. Done when a correction produces a visible model reply within the queue wait and the thread shows both the original and the revision. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #15 Thumbs up and down on each analysis, double-tap as thumbs up

The model needs a cheap signal that an estimate was right, and the user needs a one-tap way to give it.

Each analysis block carries a thumbs up and a thumbs down; double-tapping the photo is thumbs up, as a heart would be. Thumbs up writes `post_feedback` up and marks the model's thread entry accepted; thumbs down writes down and opens the comment field with focus so the correction follows. One verdict per user per post, replaceable. Done when both gestures write the row and thumbs down lands the cursor in the comment field. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

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

Tapping Sign out on Profile shows “Signing out…” and never completes, so the user stays signed in.

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

Restyle it from the frames using the theme tokens and shared components: the title bar, the seven day bubbles as an empty row drawn from today's date, the card at rest, the expanded analysis block, the shimmer with its traffic line, the no-food card, the could-not-be-analysed card, the caption-only card drawn with the results card component, and the empty state with the one-time tooltip over the +. The analysis block from #12 is on main, and this item restyles it to the frame. Done when every state matches the frames at 390 px wide in light mode from tokens and shared components, and a new post still fills in without a refresh. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #6 Capture screen matches the designer's frame

The capture sheet renders unstyled.

Restyle it from the frame using the theme tokens and shared components: the dark sheet, the top bar, the camera area, the shutter and gallery buttons, the thumbnail strip, the caption field, the location line as static copy, and the Post button. After a successful post the sheet sends a post-created event before it closes, which later items listen for. Done when the sheet matches the frame at 390 px wide and a post still completes.

### #108 The app fits an iPhone screen when installed to the home screen

Installed to an iPhone home screen, the app collides with the system: the clock overlaps content and the bottom bar is clipped.

The owner's screenshot shows the clipped bar. The installed app does not respect the status bar, the notch or the home indicator. Set viewport-fit=cover and pad the header, the bottom bar and every sheet with env(safe-area-inset-\*). Done when nothing overlaps the clock or the home indicator at 390x844 and 430x932. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #196 The coder signs in to production as the test account with no person involved

Ordinary production sign-in now works for the coder; the required autonomous production meal-post/feed proof remains outstanding.

The Oct 28 planner report about password-entry refusal was checked and proved false: ordinary form sign-in succeeded. The pending helper is cookie-only; the owner removed the unnecessary generated-link fallback. No human sign-in step is required for the configured test accounts. The owner's rule is that a test run needs no human step. Make the test account's sign-in work for the coder from start to finish. Done when the coder signs in to production as the test account, posts a meal and reaches the feed with no person involved, and the page looks and the demo script run the same way. Oct 30: the coder signed in on production through the helper and posted with no person involved; the issue was closed on Oct 31 on that evidence. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #193 Page looks for every screen against the designer's frames

No screen has been compared with the designer's frames, and the intake control and the barcode scanner have no frame at all.

Capture every screen at 390x844 on production and list the differences per screen, and check the intake and barcode copy against the banned wording (past tense, no budget, no progress, no "left"). Done when the differences are listed per screen and the fixes are merged.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196; the owner adds what he feels on his phone, because emulation cannot show that. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items, and the owner's own list has no open entry.

## Late features

### #22 Web Push when an analysis is ready or a question is waiting

When the user has left the app, the only way they learn the analysis landed is a push notification.

Register a Web Push subscription on first post (not at sign-up), store it keyed by user, and send "Your meal is ready" with the post thumbnail when the worker sets ready; send the question text when it sets needs\_input. iOS requires the PWA to be installed to the home screen for push, so the subscription prompt appears only when installed. The coder stopped PR #94 after six review rounds: the open P1 is that a late subscribe request can recreate a subscription after sign-out, which needs a server-side revocation design and a change to migration 0012 (not applied). Decision pending: waive that P1 if the push payload carries no meal content and a new subscription takes over an endpoint, or drop push. Done when a post placed, then the app backgrounded, produces a notification that opens the post. Reconciliation, Oct 31: PR #94 is merged and issue #22 is closed. The older stopped-review account above is historical; it is not a current merge hold. Real-device delivery remains a production demonstration requirement. GitHub issue status at this reconciliation: closed; this supplied entry is retained as context, not open implementation work.

### #23 One-time hint tooltips for the + sheet, the thread and the thumbs

The three things a new user has never seen are the + sheet, the thread label and the thumbs, and nothing tells them what these are.

On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Done when a fresh account sees exactly three tooltips across its first session.

### #168 Desktop browser layout

The app is a phone-width column and is awkward in a desktop browser.

At 1024 px and wider, use a centred feed column, replace the bottom bar with a side or top navigation, open post detail beside the feed, support keyboard navigation, and capture by webcam or file upload. Done when the feed, detail, capture, Days, Search and Profile are usable with a mouse and keyboard at 1280x800 and 1920x1080 with no horizontal scroll.

### #169 Agent surface: an MCP server and documented HTTP API

Agents cannot log or read meals; the app has no programmatic interface.

Add a streamable-HTTP MCP at /mcp with log\_meal, list\_meals, get\_meal and correct\_meal, authenticated by a per-user revocable token created from a "Connect an agent" row on Profile and rate-limited. Records only, past tense, no targets, no weight or exercise tools. Done when an MCP client logs a caption-only "coffee" with a past eaten-at and reads it back, a second user's token cannot read it, a revoked token is refused, and docs/agents.md documents setup.

### A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

The owner ruled on Oct 31 that this waits until the fleet work is done and is not part of Run 4. What is known: the bonus names Muse Spark Open and Muse Glimmer; Modal approved $100 of hackathon credit for the owner and hosts a Muse Spark Open endpoint billed per token; no Modal credential exists in the coder's environment or in production (MODAL_TOKEN_ID and MODAL_TOKEN_SECRET are the missing names). The model names are hardcoded in the Meta client and the ten-photo harness cannot choose a model host, so a trial needs a throwaway clone that swaps only the identify-and-portions call and leaves SAM and transcription on the Meta API. Runtime models stay Meta models only. The trial compares the ten meal photos and one "I ate half the rice" caption against the current path with the USDA lookup unchanged, spends at most 5 US dollars, and changes nothing in production. Done when the results are in docs and the owner decides whether any open-model feature ships before the Nov 3 freeze.

## Submission

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

The coder's read-only assessment of main on 2026-10-28 found no committed secret, and the owner ruled that nothing is removed or scrubbed during the build. After the last feature merges, one pass replaces the default README with a short start-here page and the owner records which working files (the agents' contracts, the Wall of Stupid file, the review policy and the review tools) stay on main. Done when the README is the start-here page, the owner has recorded which files stay, and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep.

### #26 Demo video under three minutes and the submission write-up

The submission needs a public repo, a video, and a write-up that names what was built during the event.

The owner records the video on Nov 4; the write-up goes in README.md. Script: open on the Cal AI timeline ("50 screens and 22 minutes before my first log, 11:45 to 12:07"), cut to sign-in → camera → post in ten seconds, show the SAM outlines on the detail, make a correction and show the thread keeping both versions, show the needs-input strip, close on Days. The write-up states everything was built Oct 26 to Nov 4 on the Meta Model API with SAM 3.1 and Muse Spark 1.3, lists the three Meta model calls, and says what the app does not do. Done when the video is under three minutes and the write-up is in README.md.

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

† **What this backlog is.**The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is generated from the same open issues, so the coder and the planner read the same list. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. This owner-supplied handover snapshot retains completed entries as labelled context; fresh GitHub status distinguishes them from open work. An item stays until its issue is closed by a merged pull request, except where the owner explicitly retains a separate production acceptance check; the Blocked section holds items that cannot be worked on and says why. Designer items come first, and engineering items are grouped by the pass that will work them together, not by issue number or date.

Every item is a title line and two paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the three parts. The three parts are: (1) a title a person can read; (2) a first paragraph in plain language that states the problem; (3) a second paragraph with the minimum context a person needs to solve the problem unaided, meaning what investigation, work or the owner's observations have established, ending in a done condition. Neither paragraph is a dump of everything known. An item without all three parts is not on the backlog.
