"use client";
import {useTranslations} from 'next-intl';
import {useCameraMode,writeCameraMode} from '@/lib/media/camera-mode';
export default function CameraModeSwitch() {
 const t=useTranslations('capture');
 const mode=useCameraMode();
 return <section className="border-b border-line px-screen-x py-4">
  <div className="flex items-center justify-between gap-3"><span className="text-body">{t('phoneCameraApp')}</span><button type="button" role="switch" aria-label={t('phoneCameraApp')} aria-checked={mode==='phone'} onClick={()=>writeCameraMode(mode==='phone'?'app':'phone')} className="min-h-tap min-w-tap rounded-pill border border-line px-3 text-detail">{mode==='phone'?t('on'):t('off')}</button></div>
  <p className="text-[13px] text-muted">{t('appCameraDescription')}</p>
  <p className="text-[13px] text-muted">{t('phoneCameraDescription')}</p>
 </section>;
}
