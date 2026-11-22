"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { endCurrentSession } from "@/lib/auth/end-session";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export type SignUpState = {error:string|null;email:string;handle:string};
function signUpMessage(error:{code?:string;status?:number;message?:string}|null):string {
  if (error?.code==='captcha_failed' || error?.message?.toLowerCase().includes('captcha')) return "Complete the check and try again.";
  if (error?.code==='weak_password') return "Choose a stronger password, then try again.";
  if (error?.code==='email_address_invalid') return "Enter a valid email address.";
  if (error?.code==='over_email_send_rate_limit' || error?.code==='over_request_rate_limit' || error?.status===429) return "Too many requests. Wait a moment, then try again.";
  return "We couldn't finish creating your account. Try again.";
}
export async function signUp(_previous:SignUpState, formData: FormData): Promise<SignUpState> {
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
    return failure(signUpMessage(error));
  }
  // Only email and handle return on failure. The typed password stays in the
  // existing client input; it is never echoed, persisted or put in an address.
  const ownsSession=data.session?.user.id===data.user.id;
  let profileMessage: string | null = null;
  try {
    const { error: profileError } = await createAdminClient().from("profiles").insert({ id: data.user.id, handle });
    if (profileError) {
      console.error("Sign-up profile failed:",profileError.code??"unknown");
      profileMessage = ownsSession && profileError.code === "23505" ? "That handle is taken. Choose another." : signUpMessage(null);
    }
  } catch {
    console.error("Sign-up profile failed: request_failure");
    profileMessage = signUpMessage(null);
  }
  if (profileMessage) {
    // The returned Auth id is never permission to delete an account (#1302).
    // Keep the account and use the existing signed-in profile recovery form.
    if (ownsSession) fail("/choose-handle",profileMessage);
    return failure(profileMessage);
  }
  redirect("/");
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const captchaToken = formData.get("h-captcha-response");
  const options = typeof captchaToken === "string" && captchaToken.trim() ? { captchaToken: captchaToken.trim() } : undefined;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password, ...(options ? { options } : {}) });
  if (error) fail("/sign-in", error.message.toLowerCase().includes("captcha") ? "Complete the check and try again."
    : error.code === "invalid_credentials" ? "That email and password don't match. Try again."
    : error.code === "email_not_confirmed" ? "Confirm your email address before you sign in."
    : error.code === "over_request_rate_limit" || error.status === 429 ? "Too many attempts. Wait a moment, then try again."
    : "Sign-in could not be completed. Try again.");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await endCurrentSession(supabase.auth);
  redirect("/welcome");
}

export async function chooseHandle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {data: {user}, error} = await supabase.auth.getUser();
  if (error || !user) redirect('/welcome');
  const {saveFirstHandle} = await import('@/lib/auth/first-profile');
  const message = await saveFirstHandle(createAdminClient(), user.id, String(formData.get('handle') ?? ''));
  if (message) fail('/choose-handle', message);
  redirect('/');
}
