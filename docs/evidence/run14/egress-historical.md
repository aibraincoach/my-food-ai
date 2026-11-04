# Database egress and log observations

## Historical

Window: 2026-11-02T04:15:17.615Z through 2026-11-03T04:15:17.615Z. Read-only aggregate logs. Response bytes are reported Content-Length, not billed egress; missing lengths are explicitly counted. Log row counts are not ingestion byte totals.

Legacy log API unavailable: the plan’s `logs.all` endpoint returned an error. The current `/logs` endpoint is used below when available.

### Storage by file kind

| bytes_missing_or_zero | file_kind | requests | response_bytes |
| --- | --- | --- | --- |
| 108 | original photograph | 19060 | 1769434316 |
| 479 | feed photo source | 10217 | 1196973008 |
| 21 | other storage | 2141 | 15924211 |
| 457 | results card | 3630 | 3943682 |

### Storage by file kind and client

| bytes_missing_or_zero | client_class | file_kind | requests | response_bytes |
| --- | --- | --- | --- | --- |
| 106 | automation | original photograph | 18980 | 1757463961 |
| 473 | automation | feed photo source | 9469 | 1126885521 |
| 0 | mobile browser | feed photo source | 627 | 55085853 |
| 6 | desktop browser | feed photo source | 121 | 15001634 |
| 17 | automation | other storage | 2066 | 14448263 |
| 0 | mobile browser | original photograph | 9 | 7107129 |
| 2 | desktop browser | original photograph | 71 | 4863226 |
| 449 | automation | results card | 3368 | 3803728 |
| 0 | mobile browser | other storage | 52 | 1445602 |
| 0 | mobile browser | results card | 246 | 135546 |
| 4 | desktop browser | other storage | 23 | 30346 |
| 8 | desktop browser | results card | 16 | 4408 |

### Edge requests by path prefix

| bytes_missing_or_zero | path_prefix | requests | response_bytes |
| --- | --- | --- | --- |
| 1065 | /storage/v1/object/… | 35048 | 2986275217 |
| 0 | /rest/v1/rpc/try_acquire_worker_lease | 70155 | 280959 |
| 63 | /rest/v1/profiles | 3237 | 127696 |
| 31734 | /rest/v1/posts | 33851 | 52081 |
| 6 | /rest/v1/rpc/renew_worker_lease | 5116 | 20440 |
| 6213 | /rest/v1/intake_logs | 8461 | 17818 |
| 495 | /rest/v1/saved_meals | 9094 | 17514 |
| 1 | /rest/v1/worker_lease | 130 | 11008 |
| 30976 | /rest/v1/rpc/feedback_revision | 31130 | 10982 |
| 15538 | /rest/v1/current_post_items | 15645 | 6968 |
| 945 | /rest/v1/post_feedback | 4217 | 6544 |
| 0 | /rest/v1/rpc/next_worker_wake | 184 | 5218 |
| 21 | /rest/v1/rpc/reserve_post_upload_with_leftovers | 92 | 4718 |
| 19444 | /rest/v1/post_media | 19719 | 4272 |
| 2518 | /rest/v1/jobs | 2641 | 3379 |
| 222 | /rest/v1/post_items | 289 | 2426 |
| 14 | /rest/v1/rpc/publish_results_card | 74 | 2135 |
| 144 | /rest/v1/post_comments | 252 | 1456 |
| 88 | /rest/v1/agent_tokens | 105 | 1126 |
| 8 | /rest/v1/rpc/append_post_comment | 23 | 1050 |
| 1 | /rest/v1/rpc/persist_correction | 23 | 1048 |
| 11 | /rest/v1/rpc/publish_uploaded_post | 37 | 988 |
| 0 | /rest/v1/rpc/dismiss_hint | 6 | 408 |
| 0 | /rest/v1/rpc/reserve_post_upload_with_options | 6 | 396 |
| 0 | /rest/v1/rpc/create_drink_post | 7 | 266 |
| 0 | /rest/v1/rpc/queue_post_remainder | 48 | 240 |
| 0 | /rest/v1/rpc/save_ready_meal | 60 | 240 |
| 231 | /rest/v1/fdc_cache | 333 | 204 |
| 6 | /rest/v1/rpc/search_own_posts | 8 | 192 |
| 0 | /rest/v1/rpc/complete_post_photo_attachment | 5 | 190 |
| 3 | /rest/v1/label_readings | 10 | 143 |
| 0 | /rest/v1/rpc/create_food_post | 3 | 114 |
| 12 | /rest/v1/push_subscriptions | 65 | 106 |
| 49 | /rest/v1/post_upload_drafts | 53 | 81 |
| 0 | /rest/v1/rpc/agent_log_meal | 2 | 76 |
| 0 | /rest/v1/rpc/post_work_matches | 15 | 75 |
| 706 | /rest/v1/model_calls | 733 | 54 |
| 12826 | /rest/v1/item_nutrition | 12832 | 48 |
| 0 | /rest/v1/rpc/barcode_shared_name | 10 | 40 |
| 0 | /rest/v1/rpc/agent_hit | 7 | 28 |
| 0 | /rest/v1/rpc/apply_post_remainder | 4 | 16 |
| 4 | other | 11 | 14 |
| 14 | /rest/v1/post_locations | 21 | 14 |
| 1 | /rest/v1/rpc/set_identify_provider | 3 | 12 |
| 12 | /rest/v1/agent_activity | 17 | 10 |
| 1 | /rest/v1/rpc/revert_correction | 3 | 8 |
| 0 | /rest/v1/rpc/mark_post_ready | 2 | 8 |
| 0 | /rest/v1/rpc/persist_removed_rebuild | 2 | 8 |
| 1 | /rest/v1/post_photo_attachments | 4 | 6 |
| 1 | /rest/v1/rpc/delete_post | 2 | 4 |
| 0 | /rest/v1/rpc/remove_post_media | 1 | 4 |
| 0 | /rest/v1/rpc/persist_photo_correction | 1 | 4 |
| 8 | /rest/v1/barcode_corrections | 10 | 4 |
| 348 | /realtime/… | 348 | 0 |
| 6 | /rest/v1/rpc/prepare_post_photo_attachment | 6 | 0 |
| 16 | /rest/v1/rpc/sync_item_drinks | 16 | 0 |
| 59 | /rest/v1/rpc/meal_prior_candidates | 59 | 0 |
| 12 | /rest/v1/events | 12 | 0 |
| 47 | /rest/v1/rpc/persist_owned_analysis | 47 | 0 |
| 2 | /rest/v1/rpc/write_pending_names | 2 | 0 |
| 1 | /rest/v1/rpc/persist_identified_analysis | 1 | 0 |
| 74 | /rest/v1/rpc/results_card_snapshot | 74 | 0 |
| 74707 | /rest/v1/rpc/fail_job | 74707 | 0 |
| 204 | /rest/v1/rpc/release_worker_lease | 204 | 0 |
| 26815 | /auth/v1/… | 26815 | 0 |
| 74746 | /rest/v1/rpc/claim_owned_job | 74746 | 0 |
| 1 | /rest/v1/rpc/write_pending_kcal | 1 | 0 |

### Edge requests by user agent class

| bytes_missing_or_zero | requests | response_bytes | user_agent |
| --- | --- | --- | --- |
| 82204 | 125834 | 2946487692 | browser |
| 211679 | 298467 | 40370350 | server runtime |
| 6537 | 6544 | 14 | other/absent |

### Log rows by source

| rows | source |
| --- | --- |
| 430845 | edge_logs |
| 29317 | storage_logs |
| 27107 | auth_logs |
| 24126 | pgbouncer_logs |
| 4668 | postgres_logs |
| 1883 | postgrest_logs |
| 1399 | supavisor_logs |
| 482 | auth_audit_logs |
| 372 | realtime_logs |

