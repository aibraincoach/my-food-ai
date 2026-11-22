import {headers} from 'next/headers';
import ProviderButton from '@/components/ProviderButton';
import {appleBrowserEligible} from '@/lib/auth/apple-browser';

export default async function AuthProviders() {
  const apple = appleBrowserEligible((await headers()).get('user-agent') ?? '');
  // Setup is pending. Each provider's own PR makes its one action live.
  return <div className="flex flex-col gap-tooltip-y">
    {apple && <ProviderButton provider="Apple" />}
    <ProviderButton provider="Google" />
    <ProviderButton provider="LINE" />
    <ProviderButton provider="Facebook" />
    <ProviderButton provider="ChatGPT" />
  </div>;
}
