import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'neutral';
}

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium', styles[variant])}>
      {label}
    </span>
  );
}
