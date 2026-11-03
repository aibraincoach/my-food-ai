"use client";
import {useLayoutEffect,useRef} from 'react';
/** Render the actual frozen frame without waiting for JPEG encoding. */
export default function CameraPreview({frame}:{frame:HTMLCanvasElement}) {
 const preview=useRef<HTMLCanvasElement>(null);
 useLayoutEffect(()=>{
  const canvas=preview.current;if(!canvas)return;
  canvas.width=Math.min(440,frame.width);
  canvas.height=Math.round(canvas.width*frame.height/frame.width);
  const context=canvas.getContext('2d');if(!context)return;
  context.drawImage(frame,0,0,canvas.width,canvas.height);
  canvas.setAttribute('data-camera-preview-ready','');
 },[frame]);
 return <div className="pt-3"><div className="relative mx-auto h-[276px] w-[220px] overflow-hidden rounded-card"><canvas ref={preview} role="img" aria-label="Meal photo being prepared" className="size-full object-cover"/></div></div>;
}
