import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  variant?: 'success' | 'info' | 'warn';
  duration?: number;
}

const variantStyles: Record<NonNullable<ToastProps['variant']>, string> = {
  success: 'bg-accent-teal/40 text-accent-lime',
  info: 'bg-accent-sky/40 text-text-primary',
  warn: 'bg-accent-orange/40 text-surface-900',
};

export function Toast({ message, variant = 'info', duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      aria-live="assertive"
      className={`fixed right-4 top-4 inline-flex items-center gap-sm rounded-full border border-white/15 px-md py-1.5 text-sm shadow-lg backdrop-blur transition ${variantStyles[variant]}`}
    >
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
}
