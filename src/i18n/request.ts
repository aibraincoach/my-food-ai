import {validZone} from '@/lib/posts/days';
import {cookies, headers} from 'next/headers';
import {getRequestConfig} from 'next-intl/server';
import {isLocale, resolveLocale} from './locales';
import {onError, getMessageFallback} from './strict';

export default getRequestConfig(async () => {
  const requestHeaders = await headers();
  // Public shell hint from the shell-only middleware branch. It has no
  // authority over authentication or data, only this anonymous document's lang.
  const shellLocale = requestHeaders.get('x-mfa-shell-locale');
  const locale = isLocale(shellLocale) ? shellLocale : resolveLocale((await cookies()).get('lang')?.value, requestHeaders.get('accept-language'));
  return {
    locale,
    // Same validated person-zone cookie used by the existing food/Today readers.
    // With no known zone it is UTC; date call sites still use the explicit-zone helper.
    timeZone: validZone((await cookies()).get('time-zone')?.value),
    messages: (await import(`../../messages/${locale}.json`)).default,
    onError,
    getMessageFallback,
  };
});
