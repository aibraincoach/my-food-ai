select left(c.post_id::text, 8) as post, c.kind, coalesce(c.model, '-') as model,
       case when c.kind = 'fdc' then coalesce(substring(c.request_text from '"event":"([a-z_]+)"'), 'usda ' || coalesce(substring(c.request_text from '"source":"([a-z_]+)"'), '?'))
            else coalesce(substring(c.request_text from '"format":\{"type":"json_schema","name":"([a-z_]+)"'), '-') end as step,
       count(*) as calls, count(*) filter (where c.error is not null) as errors,
       sum(c.input_tokens) as input_tokens, sum(c.output_tokens) as output_tokens, sum(c.duration_ms) as duration_ms,
       min(c.started_at) as first_call, max(c.started_at) as last_call
from public.model_calls c
where left(c.post_id::text, 8) = any(string_to_array(:'prefixes', ','))
  and c.started_at >= :'since'::timestamptz
group by 1, 2, 3, 4
order by post, min(c.started_at);
