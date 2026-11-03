# PR #460 follow-up review triage

The owner supplied Muse's **BLOCKERS: NONE** review for exact head `3eaa72fe6c184abca91b6b0f5d1db7e578e7fcec`. That review is evidence for that head only. The owner subsequently expanded this task to repair the existing test/lint failures (#450), and supplied the Perplexity review below. New code requires follow-up review of the new head; no merge approval is inferred.

| Perplexity finding | Assessment and change |
| --- | --- |
| Native backdrop dismissal | Child overlays already fail `target === currentTarget`, so ordinary child-event bubbling does not establish the claimed bug. A drag that begins inside and ends outside can retarget a click to the dialog. Dismissal now requires both a pointer-down outside the bounds on the actual dialog and a matching backdrop click; pointer cancellation resets it. Regression exercises inside-to-outside drag, out-of-bounds child, and real backdrop click. |
| Today time zone | Use the active server cookie zone passed through Home's streamed boundary, with device zone only when no configured zone exists. Day requests and post times use the same zone. |
| Calendar rich controls | Arrow capture is restricted to the calendar grid and excludes form fields, contenteditable/combobox roles and modified keys. MonthGrid's own handler is also restricted to date buttons and excludes rich inputs. |
| Structural header selectors | TopBar exposes named left/title/right data slots. Capture has an explicit header wrapper and hint class, replacing the first/last-child header/hint selectors. These attributes do not change phone layout. |
| Overlapping Today reads | Each load aborts its predecessor; a response may publish only if it still owns the current controller. Unmount aborts and unregisters listeners. Regression allows the aborted transport to resolve late and verifies it cannot overwrite newer data. |

## Test/lint scope expansion

The original global failures combined an absent TS runner, missing integration configuration, stale fake query builders, old Facebook/tile/hydration expectations, and tests that assumed a default provider URL or fixed local app ports. The working `npm test` command now runs the complete top-level suite serially with TS loading and explicit disposable loopback backend/provider checks. A fresh-stack setup and app launcher make the environment reproducible without production credentials. Real PostgreSQL/Auth/PostgREST/application routes run with scripted Storage/provider transports. Tests were not deleted or newly skipped.

Fake data sources now model soft-deletion filters, abortable queries, embedded current items, pending-name helpers and drink synchronization. Supersede assertions follow migration 0007: an owner may set superseded_at, but cannot rewrite item/nutrition history or mutate another owner’s items. The clean-stack run caught and corrected a stricter grant assumption inherited from the earlier cloned database. Tile assertions reject unsupported sizes; hydration assertions prevent counting drink water twice. The shared Facebook control is tested as visibly disabled and inert. The recompute test isolates its own model base URL rather than depending on the runner's URL. Both existing lint errors were fixed without disabling their rules.

The pre-existing bare-Node README counts are replaced with fresh guarded-runner counts after the final run. The six optional acceptance skips are retained, not added by this work. No production setting, CAPTCHA, schema, data or deployment is changed by the test setup. Local test schema setup explicitly omits external worker-wake scheduling and uses a no-op cron adapter.
