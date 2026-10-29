import type { SVGProps } from 'react';
import { tokens } from '@/lib/theme/tokens';

export type IconName = 'home' | 'search' | 'plus' | 'days' | 'profile' | 'close' | 'back' | 'chevron-down' | 'camera' | 'thumb' | 'mic' | 'flip' | 'entry-camera' | 'entry-text' | 'entry-drink' | 'entry-coffee';
type Props = SVGProps<SVGSVGElement> & { name: IconName; active?: boolean; down?: boolean; size?: number; label?: string };

export function Icon({ name, active = false, down = false, size, label, style, ...props }: Props) {
  const strokeWidth = name === 'plus' || name === 'chevron-down' ? tokens.icon.strongStroke
    : name === 'back' || name === 'close' ? tokens.icon.navigationStroke
    : name === 'thumb' ? tokens.icon.thumbStroke : tokens.icon.stroke;
  const dimension = size ?? (name === 'chevron-down' ? tokens.spacing['icon-small'] : name === 'thumb' ? tokens.spacing['icon-thumb'] : tokens.spacing.icon);
  const shapes = {
    'entry-camera': <path d="M3 7h3l2-3h8l2 3h3v13H3z M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />,
    'entry-text': <path d="M4 6h16M4 12h10M4 18h7" />,
    'entry-drink': <path d="M6 3h12l-1.5 17h-9z M7 9h10" />,
    'entry-coffee': <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M16 10h2a2 2 0 0 1 0 4h-2 M7 4v2M10 3v3" />,
    home: <path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z" fill={active ? 'currentColor' : 'none'} />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    days: <><rect x="3" y="5" width="18" height="16" rx="2" fill={active ? 'currentColor' : 'none'} /><path d="M3 10h18M8 3v4M16 3v4" stroke={active ? tokens.colors.surface : 'currentColor'} /></>,
    profile: <><circle cx="12" cy="8" r="4" fill={active ? 'currentColor' : 'none'} /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill={active ? 'currentColor' : 'none'} /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    back: <path d="M15 5l-7 7 7 7" />,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    camera: <><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M9 7l1.5-3h3L15 7" /></>,
    flip: <path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5" />,
    thumb: <path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.5 2.5V10h5c1 0 2 1 1.8 2l-1.2 6c-.2 1-1 2-2 2H7" />,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  };
  return <svg viewBox="0 0 24 24" width={dimension} height={dimension} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={{ ...style, ...(down ? { transform: 'rotate(180deg)' } : {}) }} {...props}>{shapes[name]}</svg>;
}
