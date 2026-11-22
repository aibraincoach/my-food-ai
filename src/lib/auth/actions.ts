"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { endCurrentSession } from "@/lib/auth/end-session";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signUp(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const handle = String(formData.get("handle") ?? "");
  const password = String(formData.get("password") ?? "");
  const captchaToken = formData.get("h-captcha-response");
  const options = typeof captchaToken === "string" && captchaToken.trim() ? { captchaToken: captchaToken.trim() } : undefined;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, ...(options ? { options } : {}) });
  if (error || !data.user) {
    fail("/sign-up", error?.message.toLowerCase().includes("captcha") ? "Complete the check and try again." : "We couldn't finish creating your account. Try again.");
  }
  // The profiles table has no client insert policy, so the row is created
  // with the service-role client; the secret key never leaves the server.
  // The redirect below stays outside the try: redirect() throws
  // NEXT_REDIRECT, which a catch here would mistake for a real error.
  const ownsSession=data.session?.user.id===data.user.id;
  const profileFailure="We couldn't finish creating your account. Try again.";
  let profileMessage: string | null = null;
  try {
    const admin = createAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .insert({ id: data.user.id, handle });
    if (profileError) profileMessage = ownsSession && profileError.code === "23505" ? "That handle is taken. Choose another." : profileFailure;
  } catch {
    profileMessage = profileFailure;
  }
  if (profileMessage) {
    // signUp can return an existing/obfuscated account. Its returned id is
    // never permission to delete an Auth account after a profile failure.
    // A verified sign-up session can continue through the existing handle form.
    if (ownsSession) fail("/choose-handle",profileMessage);
    fail("/sign-up", profileMessage);
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
    : "Sign-in could not be completed. Try again.");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await endCurrentSession(supabase.auth);
  redirect("/sign-in");
}

export async function chooseHandle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {data: {user}, error} = await supabase.auth.getUser();
  if (error || !user) redirect('/sign-in');
  const {saveFirstHandle} = await import('@/lib/auth/first-profile');
  const message = await saveFirstHandle(createAdminClient(), user.id, String(formData.get('handle') ?? ''));
  if (message) fail('/choose-handle', message);
  redirect('/');
}
