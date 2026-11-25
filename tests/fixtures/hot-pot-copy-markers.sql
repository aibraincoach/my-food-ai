begin;
select set_config('request.jwt.claims','{"sub":"__USER__","role":"authenticated"}',true);
do $test$
declare p uuid:='__POST__';saved uuid;again uuid;copy uuid;before jsonb;after jsonb;marked integer;
begin
 if not exists(select 1 from posts where id=p and user_id='__USER__' and status='ready')then raise exception 'Fixture identity mismatch';end if;
 select count(*),jsonb_object_agg(i.name,n.source_ref)into marked,before from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p and n.source_ref like 'shared-pot:v1:%';
 if marked<>2 then raise exception 'Expected two shared items';end if;
 saved:=save_meal_from_post(p,'Synthetic marker copy proof');
 select jsonb_object_agg(value->>'name',value#>>'{nutrition,source_ref}')into after from saved_meals,jsonb_array_elements(items)where id=saved and value#>>'{nutrition,source_ref}'like'shared-pot:v1:%';
 if before is distinct from after then raise exception 'Save changed marker';end if;
 again:=log_post_again(p,now());
 select jsonb_object_agg(i.name,n.source_ref)into after from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=again and n.source_ref like'shared-pot:v1:%';
 if before is distinct from after then raise exception 'Log again changed marker';end if;
 copy:=log_saved_meal(saved,now());
 select jsonb_object_agg(i.name,n.source_ref)into after from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=copy and n.source_ref like'shared-pot:v1:%';
 if before is distinct from after then raise exception 'Saved log changed marker';end if;
end $test$;
commit;
