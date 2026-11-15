Head at submission: 525d8e47e806c4adc151ac180b40affbbf2d6b1e
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 23.5s
Elapsed since tab open: 27.1s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/611

Answer
Links
Images
Share
11:20 AM

code review 
 aibraincoach/my-food-ai#611

Finished
14s

PR #611 (fix: size photo details before images load, merged) cleanly eliminates layout shift in photo detail views by computing container dimensions from stored width and height metadata before images load.

Architecture and CSS Layout

Shared sizing helpers: Adding photoBoxStyle and desktopPhotoVars in src/lib/media/photo-box.ts centralizes aspect-ratio math and safely falls back to 1 / 1 when dimensions are missing or non-positive.

Desktop grid math: In src/app/globals.css, .desktop-post-content computes --photo-box-h against the 680px height cap, 100dvh - 96px viewport height, 640px max photo width, and 100vw - 472px (112px dialog margin plus 360px record column), keeping the photo column uncropped and proportional.

Extreme aspect ratio risk: Because height: var(--photo-box-h) sets the height of the entire two-column grid, a very wide panoramic image (for example, 10:1) shrinks --photo-box-h to ~64px, collapsing the right-hand .desktop-post-record column with it. Adding a min-height on .desktop-post-content or clamping the aspect ratio in ratio() would prevent the metadata/comments pane from becoming unusable on ultra-wide photos.

Component and Data Flow

Simplified PostOpenFrame.tsx: Removing useLayoutEffect and naturalWidth/naturalHeight DOM measurement eliminates the post-load resize and simplifies Photo.

Consistent OutlineOverlay.tsx: Switching wholePhoto && activePhoto to photoBoxStyle(activePhoto) and passing desktopPhotoVars(activePhoto) aligns the interactive overlay with the opening frame.

Feed propagation: src/lib/posts/feed.ts (toFeedPost and toFeedPosts) and src/components/Carousel.tsx cleanly pass width and height from post_media into Slide without altering the square feed rail.

Backfill Script and Tests

Safe backfill design: scripts/backfill-media-sizes.mjs defaults to a dry run, snapshots all matching rows before writing to avoid pagination drift, swaps dimensions for EXIF orientations 5–8, clamps values to [1, 4096], and guards updates with .or(missing) so concurrent uploads are not overwritten.

Test coverage: tests/sharp-image-identity.test.mjs updates its module mock for @/lib/media/photo-box, though there are no new unit tests directly asserting photoBoxStyle or desktopPhotoVars edge cases (such as null, 0, or extreme aspect ratios).

Show me code to fix that extreme aspect ratio bug
Show me what tests we should add for photoBoxStyle
How does this interact with mobile carousel views
Write a test suite for photo-box.ts
Show me how to add a min-height to desktop-post-content
Sources
⠧
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen