'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
export default function TokenShown({ token, name }: { token: string; name: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copyLabel, setCopyLabel] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const mayLeave = useRef(false);
  const destination = useRef('/profile/agents');
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    // Keep the token in component memory only. A back navigation gets a chance
    // to show the required sheet before unmounting this one-time secret.
    history.pushState({ ...history.state, agentTokenGuard: true }, '', location.href);
    const pop = () => {
      if (mayLeave.current) return;
      history.pushState({ ...history.state, agentTokenGuard: true }, '', location.href);
      destination.current = '/profile/agents'; setLeaving(true);
    };
    const unload = (event: BeforeUnloadEvent) => { if (!mayLeave.current) { event.preventDefault(); event.returnValue = ''; } };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('a[href]');
      if (!mayLeave.current && link instanceof HTMLAnchorElement && link.href !== location.href) {
        event.preventDefault(); destination.current = link.href; setLeaving(true);
      }
    };
    window.addEventListener('popstate', pop); window.addEventListener('beforeunload', unload); document.addEventListener('click', click, true);
    return () => { window.removeEventListener('popstate', pop); window.removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true); clearTimeout(timeout.current); };
  }, []);
  const leave = () => { mayLeave.current = true; router.replace(destination.current); };
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface text-text">
    <TopBar title={name} />
    <div className="flex flex-col gap-5 px-screen-x py-5">
      <h1 className="text-body font-semibold">Token created</h1>
      <p className="text-detail text-muted">Copy it and paste it into the agent&apos;s settings. For your security it is shown only this once.</p>
      <input aria-label="Agent token" readOnly onCopy={() => { setCopied(true); mayLeave.current = true; }} value={token} className="h-[48px] min-w-0 rounded-[12px] bg-field px-3 font-mono text-[13px]" onFocus={event => event.currentTarget.select()} />
      <Button onClick={async () => { try { await navigator.clipboard.writeText(token); setCopied(true); mayLeave.current = true; setCopyLabel(true); clearTimeout(timeout.current); timeout.current = setTimeout(() => setCopyLabel(false), 2000); } catch { setError('The token could not be copied. Select it and copy it.'); } }}>{copyLabel ? 'Copied' : 'Copy token'}</Button>
      {error && <p role="alert" className="text-meta text-muted">{error}</p>}
      <p className="text-meta text-muted">If you lose it, revoke this one and create another.</p>
      <Button variant="secondary" onClick={() => copied ? leave() : setLeaving(true)}>Done</Button>
    </div>
    <Sheet open={leaving} onClose={() => setLeaving(false)} label="You won't see this token again">
      <h2 className="text-sheet-head">You won&apos;t see this token again</h2>
      <Button onClick={leave}>Leave</Button><Button variant="secondary" onClick={() => setLeaving(false)}>Stay</Button>
    </Sheet>
  </main>;
}
