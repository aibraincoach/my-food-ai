\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values('70000000-0000-0000-0000-000000000001'),('70000000-0000-0000-0000-000000000002');
insert into public.profiles(id,handle) values('70000000-0000-0000-0000-000000000001','pending-test1'),('70000000-0000-0000-0000-000000000002','pending-test2');
insert into public.posts(id,user_id,status,active_job_id) values('70000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000001','processing','70000000-0000-0000-0000-000000000008');
select public.write_pending_names('70000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000008','[{"name":"Rice","kcal":null},{"name":"Egg","kcal":null}]');
select public.write_pending_kcal('70000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000008',1,80);
do $$begin if (select pending_items->1->>'kcal' from posts where id='70000000-0000-0000-0000-000000000003')<>'80' then raise exception 'progress lost';end if;end$$;
select public.write_pending_kcal('70000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000009',0,100);
do $$begin if (select pending_items->0->>'kcal' from posts where id='70000000-0000-0000-0000-000000000003') is not null then raise exception 'stale job progress accepted';end if;end$$;
update public.posts set status='failed' where id='70000000-0000-0000-0000-000000000003';
do $$begin if (select pending_items from posts where id='70000000-0000-0000-0000-000000000003') is not null then raise exception 'terminal progress not cleared';end if;end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000001',true);
do $$begin
 begin update public.posts set pending_items='[]' where id='70000000-0000-0000-0000-000000000003';raise exception 'Owner wrote managed progress';
 exception when insufficient_privilege then null;when raise_exception then if sqlerrm <> 'Analysis progress is service managed' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000002',true);
do $$begin if exists(select 1 from posts where id='70000000-0000-0000-0000-000000000003') then raise exception 'other user can read progress';end if;end$$;
rollback;
