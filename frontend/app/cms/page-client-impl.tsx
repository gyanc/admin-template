'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-header';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { DataTable, Column, Action } from '@/components/shared/data-table';
import { FormDrawer, FormField } from '@/components/shared/form-drawer';
import { StatusBadge } from '@/components/shared/status-badge';
import { CmsPage, PaginatedResponse } from '@/lib/types';
import { useState, useCallback } from 'react';
import { cmsApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Download, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePagedResource } from '@/lib/hooks/use-paged-resource';
import { useEditForm } from '@/lib/hooks/use-edit-form';

const updateCmsSchema = z.object({
  title: z.string().min(1, 'Title is required').min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  isPublished: z.boolean(),
});

const createCmsSchema = z.object({
  title: z.string().min(1, 'Title is required').min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  isPublished: z.boolean().default(false),
});

type UpdateCmsFormData = z.infer<typeof updateCmsSchema>;
type CreateCmsFormData = z.infer<typeof createCmsSchema>;

interface CMSClientProps {
  initialData?: PaginatedResponse<CmsPage>;
  initialPage?: number;
  initialSearch?: string;
  initialStatusFilter?: string;
}

export default function CMSClient({
  initialData,
  initialPage = 1,
  initialSearch = '',
  initialStatusFilter = 'all',
}: CMSClientProps) {
  const normalizeCmsCallback = useCallback((page: any) => ({
    ...page,
    isPublished:
      page.isPublished ??
      ((page as any)?.status === 'PUBLISHED' || (page as any)?.status === 'published'),
  }), []);

  const {
    items: pages,
    loading,
    page,
    setPage,
    total,
    totalPages,
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
  } = usePagedResource<CmsPage>({
    initialData,
    initialPage,
    initialSearch,
    initialStatus: initialStatusFilter,
    fetcher: async ({ page, limit, search, status }) => {
      const response = await cmsApi.list({
        page,
        limit,
        search,
        status,
      });
      return response;
    },
    mapItem: normalizeCmsCallback,
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const editForm = useForm<UpdateCmsFormData>({
    resolver: zodResolver(updateCmsSchema),
  });

  const createForm = useForm<CreateCmsFormData>({
    resolver: zodResolver(createCmsSchema),
    defaultValues: {
      isPublished: false,
    },
  });

  const cmsMapToForm = useCallback((page: CmsPage | null) => ({
    title: page?.title || '',
    slug: page?.slug || '',
    isPublished: page?.isPublished ?? false,
  }), []);

  useEditForm<UpdateCmsFormData>(
    editingPage,
    editForm.reset,
    cmsMapToForm
  );

  const fetchPages = useCallback(async () => {
    try {
      await fetchPage();
    } catch (error) {
      console.error('Failed to fetch CMS pages:', error);
      toast.error('Failed to load CMS pages');
    }
  }, [fetchPage]);

  const handleEdit = async (pageId: string) => {
    try {
      setLoadingPage(true);
      setDrawerOpen(true);
      
      const pageData = await cmsApi.getById(pageId);
      const status = (pageData as any)?.status;
      const normalizedPage = {
        ...pageData,
        isPublished:
          pageData.isPublished ?? (status === 'PUBLISHED' || status === 'published'),
      };
      
      setEditingPage(normalizedPage);
    } catch (error: any) {
      console.error('Failed to load page:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load page';
      toast.error(message);
      setEditingPage(null);
      setDrawerOpen(false);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleUpdatePage = async (data: UpdateCmsFormData) => {
    if (!editingPage) return;

    try {
      await cmsApi.update(editingPage.id, {
        title: data.title,
        slug: data.slug,
        isPublished: data.isPublished,
      });
      toast.success('Page updated successfully');
      setDrawerOpen(false);
      fetchPages();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update page';
      toast.error(message);
    }
  };

  const handleCreatePage = async (data: CreateCmsFormData) => {
    try {
      await cmsApi.create(data);
      toast.success('Page created successfully');
      setCreateDrawerOpen(false);
      createForm.reset();
      fetchPages();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create page';
      toast.error(message);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      setDeleting(pageId);
      await cmsApi.delete(pageId);
      toast.success('Page deleted successfully');
      fetchPages();
      clearSelection();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete page';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one page');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} page(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map(pageId =>
        cmsApi.delete(pageId)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedIds.size} page(s) deleted successfully`);
      fetchPages();
      clearSelection();
    } catch (error: any) {
      toast.error('Failed to delete some pages');
    }
  };

  const columns: Column<CmsPage>[] = [
    {
      key: 'page',
      label: 'Page',
      render: (page) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="font-medium text-gray-900 block">
              {page.title}
            </span>
            <span className="text-sm text-gray-500">/{page.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (page) => (
        <StatusBadge
          label={page.isPublished ? 'Published' : 'Draft'}
          variant={page.isPublished ? 'success' : 'warning'}
        />
      ),
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (page) => (
        <span className="text-gray-600">
          {new Date(page.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: Action<CmsPage>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: (page) => handleEdit(page.id),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (page) => handleDelete(page.id),
      disabled: (page) => deleting === page.id,
      className: 'text-red-600',
    },
  ];

  const editFields: FormField<UpdateCmsFormData>[] = [
    {
      name: 'title',
      label: 'Page Title',
      type: 'text',
      placeholder: 'Enter page title',
      required: true,
    },
    {
      name: 'slug',
      label: 'URL Slug',
      type: 'text',
      placeholder: 'about-us',
      description: 'Only lowercase letters, numbers, and hyphens',
      required: true,
    },
    {
      name: 'isPublished',
      label: 'Published',
      type: 'switch',
      description: 'Make page visible on website',
    },
  ];

  const createFields: FormField<CreateCmsFormData>[] = [
    {
      name: 'title',
      label: 'Page Title',
      type: 'text',
      placeholder: 'Enter page title',
      required: true,
    },
    {
      name: 'slug',
      label: 'URL Slug',
      type: 'text',
      placeholder: 'about-us',
      description: 'Only lowercase letters, numbers, and hyphens',
      required: true,
    },
    {
      name: 'isPublished',
      label: 'Published',
      type: 'switch',
      description: 'Make page visible on website immediately',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="CMS Pages"
          description="Manage website content and pages"
          breadcrumbs={[{ label: 'CMS' }]}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => toast.success('Export functionality coming soon')}
                className="hidden sm:flex"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setCreateDrawerOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Page
              </Button>
            </>
          }
        />

        <ListToolbar
          searchPlaceholder="Search pages by title or slug..."
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
          }}
          statusOptions={[
            { value: 'all', label: 'All Status' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
          statusValue={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />

        <DataTable
          data={pages}
          columns={columns}
          loading={loading}
          emptyTitle="No pages found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating a new page'
          }
          onEmptyAction={() => setCreateDrawerOpen(true)}
          emptyActionLabel="Create Page"
          selectable
          selectedIds={selectedIds}
          onSelectItem={toggleSelect}
          onSelectAll={allSelected ? clearSelection : selectAll}
          allSelected={allSelected}
          getItemId={(page) => page.id}
          actions={actions}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={20}
          onPageChange={setPage}
          selectedCount={selectedIds.size}
          bulkActions={
            selectedIds.size > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-green-200 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">
                  {selectedIds.size} page(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
            ) : undefined
          }
        />

        {/* Edit Page Drawer */}
        <FormDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={editingPage?.title || 'Edit Page'}
          description={editingPage ? `/${editingPage.slug}` : 'No description'}
          icon={<FileText className="w-6 h-6" />}
          form={editForm}
          fields={editFields}
          onSubmit={handleUpdatePage}
          loading={loadingPage}
          mode="edit"
        />

        {/* Create Page Drawer */}
        <FormDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          title="Create New Page"
          description="Add a new page to the website"
          icon={<FileText className="w-6 h-6" />}
          form={createForm}
          fields={createFields}
          onSubmit={handleCreatePage}
          mode="create"
        />
      </div>
    </DashboardLayout>
  );
}
