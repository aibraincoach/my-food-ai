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
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    fail("/sign-up", error?.message ?? "Sign-up failed.");
  }
  // The profiles table has no client insert policy, so the row is created
  // with the service-role client; the secret key never leaves the server.
  // The redirect below stays outside the try: redirect() throws
  // NEXT_REDIRECT, which a catch here would mistake for a real error.
  let profileMessage: string | null = null;
  try {
    const admin = createAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .insert({ id: data.user.id, handle });
    if (profileError) profileMessage = profileError.message;
  } catch (e) {
    profileMessage = e instanceof Error ? e.message : "Profile creation failed.";
  }
  if (profileMessage) {
    // Roll back the orphan auth user so the address can sign up again.
    try {
      await createAdminClient().auth.admin.deleteUser(data.user.id);
    } catch {
      // Best effort; the sign-up error below is what matters.
    }
    fail("/sign-up", profileMessage);
  }
  redirect("/");
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail("/sign-in", error.message);
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await endCurrentSession(supabase.auth);
  redirect("/sign-in");
}
