'use client';
import {usePostHandle} from '@/components/PostHandle';
import {useLocalDate,useLocalTime} from '@/components/LocalTime';
import PostMenu,{type PostMenuRow} from '@/components/PostMenu';
export default function PostDetailHeader({postId,caption,eatenAt,handle:providedHandle,gtin,rows,saved=false,status,readOnly=false}:{postId:string;caption:string;eatenAt:string;handle?:string;gtin?:string|null;rows?:PostMenuRow[];saved?:boolean;status?:string;readOnly?:boolean}) {
 const handle=usePostHandle(providedHandle);const date=useLocalDate(eatenAt);const time=useLocalTime(eatenAt);
 return <div className="flex h-[52px] items-center gap-[10px] px-inset">
  <span className="flex size-8 items-center justify-center rounded-circle bg-text text-avatar text-surface">{handle.slice(0,1).toUpperCase()}</span>
  <div className="min-w-0 flex-1"><p className="truncate text-handle">{handle}</p><p className="text-label text-muted">{date} · {time}</p></div>
  <PostMenu postId={postId} caption={caption} eatenAt={eatenAt} gtin={gtin} rows={[...(status==='ready'&&!readOnly?[{label:'Add photo',onSelect:()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:postId,notEaten:false}}))}]:[]),{label:'Log again',onSelect:()=>window.dispatchEvent(new CustomEvent('log-again',{detail:{postId}}))},{label:saved?'Unsave':'Save meal',onSelect:()=>window.dispatchEvent(new CustomEvent('save-meal',{detail:{postId}}))},...(rows??[])]}/>
 </div>;
}
