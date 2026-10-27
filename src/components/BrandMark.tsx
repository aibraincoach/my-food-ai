import { tokens } from '@/lib/theme/tokens';

export function BrandMark({ size = tokens.spacing.brand }: { size?: number }) {
  const scale = size / tokens.spacing.brand;
  return <span aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, width: size, height: size, borderRadius: tokens.radii.circle, background: tokens.colors.accent, position: 'relative' }}>
    <span style={{ position: 'absolute', left: '50%', top: '50%', width: tokens.brand.barWidth * scale, height: tokens.brand.barHeight * scale, borderRadius: tokens.brand.barRadius * scale, background: tokens.colors.surface, transform: `translate(-50%, -50%) rotate(${tokens.brand.angle}deg)` }} />
    <span style={{ position: 'absolute', left: size / 2 + tokens.brand.dotX * scale, top: size / 2 + tokens.brand.dotY * scale, width: tokens.brand.dot * scale, height: tokens.brand.dot * scale, borderRadius: tokens.radii.circle, background: tokens.colors.surface, transform: 'translate(-50%, -50%)' }} />
  </span>;
}
