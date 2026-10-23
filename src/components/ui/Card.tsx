import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  ...props
}) => {
  const variants = {
    glass: 'glass-card rounded-2xl shadow-xl shadow-black/20',
    solid: 'bg-navy-900 border border-slate-800/80 rounded-2xl shadow-xl',
    bordered: 'bg-navy-900/60 border border-violet-500/20 rounded-2xl',
  };

  return (
    <div className={twMerge(clsx(variants[variant], 'p-5 sm:p-6 transition-all', className))} {...props}>
      {children}
    </div>
  );
};
