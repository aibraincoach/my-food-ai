Head at submission: 54d9264886429193663593f0837f58e987dad740
Thread: https://www.perplexity.ai/search/7997e64b-486d-4d0a-9555-a37467a316d4
Selected model at capture: Gemini 3.8 Flash
Model proof: model_preference = gemini38flash
Elapsed since Enter: 39.7s
Elapsed since tab open: 68.4s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/297
Reopened same thread for complete visible-text capture
Selected model on reopen: Gemini 3.8 Flash

Answer
Links
Images
Share
5:00 AM

code review 
 aibraincoach/my-food-ai#297

Finished
14s

Pull Request #297 implements post deletion, leftovers photo removal, and correction reversions with deterministic replay and cascade cleanup. Overall, the PR is well-architected and thoroughly tested, but it contains several important edge cases, race conditions, and UX/accessibility bugs that should be addressed before merging.

Architectural Strengths

Secure database boundary: Definer functions (owner_remove_post_data, persist_removed_rebuild) enforce strict ownership (user_id = auth.uid()), lock parent posts (FOR UPDATE), and validate storage path prefixes (auth.uid()/post.id/) to prevent path traversal.

Deterministic replay pipeline: Rebuilding from initial analysis (identify) rather than mutating current snapshot state ensures cumulative deductions or discarded items never pollute restored nutrition values.

Durable cleanup queue: Storing media_cleanup jobs with post_id = NULL avoids deadlocks or orphaned jobs when cascading post deletes occur.

Snapshot concurrency guards: persist_removed_rebuild guards against race conditions by checking item, comment, and photo array snapshots against expected IDs before applying rebuilt items.

Key Findings
1. Incomplete Storage Walk During Post Deletion

In src/app/api/posts/[id]/route.ts:

ts
const { data, error } = await bucket.list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
// ...
for (const entry of data ?? []) {
  const path = `${prefix}/${entry.name}`;
  if (entry.id) paths.push(path);
  else await walk(path);
}

In Supabase / S3 storage listings:

Folder placeholders often return with id: null and must be recurred into, but S3 folders / prefixes can also carry metadata or not represent files.

More importantly, relying solely on client-side bucket traversal before deletion creates a race condition: if a background job generates a card image (e.g. cards/[uuid]/card.png) or a photo upload completes after walk() finishes but before delete_post executes, those files will be permanently orphaned in storage.

Recommendation: Pass the folder prefix (e.g., ${user.id}/${id}/) to media_cleanup so the worker deletes by prefix or runs a wildcard purge on S3/Supabase storage, rather than relying exclusively on an exact file-path list compiled before deletion.

2. SWR / Feed Cache Inconsistency on Photo Removal

In src/components/Carousel.tsx:

ts
const remove = async (mediaId: string) => {
  // ...
  setRemoved(old => [...old, mediaId]);
  window.dispatchEvent(new CustomEvent('media-removed', { detail: { id: postId, mediaId } }));
  router.refresh();
};

In Carousel.tsx, removed is kept in local component state. If the user navigates away and returns before the server recompute job finishes (which can take several seconds due to LLM calls), the server will still return the un-rebuilt post or old slide data, causing removed photos to flash back into view.

While Feed.tsx catches media-removed, it re-fetches cards through created(). If the backend job status is still processing, Feed should reflect an in-progress/updating state rather than serving stale cached slides.

3. Missing Confirmation Dialogs for Destruction Actions

Post Deletion uses DeletePostSheet with explicit confirmation ("Delete this post? Its photos and numbers are removed.").

However, Leftovers Photo Removal (Carousel.tsx) and Correction Reversion (Thread.tsx) trigger destructive, irreversible actions immediately upon clicking:

Carousel.tsx: Clicking "Remove this photo" immediately calls DELETE /api/posts/${postId}/media?media_id=${mediaId}.

Thread.tsx: Clicking "Remove this correction" immediately calls POST /api/posts/${postId}/comments/${commentId}/revert.

Recommendation: Add a brief confirmation prompt or sheet for removing photos and corrections to prevent accidental taps, especially on mobile touchscreens.

4. Accessibility and Interaction Quirks in Menus

<details> outside click dismissal:

In Carousel.tsx and Thread.tsx, the action menus use <details> without an outside-click or backdrop listener. Once opened, clicking outside does not dismiss them unless the user explicitly hits "Cancel" or toggles the summary button.

Escape key support:

PostMenu.tsx has onKeyDown handling for Escape, but the inline menus in Carousel.tsx and Thread.tsx lack it, violating keyboard navigation conventions.

Button styling in DeletePostSheet.tsx:

The delete button hardcodes style={{ background: 'oklch(0.52 0.17 25)' }} instead of utilizing design system tokens or Tailwind theme classes (e.g., destructive color token).

5. beforeLeftovers Portion Grams Type Handling

In src/lib/pipeline/leftovers.ts:

ts
export function beforeLeftovers(item: CurrentItem): CurrentItem {
  return {
    ...item,
    calories: item.calories == null || item.not_eaten_calories == null
      ? null
      : toNumber(item.calories) + item.not_eaten_calories,
    portion_grams: grams,
    portion_text: `${grams} g`,
  };
}

Notice that grams is not defined within beforeLeftovers in the diff if grams was scoped outside or assumed global. Ensure const grams = toNumber(item.portion_grams) + (item.not_eaten_grams ?? 0) is evaluated cleanly and handles null values without formatting as "null g".

Code Quality Comparison
Area	Status	Notes
Database Migrations (0030)	Good	RLS policies, trigger checks (only_reverted_at_changes), and lock ordering are properly structured.
Background Jobs (recompute)	Good	Atomic save via persist_removed_rebuild ensures intermediate LLM states never leak to clients.
Storage Cleanup	Needs Work	Pre-walking client-side risks leaving files uploaded or rendered concurrently by running jobs.
UI / Accessibility	Needs Work	Unconfirmed deletions on sub-items; <details> menus lack outside-click and Escape key handlers.
Automated Tests	Good	Includes integration tests for cascade behavior, access boundaries, and model replay sequences.
Show me the code fix for the storage walk bug
How should I handle the race condition in the API route
Draft an inline comment for the database function
What tests should be added for the storage cleanup
Show me how to improve the accessibility issues
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 3.8 Flash