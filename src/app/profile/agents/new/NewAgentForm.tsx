'use client';
import Link from 'next/link';
import { useState } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { createTokenAction } from '../actions';
import TokenShown from '../TokenShown';
export default function NewAgentForm() {
  const [name, setName] = useState('Agent 1');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ token: string; name: string } | null>(null);
  if (created) return <TokenShown token={created.token} name={created.name} />;
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface text-text">
    <TopBar title="" left={<Link href="/profile" className="text-detail">‹ Profile</Link>} />
    <form className="flex flex-col gap-6 px-screen-x pb-8" onSubmit={async event => {
      event.preventDefault(); if (pending || !name.trim()) return; setPending(true); setError('');
      try { const result = await createTokenAction(name); if ('error' in result) setError(result.error ?? 'The token could not be created.'); else setCreated(result); }
      catch { setError('The token could not be created.'); } finally { setPending(false); }
    }}>
      <h1 className="text-title">Connect an agent</h1>
      <p className="text-detail text-muted">An agent such as Claude can use a token to post meals for you and read what you have posted.</p>
      <div className="flex flex-col gap-2"><Field label="Name" value={name} maxLength={40} autoFocus onFocus={event => event.currentTarget.select()} onChange={event => setName(event.target.value)} />
        <p className="text-meta text-muted">Only you see this. It labels the agent&apos;s posts and its activity.</p></div>
      <div className="flex flex-col gap-3"><p className="text-meta text-muted">The token can</p>
        <ul className="flex list-disc flex-col gap-3 pl-5 text-detail"><li>Post a meal you tell it about</li><li>Read the meals you have posted</li><li>Add a correction to a meal</li><li>Nothing else: no weight, no exercise, no targets</li></ul></div>
      {error && <p role="alert" className="text-detail">{error}</p>}
      <Button type="submit" disabled={pending || !name.trim()}>{pending ? 'Creating token…' : 'Create token'}</Button>
    </form>
  </main>;
}
