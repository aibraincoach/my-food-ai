import type { ReactNode } from 'react';

type Props = { title: ReactNode; left?: ReactNode; right?: ReactNode; border?: boolean; className?: string };

export function TopBar({ title, left, right, border = false, className = '' }: Props) {
  return <header className={`flex h-top-h shrink-0 items-center justify-between px-screen-x ${border ? 'border-b border-hairline' : ''} ${className}`}>
    <div className="flex min-w-icon items-center">{left}</div>
    <div className="text-body font-semibold">{title}</div>
    <div className="flex min-w-icon items-center justify-end">{right}</div>
  </header>;
}
