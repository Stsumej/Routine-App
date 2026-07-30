import type { ReactNode } from 'react';
import { OfflineBanner } from './OfflineBanner';
import { TabBar } from './TabBar';

export function ScreenShell({ children, tabBar = true, flush = false }: { children: ReactNode; tabBar?: boolean; flush?: boolean }) {
  return (
    <div className="app-shell">
      <OfflineBanner />
      <div className={`screen-content${flush ? ' screen-content--flush' : ''}`}>{children}</div>
      {tabBar && <TabBar />}
    </div>
  );
}
