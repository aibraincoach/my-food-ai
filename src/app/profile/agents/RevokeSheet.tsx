'use client';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { revokeTokenAction } from './actions';
export default function RevokeSheet({ id, name, open, onClose, onRevoked }: { id: string; name: string; open: boolean; onClose: () => void; onRevoked: () => void }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  return <Sheet hideClose panelStyle={{ gap: 14, paddingTop: 10, paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }} open={open} onClose={() => !pending && onClose()} label={`Revoke "${name}"?`}>
    <h2 className="text-sheet-head">Revoke &quot;{name}&quot;?</h2>
    <p className="text-[15px] leading-[1.5] text-text">The agent stops working right away. Posts it made stay in your feed and stay yours.</p>
    {error && <p role="alert" className="text-detail">{error}</p>}
    <Button disabled={pending} style={{ background: 'oklch(0.52 0.17 25)', color: 'white', height: 50, borderRadius: 14 }} onClick={async () => {
      if (pending) return; setPending(true); setError('');
      try { const result = await revokeTokenAction(id); if (result.error) setError(result.error); else onRevoked(); }
      catch { setError('The token could not be revoked.'); } finally { setPending(false); }
    }}>Revoke token</Button><Button variant="secondary" style={{ background: 'transparent', borderColor: 'transparent', height: 50, borderRadius: 14 }} disabled={pending} onClick={onClose}>Cancel</Button>
  </Sheet>;
}
