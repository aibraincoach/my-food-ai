import {getLocale,getMessages,getTimeZone} from 'next-intl/server';
import StrictIntlProvider from '@/components/i18n/StrictIntlProvider';

export default async function AuthLayout({children}:{children:React.ReactNode}) {
 const [locale,messages,timeZone]=await Promise.all([getLocale(),getMessages(),getTimeZone()]);
 return <StrictIntlProvider locale={locale} timeZone={timeZone} messages={{auth:messages.auth,card:messages.card,errors:messages.errors}}>{children}</StrictIntlProvider>;
}
