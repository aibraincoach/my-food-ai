# #1243/#1253 approved copy proof

Based on merged #1331,7df1551666213c0bd4c21e225c5b61a663adba9f. Planner pin7bf4e16789409d3ee8567a400ed69a245d1355c463b67532b9ad51ef1c6d4676 plus PM Japanese draft/corrections. Local only; no migration or production action.

## Change

Nine approved strings: Welcome hero/support, metadata description, table caption/source note/per-food estimate note, About opening/source/privacy. Exact English in approved-english.json. Six new keys, three replacements:143per language. No other English wording changed. The expanded table keeps its caption screen-reader only and uses the existing footnote style. Only foodApproximation.kind=estimate adds a note, naming that food. Closest references get no estimate note; old/unknown sources get only the general footnote. Open Food Facts attribution is unchanged.

Five former held entries removed. The three stored unavailable-reason leads remain held: they were not released by this ruling. The auth privacy footer stays absent pending1328; emailed codes and the preview/free promise are not built. PNG renderer/data paths unchanged.

## Verification

- check:messages143keys and strict ICU/parity checks pass; changed-file ESLint and tsc pass; local production build passes.
-80focused test cases pass across47copy/auth/nutrition/PNG and33related cases. The i18n pinned count changed137→143 after its expected failure; its15cases then pass. No full-suite rerun; existing global baseline is not claimed clean.
- Six actual-component source cases fail against base and pass on head: allreference, mixedoneestimate, closest, OFFbarcode, label+personaldrink, oldunknownsource. Actual provenance and nutrition readers used. Only the request-bound translation hook is stubbed for Node module-context isolation.
- Two newly rendered1080px English PNG hashes remain byte-identical to main's goldens.
- Chromium and WebKit at390×844: English DOM text/visible aria compares exactly to base after substituting only the approved strings on Welcome, sign-in/up, About. Both languages show the correct Welcome/About/metadata, no auth footer, and usable localized sign-in errors/sign-up forms.
- Six source fixtures in each language/engine:24expanded tables, noUSDAtext in the caption/footnote/table, exactnamedestimate-note count, correctOFFattribution, no paragraph overflow. Synthetic foodnames remain data. Numeric/table labels outside this copy scope remain for later language slices.
- OriginalH1Chromium: Bactivates59ms, fetch200, draft survives, no reload duringcapture, safe-close reload passes. OriginalH4/H5WebKit pass with their declaredsynthetic camera/page-return seams.
-1287original auth/retainedcomment/Back/freshstart/clear cases pass bothengines. Runner exit143 interrupted the final2WebKit cases; retained the4complete results and ran only those2in the owned detached bounded runner. No product failure inferred from termination.
-1320Chromium fresh/seen camera pass; original feed-tip target was behind the6new matrix meals, so it could not own the first-card tip. Restored the original fixture to first by eaten_at, read back its order, and ran only the feed cases:thumbs/thread pass. Assertions unchanged. WebKit fullfresh/seen/thumbs/thread run passes. Local access-control noise disclosed; real-device/Safari behavior unproved. The prior1331mixedWebKitreceipt remains historical, not explained or fixed here.
- One ledgered local account,7meal fixtures plus owned capture reservations/drafts and all associated data/storage/sessions deleted and read back zero; local session signed out. No production meal/account read.

## Instruments

Turbopack refused a dependency symlink outside this worktree; copied the same locked node_modules locally without install or scripts. One test launched while that copy was incomplete failed to import esbuild; rerun after copy. The first component-test instrument mixed ESM/CJS Intl contexts; replaced only that request hook with the real dictionary translator and verified base fails on the actual oldcopy. Raw receipts retained. No product change was made for these instruments.

Rawtranslation sources/reviewtable,logs,screenshots andcleanup readback are in the shared build evidence store under1243-1253-copy. Native review is not claimed.
