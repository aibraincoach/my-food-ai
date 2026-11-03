-- Deploy legacy-copy-compatible code before rollback. Keep existing copied posts.
drop function public.publish_copy_operation(uuid,uuid,boolean,timestamptz);
drop function public.cancel_copy_operation(uuid,uuid,boolean,timestamptz);
drop table public.copy_post_operations;
notify pgrst,'reload schema';
