'use client';
import {useTranslations} from 'next-intl';
import {useDesktop} from '@/lib/ui/use-desktop';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { revokeTokenAction } from './actions';
export default function RevokeSheet({ id, name, open, onClose, onRevoked }: { id: string; name: string; open: boolean; onClose: () => void; onRevoked: () => void }) {
  const t=useTranslations('agents');
  const desktop=useDesktop();
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  return <Sheet hideClose panelStyle={{ maxWidth: desktop ? 480 : undefined, gap: 14, paddingTop: 10, paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }} open={open} onClose={() => !pending && onClose()} label={t('revokeTitle',{name})}>
    <h2 className="text-sheet-head">{t('revokeTitle',{name})}</h2>
    <p className="text-[15px] leading-[1.5] text-text">{t('revokeExplanation')}</p>
    {error && <p role="alert" className="text-detail">{error}</p>}
    <Button disabled={pending} style={{ background: 'oklch(0.52 0.17 25)', color: 'white', height: 50, borderRadius: 14 }} onClick={async () => {
      if (pending) return; setPending(true); setError('');
      try { const result = await revokeTokenAction(id); if (result.error) setError(result.error); else onRevoked(); }
      catch { setError(t('revokeFailed')); } finally { setPending(false); }
    }}>{t('revokeToken')}</Button><Button variant="secondary" style={{ background: 'transparent', borderColor: 'transparent', height: 50, borderRadius: 14 }} disabled={pending} onClick={onClose}>{t('cancel')}</Button>
  </Sheet>;
}
