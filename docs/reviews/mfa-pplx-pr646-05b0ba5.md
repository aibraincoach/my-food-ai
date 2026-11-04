Head at submission: 05b0ba504a9c5e093423ef0d5569b39632bab495
Model proof: model_preference = gemini38flash
Elapsed since Enter: 45.2s
Elapsed since tab open: 52.3s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/646

Answer
Links
Images
Share
11:03 AM

code review 
 aibraincoach/my-food-ai#646

Finished
24s
Review verdict

Changes requested — I found one concrete modal-interaction bug in PR #646 at commit 05b0ba5, plus an iPad detection gap worth addressing before considering the workaround complete.

1. [P2] The save prompt does not take ownership of focus or Escape

Location: src/components/SavePhoto.tsx, lines 35–48; interaction with the document-level keyboard handler in CaptureSheet.tsx.

SavePhotoPrompt portals a new dialog into document.body, but it never moves focus into the prompt, traps focus, or handles Escape. Meanwhile, CaptureSheet keeps its existing document-level keyboard handler active:

Escape calls closeDraftRef.current(), closing the entire capture sheet rather than just the photo prompt.

Tab handling still uses controls inside dialogRef, which excludes the portaled prompt.

Focus remains on the underlying Save photo control when the prompt opens, leaving keyboard users interacting with the obscured composer.

Consequently, the new dialog’s aria-modal="true" does not match its actual interaction behavior.

Reproduce: On a device that takes the iOS hint branch, open Save photo using a hardware keyboard, then press Escape. The capture sheet closes instead of returning to the composer.

Suggested fix: Give the prompt modal focus management, restore focus when it closes, and suspend the capture sheet’s Escape/Tab handling while the prompt is open. Prefer an existing modal primitive if the project has one.

2. [P2] Desktop-style iPad user agents bypass the workaround

Location: src/components/SavePhoto.tsx, lines 8–11.

The detector requires both an iPhone|iPad|iPod token and an OS major_minor token. An iPad presenting a desktop-style Macintosh user agent fails that check and falls back to the same share-sheet path this PR is intended to replace.

This is a coverage gap rather than a regression for existing iPad users, but it makes the stated iOS 16.2+ behavior incomplete.

Suggested fix: Handle desktop-style iPad identification explicitly, and define what to do when the OS version cannot be extracted. Add detector tests for iPhone, conventional iPad, desktop-style iPad, older iOS, Android, and desktop macOS.

Validation and remaining risk

I inspected the diff and surrounding capture-sheet logic; I did not execute the application or test a physical device.

The PR description reports a passing npm run build, but leaves the iOS long-press and Android/desktop behavior checks unchecked. The check-runs endpoint returned only a successful “Vercel Preview Comments” check—not automated evidence that image saving works.

Before merging, prioritize:

A physical iPhone test in both Safari and the installed web app: confirm long-press on this blob-backed image actually offers saving and produces the expected photo.

A keyboard test: opening the prompt moves focus inside; Escape closes only the prompt; closing restores focus.

An iPad test with desktop website mode.

An Android/desktop smoke test of the extracted share/download helper.

The non-iOS helper otherwise preserves the previous share/download control flow, apart from using the original file name instead of always downloading as meal.jpg. No review comments or repository changes were posted.

Show me the suggested fix for the focus trap
How should I handle the iPad user agent check
Show me the code diff for SavePhoto.tsx
Check the rest of the PR files for issues
Let's write a comment for this review
⠦
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol