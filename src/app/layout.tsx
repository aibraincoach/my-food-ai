import type { Metadata, Viewport } from "next";
import { font } from "@/lib/theme/font";
import { tokens } from "@/lib/theme/tokens";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Food AI",
  description: "Log meals with a photo and get nutrition numbers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "My Food AI" },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = { themeColor: tokens.colors.surface };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${font.className} ${font.variable} flex min-h-dvh flex-col`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
