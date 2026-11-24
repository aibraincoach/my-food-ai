"use client";
import {useTranslations} from 'next-intl';
import { useEffect, useState } from "react";
import { validGtin } from "@/lib/fdc/gtin";
import { useRouter } from "next/navigation";
import CorrectProductSheet from "./CorrectProductSheet";
import type { ResolvedProduct } from "@/lib/fdc/barcode-product";
export default function CorrectProductAction(){
 const t=useTranslations('postMenu');
 const router=useRouter();const [current,setCurrent]=useState<{product:ResolvedProduct;postId:string}|null>(null);const [error,setError]=useState("");
 useEffect(()=>{let live=true,sequence=0;const open=async(event:Event)=>{const d=(event as CustomEvent<unknown>).detail;if(!d||typeof d!=="object")return;const {gtin,postId}=d as {gtin?:unknown;postId?:unknown};if(typeof gtin!=="string"||!validGtin(gtin)||typeof postId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId))return;const mine=++sequence;setError("");try{const r=await fetch(`/api/fdc/barcode?code=${encodeURIComponent(gtin)}`);const b=await r.json();if(!r.ok)throw Error(b.error??t('productLoadFailed'));if(live&&mine===sequence)setCurrent({product:b.product,postId});}catch(e){if(live&&mine===sequence)setError(e instanceof Error?e.message:t('productLoadFailed'));}};window.addEventListener("correct-product",open);return()=>{live=false;window.removeEventListener("correct-product",open);};},[t]);
 return <>{error&&<div role="alert" className="fixed inset-x-inset bottom-28 z-50 rounded-card bg-text p-4 text-detail text-surface" onClick={()=>setError("")}>{error}</div>}{current&&<CorrectProductSheet key={current.postId} product={current.product} onClose={()=>setCurrent(null)} onSaved={()=>{const value=current;setCurrent(null);void(async()=>{try{const r=await fetch(`/api/posts/${value.postId}/items`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"correct_product",gtin:value.product.gtin})});const b=await r.json();if(!r.ok)throw Error(b.error??t('postCorrectFailed'));window.dispatchEvent(new CustomEvent("post-created",{detail:{id:value.postId}}));router.refresh();}catch(e){setError(e instanceof Error?e.message:t('postCorrectFailed'));}})();}}/>}</>;
}
