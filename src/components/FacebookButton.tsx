import { Button } from "@/components/ui/Button";
import { tokens } from "@/lib/theme/tokens";

export default function FacebookButton() {
  return (
    <div className="flex flex-col gap-tooltip-y">
    <Button type="button" variant="secondary" disabled aria-disabled="true" aria-describedby="facebook-coming-soon" className="flex items-center justify-center gap-tooltip-y">
      <span aria-hidden="true" className="flex items-center justify-center rounded-circle bg-facebook text-white" style={{ width: tokens.spacing["icon-thumb"], height: tokens.spacing["icon-thumb"], fontSize: tokens.typography.comment.size, fontWeight: 700 }}>f</span>
      Continue with Facebook
    </Button>
    <p id="facebook-coming-soon" className="text-center text-comment text-muted">Facebook sign-in is coming soon.</p>
    </div>
  );
}
