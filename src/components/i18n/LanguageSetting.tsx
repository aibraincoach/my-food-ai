"use client";
import {useState, useTransition} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {syncWorkerLocale} from '@/i18n/worker-locale';
import {saveLocale} from '@/i18n/actions';

export default function LanguageSetting() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return <section className="border-b border-line px-screen-x py-4">
    <label className="flex min-h-tap items-center justify-between gap-3">
      <span className="text-body">{t('label')}</span>
      <select aria-label={t('label')} value={locale} disabled={pending} className="min-h-tap rounded-pill border border-line bg-surface px-3 text-detail" onChange={event => {
        const choice = event.target.value;
        setFailed(false);
        startTransition(async () => {
          try {
            if (await saveLocale(choice)) {
              await syncWorkerLocale(choice as typeof locale);
              router.refresh();
            } else setFailed(true);
          } catch {setFailed(true);}
        });
      }}>
        <option value="en">{t('english')}</option>
        <option value="ja">{t('japanese')}</option>
      </select>
    </label>
    <p className="text-[13px] text-muted">{t('hint')}</p>
    {pending ? <p role="status" className="text-detail">{t('saving')}</p> : null}
    {failed ? <p role="alert" className="text-detail">{t('error')}</p> : null}
  </section>;
}
