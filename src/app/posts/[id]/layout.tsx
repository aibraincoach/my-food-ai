import CaptureMessages from '@/components/i18n/CaptureMessages';
import type {ReactNode} from 'react';
export default function PostLayout({children}:{children:ReactNode}) {
 return <CaptureMessages>{children}</CaptureMessages>;
}
