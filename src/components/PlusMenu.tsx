"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { tokens } from "@/lib/theme/tokens";

export type PostEntry = "camera" | "text" | "drink" | "coffee" | "saved";
const entries: { entry: PostEntry; label: string; icon: IconName; angle: number }[] = [
  { entry: "camera", label: "Camera", icon: "entry-camera", angle: 160 },
  { entry: "text", label: "Text", icon: "entry-text", angle: 125 },
  { entry: "drink", label: "Drink", icon: "entry-drink", angle: 90 },
  { entry: "coffee", label: "Coffee", icon: "entry-coffee", angle: 55 },
  { entry: "saved", label: "Saved", icon: "plus", angle: 20 },
];
export default function PlusMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [centre, setCentre] = useState({x: 0, y: 0});
  useLayoutEffect(() => {
    const position = () => { const box = document.getElementById("post-menu-toggle")?.getBoundingClientRect(); if(box) setCentre({x:box.left+box.width/2,y:box.top+box.height/2}); };
    position(); window.addEventListener("resize",position); window.addEventListener("scroll",position);
    return () => {window.removeEventListener("resize",position);window.removeEventListener("scroll",position);};
  }, [open]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(open));
    const key = (event: KeyboardEvent) => { if(event.key === "Escape") {onClose();document.getElementById("post-menu-toggle")?.focus();} };
    if(open) window.addEventListener("keydown",key);
    return () => {cancelAnimationFrame(frame);window.removeEventListener("keydown",key);};
  }, [open,onClose]);
  useEffect(() => { if(open) {const timer=setTimeout(()=>ref.current?.querySelector<HTMLButtonElement>("button[data-entry]")?.focus(),360);return()=>clearTimeout(timer);} },[open]);
  return <div ref={ref} id="post-menu" role="group" aria-label="New post" aria-hidden={!open} inert={!open} className="fixed inset-0 z-40" style={{pointerEvents:open?"auto":"none"}}>
    <button tabIndex={-1} aria-label="Close post menu" onClick={onClose} className="absolute inset-0 h-full w-full" style={{background:tokens.colors['scrim-light'],opacity:visible?1:0,transition:`opacity ${open?160:220}ms`}} />
    <button aria-label="Close post menu" onClick={onClose} className="fixed flex h-tap w-tap items-center justify-center rounded-circle bg-text text-surface" style={{left:centre.x-tokens.spacing.tap/2,top:centre.y-tokens.spacing.tap/2,opacity:visible?1:0,transition:"opacity 160ms"}}><Icon name="plus" style={{transform:"rotate(45deg)"}} /></button>
    {entries.map(({entry,label,icon,angle},index)=>{
      const radius=tokens.spacing['table-row']*5;
      const radians=angle*Math.PI/180;
      const size=tokens.spacing.tap+tokens.spacing.grid*2;
      const x=visible?Math.cos(radians)*radius:0;
      const y=visible?-Math.sin(radians)*radius:0;
      return <button key={entry} data-entry={entry} aria-label={label} onClick={()=>{onClose();window.dispatchEvent(new CustomEvent("open-entry",{detail:{entry}}));}}
        className="fixed flex flex-col items-center justify-center rounded-circle"
        style={{left:centre.x-size/2,top:centre.y-size/2,width:size,height:size,background:entry==="saved"?"transparent":tokens.colors.white,border:entry==="saved"?`${tokens.border.hairline}px dashed ${tokens.colors.ring}`:undefined,boxShadow:entry==="saved"?undefined:tokens.colors['shadow-entry'],color:entry==="saved"?tokens.colors.muted:tokens.colors.text,opacity:visible?1:0,transform:`translate(${x}px,${y}px) scale(${visible?1:0.7}) rotate(${visible?0:-60}deg)`,transition:`transform ${open?360:220}ms cubic-bezier(0.34,1.3,0.64,1), opacity ${open?160:220}ms`,transitionDelay:open?`${index*30}ms`:"0ms"}}>
        <span className="absolute bottom-full mb-2 whitespace-nowrap text-meta font-medium text-text" style={{opacity:visible?1:0,transition:"opacity 100ms",transitionDelay:open?`${260+index*30}ms`:"0ms"}}>{label}</span>
        <Icon name={icon} size={tokens.spacing['item-row']} />
      </button>;
    })}
  </div>;
}
