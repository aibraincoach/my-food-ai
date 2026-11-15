Head at submission: a277c0c4b4d6e02c08c8f85644f0265ed2f49586
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 24.8s
Elapsed since tab open: 28.4s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/662

Answer
Links
Images
Share
11:13 AM

code review 
 aibraincoach/my-food-ai#662

Finished
16s

PR #662 (fix18: feed variant redirect no-store (F2/#639)) is a clean, targeted fix—already merged—that prevents browsers from caching short-lived signed URL redirects for a year.

What Changed

The pull request modifies 2 files (+13 / -1 lines):

src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts: Changes the fallback 302 redirect response in original() from ...cacheHeaders to ...headers.

tests/feed-variant-cache.test.mjs: Adds a regression test using node:test to verify that the 302 redirect uses ...headers instead of ...cacheHeaders.

Correctness and Security

In original(), createSignedUrl(data.storage_path, 60) generates a Supabase signed URL that expires in 60 seconds. Previously, returning cacheHeaders (Cache-Control: private, max-age=31536000, immutable) on the 302 redirect instructed browsers to cache that redirect for a full year, which would break image loading after 60 seconds whenever resizing failed or timed out.

Switching to headers (Cache-Control: private, no-store, X-Content-Type-Options: nosniff) ensures the 302 redirect is never cached while leaving the 200 resized WebP response and 304 ETag path untouched.

Test Coverage Note

The new test in tests/feed-variant-cache.test.mjs reads route.ts as a string and asserts against regex patterns rather than invoking the GET handler. This catches a direct revert to cacheHeaders, but it is coupled to exact code formatting and does not verify the actual runtime Cache-Control header on a 302 response.

Show me how to rewrite the test for runtime validation
Check other redirect routes for similar caching bugs
Explain how the fallback 302 redirect works
Review the code changes line by line
Look for other uses of cacheHeaders in the codebase
Sources
⠙
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen