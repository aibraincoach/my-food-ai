"use client";

import Script from "next/script";
import {useCallback,useState} from "react";
import {AuthErrorBanner} from "@/app/(auth)/_components/AuthPieces";

type CaptchaAPI={
  render:(container:HTMLElement,options:{sitekey:string;size:'invisible'})=>string;
  remove:(widget:string)=>void;
  reset:(widget:string)=>void;
  execute:(widget:string,options:{async:true})=>Promise<{response:string}>;
};
declare global{
  interface Window{
    hcaptcha?:CaptchaAPI;
    mfaHCaptchaReady?:()=>void;
    mfaHCaptchaLoaded?:boolean;
  }
}
const listeners=new Set<()=>void>();

export default function HCaptcha(){
  const sitekey=process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const [failed,setFailed]=useState(false);
  const container=useCallback((node:HTMLDivElement|null)=>{
    if(!sitekey||!node)return;
    const form=node.closest('form');
    if(!form)return;
    let widget:string|undefined,active=true,checking=false,verifiedSubmit=false;
    const render=()=>{
      if(widget===undefined&&window.hcaptcha){
        try{widget=window.hcaptcha.render(node,{sitekey,size:'invisible'});}
        catch{setFailed(true);}
      }
    };
    const submit=async(event:SubmitEvent)=>{
      if(verifiedSubmit)return;
      event.preventDefault();
      event.stopPropagation();
      if(checking)return;
      if(widget===undefined||!window.hcaptcha){setFailed(true);return;}
      checking=true;
      setFailed(false);
      try{
        window.hcaptcha.reset(widget);
        const {response}=await window.hcaptcha.execute(widget,{async:true});
        if(!response)throw Error('No CAPTCHA response');
        // A cached challenge can resolve before the browser finishes firing the
        // original submit event. requestSubmit needs a fresh task, not a retry.
        await new Promise<void>(resolve=>setTimeout(resolve,0));
        if(!active)return;
        // The SDK populates h-captcha-response. Only this verified event reaches
        // React's form action; validation and the original submitter are kept.
        verifiedSubmit=true;
        try{form.requestSubmit(event.submitter);}
        finally{verifiedSubmit=false;}
      }catch{if(active)setFailed(true);}
      finally{checking=false;}
    };
    form.addEventListener('submit',submit);
    window.mfaHCaptchaReady??=()=>{
      window.mfaHCaptchaLoaded=true;
      for(const listener of listeners)listener();
    };
    listeners.add(render);
    if(window.mfaHCaptchaLoaded)render();
    return()=>{
      active=false;
      form.removeEventListener('submit',submit);
      listeners.delete(render);
      if(widget!==undefined)window.hcaptcha?.remove(widget);
    };
  },[sitekey]);
  if(!sitekey)return null;
  return <>
    <div ref={container} className="h-captcha" data-sitekey={sitekey} data-size="invisible"/>
    <Script id="mfa-hcaptcha" src="https://js.hcaptcha.com/1/api.js?onload=mfaHCaptchaReady&render=explicit"
      strategy="afterInteractive" onError={()=>setFailed(true)}/>
    {failed?<AuthErrorBanner>The check could not be completed. Try again.</AuthErrorBanner>:null}
    <p className="text-label text-muted">This site is protected by hCaptcha and its <a href="https://www.hcaptcha.com/privacy" className="underline">Privacy Policy</a> and <a href="https://www.hcaptcha.com/terms" className="underline">Terms of Service</a> apply.</p>
  </>;
}
