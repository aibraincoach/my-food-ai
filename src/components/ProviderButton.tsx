"use client";

import {useState} from 'react';
import Image from 'next/image';

type Provider = 'Google' | 'Apple' | 'LINE' | 'ChatGPT' | 'Facebook';
type Props = {provider: Provider; startAction?: () => Promise<void>};
const marks = {
  Google: '/providers/google-sign-in.png', Apple: '/providers/apple-login.png',
  LINE: '/providers/line-login.png', Facebook: '/providers/facebook-login.png',
};
const colours = {
  Google: {background: '#fff', color: 'var(--color-text)', border: '1px solid var(--color-line)'},
  Apple: {background: '#000', color: '#fff', border: '1px solid #000'},
  LINE: {background: '#06C755', color: '#fff', border: '1px solid #06C755'},
  Facebook: {background: '#fff', color: 'var(--color-text)', border: '1px solid var(--color-line)'},
  ChatGPT: {background: '#000', color: '#fff', border: '1px solid #000'},
};

export default function ProviderButton({provider, startAction}: Props) {
  const [shown, setShown] = useState(false);
  const messageId = `${provider.toLowerCase()}-coming-soon`;
  const button = <button type={startAction ? 'submit' : 'button'}
    onClick={startAction ? undefined : () => setShown(true)}
    aria-describedby={startAction ? undefined : messageId}
    style={{...colours[provider], height: 52}}
    className="flex w-full items-center justify-center gap-[10px] rounded-field text-body font-semibold">
    {provider !== 'ChatGPT' && <Image src={marks[provider]} alt="" width={20} height={20} sizes="20px" />}
    <span className="flex flex-col items-center">
      <span>{provider === 'LINE' ? 'Log in with LINE' : `Continue with ${provider}`}</span>
      {!startAction && <span className="text-label font-normal">Coming soon</span>}
    </span>
  </button>;
  return <div className="flex flex-col">
    {startAction ? <form action={startAction}>{button}</form> : button}
    {!startAction && <p id={messageId} role="status" className="min-h-[1lh] text-center text-comment text-muted">{shown ? 'Coming soon' : ''}</p>}
  </div>;
}
