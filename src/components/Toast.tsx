import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  variant?: 'success' | 'info' | 'warn';
  duration?: number;
}

const variantStyles: Record<NonNullable<ToastProps['variant']>, string> = {
  success: 'bg-gradient-to-r from-accent-teal to-emerald-500 text-surface-900',
  info: 'bg-gradient-to-r from-surface-900/95 via-accent-lime to-accent-sky text-surface-900',
  warn: 'bg-gradient-to-r from-accent-orange to-orange-500 text-surface-900',
};

export function Toast({ message, variant = 'info', duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      aria-live="assertive"
      className={`fixed top-6 right-6 z-50 inline-flex w-max max-w-xs items-center gap-sm rounded-2xl px-5 py-3 text-base font-bold shadow-2xl ring-1 ring-white/40 transition-transform duration-200 animate-pulse ${variantStyles[variant]}`}
      role="status"
    >
      <span>{message}</span>
    </div>
  );
}
