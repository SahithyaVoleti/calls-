import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  isOnline,
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-28 h-28 text-2xl font-bold',
  };

  const indicatorSizes = {
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3 h-3 ring-2',
    lg: 'w-4 h-4 ring-2',
    xl: 'w-5 h-5 ring-2.5',
    '2xl': 'w-6 h-6 ring-3',
  };

  // Generate initials (e.g. "Together Friend" -> "TF")
  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Deterministic gradient based on string name
  const getGradient = (str: string) => {
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hues = [
      'from-violet-600 to-indigo-600',
      'from-indigo-600 to-sky-600',
      'from-fuchsia-600 to-violet-600',
      'from-purple-600 to-pink-600',
    ];
    return hues[hash % hues.length];
  };

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={twMerge(
          clsx(
            'rounded-full overflow-hidden flex items-center justify-center select-none shadow-md border border-white/10',
            sizes[size],
            src && !imageError ? 'bg-navy-900' : `bg-gradient-to-tr ${getGradient(name)} text-white`,
            className
          )
        )}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={twMerge(
            clsx(
              'absolute bottom-0 right-0 rounded-full ring-navy-950',
              isOnline ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm' : 'bg-slate-500',
              indicatorSizes[size]
            )
          )}
        />
      )}
    </div>
  );
};
