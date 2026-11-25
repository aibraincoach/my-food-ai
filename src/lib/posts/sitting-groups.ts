export const SITTING_GAP_MS=20*60*1000;
export type SittingPost={id:string;ownerId:string;eatenAt:string};
/** Consecutive eating-time gaps, isolated by owner; one owner for #1324 too. */
export function sittingGroups<T extends SittingPost>(posts:readonly T[]):T[][] {
 const ordered=posts.map(post=>{
  const time=Date.parse(post.eatenAt);
  if(!post.id||!post.ownerId||!Number.isFinite(time))throw new Error('Invalid sitting post identity or eating time');
  return{post,time};
 }).sort((a,b)=>a.post.ownerId.localeCompare(b.post.ownerId)||a.time-b.time||a.post.id.localeCompare(b.post.id));
 const groups:T[][]=[];let previous:typeof ordered[number]|undefined;
 for(const entry of ordered){
  if(!previous||previous.post.ownerId!==entry.post.ownerId||entry.time-previous.time>SITTING_GAP_MS)groups.push([]);
  groups.at(-1)!.push(entry.post);previous=entry;
 }
 return groups;
}
