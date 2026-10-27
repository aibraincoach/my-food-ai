import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'camera';
};

const variants = {
  primary: 'bg-text text-surface',
  secondary: 'bg-white text-text border border-line',
  camera: 'bg-surface text-text',
};

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={`h-field-h w-full rounded-field text-body font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`} {...props} />;
}
