import type { ButtonHTMLAttributes } from 'react';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'adult' | 'kid';
}

const classMap: Record<NonNullable<AppButtonProps['variant']>, string> = {
  adult:
    'inline-flex items-center justify-center rounded-full border border-white/20 bg-surface-700/40 px-md py-2 text-sm font-semibold text-text-primary transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky',
  kid: 'inline-flex items-center justify-center rounded-full bg-accent-lime px-md py-2 text-sm font-semibold text-surface-900 transition hover:bg-accent-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-rose',
};

export function AppButton({
  variant = 'adult',
  className = '',
  ...props
}: AppButtonProps) {
  return <button className={`${classMap[variant]} ${className}`.trim()} {...props} />;
}
