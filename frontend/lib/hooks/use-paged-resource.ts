'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PaginatedResponse } from '@/lib/types';

export interface PagedFetcherParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  [key: string]: any;
}

export interface UsePagedResourceOptions<T> {
  initialData?: PaginatedResponse<T>;
  initialPage?: number;
  initialSearch?: string;
  initialStatus?: string;
  pageSize?: number;
  fetcher: (params: PagedFetcherParams) => Promise<PaginatedResponse<T>>;
  mapItem?: (item: any) => T;
  extraParams?: Record<string, any>;
}

export function usePagedResource<T>(options: UsePagedResourceOptions<T>) {
  const {
    initialData,
    initialPage = 1,
    initialSearch = '',
    initialStatus = 'all',
    pageSize = 20,
    fetcher,
    mapItem,
    extraParams = {},
  } = options;

  const [items, setItems] = useState<T[]>(initialData?.data || []);
  const [totalPages, setTotalPages] = useState<number>(initialData?.meta?.totalPages || 1);
  const [total, setTotal] = useState<number>(initialData?.meta?.total || 0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Memoize mapItem to prevent infinite loops
  const memoizedMapItem = useCallback((item: any) => mapItem ? mapItem(item) : item, [mapItem]);

  // Memoize fetchPage function to prevent dependency loop
  // NOTE: We don't include 'fetcher' in dependencies to avoid infinite loops.
  // The fetcher is called immediately when needed, so it will always be current.
  const fetchPage = useCallback(async (override?: Partial<PagedFetcherParams>) => {
    try {
      setLoading(true);
      const response = await fetcher({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        ...extraParams,
        ...override,
      });
      const mapped = response.data?.map((i: any) => memoizedMapItem(i)) || [];
      setItems(mapped);
      setTotalPages(response.meta?.totalPages || 1);
      setTotal(response.meta?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, statusFilter, extraParams, memoizedMapItem]);

  // Sync when initialData changes (Suspense)
  useEffect(() => {
    if (initialData) {
      const mapped = initialData.data?.map((i: any) => memoizedMapItem(i)) || [];
      setItems(mapped);
      setTotalPages(initialData.meta?.totalPages || 1);
      setTotal(initialData.meta?.total || 0);
    }
  }, [initialData, memoizedMapItem]);

  // Only refetch when filters change (skip when initialData matches)
  useEffect(() => {
    if (initialData &&
        page === initialPage &&
        searchTerm === initialSearch &&
        statusFilter === initialStatus) {
      return;
    }
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((i: any) => i.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const allSelected = useMemo(() => items.length > 0 && selectedIds.size === items.length, [items, selectedIds]);

  return {
    items,
    setItems,
    total,
    totalPages,
    loading,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    fetchPage,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    allSelected,
  };
}
