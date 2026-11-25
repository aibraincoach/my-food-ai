-- Prefer retaining additive schema. Requires separate RT yes + PM order.
-- An app revert must be message-aware once structured rows exist; never erase them.
begin;
do $$ begin
 if exists(select 1 from public.post_comments where message is not null) then
  raise exception 'Cannot remove 0084 after structured messages exist; keep a message-aware app' using errcode='22023';
 end if;
end $$;
drop trigger protect_summary_pointer on public.posts;
drop function public.correct_barcode_item(uuid,uuid,text,text,numeric,text,jsonb,jsonb);
drop function public.publish_photo_drink_operation(uuid,uuid,text,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,jsonb,jsonb,text);
drop function public.publish_composer_drinks(uuid,uuid,jsonb,text,timestamptz,jsonb,boolean,jsonb,jsonb,jsonb,text);
drop function public.persist_correction_question(uuid,uuid,uuid[],uuid,jsonb,jsonb,jsonb);
drop function public.persist_removed_rebuild(uuid,uuid,uuid[],uuid[],uuid[],jsonb,jsonb);
drop function public.persist_photo_correction(uuid,uuid,uuid[],jsonb,jsonb,jsonb);
drop function public.apply_post_remainder(uuid,uuid,uuid,uuid[],jsonb,jsonb);
drop function public.persist_correction(uuid,uuid,uuid[],uuid,jsonb,jsonb);
drop function public.refresh_owned_approximation_summary(uuid,uuid,jsonb,jsonb);
drop function public.persist_analysis_with_question(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean);
drop function public.persist_approximated_analysis(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean);
drop function public.persist_identified_analysis(uuid,uuid,jsonb,jsonb,jsonb,text,text,boolean);
drop function public.persist_owned_label(uuid,uuid,jsonb,jsonb,jsonb);
drop function public.persist_owned_analysis(uuid,uuid,jsonb,jsonb,jsonb);
drop function public.persist_analysis_question(uuid,jsonb,jsonb,jsonb);
drop function public.persist_analysis(uuid,jsonb,jsonb);
drop function public.persist_analysis_initial(uuid,jsonb,jsonb);
drop function public.append_meal_summary(uuid,jsonb);
drop function public.require_meal_summary(jsonb);
drop function public.protect_summary_pointer();
alter table public.posts drop constraint posts_summary_same_post;
alter table public.posts drop column summary_comment_id;
alter table public.post_comments drop constraint post_comments_post_and_id;
alter table public.post_comments drop constraint post_comment_one_content;
alter table public.post_comments alter column body set not null;
alter table public.post_comments drop column message;
notify pgrst,'reload schema';
commit;
