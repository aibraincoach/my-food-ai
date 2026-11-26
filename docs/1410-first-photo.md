# First Home photo

The first photo uses a 320-pixel WebP from the existing secret-bearing immutable derivative route. It is a first frame: the first frame is visibly softer for about 1–2 seconds on a cold slow link, then the same sharp responsive photo replaces it. Other photo widths retain their previous bytes. The new width uses WebP quality 32; the synthetic fixture is 5,448 bytes. It is generated on its first uncached request, without a backfill or original-image fallback.

The server image owns its automatic preload. There is no extra client-emitted preload for this one fixed first-frame URL. The sharp fetch starts on the existing load/idle trigger; MealPhoto renders a sharp sibling in the same absolute box over the unchanged soft image. The mounted sharp sibling decodes and waits two frames before becoming visible, without a transition. After one more painted frame the soft image is removed and its alt moves to the sharp image. Only then does the effects gate settle. This overlay is the chosen design, not a runtime fallback. The hidden temporary seed does not perform a second upgrade.

One root effect enables `html[data-effects]` after window load, completion of the first-photo sequence and one animation frame (with a hard cap of eight seconds after navigation start). Before then, the pill has the same plain surface fill, and blur, shimmer, the pill opacity transition and the pill/entry/stuck/segment shadows are deferred. After the gate, their original tokens and resting appearance return. The load check uses the priority image marker in server HTML, so it does not mistake late hydration for a page without a photo. Aborting a superseded attempt does not settle the sequence. Cleanup removes the load listener and cancels the frame and cap. There is no persistent setting.

The frosted look and shadows appear after the sharp copy has painted, at most eight seconds after navigation start. The timing was investigated in GPU-less local WebKit emulation; real iPhone timing is unproved. Image-specific LCP `renderTime` is the paint measure, with the rAF harness, DOM readiness and distinct captured frames reported separately. DOM readiness alone does not prove paint, and repeated video frames do not provide fresh 40 ms samples.

StoryPlayer and other non-first-frame shadows are deliberately ungated.

No model or production data work is part of this change.
