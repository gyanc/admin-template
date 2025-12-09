'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-header';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { DataTable, Column, Action } from '@/components/shared/data-table';
import { FormDrawer, FormField } from '@/components/shared/form-drawer';
import { StatusBadge } from '@/components/shared/status-badge';
import { Faq, PaginatedResponse } from '@/lib/types';
import { useState, useCallback } from 'react';
import { faqApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Download, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePagedResource } from '@/lib/hooks/use-paged-resource';
import { useEditForm } from '@/lib/hooks/use-edit-form';

const updateFaqSchema = z.object({
  question: z.string().min(1, 'Question is required').min(5, 'Question must be at least 5 characters'),
  answer: z.string().min(1, 'Answer is required').min(10, 'Answer must be at least 10 characters'),
  isActive: z.boolean(),
  priority: z.number().min(0).max(100),
});

const createFaqSchema = z.object({
  question: z.string().min(1, 'Question is required').min(5, 'Question must be at least 5 characters'),
  answer: z.string().min(1, 'Answer is required').min(10, 'Answer must be at least 10 characters'),
  isActive: z.boolean().default(true),
  priority: z.number().min(0).max(100).default(0),
});

type UpdateFaqFormData = z.infer<typeof updateFaqSchema>;
type CreateFaqFormData = z.infer<typeof createFaqSchema>;

interface FAQClientProps {
  initialData?: PaginatedResponse<Faq>;
  initialPage?: number;
  initialSearch?: string;
  initialStatusFilter?: string;
}

export default function FAQClient({
  initialData,
  initialPage = 1,
  initialSearch = '',
  initialStatusFilter = 'all',
}: FAQClientProps) {
  const normalizeFaqCallback = useCallback((faq: any) => ({
    ...faq,
    isActive: faq.status === 'PUBLISHED' || faq.status === 'published' || faq.isActive !== false,
  }), []);

  const {
    items: faqs,
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
  } = usePagedResource<Faq>({
    initialData,
    initialPage,
    initialSearch,
    initialStatus: initialStatusFilter,
    fetcher: async ({ page, limit, search, status }) => {
      const response = await faqApi.list({
        page,
        limit,
        search,
        status,
      });
      return response;
    },
    mapItem: normalizeFaqCallback,
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [loadingFaq, setLoadingFaq] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const editForm = useForm<UpdateFaqFormData>({
    resolver: zodResolver(updateFaqSchema),
  });

  const createForm = useForm<CreateFaqFormData>({
    resolver: zodResolver(createFaqSchema),
    defaultValues: {
      isActive: true,
      priority: 0,
    },
  });

  const faqMapToForm = useCallback((faq: Faq | null) => ({
    question: faq?.question || '',
    answer: faq?.answer || '',
    isActive: faq?.isActive ?? true,
    priority: faq?.priority || 0,
  }), []);

  useEditForm<UpdateFaqFormData>(
    editingFaq,
    editForm.reset,
    faqMapToForm
  );

  const fetchFaqs = useCallback(async () => {
    try {
      await fetchPage();
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      toast.error('Failed to load FAQs');
    }
  }, [fetchPage]);

  const handleEdit = async (faqId: string) => {
    try {
      setLoadingFaq(true);
      setDrawerOpen(true);
      
      const faqData = await faqApi.getById(faqId);
      const status = (faqData as any)?.status;
      const normalizedFaq = {
        ...faqData,
        isActive:
          faqData.isActive !== false ||
          status === 'PUBLISHED' ||
          status === 'published',
      };
      
      setEditingFaq(normalizedFaq);
    } catch (error: any) {
      console.error('Failed to load FAQ:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load FAQ';
      toast.error(message);
      setEditingFaq(null);
      setDrawerOpen(false);
    } finally {
      setLoadingFaq(false);
    }
  };

  const handleUpdateFaq = async (data: UpdateFaqFormData) => {
    if (!editingFaq) return;

    try {
      await faqApi.update(editingFaq.id, data);
      toast.success('FAQ updated successfully');
      setDrawerOpen(false);
      fetchFaqs();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update FAQ';
      toast.error(message);
    }
  };

  const handleCreateFaq = async (data: CreateFaqFormData) => {
    try {
      await faqApi.create(data);
      toast.success('FAQ created successfully');
      setCreateDrawerOpen(false);
      createForm.reset();
      fetchFaqs();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create FAQ';
      toast.error(message);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      setDeleting(faqId);
      await faqApi.delete(faqId);
      toast.success('FAQ deleted successfully');
      fetchFaqs();
      clearSelection();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete FAQ';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one FAQ');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} FAQ(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map(faqId =>
        faqApi.delete(faqId)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedIds.size} FAQ(s) deleted successfully`);
      fetchFaqs();
      clearSelection();
    } catch (error: any) {
      toast.error('Failed to delete some FAQs');
    }
  };

  const columns: Column<Faq>[] = [
    {
      key: 'faq',
      label: 'Question',
      render: (faq) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-medium text-gray-900 block">
              {faq.question}
            </span>
            <span className="text-sm text-gray-500 line-clamp-1">
              {faq.answer}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (faq) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {faq.priority || 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (faq) => (
        <StatusBadge
          label={faq.isActive ? 'Active' : 'Inactive'}
          variant={faq.isActive ? 'success' : 'danger'}
        />
      ),
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (faq) => (
        <span className="text-gray-600">
          {new Date(faq.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: Action<Faq>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: (faq) => handleEdit(faq.id),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (faq) => handleDelete(faq.id),
      disabled: (faq) => deleting === faq.id,
      className: 'text-red-600',
    },
  ];

  const editFields: FormField<UpdateFaqFormData>[] = [
    {
      name: 'question',
      label: 'Question',
      type: 'textarea',
      placeholder: 'Enter the question',
      required: true,
      rows: 3,
    },
    {
      name: 'answer',
      label: 'Answer',
      type: 'textarea',
      placeholder: 'Enter the answer',
      required: true,
      rows: 5,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'number',
      placeholder: '0',
      description: 'Higher priority FAQs appear first (0-100)',
      min: 0,
      max: 100,
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'switch',
      description: 'Show FAQ on website',
    },
  ];

  const createFields: FormField<CreateFaqFormData>[] = [
    {
      name: 'question',
      label: 'Question',
      type: 'textarea',
      placeholder: 'Enter the question',
      required: true,
      rows: 3,
    },
    {
      name: 'answer',
      label: 'Answer',
      type: 'textarea',
      placeholder: 'Enter the answer',
      required: true,
      rows: 5,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'number',
      placeholder: '0',
      description: 'Higher priority FAQs appear first (0-100)',
      min: 0,
      max: 100,
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'switch',
      description: 'Show FAQ on website immediately',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="FAQs Management"
          description="Manage frequently asked questions"
          breadcrumbs={[{ label: 'FAQs' }]}
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
                Add FAQ
              </Button>
            </>
          }
        />

        <ListToolbar
          searchPlaceholder="Search FAQs by question or answer..."
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
          }}
          statusOptions={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          statusValue={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />

        <DataTable
          data={faqs}
          columns={columns}
          loading={loading}
          emptyTitle="No FAQs found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding a FAQ'
          }
          onEmptyAction={() => setCreateDrawerOpen(true)}
          emptyActionLabel="Add FAQ"
          selectable
          selectedIds={selectedIds}
          onSelectItem={toggleSelect}
          onSelectAll={allSelected ? clearSelection : selectAll}
          allSelected={allSelected}
          getItemId={(faq) => faq.id}
          actions={actions}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={20}
          onPageChange={setPage}
          selectedCount={selectedIds.size}
          bulkActions={
            selectedIds.size > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-amber-900">
                  {selectedIds.size} FAQ(s) selected
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

        {/* Edit FAQ Drawer */}
        <FormDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={editingFaq?.question || 'Edit FAQ'}
          description="Update FAQ details"
          icon={<HelpCircle className="w-6 h-6" />}
          form={editForm}
          fields={editFields}
          onSubmit={handleUpdateFaq}
          loading={loadingFaq}
          mode="edit"
        />

        {/* Create FAQ Drawer */}
        <FormDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          title="Add New FAQ"
          description="Create a new frequently asked question"
          icon={<HelpCircle className="w-6 h-6" />}
          form={createForm}
          fields={createFields}
          onSubmit={handleCreateFaq}
          mode="create"
        />
      </div>
    </DashboardLayout>
  );
}
