"use client";
import {NextIntlClientProvider} from 'next-intl';
import {onError, getMessageFallback} from '@/i18n/strict';
import type {Locale} from '@/i18n/locales';
import type messages from '../../../messages/en.json';

export default function StrictIntlProvider({children, locale, timeZone, messages: translations}: {
  children: React.ReactNode; locale: Locale; timeZone: string; messages: Partial<typeof messages>;
}) {
  return <NextIntlClientProvider locale={locale} timeZone={timeZone} messages={translations} onError={onError} getMessageFallback={getMessageFallback}>
    {children}
  </NextIntlClientProvider>;
}
