const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Only a non-secret session UUID and account UUID cross the worker boundary.
export function mediaSessionEpoch(session: {access_token: string; user: {id: string}} | null): {epoch: string; userId: string} | null {
  try {
    if (!session || !UUID.test(session.user.id)) return null;
    const part = session.access_token.split('.')[1];
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (!UUID.test(payload.session_id) || payload.sub !== session.user.id || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) return null;
    return {epoch: payload.session_id, userId: session.user.id};
  } catch { return null; }
}
