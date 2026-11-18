import {feedPhotoSrcSet} from './feed-photo-url';
// #222: the first photo of the last Home this person drew in this browser. Home's own HTML names its first photo only
// after the feed is read, and the shell's scripts are already downloading by then; this hint lets Home's response
// headers ask for the photo first. The cookie holds only its relative URL; an authenticated ownership read gates it.
export const FIRST_PHOTO_COOKIE='mfa-first-photo';
const PHOTO=/^\/p\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_([0-9a-f]{32})_1080\.webp$/;
/** The cookie line that remembers (or, with no usable photo, forgets) the first photo. */
export function firstPhotoCookie(url:string|null,secure:boolean):string{
 const keep=url!=null&&PHOTO.test(url);
 return `${FIRST_PHOTO_COOKIE}=${keep?encodeURIComponent(url):''}; path=/; max-age=${keep?604800:0}; samesite=lax${secure?'; secure':''}`;
}
/** A hint is optional: unreadable, deleted or foreign photos never replace the feed. */
export async function firstPhotoLinkHeader(cookie:string|undefined,userId:string,
 readPhoto:(id:string,secret:string)=>PromiseLike<{data:unknown;error:unknown}>):Promise<string|null>{
 let value='';
 try{value=cookie?decodeURIComponent(cookie):'';}catch{return null;}
 const match=PHOTO.exec(value);if(!match)return null;
 try{
  const {data,error}=await readPhoto(match[1],match[2]);
  const photo=data as {id?:string;kind?:string;photo_secret?:string;posts?:{user_id?:string;deleted_at?:string|null}}|null;
  if(error||photo?.id!==match[1]||photo.kind!=='photo'||photo.photo_secret!==match[2]||photo.posts?.user_id!==userId||photo.posts.deleted_at!==null)return null;
 }catch{return null;}
 return `<${value}>; rel=preload; as=image; fetchpriority=high; crossorigin=anonymous; imagesrcset="${feedPhotoSrcSet(value)}"; imagesizes="(min-width: 1024px) 520px, 100vw"`;
}
