-- A photo's public address carries this secret, so the address cannot be guessed.
alter table public.post_media add column photo_secret text not null default replace(gen_random_uuid()::text, '-', '');
notify pgrst, 'reload schema';
