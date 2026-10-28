"use client";

import { Button } from "@/components/ui/Button";
import { tokens } from "@/lib/theme/tokens";
import { createClient } from "@/lib/supabase/client";

export default function FacebookButton() {
  const onClick = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };
  return (
    <Button variant="secondary" onClick={onClick} className="flex items-center justify-center gap-tooltip-y">
      <span aria-hidden="true" className="flex items-center justify-center rounded-circle bg-facebook text-white" style={{ width: tokens.spacing["icon-thumb"], height: tokens.spacing["icon-thumb"], fontSize: tokens.typography.comment.size, fontWeight: 700 }}>f</span>
      Continue with Facebook
    </Button>
  );
}
