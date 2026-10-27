'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  suffix?: ReactNode;
  variant?: 'default' | 'camera';
};

export function Field({ label, suffix, variant = 'default', className = '', id, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return <div className={`flex flex-col gap-grid ${className}`}>
    {label && <label htmlFor={inputId} className={variant === 'camera' ? 'text-meta text-camera-muted' : 'text-meta text-muted'}>{label}</label>}
    <div className={`flex h-field-h items-center gap-grid rounded-field px-field-x ${variant === 'camera' ? 'bg-camera-field text-surface' : 'border border-line bg-white text-text'}`}>
      <input id={inputId} className={`min-w-0 w-full bg-transparent text-body outline-none disabled:opacity-50 ${variant === 'camera' ? 'placeholder:text-camera-muted' : 'placeholder:text-muted'}`} {...props} />
      {suffix && <span className="text-body text-muted">{suffix}</span>}
    </div>
  </div>;
}
