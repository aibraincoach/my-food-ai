'use client';
import {useEffect} from 'react';
import {firstPhotoCookie} from '@/lib/posts/first-photo-hint';
// #222: remembers Home's first photo for this person, so the next open can ask for it before anything else.
export default function FirstPhotoMemory({url}:{url:string|null}){
 useEffect(()=>{document.cookie=firstPhotoCookie(url,location.protocol==='https:');},[url]);
 return null;
}
