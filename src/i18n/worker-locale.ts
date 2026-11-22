import {isLocale, type Locale} from './locales';

export async function syncWorkerLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) throw new Error('Invalid locale.');
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
  const worker = navigator.serviceWorker.controller;
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {channel.port1.close(); reject(new Error('Offline language could not be saved.'));}, 5000);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close();
      if (event.data?.type === 'app-locale-saved' && event.data.locale === locale) resolve();
      else reject(new Error('Offline language could not be saved.'));
    };
    worker.postMessage({type: 'app-locale', locale}, [channel.port2]);
  });
}
