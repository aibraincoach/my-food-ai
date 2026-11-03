import {shareVerifiedBrowserUser} from "@/lib/auth/browser-user";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const client=createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  if(typeof window!=="undefined")shareVerifiedBrowserUser(client.auth);
  return client;
}
