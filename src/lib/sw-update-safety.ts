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
