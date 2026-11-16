# My Food AI — Backlog†

Last edited: Monday 2026-11-16 at 16:38 WIB (UTC+07:00) by Claude, PM

The only job of the PM is to maintain this backlog and keep it completely up to date. Failing to do so is immediately terminable.

## Backlog for GrokBot

### #936 Check on production that finished meals are not re-read when Home opens

After the fix for #520, a cold Home open of finished meals should not read them again. Fleet 21 first measured three extra reads, then later evidence measured none.

On production, with six finished meals, a 15-second open made no /api/feed?ids= request. A local run earlier showed three reads for other seeded meals, and later source reads blamed old off-page discovery ids and measured zero on a fresh profile. The two results are not yet reconciled. Done when a cold Home open on the owner's account and on a test account makes no /api/feed?ids= request, and the earlier three reads are explained.

### #938 Check on production that the desktop failed-upload chip shows its Remove button

On desktop the failed-upload chip cut off its own Remove button, so a person could not discard a failed added photo.

Fleet 21 recorded the failure locally and a later local repair on #912 measured the button contained and tappable. Production acceptance was not checked. The broader item #684 stays open. Done when, at 1280 wide on production, a failed added-photo upload shows its whole Remove button and tapping it removes the upload.

## Engineering backlog

### #908 The Wall of Stupid mixes the rules that get an agent fired with the history of every failure

The Wall of Stupid holds dozens of incident rows, newest first, and the rules the agents must follow sit inside those rows. A new agent has to read the whole history to learn what gets it fired.

The owner ruled on Nov 15 that the Wall of Stupid becomes two files: a short operational rules list of what gets an agent fired, and a Wall of Stupid archive that keeps the incident history. The rules list's wording is not decided. The PM contract, the planner contract, CLAUDE.md and the handover skill refer to the Wall and must name the right file. The coder alone changes the Wall, from a prompt the PM supplies. Owner, Nov 16: this item comes first on the backlog, because an agent cannot operate without a short list of the rules that get it fired. Each rule in the list names the failure it prevents, its blast radius and how it changes operations, and points to the archive entries behind it by timestamp so the archive keeps the tally of failures. Owner, Nov 16 (comment): the operational rules list is the one document he gives every PM he fires, so it is renamed, and the new name is pm-operational-rules.md. Related: #699. Done when the repository holds an operational rules list and a Wall of Stupid archive, every standing rule in today's Wall is in one of them, each rule in the operational list names its failure, its blast radius and how it changes operations and cites its archive entries by timestamp, no incident row is lost, and the contracts, CLAUDE.md and the handover skill each name the right file, the operational rules list carries the name the owner gives it, and the handover skill gives that list, with this backlog's link, to every successor PM in every PM handover.

### The uploads folder in the checkout is a dump of generated packages nobody asked for

Files no agent needs pile up in the project's uploads folder, and every handover adds more. The owner called it a garbage dump on Nov 16 and ruled that nothing is kept there for convenience.

Coder report, Nov 16: the uploads folder held 2,945 files (277,979,813 bytes), all gitignored, none read by the app, the build or a live process. All thirteen groups were removed and the folder is empty, including a designer input zip, "My Food AI app design (3).zip", that the coder judged the owner's original. The 635-entry package from the outgoing PM's handover was already absent, and nobody can say who removed it. Open: the PM contract's handover clause and the Wall's rule that a handover is never a file may disagree with what the handover skill's pack script produces, and nothing yet stops the next handover from filling the folder again. Done when the handover skill no longer leaves packages in the checkout or the owner has named a file to keep, the PM contract's handover clause and the skill say the same thing, and the owner confirms the designer zip is not needed or has it back.

### Remnants of earlier coding sessions are removed (Nov 16), and no session yet cleans up after itself

Files, folders and processes that earlier sessions of this project left on the server are still there. The owner wants every one of them gone, and asks whether Node now runs on the server because he saw a node folder.

Coder report, Nov 16: Node does run on the server. The project's own Node processes were the test stack's two gateway and model stubs and a browser driver under /tmp/mfa-f21, all stopped now; no My Food AI Next.js server ran before or runs now. Node processes that remain belong to other tools (the OpenRig daemon, the OpenClaw gateway, two other-project stubs), so the shared Node install stays. Removed: the checkout's 672 MiB node_modules, .next and build caches, old handover and worktree residue, eight project directories under Artifacts, earlier Fleet 21 scratch, and four orphaned test Postgres servers: 97,961 files, about 3.03 GiB. Only the main checkout remains registered. Open: nothing yet makes a session clean up after itself, and local builds need dependencies installed again. Done when the planner contract or the handover skill states what a session removes when it ends, and the next fleet leaves nothing outside the main checkout.

### #523 A meal shows every nutrition value as unavailable

The meal "Spicy Indonesian macaroni" shows its calories, protein, carbs and fat as unavailable. The owner re-analysed it after the fix went live, and it is still broken. He says the app's food estimates are broken.

The first analysis searched the USDA database three times, rejected every record, and never tried the plain name "macaroni". Ruling: when the USDA has no record, the model must estimate, because an unavailable value is worse than a rough estimate. The closest-food fallback and the guard that stops re-analysing from reusing an empty result are both on main. 41 ready posts (95 item rows) had incomplete macros (docs/evidence/fix18/recompute-ids.json). The coder reports that at 09:11 WIB all 41 recompute jobs were done (the last at 08:59 WIB), that 40 posts now have complete nutrition including the macaroni post (86634d46), and that it closed the GitHub issue. One post, 6fad4a16, still lacks a value because its matched USDA record holds no number for that nutrient; whether to estimate it is undecided. The queue holds only three photo-cleanup jobs, which change no meal data. PM, Nov 14 (Chrome, owner account, read-only): the macaroni post 86634d46 shows 38 kcal, 1 g protein, 8 g carbs and 0 g fat, and its latest AI comment (Nov 4, 10:11 PM) names the closest USDA record, "Macaroni, vegetable, enriched, cooked". Two older comments on it still read unavailable. 0 g fat for a fried snack looks low. PM sweep, Nov 14 23:25 WIB, of all 137 posts the Home feed loaded on the owner account: two posts show "Nutrition unavailable" for one item while their totals show numbers (6fad4a16, the salami, which is the known exception, and f08e2e86, an unsalted butter packet, 541 kcal); 12 posts show a 0 g macro, and I did not judge which are real zeros (Hydro Coco Original at 0 g protein looks right); and post 6caf8906 (leftovers, 8:55 PM) reads "This photo could not be analysed. Try again". The macaroni fix reached the other posts. The coder decides f08e2e86 and 6caf8906. GrokBot, Nov 15, sweep of all 137 posts: the macaroni post now shows numbers and its AI comment names the closest USDA food. Still wrong: blank values on the butter post f08e2e86 and the Pocari post 89286fbf, a -1 g carbs value on post 38de279e, a leftovers post 189673aa that reads "unavailable kcal", sambal at 0 kcal in post 509ef9bc, bakpia e7e1782c at 0 g protein and fat, the pizza post 61b3a510 reading "unavailable kcal" for several minutes after two servings changes in a row (it recovered), and 28 meal pages that say "Nutrition unavailable", some of them when the calories and macros are known and only a minor nutrient such as sugar or fibre is missing (88d38425). Done when a browser helper confirms on the live app that the macaroni post shows numbers with a note naming the closest USDA food or saying the model estimated them, and that no ready post shows a value that is unavailable, zero or blank, except post 6fad4a16, which is listed with its reason.

### #695 A fix for the cached expired feed-photo redirect has never been seen working on production

A change that stops a phone keeping an expired feed-photo link is on main. Nobody has seen it work on the live app, so a blurry or broken photo could still stick.

Before the fix, the feed photo route answered with a redirect to a signed link that expires in 60 seconds and marked that redirect immutable for a year. Related: #639. GrokBot, Nov 15: the redirect carries no long-lived cache header and feed photos loaded on the next visit; the busy-resizer case was only approximated. Done when GrokBot confirms on production that a feed photo requested while the resizer is busy loads correctly on the next visit.

### #699 Our review and merge process has not been compared with the owner's other recent repositories

Nobody has measured how rigorous our review, merge and proof process is against the other repositories the owner works on right now. Fleet 18 shows the process has gaps.

Take the owner's most recently active repositories and compare them with this one, practice by practice: how a change is reviewed, who may merge and on what evidence, how proof that a change works is recorded, and what happens when a merge goes wrong. Observe first: list those repositories and write down each practice as it stands. Done when a written comparison lists each practice in those repositories next to ours, and each improvement worth making is its own item.

### #929 The Perplexity review route breaks whenever the website or the model behind it changes

Reviews of pull requests run through Perplexity's website, and both the page and the model behind it change without notice. A review then fails, comes back invalid or is judged on the wrong model, and the pull request waits with no review on its head. The owner's view on Nov 16 is that the route is built as if neither one ever changes.

The repository holds receipts for failed or invalid runs, such as docs/reviews/mfa-pplx-pr310-2d4142b-invalid-model.md, mfa-pplx-pr311-e7ece5c-invalid-input.md and mfa-pplx-pr312-9e5877b-invalid-model.md, and the Wall of Stupid entry of 2026-11-03 08:24 WIB records a run judged on the wrong model. Related: #699. Observe first: the coder lists every way a review is run today, every failure on record with its cause (page change, model change, input or quota) and which step of the route each one broke. Done when a written finding lists those, and a review route is in place that finishes with a result whichever model Perplexity offers that day and records the model each run used, or the owner has ruled on a different route.

### #930 Two time-format tests pass or fail with the machine's language setting, so the baseline of failing tests is wrong

The test suite on main has failures that depend on the computer running it and not on the code, so no one can say how many tests really fail.

The planner counted 692 tests with 28 failing on main. The coder measured 694 tests with 26 failing (Nov 16). The planner's account of the gap is that two time-format tests depend on the machine's locale and were counted as failures; the coder has not confirmed it. Related: #628. Observe first: run the suite on main under two locale settings and list every test whose result changes. Done when a written finding lists each locale-dependent test, each is fixed to give one result in any locale, and one failing-test count for main is written down.

### #924 There is no guide for reaching the MCP server, and tokens were deployed without instructions

A person who needs to connect to the app's MCP server has no written way to do it. Tokens exist, but nothing says where the server is, how to get a token or how to connect a client. The owner has ChatGPT unable to work out how to connect.

The owner reported on Nov 15 that tokens were deployed with no guideline or instruction manual. Which server, which tokens and who deployed them are not recorded in this backlog. Observe first: the coder lists the MCP server (where it runs, what tools it offers, how it authenticates) and every token deployed for it, and where each is documented. No token value goes into the repository, the issue or this backlog. Done when a written guide in the repository tells a person who has never seen the server how to get a token, where the server is and how to connect a client such as ChatGPT, and a client that follows only the guide connects and lists the tools.

### #712 The ten-photo receipt on main contradicts the reported failure

ten-photos.json on main shows pass true, 50 calls all HTTP 200, hour 23:00Z. A later run was reported failing on an hour check and a 401 sign-in on test account 2, and no receipt for that run is on main. One of the two describes a run with no receipt.

Related: #471. Done when the receipt that exists is named and the other claim is withdrawn or backed by a receipt.

### #715 Two review captures sit untracked in the repository

docs/reviews/mfa-pplx-pr670-9c37722-close.md and docs/reviews/mfa-pplx-pr677-close.md are untracked and have no decision.

Related: #670, #677. Done when each is committed as a receipt or deleted.

### #925 A draft pull request of readiness documents was opened in the repository without the owner knowing what it contains

An agent opened draft pull request #682 (branch docs/muse-readiness-pm-pack, seven Markdown files under docs/product/muse-readiness-pm-pack) holding a summary of a newsletter article about Meta's Muse launch, a 40-row launch scorecard and six candidate backlog items. The owner was handed the pack afterwards and had not seen what was in it.

The planner's Fleet 21 plan, written the same day, describes PR #682 as the docs branch that holds the two review captures named in #715. Both descriptions cannot be right. The pack also lists #370, #108 and #567 as open and #22 and #221 as closed, and none of those five is in this backlog, which belongs to the owner and the PM. The pack states that every scorecard result is unrun, that its thresholds are proposals, and that the article is a secondhand account of an interview; nobody has checked its statements against the code or the contracts. Observe first: read PR #682 on GitHub (author, branch, creation date, files), compare it with the review captures in #715, and read each of the seven files against README.md, docs/eval.md and docs/pm-contract.md. Done when a written finding says which pull request number holds which files, lists every statement in the pack that disagrees with the code or a contract, and the owner has ruled whether the pack stays in the repository, is corrected, or is removed.

### #926 Nobody has written down whether a newer Muse model helps or hurts My Food AI

My Food AI identifies foods, estimates portions and applies corrections with Meta's Muse models. A product that only wraps a model is replaced when the model improves; a product that owns something the model does not have gets better with it. Nobody has said which of My Food AI's steps a stronger model improves and which it makes unnecessary.

The owner raised the test from Greg Isenberg's 48 hours in San Francisco: when a new model comes out, does it help the company or hurt it? In the code, a food with no USDA match falls back to the closest generic record, then a rice-with-protein composition, then a model estimate (src/lib/fdc/match.ts lines 92 to 109). Several open items are model errors that a stronger model may remove: #617 (squid matched to tuna sushi), #523 (macaroni), #285 (consumed number from a leftovers photo) and #572 (fallback skipped after one search). Parts a general chat model with a camera does not have today include the trail that names the record or the estimate behind a number, the consumed-versus-leftover accounting, drink and caffeine records, and the user's own history. Observe first: list each step of a meal's path (identify the food, estimate the portion, match a record, estimate when none matches, work out the consumed amount, keep the history) and mark each step as removed, improved or unchanged by a stronger model. Done when a written finding lists every step with that mark, names the steps a stronger model replaces, and states what the product keeps that a general model does not.

### #927 The planner contract does not say to plan every item that can be planned, or to give a reason for each item skipped

The planner contract describes how a plan is written but not how many backlog items it must cover. The first Fleet 21 plan wrote exact text for 7 of the 73 items on the backlog it was given and left the rest, and the owner needed many further turns to get a plan that covered what could be planned.

The owner's rule: a planner plans as many items as are feasible. An item is skipped only when it contains a fallacy or cannot be done, and the plan states that reason beside the item. The owner may instead pick the items a planner works on, and then the plan covers those items and does not grow to the whole backlog. None of this is in docs/planner-contract.md. Done when docs/planner-contract.md states all three rules and a plan lists every item it did not plan next to its reason.

### #928 The PM contract says the backlog has no In flight section, and the backlog needs one

The PM contract and the Wall of Stupid tell the PM that the backlog has no "In flight" section. The backlog needs one, so the PM cannot follow the contract and keep the backlog the owner wants.

The clause sits in the PM contract under "Shared evidence and backlog" ("It has no status table or 'in flight' section") and in docs/pm-contract.md. It comes from the Wall entry of 2026-11-03 07:08 WIB, where a status table listed merged pull requests as in flight, and the entry of 2026-11-03 23:17 WIB, where finished items sat under "In Flight". The failure in both was finished items left on the list. The remedy was never to ban the section. The In flight section holds the items a dispatch has sent to the coder that have not merged, and an item leaves the list when its work is merged. The contract must keep the ban on status tables and on finished items sitting in any section. Done when docs/pm-contract.md and the PM contract in the Project both describe an In flight section, second to last, that holds only dispatched, unmerged items; both say a finished item leaves the backlog when its work is merged; and no sentence in either says the backlog has no In flight section.

### #931 A GET to the tick route can take the worker lease and start a drain

The tick route is meant to answer three numbers (queued, running and traffic) and change nothing, and #322 was written on that premise. A GET to it can acquire a worker lease and schedule a drain.

The coder found this in Fleet 21 and recorded it on PR 922 (Nov 16); the three timed production calls for #322 were not run because of it. Observe first: read the route and list every code path a GET can reach that takes a lease, writes a row or schedules work, and which callers trigger it (app open, tab focus, the once-a-minute database wake). Related: #322, #685 and #700. Done when a written finding says whether a GET to the tick route may take a lease or start a drain, and either a GET changes nothing and a test proves it, or the owner rules the work is intended and #322's premise is rewritten.

### #212 Packaged food cannot be logged from the regular camera, and the scanner has never been tried on a phone

To log a packaged food, the user has to switch to a separate scanner, and that scanner has not been tested on a phone. The owner wants the regular camera to read a barcode and a nutrition label.

The design is to decode a barcode with deterministic code first, and to use the model only when no code is found or for a label. On Nov 1 a production check at phone width returned "not in database" for a valid barcode, and a label read by the model made a ready post whose stored nutrition matched. On Nov 2 on production, a Photo-mode shutter decoded an emulated UPC-A barcode to a Found result. The owner kept the issue open because the physical-phone check for both is unmet. Related: #452, where the label flow opens only after a barcode miss. Done when a real packaged product's barcode, photographed through the capture sheet on a phone, creates a post showing the product's name and nutrition, and a nutrition label photographed the same way does the same.

### #570 A leftovers photo takes several seconds to post while a regular photo is fast

Posting a photo of leftovers takes several seconds to show, while a regular meal photo shows at once. The owner says the leftovers photo is not snappy and that this is not acceptable.

The owner timed adding a leftover at about 11 seconds on his phone. The leftovers path waits for image encoding, upload signing, two uploads in a row (about 1.3 and 1.2 seconds) and the attachment steps before it closes the camera; a regular post hands the work to the upload manager and closes at once. The logged staging-to-attachment time was about 4.9 seconds, so most of the 11 seconds is unexplained without a trace from the phone. Two causes are suspected: two photo-upload workflows, and one worker lane shared by analysis and maintenance. Observe first: on a phone over mobile data, time a regular photo and a leftovers photo from the tap to the post showing in the feed, and record where the extra seconds go. GrokBot, Nov 5: FAIL. On judge 1 in a phone-sized browser a regular photo closes its sheet in 72 ms and a leftovers attach closes in 5,049 ms. Done when a leftovers photo shows in the feed as quickly as a regular photo, timed in a phone-sized browser.

### #594 Let the user choose where a photo is saved: the in-app camera with manual saving, or the native camera with every photo saved

The app's own camera sends photos only to the app, so none reach the phone's camera roll, and the owner wants a choice.

The owner ruled that this is a switch in personal settings with a short explanation of each mode, so he can test both. Manual-save mode keeps the app's camera and shows a Save photo button that opens the share sheet. Native mode opens the phone's own camera, which may save to the camera roll by itself. Built: the switch on Profile (kept per device), native mode, Save photo through the share sheet and a file-download fallback. Browser checks pass. Not checked on a real phone: which actions the share sheet offers and whether a copy reaches the camera roll. On iPhone with iOS 16.2 or later, a share sheet opened by an app has no Save Image option (a known Apple bug), but pressing and holding a shown photo does offer it. How people share or save everything, or nothing, is not decided. Done when the owner rules whether native mode and Save photo are accepted without a phone check, because nobody can check the share sheet or the camera roll without a physical phone.

### #452 A plainly visible nutrition label is reported as not found

A photo of a pack whose nutrition table can be read is rejected with "No nutrition label found".

A photo of a Goldfish cracker pack failed: the label is in Indonesian and the whole table is in the frame, yet the app showed "No nutrition label found" with the buttons "Take the photo again" and "Type it instead". The label flow opens only after a barcode scan answers Not in the database, so a test needs such a barcode; an English label image is ready. A label with no printed weight cannot be saved, because the database rejected the serving unit; that is fixed in the database, but the pack-photo flow has not been re-proven. GrokBot, Nov 5: not run. The label flow opens only after a barcode miss, and no barcode field was reachable. An English label image is at f18/img/label-u.jpg. Done when that photo gives a card with the numbers printed on the label, and a label in English does too, in a phone-sized browser window.

### #617 Squid and tuna are matched to the wrong food records

In the real food test, a photo of squid nigiri was matched to a USDA record described as "Sushi, topped with tuna". The test allows this kind of closest match, so a passing test does not show the match is right.

No fix has been tried. First step: look at which squid records were available, the matching trace, and the closest-food label. Done when a written finding says whether this match is acceptable and, if not, what should change.

### #373 The app reads more from the production database than it needs

The app's reads drove egress to 8.66 GB and log ingestion to 1.10 GB in one billing cycle, against 5 GB and 1 GB on Supabase's free plan, and the project was depleting its Disk IO budget. The organization is now on Pro, which includes 250 GB of egress per cycle, but the same reads still cost bandwidth and database load while judges use the app.

The feed's database traffic per page open fell from 5.06 MB to 0.523 MB (89.7% less) by reading day totals once. The app and the worker reach Supabase through web requests, not database connections, so the connection-pool setting does not apply. Nobody can explain the historical 31 of 60 connections or the 70% memory use on the small instance, and log volume is known only in rows, not bytes. Done when the billed log bytes are attributed to their sources on the usage page and the memory use on the small instance is explained.

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

The app's sign-up and sign-in run on Vercel's servers and do not pass on the browser's address, so Supabase counts the app server's addresses (seven were seen, 36 of 75 sign-ups from one). A direct hammer from one machine was refused at request 31, but that did not test the app's own path. 75 sign-ups through the production form, one every 10 to 22 seconds, raised no rate-limit message, no 429 and no CAPTCHA; why none was refused is unexplained. Observe first: send sign-ups through the form faster than a browser can, then sign in from the owner's phone on mobile data, using throwaway @example.com accounts only. Done when a written report states which address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another.

### #285 The half-eaten plate may give the wrong consumed number

The app works out how much of a meal was eaten from a photo of the leftovers. The owner has already tested it on his phone, including today, and nobody has confirmed that the consumed number is right.

The owner's own leftovers posts are the data; he will not run more tests. A capable coder investigates read-only: pull the owner's leftovers posts from production, compare each consumed number with the before and after photos, and record where a wrong number goes wrong (the portion estimate, the not-eaten step or the stored value). Related: #570 and #578. Done when a written finding says, for each of the owner's leftovers posts, whether the consumed number is right and what caused any error, and any fix is on the backlog as its own item.

### #575 A meal with unavailable nutrition does not say why

When a food shows nutrition as unavailable, an ordinary user cannot find out why. The owner could not learn why the macaroni failed without an agent reading the database traces.

The reason exists only in the model call log. For the macaroni post it said no matching generic fried-pasta record was present, and the plain name "macaroni" was never searched (#523). The closest-food label appears only when a close USDA record is found, so a food with no close record says nothing. GrokBot, Nov 5: FAIL on the done line. The owner's post with "Nutrition unavailable: watermelon chunks" shows the food name and no plain-language reason, and the macaroni post reads the same. Done when a meal with an unavailable value tells the user, in plain words and without database access, which food failed and why, checked on production with a meal known to be unavailable.

### #557 An incomplete saved label can hide a barcode provider outage

A barcode lookup can report that a product is missing when a provider is down and the account holds an incomplete saved label correction.

The lookup hides provider errors for corrections that may lack the name or serving unit needed to make a card. No production failure is claimed. A saved label with every nutrient empty passes the "complete" check. Done when incomplete corrections keep the provider error, complete corrections still work during outages, and tests cover both.

### #449 The food names do not show before the numbers on a new upload

A new upload shows no food names while its numbers are still being worked out.

Unproven. A rice-and-broccoli post reached ready with no food names shown while its numbers were pending (390x844, Fast 4G, account 1). The feed now polls pending items, so the claim may already be false. The claim is that the card discards food names the app has found while the numbers are still being worked out. Observe first: post a new photo on production and watch the card until the numbers arrive. GrokBot, Nov 5: on a new salad upload the card showed the caption and "Processing, traffic low" before any kcal, and once ready the names and numbers arrived together. The sampled polls neither show names while numbers are pending nor show names discarded, so the model-call log has to decide it. Done when a new upload shows the foods the app has found while the numbers are still being worked out, or the item is closed because the names already show.

### #686 A retry poll can be cancelled by an in-flight load, so a failed meal's retry can stop (PR #674)

After a meal fails and the user retries, the app polls for the result, but a load already in flight can cancel the restarted poll, so the retry can stop without ever showing a result.

PPLX raised this as a P2 on PR #674, and the Fleet 18 plan accepted it as real and deferred it. #674 is on main with the P2 unfixed. Done when a retry poll restarted after a failure is not cancelled by a load already in flight.

### #687 The submission text omits voice transcription and says all AI calls use the Meta Model API, which is untrue when Muse Spark Open is on

The hackathon submission was sent at 08:59 WIB. Its description never mentions voice transcription, and it says all runtime AI calls use the Meta Model API. When a user turns on Muse Spark Open in Profile, food identification goes through Baseten instead. A judge who compares the submission with the README sees two accounts of the app.

Checked in the public repository at 96ecdcf (Nov 5, 08:46 WIB): voice is built. The route /api/transcribe calls muse-voice-transcribe-1.0, and VoiceRecorder is mounted in CommentComposer, so the mic sits in the comment box on a meal, not on the capture screen. The open path is built too: open-weights.ts, plus a Profile switch that appears only when IDENTIFY_OPEN_API_KEY is set. docs/open-weights.md says production holds that key and the switch persists (Fleet 10 check), and the owner's own-account look on #281 is still open. The owner believed both were removed, and the code contradicts that. PM, Nov 14 (Chrome, owner account, read-only): production shows the mic beside the comment box on a meal, and Profile shows the switch "Identify food with Muse Spark Open", set to Off. #657 covers the README's no-match wording. Whether the portal counts edits after 09:00 is unknown. Done when GrokBot confirms on production that the mic shows in a meal's comment box and the Profile switch shows, and the owner has checked the portal for the contributor list and decided whether to edit the description.

### #689 The last Fleet 18 remediation PRs (#667, #668, #670, #671, #672, #677 and #678) merged without a clean exact-head review

These PRs are on main, and the reviewer asked for changes at most of their merged heads. Two bugs were confirmed in them: the cover photo's cache lifetime (#668) and the seeded avatar subscription (#672). Fixes for both merged afterwards in #679 and #680.

The exact-head review rule was overridden to land them before the stop. #672 merged at the unreviewed head d50bdf79 with a hand-resolved conflict in PostDetailHeader.tsx, and #677 had no PPLX run. The coder reports #679 (photo cache counted from signing time, #668) and #680 (review findings on #678 and the seeded author identity, #672) merged at 08:30 and 08:32 WIB. The coder now reports (relayed by the owner, Nov 15) reviews at the merged head of #672, #677, #678 and #680 with the fixed runner, and valid head-matched receipts already held for #667, #668, #670, #671 and #679. No receipt contents have reached the PM. Production main is 96ecdcf, and code is frozen until judging, so a new finding cannot be fixed now. Done when the avatar route is checked on production for an account with an avatar (200, private cache) and for another signed-in user (404), PostDetailHeader.tsx is checked on production for the author avatar and the servings layout, and each unreviewed merged head has been reviewed with each real finding filed as its own item.

### #691 The closing comments on #628, #471, #626 and #627 link to files that are not in the repo

The closing comments on the issues point to files under docs/evidence/run19/, such as push-row-delete.json, and those files are not on main.

Docs PR #653 contained only docs/run17-report.md. ten-photos.json reached main through docs PR #656; push-row-delete.json is not on main. The failed post-close and beer receipts and docs/run19-final-report.md are on main (3deb890e). After-the-fact reviews are allowed. Done when the docs/evidence/run19/ files are on main so the links in the closing comments open.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. A dormant hCaptcha widget is built. A direct hammer from one machine was refused at sign-up 31 and sign-in 32. The owner holds the site key and the secret; the secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT_PUBLIC_HCAPTCHA_SITE_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers both is refused.

### #578 The leftovers photo and the regular photo post through different code

The app has at least two code paths that post a photo, and the leftovers one is slower and blocks the camera. Other jobs may be done twice in different ways, and nobody has listed them.

The audit of main ranked 26 findings. The biggest: two photo-upload workflows (the leftovers path is slower and blocks the camera), several screens that each refresh when a meal finishes, the meal detail waiting for optional services, the same photo delivered under several addresses, and nutrition read twice by the feed. The smallest: the profile handle read by separate readers, serial drink lookups, a photo reloaded during matching, repeated queue counts and a repeated search interpretation. Rank 1 (the two upload workflows) is built; the other 25 await a decision. Done when each of the 26 findings is filed as its own item or closed with a reason.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature is in, one pass replaces the default README with a short start-here page. All working files stay in the repository, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed. Done when the README is the start-here page, and a search of the repository for host names, account identifiers and billing details finds only what the owner chose to keep. GitHub already shows this issue closed. It stays here until that is true.

### #659 Review findings on the merged Fleet 18 PRs have not been checked on main

Codex and AGY reviewed the Fleet 18 PRs and raised problems in code that is now merged. The planner confirmed four of them on main 7d64f4c8; they are the four items below. The rest have not been checked.

Two blockers are planner-checked on main and not yet reproduced by a coder. On #647, useProfileIdentity in PostHandle.tsx binds the viewer's avatar and handle to every post header and not the author's, the avatar route reads with the viewer's token so another user's avatar fails, and the route sends a public one-year immutable cache header for an image only signed-in users should see. On #648, wording-inventory.mjs embeds the HEAD short hash so its check can never pass after a commit, and docs/wording/inventory.md was generated before 66 files changed. Eleven other findings were reproduced and are filed as the items below; two were dismissed with proof (the #633 recompute upsert and the #633 rice-with-protein composition). Still unchecked: the #641 portion_unit "serving" that the database does not accept; on #638, Feed discovery polling that stops when the tab is hidden; on #639, NeedsInputStrip never finding new questions after an empty first poll, and RealtimePost not refreshing on visibility; the #637 Thread retry polling; and the #643 header text cut off. Done when each unchecked finding is reproduced or dismissed with proof, the blockers on #647 and #648 are each checked on main, and each one reproduced is filed as its own item.

### #694 Many of the owner's meals show wrong nutrition numbers and nobody knows how many or why

The owner has logged food daily for days, his diet changed, and he reports that a lot of what the app shows is wrong. Nobody has measured how wrong or where the error comes from.

Known cases: the macaroni snack shows 38 kcal and 0 g fat from a cooked vegetable macaroni record (#523), squid matched to a tuna sushi record (#617), a consumed number from a half-eaten plate that nobody confirmed (#285), and 12 of the owner's 137 posts show a 0 g macro that nobody judged. A capable coder investigates read-only: pull the owner's ready posts, check each food's weight and kcal against its USDA record and the photo, and record for each wrong number which step caused it (the food identified, the record matched, the weight estimated or the stored value). Done when a written finding lists every one of the owner's posts whose numbers are wrong with its cause, ranks the causes by how many posts each one explains, and each cause is on the backlog as its own item.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of caffeine from the USDA but have no beverage category and no linked intake rows. The fix covers new and re-analysed posts only. A backfill fixed 8 posts, and 12 still fail the intake rules. GrokBot, Nov 15: the old colas now show caffeine on the card and in the day total, but the Oct 29 black coffee (post 4dfe4411) shows no caffeine anywhere and is listed at 112 kcal, which is far too high for black coffee. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

### #683 Three merged fixes have never been seen working in a browser

The fixes for the meal bookmark on a failed analysis (#634), the upload chip and the meal-cover retry were reviewed in code and never run in a browser. A judge who taps them could meet a defect nobody has seen.

The coder reported this on Nov 5 and named the three fixes without PR numbers for the chip and the retry. The retry poll can also be cancelled by an in-flight load (PR #674), which is deferred. GrokBot, Nov 15: the upload chip works, and bookmarking and unbookmarking a ready meal works. Two bookmark defects: a bookmark on a "No food found" post shows filled but sends no request and cannot be unsaved, and a bookmark tapped while a post is queued reverts at about 120 s and is never saved even when the analysis finishes later. Posts that end as "No food found" also leave the Home feed and show only on Profile (see #615). GrokBot, Nov 15, second reading (12:20 to 12:46 WIB, same production build): a failed meal was made by replacing an uploaded photo's original with 4 KB of random bytes, and the post failed in about 20 s with "The analysis service refused this request. Try again." Tapping the bookmark on that failed meal shows "This meal did not finish analysis and cannot be saved." and sends no request, so the meal is never saved and never marked failed. On Home that message covers the failure text and the Try again button. The failed meal's page opens with "Nutrition could not be updated." and "The meal could not be updated." before any tap, and once showed a broken photo. Unsaving a saved failed meal was not reached, because a failed meal cannot be saved. A queued meal that finished within 2 minutes saved (200), unsaved (200) and stayed so after a reload. A queued meal that finished after 2 minutes reverted to empty at 120 s and no save request was sent; during that run the card's post id changed from 7a25457a to efde7a3d. On a "No food found" meal a second tap does nothing. The cover retry runs to a result: from Home the retry answered 204 at 1.2 s and the card showed Processing at 2.1 s, then returned to failed about 7 minutes later; from the meal page it answered 204 at 0.9 s and showed "Nutrition could not be updated." at 24 s. The cover photo has no retry of its own: a blocked photo shows broken with nothing offered. "Couldn't open this meal" never appeared. Other attempts to make a failed meal: a zero-byte file or a text file named .jpg shows "Upload failed. The server didn't respond." (misleading for a bad file) and posts nothing; a cut-off JPEG became a bread-only meal at 401 kcal; a 9000 × 9000 photo shrank to 962 KB and was analysed normally. Test data left on judge accounts: judge180119 has 0eee29a1, 467aeaa4, fe1abad8, bf3b89a2 and unpublished drafts b08f0e66 and 319e3909; judge291428 has 5ac2735a and efde7a3d. Related: #702. Done when, on production in a phone-sized browser, bookmarking a failed meal shows a plain message that it cannot be saved, without covering the failure text or the Try again button, and never marks the meal failed or saved (PM ruling, Nov 15: this matches #702's done line), a bookmark on a "No food found" meal or on a queued meal either saves or says why it cannot, and a failed meal's cover retry runs to a result, each reported by GrokBot with what it saw.

### #698 Pull requests can reach main without the PM's merge order

Merging is not yet limited to the PM's order. A pull request must merge only when the PM orders that one PR at its full head SHA, after the planner's evaluation and a zero-blocker review of that head. Fleet 18 landed seven pull requests without a clean review of their exact head.

Observe first: list every way a pull request can reach main today, including a coder's own merge, auto-merge, a merge queue, a workflow and the branch protection settings. Related: #689. The owner ruled on Nov 15, answering the planner, that merge control stays a written rule only. Done when the contracts state that no pull request merges without a merge order naming its PR and full head SHA and a zero-blocker review of that head, and the owner has accepted that nothing in GitHub refuses a merge without them.

### #684 A failed leftovers upload cannot be dismissed and stays on screen every time the app is reopened

On the owner's phone, adding a leftovers photo to a meal failed with "Upload failed. The photo could not be attached." The failure leaves a "Leftovers: Not posted yet" card in the feed and a red chip at the bottom reading "Leftovers, Not saved · Try again". The user cannot dismiss either one, and both come back after closing and reopening the app, so the screen stays broken.

The owner's screenshots (Fri Nov 6, 2:40 PM and 2:43 PM WIB, iPhone on 5G) show the failed card in the Today feed under his 2:35 PM post. It says "Not posted yet. The photo is kept on this phone." and offers only Try again. The chip sits over the post and the floating tab bar and covers the nutrition numbers. The owner reports that closing and reopening the app does not clear it. A third screenshot, Tue Nov 10 at 12:18 PM WIB, shows the same red chip still over the Today feed four days after the first failure, so the stuck state does not expire. Owner, Nov 15, 10:50 PM WIB (iPhone, 5G): a screenshot of the Fri Nov 6 2:35 PM post shows the same "Leftovers, Not saved · Try again" chip nine days later, sitting over the post's nutrition numbers and above the tab bar. He reports that pressing Try again only brings back an error and the leftovers never save. The error text was not captured. This looks like the same family as #644 (a failed attachment upload that nothing removes), but that is not confirmed. Not known: what failed the first time, whether Try again works, and where the phone keeps the failed upload. Related items: #570, #578, #644 and #625. GrokBot's leftovers attach on a judge account on Nov 5 closed in 5,049 ms and did not fail, so this is not reproduced. Observe first: read the owner's failed attachment job and its error from the jobs table and the model-call log (read-only), then fail a leftovers upload on a judge account on purpose and look for what the phone stores. Done when the error behind this failure is written down, a leftovers photo saves on the first try or on Try again in a phone-sized browser, a failed upload can be dismissed or removed by the user and stays gone after the app is reopened, and the chip does not cover the post's nutrition numbers. Fleet 21 independent source read, Nov 16 (investigators' report): PR 912 puts Remove in a fixed-height row (h-14) inside an overflow-hidden container (UploadChip.tsx line 30), so the source supports the clipping. Nobody repeated the browser measurement. Fleet 21, Nov 16 (coder, local, PR 912): the phone's new Remove button works and stays gone after a reload. On desktop the sidebar chip ends at y=364 and Remove begins at y=374.13, so Remove is clipped; it was left unfixed under the plan's rule. The original failure cause is not found and the chip over the nutrition numbers is not addressed. Merged in #912 on Nov 16 (coder report). Fleet 21 independent source read of the fixed head 50ea5f70, Nov 16: the clipping is fixed (UploadChip.tsx line 30 now uses a minimum height); the retained Firefox receipt shows the chip ending at 422.25 px with Remove at 411.70 px at 1280 wide, and 748 px with 737.45 px at 390 wide; no fresh browser run.

### #625 Tapping Post can close the sheet before the post is safely saved on the phone

Since Fleet 17, the capture sheet closes and the app says Post worked after 700 ms, even when the phone has not finished saving the draft. If the page reloads or the phone kills the app in that gap, the draft can come back as not posted or be missing, and the user's post is lost.

post() in src/lib/posts/upload-manager.ts (around line 278) reports success from the entry in memory after 700 ms. The save that marks the draft as posted can still be queued behind earlier saves that carry the full photo, and on the next start a draft saved as not posted is never published. A read of main shows post() awaiting putIntent before it returns success and no 700 ms cap left; the runtime test has not run. The 700 ms cap exists to fix #370, so the fix must keep the sheet closing within 1 second. Suggested approach: save a small record of the intent to publish first, and report success only after that record is saved. GrokBot, Nov 5: a code read confirms post() awaits putIntent before success with no 700 ms cap. The runtime test that delays the phone's save beyond 700 ms was not run. Done when a test that delays the phone's save beyond 700 ms, taps Post and then rebuilds the manager from saved data only still publishes the post, and the sheet still closes within 1 second.

### #454 The Days page is not one continuous calendar

Days cuts the calendar into separate month blocks, which no calendar app does, so the user cannot scroll through time as one run of weeks.

On the phone, Days shows November 2026 and October 2026 as two separate blocks, each with its own heading, and the newest month sits on top. Days becomes one continuous calendar: the weeks run on from one to the next in time order with no break, the month name marks where each month starts, and Days opens with today in view. GrokBot, Nov 5: the phone Days page shows October running into November in one scrolling grid, but it did not open with today in view (todayInView false, October heading), and the sticky month name across the boundary is not proven. Done when scrolling Days moves through unbroken weeks from October into November, the month names mark where each month starts, and Days opens on today, in a phone-sized browser.

### #512 The phone calendar can show the wrong month summary and jump when older months load

On the phone Days screen, the month name at the top can show the wrong month, and the screen can jump when an older month loads.

Two defects in a live change were reproduced with made-up test months, not on the owner's phone. First, the month name can keep showing October while November scrolls into view; this cannot appear on any production account today because two months fit on one screen, so it is proven only on the disposable stack with three seeded months. Second, scrolling while an older month loads makes the screen jump back to an old position. A third review finding was cut off and is unknown. Done when, on the disposable stack with three seeded months, the month name shows the month nearest the top of the screen while scrolling across the October and November boundary, and the screen stays still while an older month loads. Fleet 21 check, Nov 16: three months were already loaded with only 47 px of upward scroll, no boundary crossed the sticky line, and the header and insertion behaviour were not verified.

### #598 A returning visitor keeps seeing the old build until a hard refresh

After a deploy, a browser that already holds the previous build can keep showing it, so a visitor sees old layouts and old text that main no longer has.

After an earlier release, the owner's desktop kept showing the old full-width layout until a hard refresh. The suspect is the browser's stored copy of the app, which is not confirmed. A newer copy installs and stays waiting while the old one keeps running, and a normal reload does not switch to it. A browser can hold back a takeover while requests are in flight; that is a lead, not a proven cause. The cause is unknown. First step: with a browser holding the previous version, release or simulate a new version, and record whether a normal reload shows it and which stored copy serves the old one. GrokBot, Nov 5: a service worker is active (/sw.js) with no waiting worker on a normal reload. A new deploy cannot be simulated from a browser, so the coder owns the proof. Done when a browser holding the previous version shows the new one on its next normal load, and the check is written down.

### #571 A post started while another is going up breaks the other post with "The meal could not be saved"

Starting a second post while an earlier post is still going up can end with "The meal could not be saved.", and the owner has to press Post again to get the meal saved.

The owner's screenshot shows the toast "The meal could not be saved." over the feed, with the first post, "Beef noodle", showing a grey bar where the analysis would be. He posted one photo, photographed another food while the first was going up, and one of the two posts stopped working when the first finished; pressing Post again saved the meal. Which post stopped, and whether the two overlap in the capture sheet, the upload or the save, is not confirmed. The cause is unknown. Observe first: on a phone, start a second post while the first is still going up, and record which request raises the error and why. GrokBot, Nov 5: not reproduced as the owner saw it. An overlap on slow 4G showed no "could not be saved" toast and the second post closed in 107 ms, but /posts/<id> RSC fetches returned repeated 404s for one overlapping id, which the coder must look at. Fleet 21, Nov 16 (coder report, relayed by the planner): 16 not-found errors were seen on a meal's own address while the meal was still uploading, and the cause is not traced. Done when one post finishing never stops the screen of the other, and both meals save on the first press of Post, in a phone-sized browser.

### #599 The Today summary on the right of desktop Home is missing when the page opens and appears late

On desktop Home the right-hand column (Today, kcal consumed, protein, carbs, fat, Posted today) is empty when the page loads and fills in a moment later. The owner reports that it took far too long to show up.

On desktop Home the right-hand column (Today, kcal consumed, protein, carbs, fat, Posted today) is blank when the page loads and fills in later; the owner counted about 20 seconds, which is not a measurement. The server now fills in today's totals before the page arrives. On production the numbers were in the first DOM frame at 1.46 s and 1.93 s from navigation, and blocking the browser's data calls changed nothing; a test account showed them at 0.85 s on a normal reload. A day with posts has not been measured on the live app, and the retry message cannot be triggered from the browser. GrokBot, Nov 5: PASS on the numbers: Today kcal showed about 1.18 s from navigation on a day with posts. The loading placeholder and the retry message cannot be triggered from a browser, so they need the coder's disposable stack. Done when the column shows its numbers within two seconds on a day with posts, shows a loading placeholder from the first instant, and shows a plain message with a retry if the numbers do not arrive. Fleet 21 check, Nov 16: partial. Renaming the function produced the expected error and restoring it loaded the meal list; literal first paint and numeric totals were not certified.

### #456 A rum cocktail is logged with 15 mg caffeine

The tiki cocktail post states caffeine that the drink does not contain.

The drink card for the lime and rum tiki cocktail read "15 mg caffeine" next to 196 kcal, and the day's caffeine total read 110 mg. Fixed on main: the tiki cocktail (owner post 8535b793) now shows 196 kcal and 18 g alcohol with no caffeine on the meal page, and a glass of red wine shows 16 g alcohol and 128 kcal with no caffeine. The Nov 3 day total was not read. GitHub shows this issue closed. GrokBot, Nov 5: FAIL. Tiki cocktail 8535b793 shows 196 kcal and 18 g alcohol, but Show all lists Caffeine 15.4 mg and the Nov 3 day total shows Caffeine 95. PM ruling: the defect stands, even though the card no longer leads with caffeine. GrokBot, Nov 15: Show all still lists caffeine on the tiki cocktail 8535b793 (15.4 mg), 8b728c7e (15.4 mg) and 8ab2eccb (14 mg). Done when a cocktail or any drink with no caffeine source logs no caffeine, the card shows none, and the day's total leaves it out, checked on the tiki cocktail and a glass of wine.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

A cold tick function must load the whole food-analysis pipeline before it answers. Lazy loading of the job code is on main, but rapid tick calls hit a warm function, so no cold start has been measured, and a post from a real phone through the worker is untested. A response header and a log line now mark a cold start; nobody has read a value. Done when a cold start of the tick route is timed on production, before and after, with the times written down, and a post from a phone-sized browser completes through the worker. Fleet 21, Nov 16: halted. A GET to the tick route can acquire a worker lease and start a drain, so the route is not read-only as this item assumed; the three timed production calls were not run (see the item on the tick route).

### #323 Every protected page checks sign-in twice (part of #222)

The app checks that the user is signed in when a protected page is requested, and checks again when the home page loads. That is two round trips to the sign-in service on every page open, on top of the slow start of the server function.

The server checks sign-in once per page, and a forged request header is still refused. The browser makes zero sign-in calls on Home, Days and Profile, but server recordings still show 7, 9 and 14 checks per page open. The likeliest cause is that the guard checks every background prefetch and refresh request, not only the page, and each card carries several links. This is probably the server half of #222. GrokBot, Nov 5: the browser made 0 auth/v1 calls on a cold Home open. The server-side checks need the coder's log. Done when one page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page. Fleet 21, Nov 16 (local, ten-second windows): /user calls were 115 on Home, 10 on Days and 18 on Profile, against a target of one; no call was attributed to its source.

### #554 Tapping a meal shows nothing until the server answers

Comment, Details, tapping the photo, "more" and Post in the capture sheet wait for the server before anything changes on screen.

Design 7b shows the screen at once, using the photo already on screen while the details load. At 390 wide with 4x CPU, Comment, Details and More change within 6 to 8 ms, but a tap on the feed photo (Open meal details, 390 by 390) produced no change within 2 s. With normal CPU a tap on the feed link opens the post. GrokBot, Nov 5 (Fleet 18 result): Comment, Details and More change in 6 to 8 ms with 4x CPU. A tap on the feed photo ("Open meal details") showed no change within 2 s, though a feed-link tap with normal CPU opened the post. Done when each of these taps shows a visible change at once, and nothing jumps when the details arrive.

### #553 Thumbs up and down look the same when turned off and thumbs down waits for the server

The thumbs turn themselves off while a vote saves and before the analysis exists, with no visible difference. Thumbs down opens nothing until the vote has saved.

This is the first case found for #217. The pressed look appears at once (first change 6 to 8 ms with 4x CPU) and thumbs down opens the reply at once. The turned-off look was not observed: the buttons were never disabled, and the rest look is the grey text-off. Four of eight entry paths took longer than 50 ms to show a change: phone photo 51.5 ms, desktop More 64.3 ms, Details 66.6 ms and Comment 64.3 ms. GrokBot, Nov 5 (Fleet 18 result): the pressed look shows in 6 to 8 ms with 4x CPU and thumbs down opens its reply at once. The turned-off look was never observed because the buttons never disabled. Done when a thumb shows its pressed look at once, looks different when turned off, and thumbs down opens at once, checked on production on a phone-sized screen with a slowed processor.

### #552 The buttons under each post are 24 px tall and show no pressed or turned-off state

The buttons under a post are too small to hit and look the same at rest, while saving and when turned off.

Design 7a gives every button a 44 px tap area and five looks: at rest, pressed, saving, turned off and failed. On production every button measures 44 by 44 (Details 53 by 44). The saving, failed and pressed looks were not captured. Thumbs down took 0.39 seconds to show a change and 0.86 seconds to get its reply. GrokBot, Nov 5 (Fleet 18 result, not re-run): every button measures 44 × 44 (Details 53 × 44). The saving and failed looks were never captured, and forcing them needs the coder. Done when each button matches 7a on production on a phone-sized screen.

### #574 The Days calendar and the day summary count a different number of posts

For October 31 on a test account, the Days calendar says 5 posts and the day summary says 4 posts. Both show 1,842 kcal.

The Days calendar read "2026-10-31, 5 posts, 1,842 kcal" and the day summary read "Consumed: 1,842 kcal · 4 posts" for the same test account. The cause is unknown; one of the two may count a post the other leaves out, such as a drink, a leftovers post or a superseded one. An unfinished meal can also make a fully known day show a false "Nutrition unavailable" warning. GrokBot, Nov 5: the owner's Oct 31 day summary reads 1,725 kcal and 4 posts, and the calendar cell shows 1,725 kcal with no post count, so nothing on the calendar can be compared. For Nov 5 on judge 1 the calendar shows 2,029 kcal and the day summary shows 6 posts, 6 not finished. The original 5 versus 4 mismatch was not reproduced. Done when both places count the same posts for that day, or the screen says why they differ, checked on production against the account's October 31 posts.

### #573 The closest-record label is stored on every nutrient entry

The note that a food's numbers come from a similar USDA record is saved inside every nutrient entry of the food's micronutrients JSON, not once per food. This adds bytes to every row that uses the fallback.

The label adds bytes to every row that uses the fallback and works against the egress cut in #373. Done when the label is stored once per food, the meal's first comment still names the record, existing readers and tests pass, and rows already written are migrated or confirmed harmless.

### #572 The closest-food fallback never runs when the model stops after one search

Some foods still show nutrition as unavailable because the new closest-food fallback never runs for them. Pickled ginger is one example.

On production, 12 of 119 unavailable results in 14 days stopped after one search, about 10%. The fallback fires only when the model's first decision names a base food, and in these cases it names none. A reviewer raised that the new estimate format and migration 0053 break workers still on the old code; the worker deploys with the app and a tested rollback exists, but the risk needs a written answer. GrokBot, Nov 5: a new judge post of pickled ginger came out at 3 kcal, not unavailable, with a clarification question about the photo. The test that the done line asks for is a coder check that a browser cannot see. Done when a food whose first decision names no base food gets its own bare name searched, and a test covers that case.

### #569 The row of day circles at the top of Home is cut off at the right edge

On the phone, the row of day circles above the feed shows four whole circles and a fifth cut off by the screen edge. The owner wants the row either to scroll or never to show a partly drawn circle.

The row needs 386 px and the phone leaves 358 px, and the code clipped the row. Ruling: the row scrolls sideways back in time, drawn as Round 7 frames 7c and 7d. Today comes first with five whole circles and the edge of a sixth at rest, each swipe stops on a circle, and the feed stays on today while the row scrolls. Tapping a circle with posts opens that day; circles without posts are grey and cannot be tapped. The row starts with 30 days, loads 30 more near the end and stops at the first post, so the last circle is whole. Tapping Home while on Home returns the row to Today. Confirmed on a 390 px screen: sideways scroll, 30 circles, snap per circle, five whole circles plus the edge of a sixth. Not yet checked: tapping a circle with posts, grey circles being inert, Home returning the row to Today, and loading 30 more near the end. GrokBot, Nov 5: at 390 wide the row scrolls and shows five whole circles and the edge of a sixth. Tapping Wed 4 (a day with posts) opens /days/2026-11-04, and tapping Home returns the row to Today. Fri 30 is a link and navigates. The code on main links any day with posts, even with no kcal, as the ruling says, so this is a defect only if Fri 30 has no posts (planner, Nov 14); GrokBot checks. Scrolling to the end did not load 30 more circles (9 controls, scrollWidth 2182). Done when the row matches 7c and 7d on a phone-sized screen.

### #568 Judges have no page that shows how the app works

A judge who signs up starts with an empty account and nothing that says what the app does or which models it runs. A judge must never see another user's data.

A judge must never see another user's data. The page is Profile, then How My Food AI works (/profile/about). It names the models (SAM 3.1, Muse Spark 1.3, Muse Voice Transcribe 1.0 and the optional Muse Spark Open on Baseten) and links to Your meals but does not list them. A second account got 404 or nothing on every route to the first account's posts. Known exception: a signed photo link issued to the first account works for anyone who holds it until it expires. The change adds a database read on every direct post navigation. GrokBot, Nov 5: /profile/about lists SAM 3.1, Muse Spark 1.3, Muse Voice Transcribe and the optional Muse Spark Open, still links "Your meals ›" and shows 0 post links, so the done line is not met. PM ruling: the page lists the judge's own meals, as this item says. Done when the page lists the judge's own meals and not only a link.

### #351 The drink sheet's tiles have not been checked on the live app

The drink sheet shows tiles, and a change set their sizes and order. Ordering by use (#527) and the hold to pick a size are both in the code on main.

Issue #351 specifies six fixed tiles from the server, ordered by use with the most used first. Holding a tile for about 650 ms offers a size, such as a 240 ml cup or a 350 ml large coffee. In IntakeSheet.tsx on main (96ecdcf), six tiles are ordered by use and a 500 ms hold opens the sizes.  GrokBot, Nov 5: the drink sheet on production shows four tiles (Water glass 250 ml, Coffee cup 240 ml, Tea mug 300 ml, Water bottle 500 ml), not six. Holding a tile for about 700 ms opened no size picker. The code on main has both, so production differs from the code and the cause is unknown: a stale build (#598), hidden tiles, or how GrokBot held the tile. Done when the drink sheet on the live app shows six tiles with the most used first, and holding a tile offers its sizes.

### #615 A posted beer disappears and a clarification card takes its place

The owner posted a beer and the post vanished from the feed. A card asking a question appeared in its place. A post must stay on screen from the tap, with the calories of the drink as stated, and the question must reach the owner as a notification.

When the caption and the photo disagree, the model asks a question. The app used to mark the post "needs input", and every feed read hid posts in that state. Ruling: the post shows as posted with the drink as stated, and the question sits in the Home strip and arrives as a notification. The strip's X dismisses the question and never deletes the post. "No food found" still holds the post. The post now stays in the feed with its question beside it (column posts.question). Not yet observed: the notification (a headless browser cannot see it), and the X. A salad photo captioned "A pint of Bintang beer" stayed in the feed as a drink (18 g alcohol, 1.3 standard drinks, 203 kcal) and raised no question, so no strip row appeared. GrokBot, Nov 5: judge 2 posted a rice photo captioned "A pint of Bintang beer". The post stayed in the feed as a drink (18 g alcohol, 1.3 standard drinks, 203 kcal) and Days for Nov 5 counted 203 kcal and 1 post. No clarification strip appeared, so the strip, the X and the notification could not be tested, and a headless browser cannot see the notification. The model accepts the caption as it did in Fleet 18, so the mismatch has to be forced on the disposable stack. Done when, on the live app with test account 2, a beer caption over a mismatching photo keeps the post in the feed with its calories, the strip row shows, the server log shows it sent "Your meal needs a reply", the X dismisses the row on the same screen without a reload, and the post stays. Also check that the beer counts in the day's kcal on Days. Fleet 21, Nov 16: the beer command exited 1 ("The beer post never settled with a question") and no batch completed; Home's question strip did not appear for the fixture meal despite its database state.

### #688 The feed jumps to another meal because every card's first-run hint triggers a server action that remounts the feed in a loop

On the phone, while the user scrolls the feed, the screen suddenly jumps up to a different meal and keeps bouncing, so the user loses their place. The owner first saw it after swiping the photos of a meal that has a leftovers photo.

Fable reproduced it on production on Nov 5 in a 400 px window. The swipe is not the trigger: it also happens with no swipe and on a meal without leftovers. Every feed card mounts the "Was this estimate right?" hint, and FirstRunHint.tsx line 31 calls the getHintState server action on every mount, even when all hints are seen. That action uses the cookie-writing Supabase client (src/lib/profile/hints.ts line 11), so Next returns a 42 KB re-render of Home. The feed falls back to its loading state and remounts with page one, and the scroll position clamps from 6598 px to 3170 px. The remount mounts six more hints, which fire six more actions, about two per second until the queue drains. Loading page two mounts 20 cards at once, which starts the loop. A DOM observer, the resource timing log and a manual replay of the action all confirmed it. Not verified: Chrome's network panel listed the POSTs as 503 while timing and replays showed 200, so Fable treated the 503 as a tool artifact. Fable's smallest fix is a module-level map in FirstRunHint.tsx (ThumbsFeedback.tsx line 35 mounts the hint) that caches the lookup per page load, which cuts it to at most four actions at startup. A cleaner follow-up reads profiles.hints_seen with the browser Supabase client. Code is frozen until judging, so nothing is fixed. Done when scrolling the feed into page two on production in a phone-sized browser sends no repeated POSTs to "/", the scroll position never jumps, and swiping the photos of a meal with a leftovers photo moves only that meal's photos. Fleet 21, Nov 16 (local): no root POST while loading 80 meal elements; a scroll-position jump coincided with older rows loading, and the no-jump and leftovers-swipe conditions are not certified.

### #690 A Fleet 17 test post and its draft are still on test account 2, and the corrected run report may be incomplete

A post captioned "Fleet 17 post-close 2" (id starting d37b129e) was created at 16:21 UTC and was never cleaned up. It sits between the "retry" batch at 16:16 and the "v4" batch at 16:23, and it is in no evidence file.

A fourth close-time batch may have run without a kept receipt, which would make the "all nine readings" claim in docs/run17-report.md incomplete. Done when the post and its draft are deleted, and docs/run17-report.md either says a fourth batch ran with no receipt or says the post was not a reading.

### #628 The Fleet 17 check script passes when its checks fail and leaves a test row behind

The test script scripts/run17-checks.mjs can finish successfully even when a check fails, and it leaves test data on production.

The script scripts/run17-checks.mjs now exits with an error when a check fails, and the leftover push row on test account 2 is removed. Still broken: the dismiss step must target only this post's own question; the fake push subscription must be removed at the end of every full beer run; the tap step fails on a "-0" coordinate (BiDi error: Expected "x" to be a finite number, got the string "-0"); the answer step must wait for the strip row. The post-close run fails with Page.navigate and Page.enable timeouts on headless Chromium on the host, and the beer run fails with the strip row missing or never settling; the post-close failure looks like a host problem, not a product regression, but that is not proven. BiDi sessions on that host hit a session cap. Done when the script exits with an error when any check fails, the dismiss step targets only this post's own question, the fake push subscription is removed at the end of every run, the tap step handles "-0", the answer step waits for the strip row, and the post-close and beer commands each exit 0 on a stable browser setup with their receipts on main. Fleet 21, Nov 16: the script repairs are built (PR 918) and both commands still fail; the errors and receipts are preserved.

### #658 A single tap on a meal waits up to 320 ms before it opens

The app waits up to 320 ms after a single tap on a meal before it opens the meal, in case the tap is the first half of a double tap.

The wait is the SINGLE_TAP_WAIT_MS constant in the tap logic. It is separate from the server wait in #554, and no done line there counts it. Done when a single tap on a meal shows a visible change at once and a double tap still works, or the owner rules that the 320 ms stays.

### #700 The jobs drain route runs the worker for anyone and without holding the lease

Anyone, or a duplicate scheduled tick, can start extra workers and extra paid model calls through /api/jobs/drain. Worker concurrency was meant to be one.

The route is public and unauthenticated, and it runs the worker for any ?holder= value without holding the lease. The proposed fix is that it require the lease it was handed, or an internal secret. Related: #640. Done when a request to the route without the lease or secret is refused, a normal tick still drains the queue, and two ticks at once never run two workers.

### #701 Today on desktop reloads its numbers in a loop

When the server did not supply the day's numbers, the desktop Today view keeps asking /api/today again and again. This is the database hammering the owner complained about.

The effect depends on the day, and loading the numbers sets the day, which triggers the effect again. Related: #638. Done when the day is removed from that dependency list and the desktop Today view makes one request to /api/today per visit, counted in the network log.

### #702 Saving a meal whose analysis failed leaves the bookmark stuck, or marks a saved meal failed

On a post whose analysis already failed, the bookmark action can hang waiting forever. Unsaving an already-saved failed post can mark it failed instead of unsaving it.

In src/components/PostActions.tsx, lines 20 to 26. The not-ready, not-saved branch returns before the failed-status check, and for a saved failed post the failed branch runs during an unsave. Related: #634. Done when saving a failed post settles with an error, unsaving a saved failed post unsaves it, and a test covers both.

### #703 Retrying a failed meal opening can leave an overlay covering the screen

If opening a meal fails and the user taps retry, and navigation then hangs or fails again, an overlay covers the screen and blocks every tap, with no timeout to clear it.

In src/components/PostOpenTransition.tsx, line 49. Retry sets the phase to opening but does not change the value the effect depends on, so the slow and fail timeouts are not scheduled again. Related: #635. Done when a second failure after a retry shows the failure message and removes the overlay, and a test covers it. Fleet 21 check, Nov 16: opening while offline did not produce the prescribed failure message, so retry was not verified.

### #704 An expired photo link saved in the browser leaves the meal photo broken

The full-size meal photo keeps a signed link in the browser session and prefers it over the fresh link from the server. Once that link expires, the photo fails with 403 and stays broken until the session ends.

In src/components/OutlineOverlay.tsx, lines 34 to 42 and 54: the saved link is preferred, and a load error never clears it. Related: #635. Done when a photo opened after its saved link expired loads from the fresh link, and a failed load removes the saved link.

### #705 A retry on a label photo throws away the product name, serving size and box

When the retry reads more of the nutrition table, the app replaces the whole first reading with the retry's. The retry saw only the cropped nutrition box, so the product name and serving size become empty, and the highlight box is measured on the crop instead of the photo.

In src/lib/meta/label.ts, line 54: the retry replaces the reading outright whenever its macro completeness is higher. Related: #641. Done when a retry that reads more nutrition keeps the first reading's product name and serving size, the box is in the original photo's coordinates, and a test covers it.

### #706 A label photo from a phone is cropped from the wrong area

The label crop ignores the rotation stored in the photo. A portrait phone photo is then cropped using the unrotated width and height, so the wrong part of the picture is cut out.

In src/lib/meta/label.ts, lines 27 to 38: the crop reads the size and extracts without rotating first. A rebuttal on PR #664 argues this cannot happen for stored photos, because every upload is re-encoded through a canvas (src/lib/media/reencode.ts), which drops the orientation tag; that is unverified. Related: #641. Done when a portrait photo with rotation 6 is cropped at the label, and a test covers a rotated photo.

### #707 A retried attachment upload with a lost photo stays on Uploading forever

When an attachment upload that lost its photo is retried, for example when the network returns, the upload shows Uploading with no retake button and never settles.

In src/lib/posts/upload-manager.ts, lines 311 to 312 and 366 to 367. Retry sets the state to uploading, then the process step sees an attachment with no files and returns without finishing or failing. Related: #644. Done when a retried upload with a lost photo goes back to the retake state, and a test covers it.

### #708 Retaking a lost photo leaves the old failed upload on screen

Tapping retake opens the camera but does not remove the failed upload. After the new photo is taken the old failed entry is still there, and it comes back from the browser's stored drafts on every session.

In src/components/UploadChip.tsx, line 29: the retake handler only opens the camera. Related: #644. Done when taking the new photo removes the old failed upload, and a reload does not bring it back. Fleet 21 check, Nov 16: the fixture was not created within 60 seconds and a scoped retry reported "Control missing", so the retake, the intent count and the reload were not verified.

### #709 Deleting a meal does not remove pending or failed attachment uploads aimed at it

When a meal is deleted or becomes unavailable, attachment uploads that target it stay in the app and in storage.

In src/components/UploadChip.tsx, line 25. The listener compares only the upload's own post id, but an attachment upload names its target in the attachment, so the comparison never matches. Related: #644. Done when deleting a meal removes every pending or failed upload aimed at it, and a test covers an attachment upload.

### #710 Today shows 0 g protein, carbs or fat when the value is unavailable

The new Today summary turns a nutrient nobody could measure into a zero, so a day whose protein is unavailable shows "0 g protein". The owner ruled that unavailable is never shown as zero.

The old totals in src/lib/nutrition/totals.ts return null for a nutrient with no known value, but the today_summary function from migration 0057 sets protein, carbs and fat to 0 always, and calories to 0 unless every item lacks calories. The proposed fix is a new migration for today_summary that returns null when no item of the day has a known value. Related: #638. Done when an empty day and a day with protein missing on every item show unavailable and not 0, a day with known values shows the same totals as the old calculation, and a test covers all three.

### #711 Unit tests for the avatar and the save-meal fixes fail on main, so they prove nothing

The tests that are meant to prove the Fleet 18 avatar and save-meal fixes fail on main even without the fixes, so a green or red result says nothing about those fixes.

The Fleet 18 final report (docs/evidence/fix18/remediation-final-report.md) says the test setup is broken for profile-avatar, save-meal-readiness and related files: setTimeout is missing, SUPABASE_DB_URL is not set and module mocks are missing. The failure shows on unmodified main. Done when those test files run to a pass on a clean checkout of main, a test that should fail does fail, and the run is written down.

### #592 The round left arrow covers the start of the word kcal on a meal's second slide

On the second slide of a meal on desktop, the round left arrow sits on top of the first letter of kcal under the big number, so the word reads as cal.

The fix adds extra space beside the numbers card. On the live app at 1100, 1280 and 1440 px wide no arrow touches any text, and the smallest gap on the left is 21 px. On the phone the photo rail holds only photos and nutrition is shown separately, so there is no numbers slide with arrows. Done when it is confirmed that no arrow covers any text or number on any slide at those widths, and the phone case is confirmed as not applicable.

### #579 Photos are captured at 480 × 640 and look blurry on high-density phones

The app stores each photo at 480 × 640 pixels, the size the browser chose for the live camera, and the feed shows a smaller 384 × 512 copy. On a phone with a three-times screen a full-width card needs about 1,170 pixels, so every photo looks soft. The owner finds the blur painful.

The live camera asks for the rear camera with no size and draws one video frame, so the stored original is 480 × 640 pixels (0.31 megapixels, 126,407 bytes). The feed shrinks it to a 384 × 512 copy (22,118 bytes) cached for a year, so a sharper copy needs a new address. Photos already captured stay at 480 × 640. A sharper photo costs more Storage egress (see #375). A sharper capture, a larger feed copy at a new address and full-resolution detail photos are on main; the bytes, the egress and a real camera's resolution have not been measured. Known risks: the preload can download the wrong photo size, and one failed image turns off sharper photos for later ones. Observe first: find what resolution the camera delivers in a phone-sized browser at 3x, and the bytes of a photo at each size. GrokBot, Nov 15: the shutter now captures at 2560 × 1920 and the stored photo is sharp. The first photo still takes 2.7 to 3.4 seconds on slow mobile data, against the two-second target. The 384 px feed copy (v1.webp) of the new 2560 × 1920 capture was served as a 1920 × 1440 JPEG with a one-year immutable cache, which suggests the resize failed on a large source. A real phone's camera was not tested. Done when a photo captured in a phone-sized browser at 3x is stored at a sharper resolution, the feed and the meal detail show it sharp on a 3x phone, the first photo still shows within two seconds on mobile data, and the bytes per photo before and after are written down.

### #494 Opening a meal's detail takes 14 seconds

The owner reports 14 seconds from tapping a meal to its detail page opening. He calls it not acceptable.

The owner measured 14 seconds on an iPhone on mobile data in Indonesia; that cannot be re-measured. On production with slow 4G, a usable detail opens in 1.96 to 2.45 s on desktop and 1.64 to 1.74 s at 390 wide. The page makes 24 to 25 requests, eight repeated, and desktop downloads two 0.feed.jpg originals of about 480 to 496 KB although the feed copy is already on screen. GrokBot, Nov 5: desktop still downloads two 480 to 496 KB 0.feed.jpg originals, so the done line fails. The owner's 14 s on an iPhone cannot be re-measured and is no longer required. Done when the detail opens within two seconds at the slow-network test profile on desktop and at 390 wide, and the two large originals are not downloaded.

### #375 Storage egress is the largest source and was not cut

In the 24 hours before Run 8, Supabase Storage served 2.99 GB across 35,048 requests, almost all to browsers. The Run 8 cut measured the feed's posts reads, not Storage.

docs/egress.md says the bytes went to browser-like clients but not which files (feed photos, card images or originals) or which clients. In a later 24 hours, test automation accounted for 1.72 GB of the 1.77 GB of feed photo bytes and real mobile browsers for about 46 MB, so the split between test and real users is still a guess. Log volume was never measured in bytes. Done when Storage egress is broken down by file kind and by client (test automation or real users), log bytes are measured, and the largest real-user source is cut or shown to be small.

### #372 Feed photos are too large for a phone on mobile data

Feed photos are too large for a phone on mobile data, so the first photo is slow and the app spends more storage egress than it needs. A phone should receive a small copy sized for its screen.

The feed serves immutable WebP copies at 1920 px (default), 1040 px (2x) and 1560 px (3x) with a one-year cache header. On production the first feed photo appeared at 4.09 s and 4.05 s on a cold open with slow 4G at 390 wide, against a 2 s target. It was the 1560 copy, 50,076 bytes, rendered 390 by 520. One line in docs/media-loading.md still says "no-store". GrokBot, Nov 5: FAIL. On a cold open at slow 4G and 390 wide, three runs showed the first feed photo at 6.96 s, 8.49 s and 7.20 s (about 4.05 s in Fleet 18). The photo is v2-1560.webp, 91,542 bytes, cache-control private, max-age=31536000, immutable, with a natural width of 390 against a 390-wide card, a ratio of 1.0 where the done line needs 2. GrokBot, Nov 15: the first photo took 3.4 s on a judge account (78,522 bytes) and 2.7 s on the owner account (42,986 bytes), still over 2 s. Done when a browser helper on production records the bytes and the cache header of the first feed photo, the first photo shows within two seconds at the slow-network test profile, and the stored photo is at least twice as wide in pixels as the card it fills.

### #222 The feed fails to open, and photos and cards take too long to appear

The feed sometimes fails to open, and on a slow connection the first photo and the cards take too long to show. The goal is the feed and the first photo within two seconds at the slow-network test profile.

The original failures (3 server errors and 15 blank feeds in 100 opens on the largest test account, 146 posts) never reproduced on the earlier baseline, so their cause is not isolated. The stack for digest 3642131196 exists only in the Vercel console, because runtime logs return 403 for the coder. In emulation 100 of 100 cold opens succeeded with photos at 1.48 to 1.83 s, but on production the first feed photo measured 4.09 s and 4.05 s on a cold open with slow 4G at 390 wide. The sub-items #322, #323, #324, #520 and #372 each remove one piece of wasted work. GrokBot, Nov 5: FAIL. The first feed photo showed at 6.96 s, 8.49 s and 7.20 s on a cold slow-4G open at 390 wide, against about 4.05 s in Fleet 18 (see #372). GrokBot, Nov 15: 3.4 s on a judge account and 2.7 s on the owner account, still over 2 s. Done when a browser helper on production measures the first feed photo at 2 seconds or less on a cold open at the slow-network test profile.

### #294 The app's words read naturally everywhere

The leftovers label reads awkwardly, and nobody has reviewed the words in the rest of the app.

The terms to review: the label "leftovers (not eaten)", the line "Drank in this meal" on a meal's second slide (the owner said it sounds off), "Consumed", "Log again", "Saved meals", "Additional food", the clarification question and the Days names. List each term, where it appears and a better wording, with AGY as a second opinion. Every rule stays: use the past tense for consumed, show no target, goal, ring or percentage, and never use "left" for a remaining amount. GitHub shows this issue closed. Done when the list is reviewed, the owner has ruled on each term, and the wording is changed everywhere it appears.

### #693 Voice input exists only in the comment box on a meal

The mic is the one place a user can speak instead of type, and it is buried: it appears only after opening a meal and starting a comment. A user who wants to say what they ate when posting cannot.

The owner ruled on Nov 14 that voice must be a first-class input, available wherever the user types. Checked in the code on main (96ecdcf): VoiceRecorder is mounted only in CommentComposer.tsx, and every transcription is a model call that counts against the hourly limit (#471). PM ruling: the mic sits inside the field, in the same place as the comment box mic, in the new-post caption, the drink description, the leftovers caption, search and the comment box. Done when, in a phone-sized browser on production, each of those five fields shows the mic, and a short recorded clip played into the microphone puts its words in the field. Fleet 21 independent source read, Nov 16 (investigators' report): PR 911 loses speech on submit. The field mic's activity callback is empty (VoiceButton.tsx line 8), so pressing Post while recording closes the composer and the unmount aborts the transcription. The access test stops before transcription and cannot catch it. Fleet 21, Nov 16 (PR 911): the mics are built; those in the text composer, the drink sheet, Search and the comment box were inspected. The mobile camera-caption mic was not verified and no speech clip was played. Fleet 21 independent source read of the fixed head 16348f08, Nov 16: speech lost on Post is fixed, but speech is still lost when a drink photo is being identified during a caption recording and the result is all drinks, because the composer then switches to the drink overview and the recorder's cleanup throws the unfinished speech away (ComposerDrinks.tsx line 23, LightComposer.tsx line 78, VoiceRecorder.tsx line 13). The new tests mock drink detection as inactive and never run the cleanup. Read from source, not reproduced in a browser.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs in #553 are the first case found. List every tappable control on each screen at phone size. For each, record the time from the tap to a visible change, whether it shows a pressed look at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. Measure in Chrome with a slowed processor, using the production sign-in from #196; the table built so far used unthrottled Firefox, so the slowed-processor condition is unmet. Done when the table lists every control with those four findings, and the slow or dead ones are fixed or filed as items.

### #935 A transcription error can disappear when a detected drink changes the composer

When a person speaks a caption and the photo is identified as a drink, the composer switches to the drink overview. If the transcription fails at that moment, its error message can be hidden, so the person gets neither words nor an explanation.

Fleet 21's independent read of #911 found this from the source; it has not been reproduced in a browser. The switch replaces the part of the composer that shows the recorder's inline error. Done when a failed transcription after drink detection shows its error message, and a test or a browser run shows it.

### #937 Opening an uploading meal's address returns repeated not-found errors

While a meal is still uploading, requests for its own address are answered not found, over and over.

Fleet 21 check K15 saw sixteen not-found answers from detail prefetches while two meals uploaded; both meals still reached ready. What a person sees and the cause are not known. Done when the cause is found and an uploading meal's address produces no not-found request, or the errors are shown to be harmless and why.

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

### Flickr-style web addresses throughout the app (issue number to come)

The app's addresses do not tell a person what they are looking at, so people cannot guess, edit or share them the way they can on Flickr. The owner wants addresses where the path names the thing (a person, a meal, a day), so finding and sharing data works by reading and editing the address.

Blocked until the owner has finished researching what the real planner must be told: which pages get such an address, what each address shows a signed-out visitor, and how it fits the public photo addresses (/p/…, #915). Today's pages use /posts/<id>, /days/<date> and /profile. Done when the owner has written the address pattern and a planner brief lists every page and what its address returns.

### An agent holding an API key cannot read its owner's data through a plain web address (issue number to come)

A person can create an API key, but there is no way for a client such as ChatGPT to use it. The owner wants a person to hand the key to ChatGPT and have it fetch that person's data from an address such as /agent/<the key>/<what it wants>, and wants instructions for MCP clients behind a plain link on the website.

Blocked until the owner has finished researching what the real planner must be told. The documentation half overlaps #924 (no guide for reaching the MCP server). The research must settle: whether a key in the address is acceptable (addresses end up in logs, browser history and referrer headers), what each key may read and whether it is read-only, how a key is revoked, and whether ChatGPT can send the fixed Authorization: Bearer header the server accepts today (not checked). Done when the owner has decided the access design, a planner brief says what to build, and the website carries a link to the instructions.

---

† What this backlog is. The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This Doc is private between the PM and the owner, and the coder cannot open it. The coder reads BACKLOG.md, which the owner copies from this Doc. Every item has its own GitHub issue. An item leaves this list when its work is merged. Production proof of a merged fix is a new item in Backlog for GrokBot; the "Interdit (Not part of Hackathon)" section holds items that cannot be worked on and says why. Each section is for one role or one state: Backlog for GrokBot and Engineering backlog (open work), ordered within a section by the pass that will work them together, not by issue number or date. In flight holds the items a dispatch has sent to the coder that have not merged: an item moves there when it is dispatched and leaves the list when its work is merged.

Every item is a title line and two paragraphs. The title line carries the item's own GitHub issue number. (1) The title says in plain words what is wrong, as a GitHub issue title does. (2) The first paragraph is the problem statement, which any person can read. (3) The second paragraph holds the context we have learned that helps solve it. It can be technical. It never holds a dump of logs, review history or merged-change detail. It ends with "Done when" and a condition a person can check. Write short sentences in the active voice, as the Google developer documentation style guide asks, and spell out any term a reader outside the project would not know. An item missing a part is not on the backlog.
