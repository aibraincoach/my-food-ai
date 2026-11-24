"use server";
import {getTranslations} from 'next-intl/server';

import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';

function fail(path:string,message:string):never{
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
export async function requestPasswordReset(form:FormData):Promise<void>{
  const t=await getTranslations('auth');
  const email=String(form.get('email')??'').trim();
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))fail('/reset-password',t('enterEmail'));
  // Next's server-action boundary checks Origin against Host before this runs.
  // Missing/invalid origins fail; no guessed host or alternate redirect route.
  const origin=(await headers()).get('origin');
  let validOrigin=false;
  try{
    const url=new URL(origin??'');
    validOrigin=url.origin===origin&&(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname));
  }catch{}
  if(!validOrigin)fail('/reset-password',t('resetFailure'));
  const token=form.get('h-captcha-response');
  let failed=false;
  try{
    const supabase=await createClient(AbortSignal.timeout(8000));
    const {error}=await supabase.auth.resetPasswordForEmail(email,{
      redirectTo:`${origin}/auth/password-reset`,
      ...(typeof token==='string'&&token.trim()?{captchaToken:token.trim()}:{}),
    });
    failed=Boolean(error);
  }catch{failed=true;}
  if(failed)fail('/reset-password',t('resetFailure'));
  // No account lookup or address echo: this is identical for existing/absent users.
  redirect('/reset-password?sent=1');
}
export async function updatePassword(form:FormData):Promise<void>{
  const t=await getTranslations('auth');
  const password=String(form.get('password')??'');
  if(password.length<8)fail('/new-password',t('passwordLength'));
  let failed=false,missingUser=false;
  try{
    const supabase=await createClient(AbortSignal.timeout(8000));
    const {data:{user},error:identityError}=await supabase.auth.getUser();
    if(identityError)throw identityError;
    if(!user)missingUser=true;
    else{
      const {error}=await supabase.auth.updateUser({password});
      failed=Boolean(error);
    }
  }catch{failed=true;}
  if(missingUser)fail('/reset-password',t('invalidReset'));
  if(failed)fail('/new-password',t('passwordFailure'));
  redirect('/');
}
