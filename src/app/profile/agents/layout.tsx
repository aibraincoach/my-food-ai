import {getLocale,getMessages,getTimeZone} from 'next-intl/server';
import StrictIntlProvider from '@/components/i18n/StrictIntlProvider';
import type {ReactNode} from 'react';
export default async function AgentLayout({children}:{children:ReactNode}){
 const [locale,messages,timeZone]=await Promise.all([getLocale(),getMessages(),getTimeZone()]);
 return <StrictIntlProvider locale={locale} timeZone={timeZone} messages={{postMenu:messages.postMenu}}><div className="desktop:flex desktop:min-h-dvh desktop:items-center desktop:justify-center desktop:bg-scrim-32 desktop:p-6 desktop:[&>main]:my-0 desktop:[&>main]:max-h-[calc(100dvh-48px)] desktop:[&>main]:min-h-0 desktop:[&>main]:w-[480px] desktop:[&>main]:overflow-y-auto desktop:[&>main]:rounded-[10px]">{children}</div></StrictIntlProvider>;
}
