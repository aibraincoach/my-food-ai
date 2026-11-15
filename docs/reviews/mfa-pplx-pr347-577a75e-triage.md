Triage by coder, head 577a75e031fe8d4e77d633bb37cdab3f3e3a9d70, model Gemini 4 Hydrogen (request proof and footer agree).
1. DeletedPosts uses timeZone UTC while DeletePostSheet uses the browser-local weekday — Real (minor, verified both lines; dates can differ by one day).
2. Rollback drops the deleted_at policy without purging soft-deleted rows, making them visible again — Real (verified rollback script).
3. Redundant ownership pre-check in softDeletePost before an RPC that locks and re-checks — Real (minor, verified both checks).
4. list_deleted_posts p_user_id is redundant with the auth.uid() enforcement — Not real (explicit parameter, harmless).
Real findings: 3 (items 1, 2, 3)
