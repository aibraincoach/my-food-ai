import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {
  AVATAR_VARIANTS,
  avatarStoragePath,
  avatarStoragePrefix,
  encodeAvatarWebp,
  readAvatarUpload,
} from '@/lib/profile/avatar';

async function removeStoredAvatar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  mediaId: string,
) {
  const paths = AVATAR_VARIANTS.map(variant => avatarStoragePath(userId, mediaId, variant));
  await supabase.storage.from('media').remove(paths);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: 'Sign in required.'}, {status: 401});

  const form = await request.formData().catch(() => null);
  const file = form?.get('photo');
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({error: 'Choose a photo.'}, {status: 400});
  }

  let source: Buffer;
  try {
    source = await readAvatarUpload(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({error: 'That photo could not be read.'}, {status: 400});
  }

  const mediaId = crypto.randomUUID();
  try {
    for (const variant of AVATAR_VARIANTS) {
      const body = await encodeAvatarWebp(source, variant);
      const path = avatarStoragePath(user.id, mediaId, variant);
      const {error} = await supabase.storage.from('media').upload(path, body, {
        contentType: 'image/webp',
        upsert: true,
      });
      if (error) throw error;
    }
  } catch {
    await removeStoredAvatar(supabase, user.id, mediaId);
    return NextResponse.json({error: 'The photo could not be saved.'}, {status: 503});
  }

  const {data: prior} = await supabase.from('profiles').select('avatar_media_id').eq('id', user.id).maybeSingle();
  const {error: profileError} = await supabase.from('profiles').update({avatar_media_id: mediaId}).eq('id', user.id);
  if (profileError) {
    await removeStoredAvatar(supabase, user.id, mediaId);
    return NextResponse.json({error: 'The photo could not be saved.'}, {status: 503});
  }

  if (prior?.avatar_media_id && prior.avatar_media_id !== mediaId) {
    await removeStoredAvatar(supabase, user.id, prior.avatar_media_id);
  }

  return NextResponse.json({avatar_media_id: mediaId});
}

export async function DELETE() {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: 'Sign in required.'}, {status: 401});

  const {data: profile} = await supabase.from('profiles').select('avatar_media_id').eq('id', user.id).maybeSingle();
  const mediaId = profile?.avatar_media_id;
  if (!mediaId) return NextResponse.json({ok: true});

  const {error} = await supabase.from('profiles').update({avatar_media_id: null}).eq('id', user.id);
  if (error) return NextResponse.json({error: 'The photo could not be removed.'}, {status: 503});

  await removeStoredAvatar(supabase, user.id, mediaId);
  const listed = await supabase.storage.from('media').list(avatarStoragePrefix(user.id, mediaId));
  if (listed.data?.length) {
    await supabase.storage.from('media').remove(listed.data.map(row => `${avatarStoragePrefix(user.id, mediaId)}/${row.name}`));
  }

  return NextResponse.json({ok: true});
}
