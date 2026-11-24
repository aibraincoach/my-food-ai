"use server";
import {getTranslations} from 'next-intl/server';

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { endCurrentSession } from "@/lib/auth/end-session";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export type SignUpState = {error:string|null;email:string;handle:string};
type AuthMessageKey=keyof typeof import('../../../messages/en.json')['auth'];
function signUpMessage(t:(key:AuthMessageKey)=>string,error:{code?:string;status?:number;message?:string}|null):string {
  if (error?.code==='captcha_failed' || error?.message?.toLowerCase().includes('captcha')) return t('completeCheck');
  if (error?.code==='weak_password') return t('weakPassword');
  if (error?.code==='email_address_invalid') return t('validEmail');
  if (error?.code==='over_email_send_rate_limit' || error?.code==='over_request_rate_limit' || error?.status===429) return t('tooManyRequests');
  return t('signupFailure');
}
export async function signUp(_previous:SignUpState, formData: FormData): Promise<SignUpState> {
  const t=await getTranslations('auth');
  const email = String(formData.get("email") ?? "");
  const handle = String(formData.get("handle") ?? "");
  const password = String(formData.get("password") ?? "");
  const failure=(error:string):SignUpState=>({error,email,handle});
  const captchaToken = formData.get("h-captcha-response");
  const options = typeof captchaToken === "string" && captchaToken.trim() ? { captchaToken: captchaToken.trim() } : undefined;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, ...(options ? { options } : {}) });
  if (error || !data.user) {
    console.error("Sign-up failed:",error?.code??"no_user");
    return failure(signUpMessage(t,error));
  }
  // Only email and handle return on failure. The typed password stays in the
  // existing client input; it is never echoed, persisted or put in an address.
  if (!data.session) {
    return failure(t('confirmOrSignIn'));
  }
  // A returned user id alone is not authority to assign that account a handle.
  // Verify the session issued by sign-up before making the one profile write.
  let verifiedId: string | undefined;
  try {
    const { data: verified, error: verificationError } = await supabase.auth.getUser();
    if (!verificationError) verifiedId = verified.user?.id;
  } catch {
    console.error("Sign-up session verification failed.");
  }
  if (!verifiedId || verifiedId !== data.session.user.id || verifiedId !== data.user.id) {
    await endCurrentSession(supabase.auth);
    return failure(signUpMessage(t,null));
  }
  let profileMessage: string | null = null;
  try {
    const { error: profileError } = await createAdminClient().from("profiles").insert({ id: verifiedId, handle });
    if (profileError) {
      console.error("Sign-up profile failed:",profileError.code??"unknown");
      profileMessage = profileError.code === "23505" ? t('takenHandle') : signUpMessage(t,null);
    }
  } catch {
    console.error("Sign-up profile failed: request_failure");
    profileMessage = signUpMessage(t,null);
  }
  if (profileMessage) {
    // The returned Auth id is never permission to delete an account (#1302).
    // Keep the account and use the existing signed-in profile recovery form.
    fail("/choose-handle",profileMessage);
  }
  redirect("/");
}

export async function signIn(formData: FormData): Promise<void> {
  const t=await getTranslations('auth');
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const captchaToken = formData.get("h-captcha-response");
  const options = typeof captchaToken === "string" && captchaToken.trim() ? { captchaToken: captchaToken.trim() } : undefined;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password, ...(options ? { options } : {}) });
  if (error) fail("/sign-in", error.message.toLowerCase().includes("captcha") ? t('completeCheck')
    : error.code === "invalid_credentials" ? t('credentialsMismatch')
    : error.code === "email_not_confirmed" ? t('confirmEmail')
    : error.code === "over_request_rate_limit" || error.status === 429 ? t('tooManyAttempts')
    : t('signinFailure'));
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await endCurrentSession(supabase.auth);
  redirect("/welcome");
}

export async function chooseHandle(formData: FormData): Promise<void> {
  const t=await getTranslations('auth');
  const supabase = await createClient();
  const {data: {user}, error} = await supabase.auth.getUser();
  if (error || !user) redirect('/welcome');
  const {saveFirstHandle} = await import('@/lib/auth/first-profile');
  const message = await saveFirstHandle(createAdminClient(), user.id, String(formData.get('handle') ?? ''));
  if (message) {
    const key=message==="Enter a handle of 1 to 80 characters."?'handleLength':message==="That handle is taken. Choose another."?'takenHandle':message==="Your handle could not be saved. Try again."?'handleFailure':null;
    if(!key)throw new Error('Unknown handle error message.');
    fail('/choose-handle',t(key));
  }
  redirect('/');
}
