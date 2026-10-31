"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { MAX_CAPTION_LENGTH } from "@/lib/posts/caption";

export default function PostMenu({ postId, caption }: { postId: string; caption: string }) {
  const router = useRouter();
  const menu = useRef<HTMLDetailsElement>(null);
  const savingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(caption);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const edit = () => { if (menu.current) menu.current.open = false; setValue(caption); setError(""); setOpen(true); };
  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setError("");
    try {
      const response = await fetch(`/api/posts/${postId}/caption`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption: value }) });
      if (!response.ok) throw new Error("The caption could not be saved. Try again.");
      window.dispatchEvent(new CustomEvent("post-created", { detail: { id: postId } }));
      router.refresh(); setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "The caption could not be saved."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  return <>
    <details ref={menu} className="relative shrink-0">
      <summary aria-label="Meal menu" className="flex min-h-tap min-w-tap cursor-pointer list-none items-center justify-center text-detail">···</summary>
      <div className="absolute right-0 z-10 min-w-40 rounded-field border border-hairline bg-surface p-2 shadow-segment"><button type="button" onClick={edit} className="min-h-tap w-full px-tooltip-x text-left text-detail">Edit caption</button></div>
    </details>
    <Sheet open={open} onClose={() => { if (!savingRef.current) setOpen(false); }} label="Edit caption">
      <h2 className="text-sheet-title">Edit caption</h2>
      <label htmlFor={`caption-${postId}`} className="text-meta text-muted">Caption</label>
      <textarea id={`caption-${postId}`} autoFocus maxLength={MAX_CAPTION_LENGTH} disabled={saving} value={value} onChange={e => setValue(e.target.value)} className="min-h-24 rounded-field bg-field p-tooltip-x text-body" />
      {error ? <p role="alert" className="text-meta text-muted">{error}</p> : null}
      <div className="flex gap-2"><button type="button" disabled={saving} onClick={() => setOpen(false)} className="min-h-tap px-tooltip-x text-detail">Cancel</button><button type="button" disabled={saving || value === caption} onClick={() => { void save(); }} className="min-h-tap rounded-field bg-text px-screen-x text-detail text-surface">{saving ? "Saving…" : "Save"}</button></div>
    </Sheet>
  </>;
}
