'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/Button';

type Provider = 'Google' | 'Apple' | 'LINE' | 'ChatGPT' | 'Facebook';
type Props = {provider: Provider; startAction?: () => Promise<void>};

export default function ProviderButton({provider, startAction}: Props) {
  const [shown, setShown] = useState(false);
  const messageId = `${provider.toLowerCase()}-coming-soon`;
  const button = <Button type={startAction ? 'submit' : 'button'} variant="secondary"
    onClick={startAction ? undefined : () => setShown(true)}
    aria-describedby={startAction ? undefined : messageId}
    className="flex flex-col items-center justify-center">
    <span>Continue with {provider}</span>
    {!startAction && <span className="text-comment font-normal text-muted">Coming soon</span>}
  </Button>;
  return <div className="flex flex-col gap-tooltip-y">
    {startAction ? <form action={startAction}>{button}</form> : button}
    {!startAction && <p id={messageId} role="status" className="min-h-5 text-center text-comment text-muted">{shown ? 'Coming soon' : ''}</p>}
  </div>;
}
