# Structured app comments: file-first preparation (#1219 A)

**0084 is UNAPPLIED and held.** This PR adds migration/rollback files, SQL-level
tests and documentation only; its src/messages/scripts diff is empty. Merging
files runs no SQL and changes no app callers. RT's written database yes and the
PM's exact apply order remain required. Applied migration history is unchanged.

## Contract

A new nullable post_comments.message contains a code and values. Exactly one of
body/message is required; user text and old model text remain body. A nullable
posts.summary_comment_id has a same-post foreign key and a server-owned pointer
guard. New summary writers append a structured mealSummary and set this pointer
in one transaction. Refresh changes only the pointed mealSummary, never the
latest model/question comment and never a body selected by English phrases.

Old posts keep null pointers and their history as written, with no rebuild,
parse, added summary row, or timestamp change. The one already-completed read
at 2026-11-25 17:27Z recorded 404 ready_non_deleted_posts, 495
model_comment_rows_unreverted_all_posts (including deleted posts), and 0
model_comment_rows_reverted_all_posts. These are snapshot counts, not current
counts and not a by-kind classification. Do not repeat the count or infer that
every model sentence is app-written.

0082 is a required applied precondition. The actual intersection is only
publish_photo_drink_operation and its internal publish_composer_drinks: the new
overloads require BOTH p_render_zone and p_message. Zone refusal precedes all
writes; zone, message and summary pointer commit together. A receipt replay
repairs a null zone only, rejects a different real zone, and creates no duplicate
meal/comment. Food, tile, copy and agent zone-only overloads from 0082 are final
and unchanged. Every old text/zone-only signature remains for the deployed app.
The copy primitives copy facts but no comment history, so the copy's pointer is
null; it never points at the source comment.

## Order

1. Review and PM-order the exact-head file-only merge. Confirm main contains
   the bytes and docs still say UNAPPLIED. This authorizes no apply.
2. Separately, apply 0082 first under RT yes and PM exact order; record its
   signatures/grants/hash. C-atomic deploys only after that read-back and its own
   exact-head order. This file PR does not perform either step.
3. Apply 0084 only under its own RT yes and PM exact order, after the 0082
   read-back. The top check refuses absent 0082 before any schema write. Record
   columns, constraints, functions, grants and exact hash in an apply receipt.
4. The separate #1219 A app switch merges only after C-atomic is deployed green
   AND 0084 is applied/read back, with the PM's exact app-head order. It supplies
   both photo-drink parameters and reads structured messages in the reader's
   locale. Agent protocol remains declared English. No model call occurs in A.
5. Only after the app is green and a no-caller search may a later held migration
   drop unused text/intermediate photo signatures. No drop is in 0084.

## Rollback

Prefer keeping the additive schema. Revert to a message-aware app once any
structured message has been stored; the old C1/C-atomic readers cannot read a
message-only row. The schema down refuses if ANY message row exists, including
history/reverted rows. It never erases or rewrites messages. An app reversion
retains 0084, and the operator stops for a reviewed message-aware revision.

Only when no message exists, and after reverting all new callers under a
separate exact order, may the reviewed down remove the newly added signatures,
pointer and message columns. It preserves old text and 0082 zone-only functions.
The local test rehearses both safe empty-schema down and the refusal with a
stored message, confirming the row and pointer survive. Nothing invokes this
rollback in production here.

## Verification boundary

Local SQL proofs cover question atomicity and isolation, pointer integrity,
old/null-pointer no-op, copy isolation, both-parameter publication and replay,
code/zone-write mutations, absent-0082 refusal, and rollback stop. A clean local
bootstrap is not a production apply. Browser, translation and app build proofs
belong to the separate app PR; this file-only PR changes none of those bytes.
