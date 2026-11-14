Head at submission: 3c8d25f428163f6be9b503fb859f07ab189f30db
Model proof: model_preference = gemini4hydrogen
Elapsed since Enter: 20.2s
Elapsed since tab open: 24.5s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/655

Answer
Links
Images
Share
10:29 AM

code review 
 aibraincoach/my-food-ai#655

Finished
11s

Pull request #655 (Fleet 19: JSON errors on question dismiss (#627)) is a clean, focused change that ensures all error responses from the DELETE /api/posts/[id]/question endpoint return JSON { error } payloads instead of empty bodies, and it is already merged.

Route Handler Changes

In src/app/api/posts/[id]/question/route.ts, the DELETE handler replaces three empty new Response(null, ...) error responses with NextResponse.json(...):

Invalid UUID (404): Returns { error: "Meal not found." } when isUuid(id) fails.

Missing or unauthorized post (404): Returns { error: "Meal not found." } when !post, avoiding leaking whether a post belongs to another user.

Database read error (500): Returns { error: "Question could not be dismissed." } when the initial select fails, matching the existing 500 response on cleared.error.

Success (204): Continues to return new Response(null, { status: 204 }) as expected for a 204 No Content response.

Authorization is properly scoped with .eq("user_id", user.id) on both the lookup and the update, and the error messages are consistent with the rest of the handler.

Test Coverage

tests/question-dismiss-route.test.mjs adds an integration test using node:test that:

Guards against running against non-local environments by asserting APP_URL and NEXT_PUBLIC_SUPABASE_URL resolve to localhost, 127.0.0.1, or [::1].

Verifies 401 (Sign in required.) for unauthenticated requests.

Verifies 404 (Meal not found.) for a malformed ID ('not-a-meal'), a random nonexistent UUID, and another user's post.

Confirms question remains intact after failed requests, returns 204 on an authorized DELETE, and clears question to null in the database, with cleanup in finally.

Minor Observations

Untested 500 path: The 500 error branches are not exercised by the integration test, which is expected given it runs against a live Supabase instance without mocking.

Compact formatting: Both files pack multiple statements onto single lines; if that matches the repository's convention, no action is needed, though standardizing formatting with Prettier/ESLint would improve readability.

Check for other endpoints with similar error handling
Add Prettier or ESLint configuration to the repo
Review the integration test assertions for edge cases
Show me how to run these integration tests locally
Look at the original issue #627 for context
Sources
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen