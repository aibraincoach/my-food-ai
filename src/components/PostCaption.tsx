'use client';
import {useEffect,useRef,useState} from 'react';
export default function PostCaption({handle,caption,className='',postId}:{postId?:string;handle:string;caption:string;className?:string}) {
 const [override,setOverride]=useState<{caption:string;error?:string}|null>(null);
 useEffect(()=>{const receive=(event:Event)=>{const d=(event as CustomEvent<{id:string;caption:string;error?:string}>).detail;if(postId&&d?.id===postId)setOverride({caption:d.caption,error:d.error});};window.addEventListener('post-caption',receive);return()=>window.removeEventListener('post-caption',receive);},[postId]);
 const displayed=override?.caption??caption;
 const ref=useRef<HTMLParagraphElement>(null);const [expanded,setExpanded]=useState(false),[overflow,setOverflow]=useState(false);
 useEffect(()=>{const element=ref.current;if(!element)return;const measure=()=>{if(!expanded)setOverflow(element.scrollHeight>element.clientHeight+1);};measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();},[displayed,handle,expanded]);
 if(!displayed&&!override?.error)return null;
 return <div className={`relative text-comment leading-[1.4] ${className}`}><p ref={ref} className={`${expanded?'':'line-clamp-2'} whitespace-pre-wrap break-words`}><span className="font-semibold">{handle}</span> {displayed}</p>{overflow&&!expanded&&<button type="button" className="absolute bottom-0 right-0 bg-surface pl-1 text-text" aria-expanded={expanded} onClick={()=>setExpanded(true)}>more</button>}{override?.error&&<p role="alert">{override.error}</p>}</div>;
}
