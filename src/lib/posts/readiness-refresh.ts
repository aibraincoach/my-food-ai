// Home owns a fresh feed read and contribution reconciliation immediately
// after SSR. Other tabs still need the readiness observer's initial refresh.
export function refreshAfterReadinessSeed(path: string, hasHomeFeed: boolean): boolean {
  return path !== '/' || !hasHomeFeed;
}
export function refreshAfterReady(announce: boolean, wasPending: boolean, previousStatus: string | undefined): boolean {
  return announce || wasPending || previousStatus !== 'ready';
}
