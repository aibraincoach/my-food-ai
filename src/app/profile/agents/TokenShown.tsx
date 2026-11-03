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
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface text-text desktop:my-8 desktop:min-h-[640px] desktop:max-w-[480px] desktop:rounded-[24px] desktop:border desktop:border-line desktop:shadow-lg">
    <TopBar title={name} className="[&>div:nth-child(2)]:min-w-0 [&>div:nth-child(2)]:truncate" />
    <div className="flex flex-col gap-4 px-screen-x pt-7">
      <h1 className="text-title">Token created</h1>
      <p className="text-[15px] leading-[1.5] text-muted">Copy it and paste it into the agent&apos;s settings. For your security it is shown only this once.</p>
      <div className="flex flex-col gap-[14px] rounded-[14px] bg-field p-4">
      <textarea rows={2} aria-label="Agent token" readOnly onCopy={() => { setCopied(true); mayLeave.current = true; }} value={token} className="h-[48px] min-w-0 resize-none border-0 bg-transparent p-0 font-mono text-[13px] leading-[1.5] outline-none" onFocus={event => event.currentTarget.select()} />
      <Button style={{ height: 44 }} onClick={async () => { try { await navigator.clipboard.writeText(token); setCopied(true); mayLeave.current = true; setCopyLabel(true); clearTimeout(timeout.current); timeout.current = setTimeout(() => setCopyLabel(false), 2000); } catch { setError('The token could not be copied. Select it and copy it.'); } }}><span className="flex items-center justify-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>{copyLabel ? 'Copied' : 'Copy token'}</span></Button>
      </div>
      {error && <p role="alert" className="text-meta text-muted">{error}</p>}
      <p className="text-[13px] leading-[1.5] text-muted">If you lose it, revoke this one and create another.</p>
    </div>
    <div className="mt-auto px-inset pt-6 pb-[calc(34px+env(safe-area-inset-bottom))]"><Button variant="secondary" style={{ borderColor: 'var(--color-text)', borderWidth: 1.5, height: 50, borderRadius: 14 }} onClick={() => copied ? leave() : setLeaving(true)}>Done</Button></div>
    <Sheet hideClose panelStyle={{ gap: 14, paddingTop: 10, paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }} open={leaving} onClose={() => setLeaving(false)} label="You won't see this token again">
      <h2 className="text-sheet-head">You won&apos;t see this token again</h2>
      <Button onClick={leave}>Leave</Button><Button variant="secondary" onClick={() => setLeaving(false)}>Stay</Button>
    </Sheet>
  </main>;
}
