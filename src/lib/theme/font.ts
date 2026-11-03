import localFont from 'next/font/local';

// Static instances of Google Fonts' OFL Manrope, bundled for offline builds.
export const font = localFont({
  src: [
    { path: '../../assets/fonts/Manrope-300.woff2', weight: '300', style: 'normal' },
    { path: '../../assets/fonts/Manrope-400.woff2', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/Manrope-500.woff2', weight: '500', style: 'normal' },
    { path: '../../assets/fonts/Manrope-600.woff2', weight: '600', style: 'normal' },
  ],
  // Load only the faces actually used; preloading all four competes with the first meal photo.
  preload: false,
  variable: '--font-sans',
  display: 'swap',
  fallback: ['sans-serif'],
});
