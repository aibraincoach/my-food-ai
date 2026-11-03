# My Food AI — Backlog†

Last edited: Tuesday 2026-11-03 at 09:42 WIB (UTC+07:00) by Claude, PM

Standing rulings from the owner:

- A head refreshed from main with no code change of its own merges without a new order (Nov 2, 23:21 WIB).
- A refresh with a code change needs a fresh review first (Nov 2, 23:21 WIB).
- Every feature built is in the video (Nov 2, 23:21 WIB).
- The freeze is Tue Nov 3 at 23:59 WIB.
- \#189, #226, #230 and #273 are resolved, and the owner will not check food totals (Nov 3, 08:03 WIB).
- All working files stay in the public repository (Nov 3, 08:05 WIB).
- \#221 and #22 are closed (Nov 3, 08:06 WIB).
- The owner records the video on his own account (Nov 3, 09:41 WIB).

## In Flight&#32;

These items are in the Run 7 plan (approved Nov 3, 07:30 WIB). The Engineering backlog holds the open work the plan does not build.

### #222 The feed fails to open, and photos and cards take too long to appear

On a large account the feed sometimes shows an error or never appears, and when it does open, photos and cards take a long time to show, so the app feels broken and slow.

You saw ten seconds of nothing after opening the app on Nov 2 at about 17:00 WIB. That was before Run 6 merged. The coder also saw an intermittent feed error that day (code 2161345913). On Nov 3 the coder opened the feed on production at 2624204 a hundred times. Three openings showed a server error (digest 3642131196). Fifteen showed no feed after 45 seconds. All of these were on the larger feed, and the last 12 openings all failed. On Nov 3 at 08:09 WIB the feed took about a minute to appear on a cold start. The runtime logs return 403 for the coder, and only your Vercel console holds the stack. Reading the code, the coder found four things. One opening fires about 120 to 160 concurrent requests. The day-totals refresh re-reads every loaded day, so the cost grows with the feed. The three digest errors were thrown in the server render of Home's last-five-days totals. The blank openings were client requests that never settled. The per-day read added in #296 and the service worker are cleared as causes. A code review of Nov 3 found more causes of the slow cold open. They are the first items in the Engineering backlog, marked part of #222. No fix has been made. The feed sizes as of Nov 1 were 146 posts on the first test account, 5 on the second and 20 on yours. Done when the feed opens every time in a hundred controlled openings on the largest test account, the first photo of the feed shows within two seconds on a phone over mobile data, the feed shows something within two seconds of opening the app, and the sizes and times before and after are in docs.

### #304 The app opens on the last feed it showed and updates behind it

Opening the app shows a blank screen until the server answers, and the owner reports ten seconds with nothing on it.

You reported this on Nov 2 and you see it every day on your phone. The service worker (public/sw.js) loads each page from the network first. It never shows the last signed-in feed while it waits. It falls back to a cached anonymous page only when the request fails outright (the coder's source check of Nov 2). That may explain the blank screen, but it is not proven. The fix is to show the last feed the phone received at once, then replace it with fresh posts when they arrive. Nothing the user taps may wait for the refresh. This sits next to #222. Done when opening the installed app on a throttled connection shows the last feed within two seconds, and the new posts appear behind it without the page jumping.

### #305 The first card's photo loads first and the photos below it wait

On a slow connection the first card's photo arrives late, and nobody has shown whether the photos below it are the reason.

The sampled feed image is 152,193 bytes and its response carries no Cache-Control header (docs/media-loading.md), so several cards cost megabytes on mobile data and a revisit downloads them again. Load the first card's photo with priority, load the others as the user scrolls toward them, and let the phone keep photos between visits. Whether the feed already loads lazily is not known, so observe first. Done when the first photo of the feed shows within two seconds on mobile data, the photos below it do not delay it, and a second visit loads the same photos from the phone.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

The bonus names Muse Spark Open and Muse Glimmer. You ruled on Nov 2 at 23:21 WIB that the trial is attempted before the freeze. Baseten selected you on Oct 28 with $100 in credits and up to 2M tokens per minute. The model is meta-models/muse-spark-open-1026, served through an OpenAI-compatible endpoint at https://inference.baseten.co/v1. It always reasons, so output caps that include reasoning need checking. Modal's $100 code failed (see #288). Fireworks is unconfirmed. The model names are hardcoded in the Meta client, and the ten-photo harness cannot choose a model host. The trial needs a throwaway clone that swaps only the identify-and-portions call. SAM and transcription stay on the Meta API. The trial compares the ten meal photos and one "I ate half the rice" caption against the current path. The USDA lookup is unchanged. The trial spends at most 5 US dollars. A throwaway clone proves the model only. A qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Done when a real, switchable path on main runs the identify-and-portions step on Muse Spark Open through Baseten, the model ID is logged, the results against the ten photos are in docs, and you have seen it work on production.

### #288 The coder must confirm it can sign in to Baseten

The open-weights trial (#281) cannot start until the coder can use the Baseten key.

Baseten selected you on Oct 28 with $100 in credits and up to 2M tokens per minute. The model is meta-models/muse-spark-open-1026, served through an OpenAI-compatible endpoint at https://inference.baseten.co/v1. The key works only with that model. You say you gave the key to the coder and the planner. Modal's $100 code failed on Nov 2 ("maximum number of redemptions"). Its dashboard shows $30.00, so you chose Baseten for now. The key never goes in the repository, an issue or this backlog, because the coder copies this backlog into the public repository. Done when the coder confirms the trial can sign in to Baseten.

### #316 The Facebook button is shown grayed out and does nothing

A judge who taps the Facebook button on the sign-in page would see an error, because the Facebook app is in Development mode.

The owner ruled on Nov 2 at 23:21 WIB that the button stays on the page for show, is grayed out, and does nothing when tapped. Facebook sign-in cannot go live for the hackathon because Meta's app review takes longer than the event (#114). Done when the Facebook button on the sign-in and sign-up pages is grayed out, tapping it does nothing, and no error shows.

### #306 Every tap that saves shows its result at once

Some taps that save something look dead until the server answers, so the app feels slow.

The thumbs (#215) are the first case the owner found, and he reports the same clunk across the app. The bookmark, Save meal, Log again and Edit caption (#223) are the likely others; which of them wait for the server is not known, so observe first. Each should show its new state at the tap, settle when the save lands, and show an error and revert if it fails. #217 measures every control; this item fixes the ones that wait. Done when each of those taps changes the screen before the server answers on a throttled connection, the saved state survives a reload, and a failed save is shown.

### #307 A card shows the foods the app has found while the numbers are still being worked out

A new post shows a shimmer for most of its wait, though the app knows what the foods are long before it knows their nutrition.

Production timings of Nov 1 show identification finishing in 3.3 to 8.1 seconds while the active worker time of the whole job was 16.5 to 25.2 seconds (docs/production-performance.md), so for most of the wait the foods are known and only their nutrition is missing. Show the food names as soon as identification finishes, fill in each food's nutrition as it lands, and keep the total unavailable until all of it is in. Every wording and claims rule stays. Done when a post made on production shows its food names before its totals are ready, and no total appears until all of its foods are calculated.

### #139 A held worker lease renews for its full time

A worker that renews its lease does not actually extend it, so a long job can lose the lease while it is still running.

The coder found this in the lease SQL; a 300-second time-to-live against about 60 seconds of work hides it today. Fix the renewal and add a test. Done when a lease held past its first term is still held and a test proves it.

### #282 The live app keeps working while judges use it

Judging runs Nov 4 to Nov 8, and if the Meta API credits run out first, a judge who posts a meal sees a failed analysis.

The Meta credits and USDA's rate limit can both run out while judges use the app. The console on Nov 2 showed $134.29 of free credits, two payment methods on file and no end date. You were told the hackathon credits do not extend through judging, and that spend alerts are not hard caps. Whether a card bills after the free credits end is unconfirmed. The 16-food gate alone made 38 model calls and 69,169 output tokens. USDA FoodData Central allows 1,000 requests an hour. The twenty-post drain made 94 requests, 4.7 per meal. That allows roughly 200 meals an hour. The sushi photo needs up to 36 requests when cold. When USDA answers 429, the worker retries at 30 and 60 seconds, ignores Retry-After and then fails the post (the planner's reading of the coder's report of Nov 2). Done when a post made while the Meta Model API refuses a call, or while USDA answers 429, shows the user a clear message and can be retried, and a USDA 429 waits as USDA asks.

### #287 The README shows judges the three Meta models, the technical depth and what the app does not do

A judge reads the repository and watches the video, and the README does not yet put in front of them the evidence the four scoring criteria ask for.

The hackathon scores Impact 30%, Use of Meta AI Tooling 25%, Demo 25% and Technical Depth 20% (Guide section 8, from the hackathon rules reference; the PM has not read the Guide first-hand). The README must show judges evidence for each. It names SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, with the job each does and where its model ID is logged. It summarises what was built from Oct 26 to Nov 4. The evidence is the test count, the ten-photo evaluation with its stated limits, the real-model gates, the worker timing and the item history that keeps every correction. It says plainly that the app records what was eaten. It never advises, sets no targets and makes no health claims, because the hackathon's anti-project list names nutrition coaching. It states only what the coder's reports prove. It carries no private account detail. Done when the README has those parts and each claim links to its evidence. Your read of it is #318.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

The coder's read-only check of main on Oct 28 found no committed secret. You ruled that nothing is removed or scrubbed during the build. After the last feature merges, one pass replaces the default README with a short start-here page (#287). You ruled on Nov 3 at 08:05 WIB that all working files stay on main, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Done when the README is the start-here page, and a search of main for host names, account identifiers and billing detail returns only what you chose to keep.

## Backlog for Owner

### #212 Barcode and nutrition-label scanning is untested on a phone

You can log a packaged food from its barcode or nutrition label, but nobody has tried it on a phone with a real pack. Every check so far ran in emulation.

The capture sheet now switches between Photo, Barcode and Text by swiping (PR #298). A barcode photographed in Photo mode is also read. The app decodes the barcode from the image first and looks up the digits. It uses the model only when it finds no barcode, and for labels. Photograph a real pack's barcode through the capture sheet. The card should show the product's name, its nutrition and the pack photo. Then photograph a nutrition label. It should give the same kind of card. Done when both give a correct card on your phone.

### #285 Test the half-eaten plate again on your phone

The app uses a leftovers photo to work out how much you ate. Nobody has confirmed on a phone that the consumed number is right.

Photograph a meal before and after you eat it, then look at the consumed number. If it is wrong, tell the coder. Each failure gives the fleet another data point. The video includes the not-eaten plate (ruled Nov 2), so this has to work first. On Nov 3 you ate a plate of pineapple and papaya, left one piece of papaya and logged it. You said the app was very slow. You have not said whether the consumed number was right. Done when a fresh before-and-after test gives the right consumed number. If it does not, the plate stays out of the video.

### #318 Read the README before recording

Judges read the README first. You have not read it yet.

The coder writes it in Run 7 (#287). Read it after it merges. Done when you have read it and listed anything wrong.

### #26 The demo video and the submission do not exist yet

Nothing is submitted until you record the video and submit it. The submission is due Nov 5 at 09:00 WIB.

The submission needs the public repository, the video link and a list of everyone who worked on it, by Nov 4 at 9 PM EST (Nov 5 at 09:00 WIB). Judges stop watching at three minutes. You ruled on Nov 2 that every feature built is in the video, the not-eaten plate included, and that you need no script from the PM. The Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8. Post the video to X as soon as it exists. Whether the post must exist before the submission deadline is unconfirmed. No merges or deploys run from the start of recording until the submission is in. Done when a video under three minutes is on X and the submission is in.

## Backlog for Designer

### #289 Frames for logging a drink by photo, by tap or by caption

The card for a drink does not show a can of cola's caffeine, and logging a drink does not feel smooth.

You photographed a can of Coca-Cola on Nov 2. It counted as caffeine, but its card shows none. You do not want people pushed down one flow. A photo of a coffee, a photo of a glass of water, a tap on the drink sheet and a caption must each work. A photo of water is estimated and added to hydration. A photo of a caffeine-forward drink is estimated, added and shows its caffeine on the card. One photo can hold several drinks, as when a bodybuilder lines up five before a workout. The card must show every drink and its caffeine. You name High Coffee as a reference for logging caffeine smoothly and WaterMinder for logging liquids. Records only, past tense, no targets, no ring or percentage. Done when frames at 390x844 are delivered for the drink card with its caffeine, a photo of water, a photo of a can, a photo with several drinks, a quick tap and the drink sheet.

### #290 Frames for the capture sheet's modes with Barcode as an obvious choice

People cannot tell that the app scans barcodes, because the Barcode choice is easy to miss.

You ruled on Oct 29 to keep a Barcode toggle. On Nov 2 you asked for the modes to be reached by swiping, with Barcode an obvious option. That advertises the feature without forcing anyone down it. A photo is still a photo (#212). Done when frames at 390x844 are delivered for the capture sheet showing the swipe between modes, Barcode selected, and a first-time hint.

### #291 Frames for removing and redoing

A user cannot take back something added to a post, and nothing shows how to remove a post.

You asked on Nov 2 about deleting an item and its result so people can redo it. The small cases are a leftovers photo or a correction added by mistake. The large case is a whole post. #174 adds Delete to the post menu. Done when frames at 390x844 are delivered for deleting a post with its confirmation, removing a leftovers photo or a correction from a post, and the post after either.

### #108 The installed app overlaps the iPhone clock and home indicator

Installed to an iPhone home screen, the clock overlaps content and the bottom bar is clipped.

Your screenshot shows the clipped bar. The installed app does not respect the status bar, the notch or the home indicator. The designer draws the header, the bottom bar and every sheet inside the safe areas, so that nothing overlaps the clock or the home indicator. Engineering then builds it with viewport-fit=cover and env(safe-area-inset-\*) padding. Done when frames at 390x844 and 430x932 show the header, the bottom bar and every sheet inside the safe areas.

## Engineering backlog

### The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

A code review of Nov 3 found this. It is a report that the coder has not verified. The tick route statically imports the worker drain. The drain statically imports all six job modules. Those pull in the food-analysis pipeline, the Meta model SDK, the SAM parser, the PNG library and the push library. The files are src/app/api/jobs/tick/route.ts, src/lib/worker/handlers.ts and src/components/QueueTicker.tsx. The suggested fix loads each job module with a dynamic import inside the job runner, keyed by job kind, so tick boots with only the queue code. Tests pass their own job table and are untouched. This change touches the worker path, so it needs a deploy and a real phone check before the demo. Done when a cold tick call answers without loading the job modules, and the cold open times before and after are in docs.

### Every protected page checks sign-in twice (part of #222)

The middleware calls Supabase to verify the user. The home page then calls Supabase to verify the user again. That is two round trips on every page open, on top of the cold function boot.

The code review of Nov 3 found this (src/middleware.ts, src/app/(tabs)/page.tsx). The suggested fix has the middleware write the verified user id into a request header that it overwrites unconditionally. Pages read that header and skip the second check. The middleware still validates the token, so a client cannot fake the header. API routes are not matched by the middleware, so they keep their own check. Done when a page open makes one sign-in call, and an unsigned request still cannot reach a protected page.

### Home computes the day totals twice on every open (part of #222)

The server renders the row of day bubbles with totals for the last 5 days. The browser feed then computes totals again for the feed's days. Today's totals are queried twice on every home open.

The code review of Nov 3 found this (src/app/(tabs)/page.tsx, src/components/Feed.tsx). The suggested fix passes the server's totals into the feed and skips the feed's own call for days already covered. It overlaps the Run 7 change that bounds refreshTotals. Done when a home open queries today's totals once.

### The Vercel and Supabase regions may be far from Jakarta (part of #222)

If the Vercel functions and the Supabase project run in the US, every open from Jakarta pays that distance on every request. Nobody has checked the regions.

The code review of Nov 3 could not see either region from the repository. It says this may be the biggest single cost on every open. It also found that a fresh deploy from the repository alone gets different timeouts and regions than production. vercel.json contains only an ignore rule. Only the tick route sets a 300-second limit in code. The production 300-second setting is recorded only as a comment saying it was verified through an admin interface on Oct 27 (src/lib/meta/client.ts). Find both regions. Then declare the regions and timeouts in the deployment config and the route files. Done when both regions are reported, and the repository declares the regions and timeouts that production uses.

### Fonts ship as four full TrueType files, about 390KB (part of #222)

First paint on a phone downloads up to 390KB of font files. Four Manrope weights, about 97KB each, are served as they are.

The code review of Nov 3 found this (src/lib/theme/font.ts, src/assets/fonts/). The font loader does not convert the files to the smaller web format or trim unused characters. The suggested fix converts them to the web format and trims them to the Latin character set. Done when first paint downloads the fonts at a much smaller size, the text looks the same, and the sizes before and after are in docs.

### The Days page runs a query for every meal

The Days reader fetches the month's posts. Then it runs an items query and a photo query for each post, in batches of 8. A month with 40 meals costs about 80 extra queries, plus a signed web address call per photo. The page gets slower the more the app is used.

The code review of Nov 3 found this (src/lib/posts/days.ts). The month summary in the same file does the same job in one joined query. The suggested fix gives the Days reader the same shape. Done when the Days page for a month loads with a fixed number of queries, however many meals it holds.

### The spending routes have no per-user call cap

Only the agent-token routes cap calls, at 60. The label reader, voice transcription, food search and post creation routes have no per-user cap. A stuck loop calling the label reader burns one Meta model call per hit with nothing to stop it. The same holds for transcription and food search quota.

All of these routes require sign-in, so this is about a runaway client, not anonymous abuse (src/lib/agents/tokens.ts, src/app/api/label/read/route.ts, src/app/api/transcribe/route.ts). The suggested fix reuses the agent-token call-count pattern as a per-user cap on the spending routes. Done when a loop calling each of those routes is refused after the cap.

### Upload signing accepts invalid shot sizes and positions

The upload route writes the caller's position, width and height straight into the media rows. A caller can store position -1 or 9999, width 0, or duplicate positions. Later code assumes sane values for ordering and display, so crafted uploads can order or display oddly.

The code review of Nov 3 found this (src/app/api/media/sign-upload/route.ts). The suggested fix rejects negative positions, zero sizes and duplicate positions. Done when each of those uploads is refused.

### No loading screen appears when you move between screens

When you move between screens, nothing shows until the next screen is ready. On a slow open this looks like a frozen app.

The code review of Nov 3 left this out as a smaller item. Done when each tab shows a loading state at once while its page loads.

### The health endpoint cannot tell whether the app works

The health endpoint reports only whether the configuration names are set. It does not tell whether the database or the model path works.

The code review of Nov 3 left this out as a smaller item. Done when the health endpoint reports whether the database and the model path answer.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

Supabase Auth limits requests per IP address and supports the hCaptcha and Cloudflare Turnstile CAPTCHAs (Supabase docs), and some of its limits can be changed in the dashboard. Nobody has recorded what the production project has set, whether a CAPTCHA is on, or whether a new account's posts, which spend Meta credits, are limited. Observe first: report the Auth limits the production project has set, the CAPTCHA state, what a script that sends sign-ups and sign-ins faster than a person receives, and how many posts a new account can make. The planner cut this item on Nov 3 because a hammering test against production could lock out the demo accounts, so the test must not use the demo accounts and no limit may lock them out. Done when those are reported and a script that hammers sign-up and sign-in is refused.

### #192 The photo flickers while a post is processed

While a post is being processed, its photo flickers, flashes and reloads over and over. It looks broken.

You reported this on Oct 29. A planner report of Oct 27 said each card subscribes to its row and polls every 3 seconds while the post is unsettled. The cause is not known. Run 6's #299 evidence showed the photo loading once on production. Observe first, then fix. Done when a post made on production shows its photo with no flicker or reload from posting until it is ready.

### #216 Sign out never finishes

Tapping Sign out on Profile shows "Signing out…" and never completes. The user stays signed in.

The owner reported this on Oct 29 at 15:09 on production, in desktop Chrome, on an account just created. Signing out of an earlier account had worked a few minutes before. Nobody has reproduced it since. The investigator's code read of Nov 3 found a failure message in SignOutButton.tsx ("Could not sign out. Try again."), so a hang is not a handled failure. The cause is not known. Reproduce it on production in desktop Chrome with a new account and an older one. Done when Sign out signs the user out and returns them to the sign-in page on both, and a failure shows a message instead of waiting forever.

### #223 Check that an edited caption shows everywhere

On Oct 29 the owner's caption ended in a stray "R" that he did not want, and he could not change it.

"Edit caption" is now in the post menu (PostMenu.tsx), and Run 7 makes the save instant (#306). Editing the caption does not re-run the estimate or change the items. Check it on production with a test account. Done when an edited caption shows its new text on the feed card, post detail, Days and Search after a reload on production.

### #228 A meal summary may state numbers that differ from the calculated totals

Written text on a card could state calorie or macro numbers that differ from the calculated totals.

A ChatGPT code review of Oct 29 made two claims. The model-written summary is checked for wording but not compared with the calculated totals. A formatter that works from the totals already exists. Nobody has verified either claim. First read the summary code and try to produce a summary whose number differs from the totals. Then report. If it can differ, publish only nutrition text formatted from the totals. Leave the caption's own numbers (such as "two eggs") alone. Make every screen that shows these numbers agree after rounding. Done when a model summary saying 900 kcal against calculated totals of 600 kcal publishes 600 everywhere, or the report shows it cannot happen.

### #272 The food matcher gives different answers for the same words

The same words for a food can match different references from one call to the next, and one miss turns a whole meal's total into unavailable.

The coder's probes of Nov 2 (report of 14:05 WIB) recorded the matcher's reason for every match. Identical lowercase input selected different references across calls. So the variation is in the choice, not only in capital letters. The dipping sauce matched "Dip, NFS" at 432 kcal per 100 g, about 130 kcal for 30 g. The planner reported earlier that a cheeseburger with lettuce, tomato, onion and pickle matched in one answer and not in another. Its total of 1,296 kcal became unavailable, with a known subtotal of 467 kcal. No fix has been made. Done when the same words give the same match on repeated calls, or you decide to keep the variation and keep these foods out of the demo.

### #65 The pipeline's tests cannot run offline

Nothing exercises the analysis pipeline without a live key and live credit.

Meta's workshop repository ships a scripted offline model for its tests. It is a real OpenAI client whose requests never leave the machine. It answers from recorded outputs, including recorded SAM outputs, and it can refuse a request with a 400. The coder's investigation of Nov 3 found that a fake already exists in tests/fake-meta. MODEL\_API\_BASE\_URL is already wired into the client. Only the tests that use the fake are missing. Done when the path from a posted meal to ready, a correction, a 400 failing a job at once and a 429 retrying all run in the test suite with no network and no key.

### #66 Nothing tests that a brief Meta rate limit is retried

A brief rate limit from the Meta Model API should not cost a job attempt, and no test shows that it does not.

Meta's workshop client sets four retries and a 180-second timeout on the OpenAI SDK client. The SDK waits as long as the API asks on a 429 or a 503. The coder's investigation of Nov 3 found that our client already sets its retry count and timeout explicitly in one file (client.ts). Only the test is missing. Done when a test through the fake API shows that a 429 which carries a wait is retried inside one job attempt.

### #294 The app's words read naturally everywhere

The leftovers label reads awkwardly, and nobody has reviewed the words in the rest of the app.

The owner said on Nov 2 that "leftovers (not eaten)" is janky. The planner reviews the app's terms with AGY as a second opinion and lists each term, where it appears and a recommended replacement. The terms include the leftovers label, "Consumed", "Log again", "Saved meals", "Additional food", the needs-input question and the Days names. Every rule stays: consumed past tense, no target, goal, ring or percentage, and no "left" as a word for a remaining amount. Done when the list is reviewed, the owner has ruled on each term, and the wording is changed everywhere it appears.

### #107 Every card has a visible way to open post detail

A new user has to guess that tapping a card's text opens the meal's detail view. Nothing on the card says so.

The detail view is where the SAM outlines, the full nutrition table and item editing live, so a user who never finds it never sees where the numbers came from. Add a "Details ›" control on every card, and make the photo and the analysis block tappable too. Done when a new user opens detail without being told how.

### #175 Days shows days that hold only water or caffeine

A day on which only water or caffeine was logged shows nothing on Days.

Water and caffeine are intake entries and are allowed; weight and exercise are not. Done when such a day appears on Days with a marker.

### #224 Times on a card are in the user's own time zone

A post shows its time twice in two different zones, one labelled UTC and one in local time.

The owner's screenshot of Oct 29 at 17:29 JST shows the card header "CONSUMED · 8:20 AM UTC" above a caption stamped 5:20 PM for the same post; he is in Japan. The coder's investigation of Nov 3 found no UTC label in the current card and detail components, so the cause may have moved; observe first. Show every time in the device's time zone: card header, post detail, the thread and the Days stories. Done when a post made at 5:20 PM in Japan reads 5:20 PM everywhere a time shows, and no screen labels a time UTC.

### #215 Thumbs up and down respond at the tap

The thumbs-up and thumbs-down buttons look dead when tapped, the change shows up some time later, and they feel clunky.

The owner reported this on Oct 29 while using the app. The cause is not known; a likely one is that the button waits for the server before it shows anything, but verify that by observation. Fix it so the button shows its pressed state at the tap, settles when the verdict is saved, and shows an error and reverts if the save fails. Done when a tap on either thumb changes the button visibly before the server answers on production, the saved verdict survives a reload, and a failed save is shown.

### #29 Rendered results-card image added to each post's carousel

Not every post has a photo, and a photo post loses its numbers once the analysis is one line of small type.

The coder's investigation of Nov 3 found this built. results-card.tsx renders the card from the stored items and totals and stores it as a post\_media row of kind card. Caption-only posts use the card as their image. Only acceptance remains. The card is a clean square with item names, portions and totals in the app's type and colours. Code renders it from data, not an image-generation model, because this build is limited to SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0. It uses consumed wording only, with no goal, rings or percentages. It is regenerated when a correction supersedes the items. Done when a logged photo shows the photo and then the card as swipeable slides, a caption-only post shows the card as its image, and a correction changes the numbers on the card.

### #283 A saved card image shows its whole footer

A results card saved as a PNG cuts off its footer.

The coder found this on Nov 2 while checking saved cards after PR #271 (his report of 14:44 WIB). Which footers clip, on which cards, and whether the card image shown in the feed clips too are not known. Observe first, then fix. Done when a saved card's PNG shows its footer in full for a meal with one photo and for a meal with leftovers photos.

### #18 Days stories row and month grid of past posts

A user cannot look back over what they ate on earlier days.

The row at the top of Home is seven day bubbles, today on the right, each showing the day's first photo or a blank ring if nothing was eaten. Tapping a day plays that day's posts full screen in sequence with tap-to-advance and swipe-left/right between days, and the last card shows "Consumed on Tuesday: 1,840 kcal" with the macro line. A sum of what was eaten is a record, not a goal; no comparison to any other day, no average, no target. The Days tab in the bottom bar opens a month grid that scrolls back. Done when a week with three logged days plays as three stories and the bubbles match.

### #20 Profile grid of the user's post thumbnails with sign out

Profile gives a user no overview of their own posts.

Show a grid of post thumbnails, newest first, three across; tapping one opens the detail. Above it the handle and a Sign out button. Nothing else: no weight, no streak, no badge, no count of anything beyond posts. Done when the grid loads the user's posts and nothing on the screen suggests progress toward anything.

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

### #193 Page looks for every screen against the designer's frames

No screen has been compared with the designer's frames, and the intake control and the barcode scanner have no frame at all.

Capture every screen at 390x844 on production and list the differences per screen, and check the intake and barcode copy against the banned wording (past tense, no budget, no progress, no "left"). Done when the differences are listed per screen and the fixes are merged.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items.

### #23 One-time hint tooltips for the + sheet, the thread and the thumbs

The three things a new user has never seen are the + sheet, the thread label and the thumbs, and nothing tells them what these are.

On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Done when a fresh account sees exactly three tooltips across its first session.

## Interdit (Not part of Hackathon)

### #114 Facebook Login in production mode

Public sign-in with Facebook needs the app submitted for Meta app review, which takes longer than the event.

Blocked by Meta app review. Dev mode works for the developer's own and test accounts, which is enough for the demo. The owner wants the Facebook button on the sign-in page for show and does not intend it to go live for the hackathon. Facebook Login is the Meta sign-in that exists and Supabase supports it. While a Facebook app is in Development mode only people with a role on the app can sign in, and everyone else sees an "App Not Setup" error (Supabase docs), so a judge who taps the button would see an error. Instagram has no sign-in for consumer apps: Meta shut the Instagram Basic Display API on Dec 4, 2024 and tells developers to use Facebook Login for authentication, and its newer Instagram login serves business and creator accounts. No Instagram button is added, and no separate Meta-account sign-in was found. Whether the button shows today, and what a person without a role sees when tapping it, is not known. The owner ruled on Nov 2 at 23:21 WIB that the button is shown grayed out and does nothing; the item under Late features covers that. This item stays blocked because Meta app review still stands between the app and a working Facebook sign-in.

### #115 Dark mode

The app has no dark mode.

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

### #218 Hydration as a share of daily intake

The owner wants the app eventually to show how much of the user's daily intake is hydration.

Blocked until after the hackathon, and blocked by the claims rule: the app shows no percentage that reads as progress, and a share of intake is a percentage. The owner decides whether this one figure may break that rule. Done when the owner has lifted the rule for this figure and its design is drawn.

---

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. An item stays until its issue is closed by a merged pull request; the "Interdit (Not part of Hackathon)" section holds items that cannot be worked on and says why. Each section is for one role or one state: In Flight (the coder's items in the Run 7 plan), Backlog for Owner, Backlog for Designer and Engineering backlog, ordered within a section by the pass that will work them together, not by issue number or date.

Every item is a title line and two paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the three parts. The three parts are: (1) a title a person can read; (2) a first paragraph that states the problem in plain language and in enough depth that a person could fix it; (3) a second paragraph with all the context that helps a person solve the problem, meaning what investigation, work or the owner's observations have established, ending in a done condition. Neither paragraph is a dump of everything known. Write short sentences in the active voice, as the Google developer documentation style guide asks. An item without all three parts is not on the backlog.
