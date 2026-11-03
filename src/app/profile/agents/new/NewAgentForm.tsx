'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { TopBar } from '@/components/ui/TopBar';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { createTokenAction } from '../actions';
import TokenShown from '../TokenShown';
export default function NewAgentForm() {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { const input = form.current?.querySelector('input'); input?.focus(); input?.select(); }, []);
  const [name, setName] = useState('Agent 1');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ token: string; name: string } | null>(null);
  if (created) return <TokenShown token={created.token} name={created.name} />;
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface text-text desktop:my-8 desktop:min-h-[640px] desktop:max-w-[480px] desktop:rounded-[24px] desktop:border desktop:border-line desktop:shadow-lg">
    <TopBar title={<h1>Connect an agent</h1>} left={<Link href="/profile" className="flex h-tap items-center text-[15px]"><Icon name="back" size={22}/>Profile</Link>} right={<span className="w-[70px]"/>} />
    <form ref={form} className="flex flex-1 flex-col" onSubmit={async event => {
      event.preventDefault(); if (pending || !name.trim()) return; setPending(true); setError('');
      try { const result = await createTokenAction(name); if ('error' in result) setError(result.error ?? 'The token could not be created.'); else setCreated(result); }
      catch { setError('The token could not be created.'); } finally { setPending(false); }
    }}>
      <div className="flex flex-col gap-[22px] px-screen-x pt-5">
      <p className="text-[15px] leading-[1.5] text-text">An agent such as Claude can use a token to post meals for you and read what you have posted.</p>
      <div className="flex flex-col gap-2"><label htmlFor="agent-name" className="text-[13px] font-semibold">Name</label><Field id="agent-name" className="[&>div]:focus-within:border-[1.5px] [&>div]:focus-within:border-text" value={name} maxLength={40} autoFocus onFocus={event => event.currentTarget.select()} onChange={event => setName(event.target.value)} />
        <p className="text-[12px] leading-[1.5] text-muted">Only you see this. It labels the agent&apos;s posts and its activity.</p></div>
      <div className="flex flex-col border-t border-hairline"><p className="pt-[14px] pb-1 text-[13px] font-semibold">The token can</p>
        <ul>{['Post meals as you', 'Read your posts', 'Add corrections to your meals', 'Cannot change your account or see your password'].map((fact, index) => <li key={fact} className="flex min-h-tap items-center gap-3 border-b border-hairline py-2 text-[14px]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 ${index === 3 ? 'text-muted' : ''}`} aria-hidden="true"><path d={index === 3 ? 'M6 6l12 12M18 6 6 18' : 'm5 12 5 5 9-10'}/></svg><span>{fact}</span>
        </li>)}</ul></div>
      {error && <p role="alert" className="text-detail">{error}</p>}
      </div>
      <div className="mt-auto px-inset pt-6 pb-[calc(34px+env(safe-area-inset-bottom))]"><Button style={{ height: 50, borderRadius: 14 }} type="submit" disabled={pending || !name.trim()}>{pending ? 'Creating token…' : 'Create token'}</Button></div>
    </form>
  </main>;
}
