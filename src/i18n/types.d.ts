import messages from '../../messages/en.json';
import type {Locale as AppLocale} from './locales';
declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
