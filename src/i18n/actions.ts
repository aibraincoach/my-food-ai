"use server";
import {cookies} from 'next/headers';
import {isLocale} from './locales';

export async function saveLocale(value: string): Promise<boolean> {
  if (!isLocale(value)) return false;
  try {
    // Deployment configuration, never a client-supplied forwarded header.
    const secure = process.env.APP_URL ? new URL(process.env.APP_URL).protocol === 'https:' : process.env.NODE_ENV === 'production';
    (await cookies()).set('lang', value, {path: '/', maxAge: 31536000, sameSite: 'lax', httpOnly: true, secure});
    return true;
  } catch {
    // A failed write is visible; it never changes the client locale optimistically.
    return false;
  }
}
