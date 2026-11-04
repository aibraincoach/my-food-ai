"use client";
import {useCameraMode,writeCameraMode} from '@/lib/media/camera-mode';
export default function CameraModeSwitch() {
 const mode=useCameraMode();
 return <section className="border-b border-line px-screen-x py-4">
  <div className="flex items-center justify-between gap-3"><span className="text-body">Use the phone&apos;s camera app</span><button type="button" role="switch" aria-label="Use the phone's camera app" aria-checked={mode==='phone'} onClick={()=>writeCameraMode(mode==='phone'?'app':'phone')} className="min-h-tap min-w-tap rounded-pill border border-line px-3 text-detail">{mode==='phone'?'On':'Off'}</button></div>
  <p className="text-[13px] text-muted">Off: My Food AI&apos;s own camera takes the photo and sends it only to the app. Save photo, under the preview, opens the share sheet where supported, or downloads the photo.</p>
  <p className="text-[13px] text-muted">On: the phone&apos;s camera app takes the photo and hands it to My Food AI. Whether the phone keeps a copy is up to the phone. This choice is kept on this device.</p>
 </section>;
}
