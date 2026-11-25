# Atomic capture zones (#1368 C-atomic)

A food, tile drink, photo drink, copy or agent publication now commits its capture
zone in the same database transaction as its post. The browser supplies a
canonical IANA name. Each new RPC checks the database's own `pg_timezone_names`
before any insert and raises `PT400` when it refuses the zone. Offset and
abbreviation inputs are refused. Changed non-null zones on a receipt replay get
`PT409`; a C1 receipt whose separate zone save failed may repair only its null
zone with the retry's explicit value. Existing owner, key, cancellation and job
fences stay in the publication transaction.

The app uses the new overloads only. It removes the separate post-commit zone
save, the copy compare and renderer metadata writes. Receipt fast paths still
avoid repeating food/label lookups, but call the same atomic publication RPC to
check/repair their zone. On those owned-receipt paths, selection inputs that the
RPC no longer needs are null; a missing receipt therefore fails validation rather
than creating a second meal. The agent API and MCP schema require `time_zone`;
agent docs and in-app instructions explain it.

## Apply and switch

1. Obtain RT's written database yes and the PM's exact order for **0082**. The
   checked-in SQL is preparation, not evidence of an apply.
2. Apply 0082 before this app merge. It adds zone-only signatures and leaves old
   signatures for the running C1 app. Its top check refuses a message-first 0084
   layout. Read back all five signatures and their grants, the fixed validator
   error, and the exact migration hash in the apply receipt.
3. Merge the exact reviewed C-atomic head only after the PM orders it and the
   0082 readback is recorded; confirm the app deploy is green.
4. #1219 A's 0084 comes next and adds both `p_render_zone` and `p_message` only on
   the actual overlap: photo-drink publication and its internal composer. Food,
   tile, copy and agent zone-only signatures are final. The intermediate
   photo-drink zone-only signature is dropped only after #1219 is green and a
   no-caller search, in a separately held drop migration.
5. Held **0083** performs the UTC backfill and old-signature drops after C-atomic
   is green, not before C1's recorded deploy +1 hour. That is an eligibility
   timestamp, not a wait or observation window. Held **C2** removes the renderer's
   null-zone read default only after the 0083 zero-null readback. Neither is here.

No production apply, backfill, old-signature drop or owner ask is performed by
these local proofs. No production latency or real-phone claim is made. The app's
ICU canonical-name set may differ in tzdata version from production Postgres;
the database refusal now rolls back the entire publication and maps to 400.

## Rollback

Prefer retaining additive 0082. Revert the app to C1 first, before optionally
running the reviewed `0082_atomic_capture_zones.down.sql` under a separate order.
The down removes only new signatures/helper; it keeps stored zones and all old
signatures. It refuses to remove 0082 beneath any 0084 message callers. Once 0084
has written structured messages, an app revert must remain message-aware and
retain 0084; no rollback erases messages or rebuilds history.

## Kept behavior and limits

- Viewing-zone `validZone` remains the named display default before a device
  reports its zone; it is not stored capture data.
- Old null-zone rows still use the explicitly documented renderer read default
  until held 0083/C2. The renderer no longer writes it.
- Optional PNG, hydration, save, queue and media privacy behavior is retained.
- Agents use the declared English machine protocol. The one new Japanese
  instruction is PM-drafted, reviewer double-read, **not native-reviewed**.
- The pre-existing comment-label test hook lint errors are fixed without
  changing its stored-text assertions. The error-display guard lint issue had
  already been fixed in C1. The unused tile POST `?tz=` was removed.
