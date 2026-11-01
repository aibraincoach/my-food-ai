'use client';
import {useEffect,useRef,useState} from 'react';
export default function PostCaption({handle,caption,className=''}:{handle:string;caption:string;className?:string}) {
 const ref=useRef<HTMLParagraphElement>(null);const [expanded,setExpanded]=useState(false),[overflow,setOverflow]=useState(false);
 useEffect(()=>{const element=ref.current;if(!element)return;const measure=()=>{if(!expanded)setOverflow(element.scrollHeight>element.clientHeight+1);};measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();},[caption,handle,expanded]);
 if(!caption)return null;
 return <div className={`text-comment leading-[1.4] ${className}`}><p ref={ref} className={`${expanded?'':'line-clamp-2'} whitespace-pre-wrap break-words`}><span className="font-semibold">{handle}</span> {caption}</p>{overflow&&!expanded&&<button type="button" className="text-text" aria-expanded={expanded} onClick={()=>setExpanded(true)}>more</button>}</div>;
}
