import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, action }: EmptyStateProps) {
  return (
    <div className="p-12 text-center">
      <p className="text-gray-600 font-medium">{title}</p>
      {description ? <p className="text-gray-500 text-sm mt-1">{description}</p> : null}
      {action ? action : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
