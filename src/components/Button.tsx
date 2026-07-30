import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface CommonProps {
  children: ReactNode;
  primary?: boolean;
  auto?: boolean;
  className?: string;
}

export function Button({
  to,
  state,
  onClick,
  children,
  primary,
  auto,
  className,
  ...rest
}: CommonProps & { to?: string; state?: unknown; onClick?: () => void } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'onClick'>) {
  const cls = `btn${primary ? ' btn--primary' : ''}${auto ? ' btn--auto' : ''}${className ? ` ${className}` : ''}`;
  if (to) {
    return (
      <Link to={to} state={state} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
