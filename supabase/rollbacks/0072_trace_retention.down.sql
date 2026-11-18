-- Rolls back 0072: removes the trace retention functions and its index. Deleted trace rows are not restored: they cannot be.
drop function if exists public.retention_traces_batch(integer);
drop function if exists public.retention_traces_dry_run(timestamptz);
drop function if exists public.retention_trace_candidates(timestamptz);
drop index if exists public.model_calls_started;
