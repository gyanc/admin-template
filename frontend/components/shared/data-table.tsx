'use client';

import { ReactNode } from 'react';
import { Loader2, CheckSquare, Square, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from './empty-state';
import { Pagination } from './pagination';

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface Action<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  disabled?: (item: T) => boolean;
  className?: string;
  hidden?: (item: T) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  
  // Selection
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectItem?: (id: string) => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  getItemId: (item: T) => string;
  
  // Actions
  actions?: Action<T>[];
  actionsLabel?: string;
  
  // Pagination
  page?: number;
  totalPages?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  
  // Bulk actions
  bulkActions?: ReactNode;
  selectedCount?: number;
  
  // Custom styling
  className?: string;
  rowClassName?: (item: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyTitle = 'No data found',
  emptyDescription = 'Get started by adding a new item',
  onEmptyAction,
  emptyActionLabel = 'Add Item',
  selectable = false,
  selectedIds = new Set(),
  onSelectItem,
  onSelectAll,
  allSelected = false,
  getItemId,
  actions = [],
  actionsLabel = 'Actions',
  page,
  totalPages,
  total,
  pageSize = 20,
  onPageChange,
  bulkActions,
  selectedCount = 0,
  className = '',
  rowClassName,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={onEmptyAction ? emptyActionLabel : undefined}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bulkActions && selectedCount > 0 && bulkActions}
      
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {selectable && (
                  <th className="px-6 py-3 text-left" style={{ width: '60px' }}>
                    <button 
                      onClick={onSelectAll}
                      className="flex items-center"
                      type="button"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-${column.align || 'left'} text-xs font-semibold text-gray-700 uppercase tracking-wider ${column.className || ''}`}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.label}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ width: '100px' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((item) => {
                const itemId = getItemId(item);
                const isSelected = selectedIds.has(itemId);
                const rowClass = rowClassName ? rowClassName(item) : '';
                
                return (
                  <tr
                    key={itemId}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''} ${rowClass}`}
                  >
                    {selectable && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onSelectItem?.(itemId)}
                          className="flex items-center"
                          type="button"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 text-${column.align || 'left'} ${column.className || ''}`}
                      >
                        {column.render(item)}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-48" align="end">
                            <DropdownMenuLabel>{actionsLabel}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {actions.map((action, idx) => {
                              const isHidden = action.hidden?.(item);
                              const isDisabled = action.disabled?.(item);
                              
                              if (isHidden) return null;
                              
                              return (
                                <DropdownMenuItem
                                  key={idx}
                                  onClick={() => action.onClick(item)}
                                  disabled={isDisabled}
                                  className={action.className || ''}
                                >
                                  {action.icon && <span className="mr-2">{action.icon}</span>}
                                  {action.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {page !== undefined && totalPages !== undefined && total !== undefined && onPageChange && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
}
