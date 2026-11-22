import {AuthShell} from '../_components/AuthShell';
import {Suspense} from 'react';
import {connection} from 'next/server';
import {chooseHandle} from '@/lib/auth/actions';
import {Button} from '@/components/ui/Button';
import {AuthField} from '../_components/AuthField';
import {AuthHeader,AuthErrorBanner,AuthBackRow} from '../_components/AuthPieces';

type Props={searchParams:Promise<{error?:string}>};
export default function ChooseHandlePage(props:Props){
  return <Suspense fallback={null}><ChooseHandleContent {...props}/></Suspense>;
}
async function ChooseHandleContent({searchParams}:Props){
  await connection();
  const {error}=await searchParams;
  const handleError=error&&(error.startsWith('That handle is taken.')||error.startsWith('Enter a handle'))?error:undefined;
  return <AuthShell>
    <AuthBackRow href="/welcome">Welcome</AuthBackRow>
    <AuthHeader title="Choose a handle" align="start"/>
    <form action={chooseHandle} className="flex flex-1 flex-col gap-4">
      {error&&!handleError?<AuthErrorBanner>{error}</AuthErrorBanner>:null}
      <AuthField label="Handle" name="handle" type="text" required maxLength={80} autoComplete="nickname" placeholder="yourname" help="The name shown on your posts." error={handleError}/>
      <Button type="submit">Continue</Button>
    </form>
  </AuthShell>;
}
