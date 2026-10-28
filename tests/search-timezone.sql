begin read only;
do $$
begin
  if ('2026-10-25 01:00+00'::timestamptz at time zone 'America/Edmonton')::date <> date '2026-10-24' then raise exception 'Saturday local date failed'; end if;
  if extract(hour from '2026-10-25 01:00+00'::timestamptz at time zone 'America/Edmonton') not between 17 and 22 then raise exception 'Local dinner hour failed'; end if;
  if extract(hour from '2026-10-24 14:00+00'::timestamptz at time zone 'America/Edmonton') not between 5 and 10 then raise exception 'Local breakfast hour failed'; end if;
  if ('2026-10-24 23:30+00'::timestamptz at time zone 'Asia/Tokyo')::date <> date '2026-10-25' then raise exception 'Tokyo next-day date failed'; end if;
  if (timestamp '2026-03-09 00:00' at time zone 'America/Edmonton') - (timestamp '2026-03-08 00:00' at time zone 'America/Edmonton') <> interval '23 hours' then raise exception 'Spring DST bounds failed'; end if;
  if (timestamp '2026-11-02 00:00' at time zone 'America/Edmonton') - (timestamp '2026-11-01 00:00' at time zone 'America/Edmonton') <> interval '25 hours' then raise exception 'Autumn DST bounds failed'; end if;
end $$;
rollback;
