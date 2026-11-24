import {pickCaptureMessages} from '@/i18n/capture-scope';
import type {ReactNode} from 'react';
import {getLocale,getMessages,getTimeZone} from 'next-intl/server';
import StrictIntlProvider from './StrictIntlProvider';

// Capture, voice and pending uploads are used on tabs and post detail.
// Auth/Welcome do not receive this namespace.
export default async function CaptureMessages({children}:{children:ReactNode}) {
 const [locale,messages,timeZone]=await Promise.all([getLocale(),getMessages(),getTimeZone()]);
 return <StrictIntlProvider locale={locale} timeZone={timeZone} messages={pickCaptureMessages(messages)}>{children}</StrictIntlProvider>;
}
