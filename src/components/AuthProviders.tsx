import {headers} from 'next/headers';
import ProviderButton from '@/components/ProviderButton';
import {appleBrowserEligible} from '@/lib/auth/apple-browser';

export default async function AuthProviders() {
  const apple = appleBrowserEligible((await headers()).get('user-agent') ?? '');
  // Setup is pending. Each provider's own PR makes its one action live.
  return <div className="flex flex-col gap-tooltip-y">
    <ProviderButton provider="Google" />
    {apple && <ProviderButton provider="Apple" />}
    <ProviderButton provider="LINE" />
    <ProviderButton provider="ChatGPT" />
    <ProviderButton provider="Facebook" />
  </div>;
}
