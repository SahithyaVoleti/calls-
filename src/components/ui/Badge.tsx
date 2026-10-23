import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'online' | 'offline' | 'calling' | 'incall' | 'neutral' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
}) => {
  const variants = {
    online: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    offline: 'bg-slate-800 text-slate-400 border-slate-700',
    calling: 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse',
    incall: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    neutral: 'bg-navy-800 text-slate-300 border-slate-700/60',
    warning: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border tracking-wide',
          variants[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
};
