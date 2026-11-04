## Item 3 — whole meal detail photo (#525), Lane C

PR https://github.com/aibraincoach/my-food-ai/pull/556; exact head `81c0b19a6218ca61397500b9d61f892bc6a5bafa`. Code complete, owner phone acceptance remains open. No new issues created by this lane.

The phone detail follows stored photo ratio, capped at 80dvh. DetailImage and desktop additional photos use contain. Overlay masks, boxes and pointer hit testing use the same minimum scale; obsolete expand-on-tap state is removed. Feed images unchanged.

Validation: `npx tsc --noEmit`, focused ESLint, `git diff --check` and default `npm run build` (Turbopack) passed. An earlier `--webpack` build compiled but omitted Tailwind utilities because next.config only supplies the Tailwind loader for Turbopack; its page look was rejected, and all accepted measurements below come from the true default production build. Build dependency setup used worktree-local hardlinks from existing node_modules, no install.

Read-only real test-account meals: portrait 3024x4032 (#189 breakfast repro), square1280x1280 and landscape1280x960 load fixtures. Firefox BiDi, no Playwright. No image files stored. One live viewport look of phone portrait and desktop portrait was captured directly to the tool display as JPEG bytes, never saved. Full photo visible, masks on food; no layout differences beyond requested whole-photo frame and letterboxing. The phone top/bottom and desktop edges are visible. Existing overlapping food-name chips remain as before.

| Viewport | Shape | Frame | Rendered complete photo | Mask offset |
|---|---|---|---|---|
|390x844|portrait .75|378x504|378x504|0,0|
|390x844|square1.0|378x378|378x378|0,0|
|390x844|landscape1.33|378x283.5|378x283.5|0,0|
|1280x800 desktop dialog|portrait .75|640x680|510x680|65,0|
|1280x800 desktop dialog|square1.0|640x680|640x640|0,20|
|1280x800 desktop dialog|landscape1.33|640x680|640x480|0,100|

Every image decoded at its original stored dimensions, computed objectFit=contain, and every measured loaded mask exactly matches the rendered image bounds (within2px tolerance). All six item-chip activations opened their editor. Separate real pointer actions at source-photo point1850,3100 hit the IMG outside any button, selected thick toast and opened its editor: phone viewport231.25,487.5; desktop517.004,582.817. This verifies the changed parent coordinate hit test on both viewport modes.

Before crop is inferred from the prior source cover math and these measured widths/stored dimensions, not a separate baseline runtime: old phone378x230 portrait showed45.63% height (54.37% cropped); desktop640x680 portrait showed79.69% height (20.31% cropped). Now0% cropped in both. Square phone old39.15% height cropped; landscape phone old18.87% height cropped. Desktop square old5.88% width cropped and landscape29.41% width cropped. Accepted geometry receipt is /tmp/run13-c-look.json and real pointer receipt/tmp/run13-c-hit.json (temporary, copy figures into final report; no screenshots).

Driver attempts: two page-scoped/flattened Chromium Network.setCookies calls timed out20sec each before app navigation; browser Storage.setCookies and Page.navigate also stalled. Isolated Firefox BiDi with first-party document.cookie succeeded. Initial BiDi cookie partition attempt redirected to sign-in; corrected before accepted run. Dedicated Firefox19414 profile/tmp/run13-c-firefox, Chromium19413 profile/tmp/run13-c-chromium and local server3143 were started by this lane and must be stopped during cleanup. Final accepted server session89668; Firefox session18529; Chromium89811.
