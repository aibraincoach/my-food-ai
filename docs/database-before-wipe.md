# Supabase project ukudowbsfmofisekahqb as found on 2026-10-27, before repurposing from AI Fitness Coach to My Food AI

Connection: read-only `SELECT` via `psql` and `SUPABASE_DB_URL` (pooler, port 6543). Database password verified: current (non-legacy) project password works; legacy password was not used.

## 1. User schemas — tables and approximate row counts

```
 schema  |             table             | approx_rows 
---------+-------------------------------+-------------
 auth    | audit_log_entries             |          -1
 auth    | custom_oauth_providers        |          -1
 auth    | flow_state                    |          -1
 auth    | identities                    |          -1
 auth    | instances                     |          -1
 auth    | mfa_amr_claims                |          -1
 auth    | mfa_challenges                |          -1
 auth    | mfa_factors                   |          -1
 auth    | mfa_recovery_code_sets        |          -1
 auth    | mfa_recovery_codes            |          -1
 auth    | oauth_authorizations          |          -1
 auth    | oauth_client_states           |          -1
 auth    | oauth_clients                 |          -1
 auth    | oauth_consents                |          -1
 auth    | one_time_tokens               |          -1
 auth    | refresh_tokens                |          -1
 auth    | saml_providers                |          -1
 auth    | saml_relay_states             |          -1
 auth    | schema_migrations             |          76
 auth    | scim_tokens                   |          -1
 auth    | scim_users                    |          -1
 auth    | sessions                      |          -1
 auth    | sso_domains                   |          -1
 auth    | sso_providers                 |          -1
 auth    | users                         |          -1
 auth    | webauthn_challenges           |          -1
 auth    | webauthn_credentials          |          -1
 lowdown | ai_questions                  |          -1
 lowdown | deployment_version_registry   |          -1
 lowdown | enrichment_source_priority    |          -1
 lowdown | events                        |        2762
 lowdown | identities                    |          -1
 lowdown | identity_value_events         |          -1
 lowdown | ingest_alert_claims           |          -1
 lowdown | ingest_daily_volume           |          -1
 lowdown | ingest_health_windows         |        1207
 lowdown | ingest_rate_limit_buckets     |         106
 lowdown | lowdown_contact_submissions   |          -1
 lowdown | lowdown_scheduler_wake_config |          -1
 lowdown | network_enrichment_raw        |         432
 lowdown | network_geo_enrichment        |         432
 lowdown | ops_alert_evaluations         |         694
 lowdown | ops_alerts                    |          -1
 lowdown | schema_migrations             |          23
 lowdown | sites                         |          -1
 lowdown | stripe_event_records          |          -1
 lowdown | stripe_processed_events       |          -1
 public  | api_token_usage_daily         |          -1
 public  | api_tokens                    |          -1
 public  | body_measurements             |         151
 public  | cron_log                      |           4
 public  | food_calibrations             |          -1
 public  | health_metrics                |        2792
 public  | import_jobs                   |          -1
 public  | import_receipts               |          -1
 public  | integration_tokens            |          -1
 public  | login_attempts                |          -1
 public  | nutrition_log                 |          28
 public  | readiness_scores              |          -1
 public  | schema_migrations             |          -1
 public  | user_credentials              |          -1
 public  | user_providers                |          -1
 public  | user_settings                 |          -1
 public  | workouts                      |         176
 storage | buckets                       |          -1
 storage | buckets_analytics             |          -1
 storage | buckets_vectors               |          -1
 storage | migrations                    |          61
 storage | objects                       |          -1
 storage | s3_multipart_uploads          |          -1
 storage | s3_multipart_uploads_parts    |          -1
 storage | vector_indexes                |          -1
(72 rows)
```

(`approx_rows` of `-1` means PostgreSQL has not refreshed statistics for that relation.)

## 2. Extensions

```
      extname       | extversion 
--------------------+------------
 pg_stat_statements | 1.11
 pgcrypto           | 1.3
 plpgsql            | 1.0
 supabase_vault     | 0.3.1
 uuid-ossp          | 1.1
(5 rows)
```

## 3. Storage buckets

```
 name | public | objects 
------+--------+---------
(0 rows)
```

## 4. Auth users

```
 users | newest 
-------+--------
     0 | 
(1 row)
```

## 5. pg_cron jobs

pg_cron not installed

## 6. Row-level security policies

```
 schemaname |  tablename   |         policyname          
------------+--------------+-----------------------------
 lowdown    | ai_questions | ai_questions_select_cockpit
 lowdown    | identities   | identities_select_cockpit
(2 rows)
```
