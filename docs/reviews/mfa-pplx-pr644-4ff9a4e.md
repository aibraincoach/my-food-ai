Head at submission: 4ff9a4e97806fefc59c80605c119de797327978e
Model proof: model_preference = gemini38flash
Elapsed since Enter: 48.8s
Elapsed since tab open: 81.8s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/644

Answer
Links
Images
Share
10:57 AM

code review 
 aibraincoach/my-food-ai#644

Finished
24s
Review verdict

Changes requested for PR #644 at commit 4ff9a4e. I found three correctness issues in the new attachment/recovery flow. The most important is that a normal connectivity change can turn a lost-photo error into a permanent “uploading” state.

1. P1 — Automatic retry destroys the lost-photo recovery state

Location: src/lib/posts/upload-manager.ts — retry(), online(), and the new empty-attachment guard in process().

The failure sequence is:

Reload restores an attachment intent without photo bytes, correctly producing state: 'failed', the retake message, and photoLost: true.

online() retries every failed entry.

retry() changes the entry to uploading and clears its message.

process() encounters attachment && !files.length and returns without restoring failure.

The entry now remains “Adding photo…” indefinitely. Because photoLost is derived from the message that retry() just cleared, the chip also loses its retake button. An explicit retry through another UI has the same problem.

Recommended fix: prevent retries of attachments with missing bytes and preserve their recovery state. Prefer an explicit persisted failure reason over deriving photoLost from display text.

Regression test: restore an intent-only attachment, call online() and then retry(id), and verify it remains failed with photoLost: true, retains its retake message, and performs no network requests.

2. P2 — Retaking a lost photo leaves the original failed operation behind

Location: src/components/UploadChip.tsx — new photoLost click handler; src/lib/posts/upload-manager.ts — postAttachment().

The retake button dispatches open-entry with the target post and leftovers flag, but it neither removes the lost operation nor passes its operation ID for replacement. postAttachment() always creates a fresh UUID.

Consequently, a successful retake creates and completes a new operation while the original failed intent remains in memory and IndexedDB. The chip can continue displaying “This photo was not kept. Take it again.” after the replacement photo has been attached, and the stale error returns on reload.

Recommended fix: associate the camera flow with the failed operation and replace or retire that operation once the replacement intent is durable. Do not delete the original simply when opening the camera—canceling the camera should preserve the recovery option.

Regression test: restore a lost-photo intent, retake and successfully attach a photo, reload, and verify there is no remaining failed intent or recovery chip.

3. P2 — Showing an attachment replaces the existing post carousel instead of adding an in-flight slide

Location: src/components/Feed.tsx — new attachment upload prop passed into PostCard; existing consumers in PostCard.tsx and UploadingPost.tsx.

The new wiring sends attachment uploads through components that interpret every upload without upload.postId as an unpublished post. An attachment has only attachment.postId until it finishes, so during upload:

PostCard replaces the existing media with UploadMedia.

UploadMedia sets pending = true and renders no existing carousel slides.

Post actions become inert, the normal post menu disappears, and the caption becomes “Added photo” or “Leftovers.”

On failure, the existing post’s actions disappear and the status can claim “Not posted yet,” although the post already exists.

After completion, UploadMedia still assumes the preview represents the first existing photo: it prepends the attachment preview and uses post.slides.slice(1), which can omit the original first photo.

Recommended fix: give attachments a distinct rendering path. Preserve the published post’s caption, menu, actions, and existing slides; append the pending attachment as a separate slide. Once fresh media includes the attachment, deduplicate by media identity rather than dropping the first slide.

Regression test: start from a published post with multiple photos and a caption, attach another photo, and assert that the original slides, caption, and controls remain intact through upload, failure, and completion.

Validation scope

I inspected the nine-file diff and the surrounding upload manager, post-card, and upload-media implementations. I did not execute the build or tests. The PR description reports a successful build and four test suites; GitHub returned only a successful “Vercel Preview Comments” check, not an executable-test result.

The added tests cover intent persistence and initial lost-photo restoration, but not the retry transition, replacement cleanup, or existing-post carousel behavior above.

Explain the fix for the P1 retry issue
Show me a code patch for the P2 leak
Draft a review comment summarizing these issues
How should we test the lost-photo recovery flow
Check the rest of the PR diff for other edge cases
⠼
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
GPT-6.1 Sol