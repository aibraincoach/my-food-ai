import localFont from 'next/font/local';

// Static instances of Google Fonts' OFL Manrope, bundled for offline builds.
export const font = localFont({
  src: [
    { path: '../../assets/fonts/Manrope-300.ttf', weight: '300', style: 'normal' },
    { path: '../../assets/fonts/Manrope-400.ttf', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/Manrope-500.ttf', weight: '500', style: 'normal' },
    { path: '../../assets/fonts/Manrope-600.ttf', weight: '600', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['sans-serif'],
});
