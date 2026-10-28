'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = { open: boolean; onClose: () => void; children: ReactNode; label: string };

/** Native modal supplies focus trapping, inert background, and Escape dismissal. */
export function Sheet({ open, onClose, children, label }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} aria-label={label} onCancel={onClose} onClick={(event) => {
    if (event.target === event.currentTarget) onClose();
  }} className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-text backdrop:bg-scrim">
    <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-full max-w-phone flex-col gap-sheet-gap overflow-y-auto rounded-t-sheet bg-surface px-screen-x pt-sheet-top pb-sheet-safe">
      <div aria-hidden="true" className="mx-auto h-handle-h w-handle-w shrink-0 rounded-circle bg-ring" />
      {children}
    </div>
  </dialog>;
}
