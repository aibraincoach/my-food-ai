"use client";
import {Suspense} from 'react';
import CorrectProductAction from '@/components/CorrectProductAction';
import NavigationControls from '@/components/NavigationControls';
import PostCreatedListeners from '@/components/PostCreatedListeners';
import PostReadinessListener from '@/components/PostReadinessListener';
import QueueTicker from '@/components/QueueTicker';
export default function TabsLayout({children}:{children:React.ReactNode}) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-1 flex-col bg-surface pb-[calc(100px+env(safe-area-inset-bottom))]">
    <CorrectProductAction/><QueueTicker/><PostCreatedListeners/><PostReadinessListener/>
    <Suspense fallback={<p className="p-screen-x text-detail text-muted">Loading…</p>}>{children}</Suspense>
    <NavigationControls/>
  </div>;
}
