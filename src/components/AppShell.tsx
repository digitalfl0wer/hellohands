import type { PropsWithChildren, ReactNode } from 'react';

interface AppShellProps {
  header?: ReactNode;
  footer?: ReactNode;
  kidMode?: boolean;
}

/**
 * AppShell centralises safe-area padding, max-width layout, and background treatment.
 * Later screens can slot custom header/footer content while keeping a consistent frame.
 */
export function AppShell({
  header,
  footer,
  children,
  kidMode = false,
}: PropsWithChildren<AppShellProps>) {
  return (
    <div
      className={kidMode ? 'hh-bg-kid' : 'hh-bg-adult'}
      data-theme={kidMode ? 'kid' : 'adult'}
    >
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-16 pt-10 sm:px-8 lg:px-16">
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
