# Responses displayed as the generic server failure

Known response message_code values keep their exact original English. An absent or unknown message_code produces capture.serverFailed. The operational code field is untouched.

These fixed route/helper sentences occur in uncoded error responses and therefore now display "The server didn't respond." instead of the raw text:

- Drink operation not found.
- Drinks could not be checked. You can still post the photo.
- Photo draft not found.
- Signing upload URLs failed.
- That food could not be logged.
- The drink operation could not be confirmed. Your selection is kept.
- The drinks could not be posted. Your photo was kept.
- The meal could not be logged.
- The meal could not be saved.
- The pack photo or portion could not be saved.
- The pending copy could not be removed.
- The photo could not be attached.
- The photo could not be unmarked.
- The photo upload could not be completed. Your draft was kept; try again.
- The saved drink could not be confirmed. Your selection is kept.
- The upload draft expired. Your photos were kept; try again.
- This drink intent changed.
- This drink post was removed.
- This drink selection changed. Start a new drink post.
- This pending drink was removed.
- This photo has already been checked.
- This photo is being checked.
- Transcription could not be completed.
- Transcription is busy. Please try again.
- Wait for this meal to be ready.
- You have made a lot of requests this hour. Try again later.

Other sites return database/provider error.message or receipt.error; arbitrary runtime detail cannot be enumerated. Their exact source expressions are listed below. No such raw wording is persisted.

- src/app/api/drinks/identify/route.ts:20 — existing.state==='pending'?'This photo is being checked.':'Drinks could not be checked. You can still post the photo.'
- src/app/api/drinks/identify/route.ts:36 — claimError.code==='23505'?'This photo has already been checked.':'Drinks could not be checked. You can still post the photo.'
- src/app/api/drinks/post/route.ts:25 — receipt.error
- src/app/api/drinks/post/route.ts:43 — error.code==='42501'?'Photo draft not found.':'The drinks could not be posted. Your photo was kept.'
- src/app/api/intake/post/route.ts:49 — receipt.error
- src/app/api/media/sign-upload/route.ts:64 — mediaError.message
- src/app/api/media/sign-upload/route.ts:77 — e instanceof Error ? e.message : "Signing upload URLs failed."
- src/app/api/posts/[id]/log-again/route.ts:16 — error instanceof CopyOperationError?error.message:'The meal could not be logged.'
- src/app/api/posts/[id]/log-again/route.ts:22 — error instanceof CopyOperationError?error.message:'The pending copy could not be removed.'
- src/app/api/posts/[id]/media/route.ts:15 — missing.message
- src/app/api/posts/[id]/media/route.ts:23 — error.message
- src/app/api/posts/[id]/media/route.ts:26 — error instanceof Error?error.message:'The photo could not be attached.'
- src/app/api/posts/[id]/media/route.ts:57 — error.code==='55000'?'Wait for this meal to be ready.':'The photo could not be unmarked.'
- src/app/api/posts/food/route.ts:46 — null
- src/app/api/posts/food/route.ts:101 — error.code?.startsWith("22") ? "The pack photo or portion could not be saved." : "The meal could not be saved."
- src/app/api/posts/food/route.ts:122 — error.code?.startsWith("22") ? "That food could not be logged." : "The meal could not be saved."
- src/app/api/posts/route.ts:53 — error.message
- src/app/api/posts/route.ts:76 — expired ? "The upload draft expired. Your photos were kept; try again." : "The photo upload could not be completed. Your draft was kept; try again."
- src/app/api/saved/[id]/log/route.ts:14 — error instanceof CopyOperationError?error.message:'The meal could not be logged.'
- src/app/api/saved/[id]/log/route.ts:20 — error instanceof CopyOperationError?error.message:'The pending copy could not be removed.'
- src/app/api/transcribe/route.ts:32 — error instanceof MetaApiError&&error.status===429?'Transcription is busy. Please try again.':'Transcription could not be completed.'
