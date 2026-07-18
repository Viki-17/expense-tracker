import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const baseField =
  'w-full px-4 py-3 bg-surface-2 border border-separator/60 rounded-xl text-sm text-label placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-ring/30 transition-all';

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${baseField} ${className}`} />;
}

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select {...rest} className={`${baseField} ${className}`}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${baseField} ${className}`} />;
}

export function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-semibold text-secondary uppercase tracking-wide mb-2 ${className}`}>{children}</label>;
}