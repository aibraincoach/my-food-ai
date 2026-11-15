Head at submission: 7279ca386f43fcf1451cc3716d572cb2d5d73a69
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 24.2s
Elapsed since tab open: 28.0s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/584

Answer
Links
Images
Share
7:34 PM

code review 
 aibraincoach/my-food-ai#584

Finished
9s

Pull Request #584 (fix: fit desktop capture to shorter screens) updates the desktop capture modal and composer to scale dynamically within shorter viewports instead of overflowing or requiring outer scrollbars . The PR is already merged and modifies four files across CSS, React components, and a browser verification script .

Layout and CSS Changes

The core layout changes in src/app/globals.css, src/components/CaptureSheet.tsx, and src/components/LightComposer.tsx replace fixed 620px and 450px heights with viewport-bounded sizing (min(620px, calc(100dvh - 48px))) and flex-based viewfinder scaling .

Dynamic viewfinder sizing: Setting flex: 1 1 auto !important; min-height: 240px; height: auto !important; on .desktop-viewfinder inside a flex-direction: column container ensures the camera preview absorbs remaining vertical space after the 52px mode strip and 96px shutter row .

Viewport-locked background: Adding html:has(.desktop-capture) and body:has(.desktop-capture) with height: 100dvh; overflow: hidden; cleanly prevents background feed scrolling while the modal is open on desktop .

Inline style specificity conflict: In src/components/CaptureSheet.tsx, .desktop-viewfinder still retains style={{ height: labelState==="read"?300:tokens.capture.previewHeight, marginTop: tokens.capture.previewTop }} . Because inline styles override Tailwind utility classes (desktop:h-auto), the desktop layout relies entirely on the !important rules in src/app/globals.css to win; if globals.css is refactored later, this will silently break .

Short-screen overflow risk: In src/app/globals.css, @media (min-width:1024px) and (max-height:667px) changes .desktop-capture from overflow-y: auto to overflow-y: hidden . Because .desktop-viewfinder has min-height: 240px, plus 52px (mode strip) and 96px (shutter row) = 388px minimum, any desktop viewport shorter than ~436px (388px + 48px margin) will clip the bottom of the capture modal with no way to scroll .

Width mismatch on narrow viewports: .desktop-capture-inner[data-round6-capture] now uses width: min(960px, calc(100vw - 48px)), which shrinks below 960px on viewports between 1024px and 1008px (actually 960 + 48 = 1008px), whereas [aria-label="Capture content"] and .desktop-viewfinder still hardcode width: 600px and .desktop-drop-side hardcodes width: 360px . Below 1008px (or if 1024px is the breakpoint, 1024 - 48 = 976px, which is fine, though LightComposer.tsx also hardcodes grid-cols-[minmax(0,600px)_360px]), it is close enough at 1024px (976px > 960px), but using minmax(0, 600px) consistently in CSS would be safer .

Verification Script (scripts/run15-page-checks.mjs)

The new script automates Firefox BiDi checks for day-ring scrolling, admin access, and desktop capture/composer heights at 1366x650 and 1024x700 .

Dead code and stale comments: readFile is imported on line 5 and fill() is defined on line 20, but neither is used anywhere in the script . The usage comment on line 4 also references scripts/run14-production-checks.mjs and uploads/run14/production-checks.json instead of run15 .

Admin role mutation in try block: When running against localhost, the script promotes user.id to admin and demotes it back to user inside the try block . If navigate('/admin') or evaluate(...) throws an exception, the demotion is skipped and the test user remains an admin in the local database; moving the role reset into finally (like the post cleanup) would prevent dirty test state .

Hardcoded timeouts: The script relies on several fixed pause(...) calls (1000ms, 1200ms, 1800ms, 2000ms) rather than until(...) conditions, which can make CI or slower local runs flaky .

Show me how to fix the inline style specificity issue
Rewrite the browser verification script to avoid timeouts
Suggest a test case for a 600px tall viewport
Explain how the viewport-locked background works
Check the remaining files changed in this PR
Sources
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen