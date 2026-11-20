import {Suspense} from 'react';
import {connection} from 'next/server';
import {chooseHandle} from '@/lib/auth/actions';
import {Button} from '@/components/ui/Button';
import {Field} from '@/components/ui/Field';

type Props = {searchParams: Promise<{error?: string}>};
export default function ChooseHandlePage(props: Props) {
  return <Suspense fallback={null}><ChooseHandleContent {...props}/></Suspense>;
}
async function ChooseHandleContent({searchParams}: Props) {
  await connection();
  const {error} = await searchParams;
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col justify-center gap-screen-x px-card-padding">
    <h1 className="text-title">Choose a handle.</h1>
    <form action={chooseHandle} className="flex flex-col gap-tooltip-y">
      {error && <p role="alert" className="text-detail">{error}</p>}
      <Field name="handle" type="text" required maxLength={80} autoComplete="nickname" placeholder="Handle" aria-label="Handle"/>
      <Button type="submit">Continue</Button>
    </form>
  </main>;
}
