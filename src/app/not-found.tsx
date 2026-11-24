import {useTranslations} from 'next-intl';
import Link from "next/link";
export default function NotFound() {
 const t=useTranslations('errors');
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
    <header className="flex h-top-safe items-center px-inset"><h1 className="text-title">My Food AI</h1></header>
    <div className="px-screen-x py-sheet-top"><p className="text-detail text-muted">{t('notFound')}</p>
      <Link href="/" className="mt-sheet-top inline-flex min-h-tap items-center rounded-full bg-text px-inset text-surface">{t('backFeed')}</Link>
    </div>
  </main>;
}
