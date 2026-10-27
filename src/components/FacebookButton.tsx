"use client";

import { createClient } from "@/lib/supabase/client";

export default function FacebookButton() {
  const onClick = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "facebook" });
  };
  return (
    <button type="button" onClick={onClick} className="w-full border border-neutral-300 py-2 text-sm">
      Continue with Facebook
    </button>
  );
}
