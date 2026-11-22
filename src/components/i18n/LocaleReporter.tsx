"use client";
import {useEffect} from 'react';
import type {Locale} from '@/i18n/locales';

export default function LocaleReporter({locale}: {locale: Locale}) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // A pre-deployment controller does not know this message yet. Report on
    // every controller change as well; do not delay document rendering for it.
    const report = () => navigator.serviceWorker.controller?.postMessage({type: 'app-locale', locale});
    report();
    navigator.serviceWorker.addEventListener('controllerchange', report);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', report);
  }, [locale]);
  return null;
}
