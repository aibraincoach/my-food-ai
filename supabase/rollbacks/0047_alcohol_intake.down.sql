delete from public.intake_logs where kind='alcohol';
alter table public.intake_logs drop constraint intake_logs_kind_check;
alter table public.intake_logs add constraint intake_logs_kind_check check (kind in ('water','caffeine'));
alter table public.intake_logs drop constraint intake_amount_range;
alter table public.intake_logs add constraint intake_amount_range check ((kind='water' and amount between 1 and 5000) or (kind='caffeine' and amount between 1 and 1000));
