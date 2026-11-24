import {getTranslations} from 'next-intl/server';
import CaptureMessages from '@/components/i18n/CaptureMessages';
import Sidebar from '@/components/Sidebar';
import {Suspense} from 'react';
import NavigationControls from '@/components/NavigationControls';
import PostCreatedListeners from '@/components/PostCreatedListeners';
import PostReadinessListener from '@/components/PostReadinessListener';
import QueueTicker from '@/components/QueueTicker';
export default async function TabsLayout({children}:{children:React.ReactNode}) {
  const t=await getTranslations('feed');
  return <CaptureMessages><div className="mx-auto flex min-h-dvh w-full max-w-phone flex-1 flex-col bg-surface pb-[calc(100px+var(--mfa-chip-space,0px)+env(safe-area-inset-bottom))] desktop:ml-[240px] desktop:mr-0 desktop:w-[calc(100%-240px)] desktop:max-w-none desktop:pb-6">
    <Sidebar/><NavigationControls/>
    <Suspense fallback={null}><QueueTicker/><PostCreatedListeners/><PostReadinessListener/></Suspense>
    <Suspense fallback={<p className="p-screen-x text-detail text-muted">{t('loadingPage')}</p>}>{children}</Suspense>
  </div></CaptureMessages>;
}
