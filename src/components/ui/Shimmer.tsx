import type { CSSProperties } from 'react';
import { tokens } from '@/lib/theme/tokens';

export function Shimmer({ width }: { width: CSSProperties['width'] }) {
  return <div aria-hidden="true" className="h-shimmer-h max-w-full rounded-chip animate-shimmer" style={{
    width,
    backgroundImage: `linear-gradient(90deg, ${tokens.colors['shimmer-a']} 25%, ${tokens.colors['shimmer-b']} 50%, ${tokens.colors['shimmer-a']} 75%)`,
    backgroundSize: '200% 100%',
  }} />;
}
