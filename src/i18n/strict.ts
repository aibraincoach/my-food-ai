export function onError(error: Error): never { throw error; }
export function getMessageFallback({error}: {error: Error}): never { throw error; }
