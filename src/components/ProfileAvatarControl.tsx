'use client';
import {useRef, useState, type ChangeEvent} from 'react';
import Avatar from '@/components/Avatar';
import {Sheet} from '@/components/ui/Sheet';

export default function ProfileAvatarControl({
  userId,
  handle,
  initialMediaId,
}: {
  userId: string;
  handle: string;
  initialMediaId: string | null;
}) {
  const [mediaId, setMediaId] = useState(initialMediaId);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const notify = (next: string | null) => {
    setMediaId(next);
    window.dispatchEvent(new CustomEvent('profile-identity-changed', {detail: {avatarMediaId: next}}));
  };

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.set('photo', file);
      const response = await fetch('/api/profile/avatar', {method: 'POST', body});
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'The photo could not be saved.');
      notify(typeof payload.avatar_media_id === 'string' ? payload.avatar_media_id : null);
      setMenu(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The photo could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/profile/avatar', {method: 'DELETE'});
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'The photo could not be removed.');
      notify(null);
      setMenu(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The photo could not be removed.');
    } finally {
      setBusy(false);
    }
  };

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await upload(file);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Profile picture"
        disabled={busy}
        onClick={() => setMenu(true)}
        className="hidden desktop:flex desktop:shrink-0 disabled:opacity-50"
      >
        <Avatar userId={userId} mediaId={mediaId} handle={handle} sizePx={88} textClassName="text-[32px] font-semibold" />
      </button>
      <button
        type="button"
        aria-label="Profile picture"
        disabled={busy}
        onClick={() => setMenu(true)}
        className="desktop:hidden disabled:opacity-50"
      >
        <Avatar userId={userId} mediaId={mediaId} handle={handle} sizePx={64} textClassName="text-avatar" />
      </button>
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      <Sheet open={menu} onClose={() => !busy && setMenu(false)} label="Profile picture">
        <div className="flex flex-col gap-2 px-4 pb-6 pt-2">
          <button type="button" disabled={busy} className="min-h-tap rounded-field px-3 text-left text-body" onClick={() => cameraRef.current?.click()}>
            Take photo
          </button>
          <button type="button" disabled={busy} className="min-h-tap rounded-field px-3 text-left text-body" onClick={() => galleryRef.current?.click()}>
            Choose photo
          </button>
          {mediaId ? (
            <button type="button" disabled={busy} className="min-h-tap rounded-field px-3 text-left text-body text-muted" onClick={() => void remove()}>
              Remove
            </button>
          ) : null}
          {error ? <p role="alert" className="px-3 text-detail text-muted">{error}</p> : null}
        </div>
      </Sheet>
    </>
  );
}
