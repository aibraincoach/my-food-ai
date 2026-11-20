import {Button} from '@/components/ui/Button';

type Provider = 'Google' | 'Apple' | 'LINE' | 'ChatGPT' | 'Facebook';
type Props = {provider: Provider; start?: () => Promise<void>};

export default function ProviderButton({provider, start}: Props) {
  const button = <Button type={start ? 'submit' : 'button'} variant="secondary" disabled={!start} aria-describedby={start ? undefined : `${provider.toLowerCase()}-coming-soon`}>
    Continue with {provider}
  </Button>;
  return <div className="flex flex-col gap-tooltip-y">
    {start ? <form action={start}>{button}</form> : button}
    {!start && <p id={`${provider.toLowerCase()}-coming-soon`} className="text-center text-comment text-muted">{provider} sign-in is coming soon.</p>}
  </div>;
}
