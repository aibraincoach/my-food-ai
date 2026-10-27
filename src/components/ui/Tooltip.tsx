import type { ReactNode } from 'react';
import { tokens } from '@/lib/theme/tokens';

type Props = { children: ReactNode; caret?: 'bottom' | 'left'; light?: boolean; className?: string };

export function Tooltip({ children, caret = 'bottom', light = false, className = '' }: Props) {
  const background = light
    ? `color-mix(in srgb, ${tokens.colors.surface} ${tokens.opacity.lightTooltip * 100}%, transparent)`
    : tokens.colors.text;
  return <span role="tooltip" className={`relative inline-flex rounded-field px-tooltip-x py-tooltip-y text-detail ${className}`} style={{ background, color: light ? tokens.colors.text : tokens.colors.surface }}>
    <span aria-hidden="true" style={{
      position: 'absolute', width: tokens.spacing['tooltip-caret'], height: tokens.spacing['tooltip-caret'], background,
      ...(caret === 'bottom' ? { bottom: -tokens.spacing['tooltip-offset'], left: '50%', transform: 'translateX(-50%) rotate(45deg)' } : { left: -tokens.spacing['tooltip-offset'], top: '50%', transform: 'translateY(-50%) rotate(45deg)' }),
    }} />
    <span className="relative">{children}</span>
  </span>;
}
