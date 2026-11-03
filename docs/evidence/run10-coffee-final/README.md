# Fleet10 production phone acceptance: 7m and same-fixture 15/16 / 306

Method: designated test account2, fresh Chromium156ARM profile,390×844, CPU4×, actual DevToolsFast4G tuple1012500B/s down /168750B/s up /165ms latency. Asia/Tokyo was explicitly set both in browser context and CDP, with Tokyo geolocation35.6762/139.6503; geolocation alone does not change Intl. All food/label responses were real production responses. No signup/auth-form probe. Original hints/provider backed up privately and restored exactly at final cleanup.

Production code: initial7m12:57–12:59UTC and photo follow-up13:01–13:02 on READY6f857ac; final phone views13:18–13:19 and controlled30613:20–13:21 on final READY789c2b7db3ac5a75f7c2b7271419a8a3176c9702. The later changes were copy/drink durable save and phone contrast; unaffected7m cases were not presented as a fresh full rerun. Water posting is also covered by root's final0045 drink acceptance.

| Check | Actual production result |
|---|---|
|#23 four hints|Reset designated account2 hints only. Thumbs12:57:04–07; capture+modes12:57:07–09; thread12:57:30–37. All four visible in viewport and persisted. Revisit counts thumbs/capture/modes/thread all0; stored array contains exactly allfour keys. Modes copy is current “Swipe to scan a barcode.” Original array restored at cleanup.|
|#224 Tokyo|Caption meal eaten_at11:27:00Z: card/detail/Days8:27PM; thread model comment created12:57:25Z renders9:57PM. Intl resolvesAsia/Tokyo; rendered time values independently converted from their own ISO. Meal clock and comment clock are correctly different.|
|#223 caption|Edited through actual sheet/PATCH200, reloaded; exact new caption found on Feed, post detail, selected Days story and Search12:57:42–48.|
|#175 Water date|Water tile then Edit time→Oct22 12:34Tokyo on a date with no other post: Days enabled, label1post/0kcal, story Water250ml. Stronger standalone intake-only Oct19:0posts, enabled calendar label “drank”.|
|#29 caption card|Caption-only rice displays CONSUMED card with129kcal/3gprotein/28gcarb/0gfat.|
|#29 photo/card/correction|Real repository spaghetti photo produced photo then card then leftovers-add slide. Genuine CDP touch swipe selected slide1 atscrollLeft390/width390. Actual “I ate half the spaghetti.” correction changed current portion200→100g. Immutable card PNG hashes differ before/after.|
|#283 exported PNGs|Downloaded actual owner-authorized Storage PNGs,1080×1080. Onephoto65181B SHA7650c49cd704c28b460fce76f3b25c51356a31abc7f39db630a5382ba2ec8067; corrected64670B SHA55d22ee9303a98044c4faf1e251d2373594b867686a5d9b6346338e6ad492fb4; leftovers56584B SHAbe6972b01d3ef8b61ad91b6a64440aa67d90acf877a5ee5fa619cd35a0f408c1. Onephoto and leftovers PNGs literally viewed: complete footer, not DOM-only.|
|15 Replace|New leftovers attachment POST13:01:29.040; response13:01:29.808; oldphoto DELETE first13:01:29.913, bounded ready retries followed. Newphoto remains, oldphoto removed after attachment. Same image intentionally tests mechanics, not physical portion accuracy.|
|15 Unmark|Same replacement photo retained; not_eaten becomesfalse; actual reanalysis changed currentitem0g eaten/100g leftover→100g eaten/not_eaten null, ready13:02:30.|
|16 photo Undo|Remove→Undo418ms, waited beyond6sec; no DELETE, exact photo rows unchanged.|
|16 correction Undo|Remove→Undo154ms, waited beyond6sec; no revertHTTP, comment still active.|
|306 bookmark/menuSave|Final code: acknowledged requests held before backend; filledUnsave state visible before answer. Browser networkabort shows error and restores Save/false. Both named controls separately exercised.|
|306 editedcaption|Final code: newcaption visible while PATCH held before backend; abort reopens error and restores original visible caption and DB value.|
|306 Logagain+SavedLognow|Final code: each closes to a NEW “Saving copy…” feed entry while POST held, receipt verified absent; releasing actual request creates onecopy, realID visible afterreload.|
|306 failedcopy|Three real browseraborts, zero receipt/copy; unconfirmederror replaces Savingstate; durable input survivesreload. ExplicitTryagain reuses sameoperation and commits onecopy.|
|306 lostackcancel|Actual route.fetch commits then responseaborted three times; one serverreceipt/copy. Remove pending sends actualDELETE, receiptcancelled/targetsoftdeleted, absent afterreload. No new modelcall for copy tests.|

Controlled306 contexts blocked SW only to make interception trustworthy; normal7m and visual acceptance allowed SW. These are functional results, not performance benchmarks during root builds.

#307 remains unproven by this flow: initial observation incorrectly matched caption “Plain spaghetti,” so that screenshot is explicitly excluded from names-before-totals proof. Correctly scoped Processing-child observation during leftover replacement saw only Processing and no itemnames; that reanalysis path does not prove original identify streaming. A proper observer is prepared on final7k's single necessary new caption fixture. No extra food fixture was made for307.

Driver corrections retained in raw receipts: first photo follow-up attempted a feed-carousel selector on detail (two timeouts before mutation), and queried a nonexistent calories column before Unmark (no mutation). Corrected feed selector/schema then passed the actual cases above. They are harness failures, not hidden product passes.

Cleanup13:21:24.866UTC:9 exact owner-bound post/stage IDs (including published copies and staged final visual photos),1standalone intake,4copy receipts,1saved snapshot and all exact-prefix Storage objects removed/verified; no running owned job removed; original hints/provider restored and verified; cleanupissues[]. No nonfixture job/post removed. Evidence folder: uploads/run10-coffee-acceptance/final-2026-11-03T12-57-01-845Z; final-copy-results.json and state-private.json contain precise operations/cleanup, PNGs are actual exports.
