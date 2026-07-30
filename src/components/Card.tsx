import type { CSSProperties, ReactNode } from 'react';

export function Card({ children, compact, style, className }: { children: ReactNode; compact?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <div className={`card${compact ? ' card--compact' : ''}${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  );
}
