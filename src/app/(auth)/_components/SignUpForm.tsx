'use client';
import {startTransition,useActionState} from 'react';
import {signUp,type SignUpState} from '@/lib/auth/actions';
import HCaptcha from '@/components/HCaptcha';
import {Button} from '@/components/ui/Button';
import {AuthField} from './AuthField';
import {AuthErrorBanner} from './AuthPieces';
const initial:SignUpState={error:null,email:'',handle:''};
export default function SignUpForm(){
 const [state,submit,pending]=useActionState(signUp,initial);
 return <form method="post" onSubmit={event=>{event.preventDefault();if(pending)return;const data=new FormData(event.currentTarget);startTransition(()=>submit(data));}} className="flex flex-1 flex-col gap-4">
  {state.error?<AuthErrorBanner>{state.error}</AuthErrorBanner>:null}
  <AuthField label="Email" name="email" type="email" required autoComplete="email" placeholder="name@example.com" defaultValue={state.email}/>
  <AuthField label="Handle" name="handle" type="text" required maxLength={80} autoComplete="nickname" placeholder="yourname" help="The name shown on your posts." defaultValue={state.handle}/>
  <AuthField label="Password" name="password" type="password" required autoComplete="new-password" placeholder="Password"/>
  <HCaptcha/>
  <Button type="submit" disabled={pending}>Create account</Button>
 </form>;
}
