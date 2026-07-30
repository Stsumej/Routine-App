import type { ReactNode } from 'react';

export function Badge({ children, onBg }: { children: ReactNode; onBg?: boolean }) {
  return <span className={`badge${onBg ? ' badge--on-bg' : ''}`}>{children}</span>;
}
