import LocaleReporter from '@/components/i18n/LocaleReporter';
import {getLocale,getMessages,getTimeZone,getTranslations} from 'next-intl/server';
import StrictIntlProvider from '@/components/i18n/StrictIntlProvider';
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { font } from "@/lib/theme/font";
import { tokens } from "@/lib/theme/tokens";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PostOpenTransition from "@/components/PostOpenTransition";
import FeedCacheMutations from "@/components/FeedCacheMutations";
import DeletePostSheet from "@/components/DeletePostSheet";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
 const t=await getTranslations('metadata');
 return {
  title: "My Food AI",
  description: t('description'),
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "My Food AI" },
  icons: { apple: "/icons/icon-192.png" },
 };
}

// viewport-fit=cover lets the page run under the notch and home indicator; env(safe-area-inset-*) keeps content clear of them.
export const viewport: Viewport = { themeColor: tokens.colors.surface, viewportFit: "cover", interactiveWidget: "resizes-content" };

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <Suspense fallback={null}><LocaleDocument>{children}</LocaleDocument></Suspense>;
}

async function LocaleDocument({children}: {children: React.ReactNode}) {
  const [locale,messages,timeZone]=await Promise.all([getLocale(),getMessages(),getTimeZone()]);
  return (
    <html lang={locale} className="h-full antialiased" data-build={process.env.NEXT_PUBLIC_BUILD}>
      <body className={`${font.className} ${font.variable} flex min-h-dvh flex-col`}>
        <Suspense fallback={null}><ServiceWorkerRegistration /></Suspense>
        <LocaleReporter locale={locale}/>
        <Suspense fallback={null}><DeletePostSheet /><PostOpenTransition /></Suspense>
        <FeedCacheMutations />
        <StrictIntlProvider locale={locale} timeZone={timeZone} messages={{navigation:messages.navigation,errors:messages.errors,card:messages.card}}>{children}</StrictIntlProvider>
      </body>
    </html>
  );
}
