/** An update is applied only on a later user lifecycle event, with no work at risk. */
export function createUpdateSafety({blocked, pending, reload}: {
  blocked: () => boolean;
  pending: () => Promise<boolean>;
  reload: () => void;
}) {
  let ready = false, checking = false, reloaded = false;
  return {
    ready() { ready = true; },
    async safePoint() {
      if (!ready || checking || reloaded || blocked()) return;
      checking = true;
      try {
        if (await pending() || blocked()) return;
        reloaded = true;
        reload();
      } finally { checking = false; }
    },
  };
}

const TEXT_INPUTS = new Set(['text', 'email', 'password', 'search', 'url', 'tel', 'number']);

/** Read live fields only; never retain their contents in update state. */
export function hasUnsentText(root: ParentNode): boolean {
  return Array.from(root.querySelectorAll('textarea,input,[contenteditable]')).some(field => {
    if (field.matches(':disabled') || field.hasAttribute('readonly')) return false;
    if (field.tagName === 'TEXTAREA') return Boolean((field as HTMLTextAreaElement).value.trim());
    if (field.tagName === 'INPUT') {
      const input = field as HTMLInputElement;
      return TEXT_INPUTS.has(input.type) && Boolean(input.value.trim());
    }
    return (field as HTMLElement).isContentEditable && Boolean(field.textContent?.trim());
  });
}
