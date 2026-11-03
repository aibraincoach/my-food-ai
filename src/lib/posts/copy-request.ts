/** Frozen selection persisted before a copy can be sent in the background. */
export type CopyRequest = {id:string;saved:boolean;eatenAt:string};
export function copyEndpoint(copy:CopyRequest):string {
 return copy.saved?`/api/saved/${copy.id}/log`:`/api/posts/${copy.id}/log-again`;
}
