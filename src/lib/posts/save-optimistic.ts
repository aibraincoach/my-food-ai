export type BookmarkState = {id: string | null; pending: boolean};
export function beginBookmark(state: BookmarkState): BookmarkState {
  return state.pending ? state : {id: state.id ? null : 'pending', pending: true};
}
export function finishBookmark(previous: BookmarkState, savedId: string | null, failed = false): BookmarkState {
  return {id: failed ? previous.id : savedId, pending: false};
}
