import type { PropsWithChildren, ReactNode } from 'react';

interface AppShellProps {
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * AppShell centralises safe-area padding, max-width layout, and background treatment.
 * Later screens can slot custom header/footer content while keeping a consistent frame.
 */
export function AppShell({ header, footer, children }: PropsWithChildren<AppShellProps>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 text-text-primary">
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-12 pt-6 sm:px-8 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,var(--surface-700)_0%,transparent_60%)] opacity-70" />
        {header && (
          <header className="py-sm" role="banner">
            {header}
          </header>
        )}
        <main className="flex flex-1 flex-col gap-lg" role="main">
          {children}
        </main>
        {footer && (
          <footer className="py-sm" role="contentinfo">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
