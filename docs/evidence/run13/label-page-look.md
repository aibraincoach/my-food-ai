## Item5 page look — label without serving size (#452)

Accepted page look on E exact head8b0c0d4cb8b83e2bcc4fa43c36fc7b79144f8abf inside root's integrated local default production build at127.0.0.1:60380. Firefox native WebDriver BiDi, no Playwright and no stored image files. Both viewport cases used the hydrated actual New post/capture UI, decoded an unknown generated barcode, selected Photograph the nutrition label, uploaded the existing FDA sample fixture through the real local stage/storage routes, and stubbed only/api/label/read with is_label:true, serving:null and filled per_serving numbers. No Post was submitted.

|Viewport|Message|Take photo again|Type instead|Photo|
|---|---|---|---|---|
|390x844|20,759350x21, visible|20,780124.917x44, visible|160.917,78087.350x44, visible|contain|
|1280x800|780,166320x42, visible|780,208124.917x44, visible|920.917,20887.350x44, visible|contain|

Displayed message: "The serving weight or volume could not be read". Both exits function in both viewport cases: retry returns to capture, a second uploaded fixture returns to the no-serving message, and Type it instead shows the caption composer. Two label read calls per viewport. A separate phone live screenshot was displayed directly as tool image bytes, never saved; message and both exits readable with no overlap, full label photograph contained above them. The same fixture visibly prints a serving size; its null-serving response was deliberately stubbed to exercise the specific state, not a claim about real provider extraction. Owner Goldfish photo remains untested.

Accepted geometry receipt/tmp/run13-e-look.json; driver/tmp/run13-e-look-c.mjs. The original driver sometimes dispatched open-entry before hydration; corrected by waiting for[data-feed-client-ready], then clicking the actual hydrated New post button or the mounted capture entry event. Navigations use wait:none plus explicit readiness checks to avoid unrelated page subresource waits. Previous barcode fixture existed in OFF; accepted unknown generated barcode resolves missing before choosing label. No product defect claimed for driver failures.

Cleanup verified against exact nine staged IDs created by this lane's two accepted viewport cases and one direct visual pass:18 local storage files and9 matching media_cleanup jobs removed; all9 storage prefixes empty, no retained posts, no remaining matching jobs. Cleanup script/tmp/run13-e-cleanup-c.mjs uses local-only host guard. Own Firefox19414 stopped and no listeners on19413/19414. Shared integrated server60380 is root-owned and left for root cleanup. No new issues created.
