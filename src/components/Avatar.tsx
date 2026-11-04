'use client';
import {avatarMediaUrl, pickAvatarVariant} from '@/lib/profile/avatar-url';

type Props = {
  handle: string;
  userId?: string | null;
  mediaId?: string | null;
  sizePx: number;
  className?: string;
  textClassName?: string;
};

export default function Avatar({handle, userId, mediaId, sizePx, className = '', textClassName = ''}: Props) {
  const initial = handle.slice(0, 1).toUpperCase() || '?';
  const variant = pickAvatarVariant(sizePx);
  const src = userId && mediaId ? avatarMediaUrl(userId, mediaId, variant) : null;
  const style = {width: sizePx, height: sizePx};
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={sizePx}
        height={sizePx}
        className={`shrink-0 rounded-circle object-cover ${className}`}
        style={style}
      />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-circle bg-text text-surface ${textClassName} ${className}`}
      style={style}
      aria-hidden={Boolean(handle)}
    >
      {initial}
    </span>
  );
}
