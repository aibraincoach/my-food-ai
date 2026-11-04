# Database egress and log observations

## Latest

Window: 2026-11-03T07:41:34.173Z through 2026-11-04T07:41:34.173Z. Read-only aggregate logs. Response bytes are reported Content-Length, not billed egress; missing lengths are explicitly counted. Log row counts are not ingestion byte totals.

Legacy log API unavailable: the plan’s `logs.all` endpoint returned an error. The current `/logs` endpoint is used below when available.

### Storage by file kind

| bytes_missing_or_zero | file_kind | requests | response_bytes |
| --- | --- | --- | --- |
| 282 | feed photo source | 10263 | 1767928692 |
| 85 | original photograph | 894 | 75535758 |
| 96 | results card | 1545 | 66366400 |
| 118 | other storage | 8405 | 50464503 |

### Storage by file kind and client

| bytes_missing_or_zero | client_class | file_kind | requests | response_bytes |
| --- | --- | --- | --- | --- |
| 282 | automation | feed photo source | 9970 | 1720939521 |
| 96 | automation | results card | 1539 | 66061096 |
| 85 | automation | original photograph | 841 | 54187582 |
| 0 | mobile browser | feed photo source | 281 | 45635749 |
| 118 | automation | other storage | 8194 | 45497726 |
| 0 | desktop browser | original photograph | 22 | 19496314 |
| 0 | desktop browser | other storage | 163 | 4836221 |
| 0 | mobile browser | original photograph | 31 | 1851862 |
| 0 | desktop browser | feed photo source | 12 | 1353422 |
| 0 | desktop browser | results card | 6 | 305304 |
| 0 | mobile browser | other storage | 48 | 130556 |

### Edge requests by path prefix

| bytes_missing_or_zero | path_prefix | requests | response_bytes |
| --- | --- | --- | --- |
| 581 | /storage/v1/object/… | 21107 | 1960295353 |
| 66289 | /rest/v1/rpc/feedback_revision | 79136 | 962531 |
| 399 | /rest/v1/profiles | 13052 | 519665 |
| 53407 | /rest/v1/posts | 61755 | 265829 |
| 0 | /rest/v1/rpc/next_worker_wake | 4479 | 146916 |
| 11728 | /rest/v1/intake_logs | 15240 | 56231 |
| 15841 | /rest/v1/current_post_items | 16428 | 49895 |
| 0 | /rest/v1/rpc/try_acquire_worker_lease | 5073 | 20881 |
| 4279 | /rest/v1/post_feedback | 14625 | 20692 |
| 780 | /rest/v1/saved_meals | 7558 | 17094 |
| 0 | /rest/v1/rpc/reserve_post_upload_with_leftovers | 214 | 14124 |
| 23 | /rest/v1/rpc/publish_results_card | 191 | 6114 |
| 8829 | /rest/v1/post_media | 9641 | 3953 |
| 13 | /rest/v1/rpc/dismiss_hint | 47 | 2312 |
| 0 | /rest/v1/rpc/publish_uploaded_post | 49 | 1862 |
| 47 | /rest/v1/composer_drink_readings | 159 | 1481 |
| 0 | /rest/v1/rpc/create_drink_post | 37 | 1468 |
| 411 | /rest/v1/post_comments | 776 | 1396 |
| 0 | /rest/v1/rpc/user_hit | 320 | 1281 |
| 48482 | /auth/v1/… | 48494 | 1105 |
| 0 | /rest/v1/rpc/publish_drink_operation | 29 | 1102 |
| 0 | /rest/v1/rpc/publish_copy_operation | 26 | 1027 |
| 0 | /rest/v1/rpc/save_meal_from_post | 22 | 868 |
| 0 | /rest/v1/rpc/renew_worker_lease | 145 | 580 |
| 0 | /rest/v1/rpc/create_food_post | 12 | 554 |
| 23 | /rest/v1/rpc/search_own_posts | 31 | 474 |
| 950 | /rest/v1/item_nutrition | 968 | 468 |
| 9 | /rest/v1/copy_post_operations | 23 | 417 |
| 18 | /rest/v1/label_readings | 30 | 411 |
| 273 | /rest/v1/agent_tokens | 281 | 382 |
| 0 | /rest/v1/rpc/save_ready_meal | 91 | 364 |
| 0 | /rest/v1/rpc/publish_food_operation | 9 | 342 |
| 11286 | /rest/v1/jobs | 11333 | 339 |
| 0 | /rest/v1/rpc/queue_post_remainder | 49 | 245 |
| 25 | /rest/v1/drink_post_operations | 67 | 238 |
| 0 | /rest/v1/rpc/complete_post_photo_attachment | 5 | 190 |
| 0 | /rest/v1/rpc/publish_photo_drink_operation | 5 | 190 |
| 180 | /rest/v1/fdc_cache | 263 | 166 |
| 0 | /rest/v1/rpc/barcode_shared_name | 29 | 116 |
| 21 | /rest/v1/push_subscriptions | 75 | 108 |
| 167 | /rest/v1/post_upload_drafts | 182 | 92 |
| 13 | /rest/v1/rpc/save_revision_feedback | 14 | 84 |
| 0 | /rest/v1/rpc/edit_post_item | 2 | 76 |
| 0 | /rest/v1/rpc/publish_composer_drinks | 2 | 76 |
| 0 | /rest/v1/rpc/delete_post | 17 | 68 |
| 10 | /rest/v1/user_call_hits | 11 | 63 |
| 0 | /rest/v1/rpc/set_identify_provider | 8 | 48 |
| 0 | /rest/v1/rpc/log_post_again | 1 | 38 |
| 0 | /rest/v1/rpc/unmark_not_eaten | 1 | 38 |
| 0 | /rest/v1/rpc/cancel_copy_operation | 1 | 38 |
| 0 | /rest/v1/rpc/copy_owned_post | 1 | 38 |
| 14 | /rest/v1/barcode_corrections | 29 | 30 |
| 0 | /rest/v1/rpc/persist_correction | 5 | 20 |
| 3 | /rest/v1/food_post_operations | 13 | 20 |
| 0 | /rest/v1/rpc/apply_post_remainder | 5 | 20 |
| 0 | /rest/v1/rpc/remove_post_media | 4 | 19 |
| 0 | /rest/v1/rpc/set_post_servings | 4 | 16 |
| 0 | /rest/v1/rpc/restore_post | 4 | 16 |
| 3 | /rest/v1/rpc/list_deleted_posts | 9 | 12 |
| 0 | /rest/v1/rpc/persist_removed_rebuild | 2 | 8 |
| 0 | /rest/v1/agent_activity | 3 | 6 |
| 2 | /rest/v1/post_photo_attachments | 5 | 6 |
| 614 | /rest/v1/model_calls | 616 | 4 |
| 0 | /rest/v1/rpc/cancel_drink_operation | 1 | 4 |
| 65 | /rest/v1/post_items | 66 | 2 |
| 98 | /rest/v1/rpc/write_pending_kcal | 98 | 0 |
| 98 | /rest/v1/rpc/write_pending_names | 98 | 0 |
| 5 | /rest/v1/rpc/prepare_post_photo_attachment | 5 | 0 |
| 1126 | /realtime/… | 1126 | 0 |
| 1 | /rest/v1/events | 1 | 0 |
| 4618 | /rest/v1/rpc/claim_owned_job | 4618 | 0 |
| 3 | /rest/v1/rpc/persist_approximated_analysis | 3 | 0 |
| 48 | /rest/v1/rpc/meal_prior_candidates | 48 | 0 |
| 4482 | /rest/v1/rpc/release_worker_lease | 4482 | 0 |
| 191 | /rest/v1/rpc/results_card_snapshot | 191 | 0 |
| 3 | /rest/v1/rpc/fail_job | 3 | 0 |
| 46 | /rest/v1/rpc/persist_identified_analysis | 46 | 0 |
| 585 | /rest/v1/rpc/feedback_revisions | 585 | 0 |
| 3 | other | 3 | 0 |
| 166 | /rest/v1/rpc/sync_item_drinks | 166 | 0 |
| 5 | /rest/v1/rpc/append_post_comment | 5 | 0 |

### Edge requests by user agent class

| bytes_missing_or_zero | requests | response_bytes | user_agent |
| --- | --- | --- | --- |
| 24100 | 51938 | 1780303704 | browser |
| 210701 | 270958 | 182095902 | server runtime |
| 1462 | 1462 | 0 | other/absent |

### Log rows by source

| rows | source |
| --- | --- |
| 324358 | edge_logs |
| 48357 | auth_logs |
| 20266 | pgbouncer_logs |
| 18763 | storage_logs |
| 3683 | postgres_logs |
| 1296 | postgrest_logs |
| 548 | auth_audit_logs |
| 448 | supavisor_logs |
| 418 | realtime_logs |

