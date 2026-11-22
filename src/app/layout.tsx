import LocaleReporter from '@/components/i18n/LocaleReporter';
import {getLocale} from 'next-intl/server';
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { font } from "@/lib/theme/font";
import { tokens } from "@/lib/theme/tokens";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PostOpenTransition from "@/components/PostOpenTransition";
import FeedCacheMutations from "@/components/FeedCacheMutations";
import DeletePostSheet from "@/components/DeletePostSheet";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Food AI",
  description: "Log meals with a photo and get nutrition numbers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "My Food AI" },
  icons: { apple: "/icons/icon-192.png" },
};

// viewport-fit=cover lets the page run under the notch and home indicator; env(safe-area-inset-*) keeps content clear of them.
export const viewport: Viewport = { themeColor: tokens.colors.surface, viewportFit: "cover", interactiveWidget: "resizes-content" };

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <Suspense fallback={null}><LocaleDocument>{children}</LocaleDocument></Suspense>;
}

async function LocaleDocument({children}: {children: React.ReactNode}) {
  const locale=await getLocale();
  // Slice 1 translates only the Language row. Enable document locale with slice 2.
  return (
    <html lang="en" className="h-full antialiased" data-build={process.env.NEXT_PUBLIC_BUILD}>
      <body className={`${font.className} ${font.variable} flex min-h-dvh flex-col`}>
        <Suspense fallback={null}><ServiceWorkerRegistration /></Suspense>
        <LocaleReporter locale={locale}/>
        <Suspense fallback={null}><DeletePostSheet /><PostOpenTransition /></Suspense>
        <FeedCacheMutations />
        {children}
      </body>
    </html>
  );
}
