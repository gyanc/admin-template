'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-header';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { DataTable, Column, Action } from '@/components/shared/data-table';
import { FormDrawer, FormField } from '@/components/shared/form-drawer';
import { EmailTemplate, PaginatedResponse } from '@/lib/types';
import { useState, useCallback } from 'react';
import { emailTemplatesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Download, Mail, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePagedResource } from '@/lib/hooks/use-paged-resource';
import { useEditForm } from '@/lib/hooks/use-edit-form';

const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').min(2, 'Template name must be at least 2 characters'),
  subject: z.string().min(1, 'Subject is required').min(3, 'Subject must be at least 3 characters'),
  body: z.string().min(1, 'Body is required'),
  triggerType: z.string().min(1, 'Trigger type is required'),
});

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').min(2, 'Template name must be at least 2 characters'),
  subject: z.string().min(1, 'Subject is required').min(3, 'Subject must be at least 3 characters'),
  body: z.string().min(1, 'Body is required'),
  triggerType: z.string().min(1, 'Trigger type is required'),
});

type UpdateTemplateFormData = z.infer<typeof updateTemplateSchema>;
type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;

const TRIGGER_TYPES = [
  { value: 'WELCOME_EMAIL', label: 'Welcome Email' },
  { value: 'PASSWORD_RESET', label: 'Password Reset' },
  { value: 'EMAIL_VERIFICATION', label: 'Email Verification' },
  { value: 'ACCOUNT_SUSPENDED', label: 'Account Suspended' },
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'NEW_STAFF', label: 'New Staff' },
];

interface EmailTemplatesClientProps {
  initialData?: PaginatedResponse<EmailTemplate>;
  initialPage?: number;
  initialSearch?: string;
  initialTriggerFilter?: string;
}

export default function EmailTemplatesClient({
  initialData,
  initialPage = 1,
  initialSearch = '',
  initialTriggerFilter = 'all',
}: EmailTemplatesClientProps) {
  const {
    items: templates,
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
  } = usePagedResource<EmailTemplate>({
    initialData,
    initialPage,
    initialSearch,
    initialStatus: initialTriggerFilter,
    fetcher: async ({ page, limit, search, status }) => {
      const response = await emailTemplatesApi.list({
        page,
        limit,
        search,
        triggerType: status,
      });
      return response;
    },
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const editForm = useForm<UpdateTemplateFormData>({
    resolver: zodResolver(updateTemplateSchema),
  });

  const createForm = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
  });

  const templateMapToForm = useCallback((template: EmailTemplate | null) => ({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    triggerType: template?.triggerType || '',
  }), []);

  useEditForm<UpdateTemplateFormData>(
    editingTemplate,
    editForm.reset,
    templateMapToForm
  );

  const fetchTemplates = useCallback(async () => {
    try {
      await fetchPage();
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      toast.error('Failed to load email templates');
    }
  }, [fetchPage]);

  const handleEdit = async (templateId: string) => {
    try {
      setLoadingTemplate(true);
      setDrawerOpen(true);
      
      const templateData = await emailTemplatesApi.getById(templateId);
      setEditingTemplate(templateData);
    } catch (error: any) {
      console.error('Failed to load template:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load template';
      toast.error(message);
      setEditingTemplate(null);
      setDrawerOpen(false);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleUpdateTemplate = async (data: UpdateTemplateFormData) => {
    if (!editingTemplate) return;

    try {
      await emailTemplatesApi.update(editingTemplate.id, data);
      toast.success('Email template updated successfully');
      setDrawerOpen(false);
      fetchTemplates();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update email template';
      toast.error(message);
    }
  };

  const handleCreateTemplate = async (data: CreateTemplateFormData) => {
    try {
      await emailTemplatesApi.create(data);
      toast.success('Email template created successfully');
      setCreateDrawerOpen(false);
      createForm.reset();
      fetchTemplates();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create email template';
      toast.error(message);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this email template?')) return;

    try {
      setDeleting(templateId);
      await emailTemplatesApi.delete(templateId);
      toast.success('Email template deleted successfully');
      fetchTemplates();
      clearSelection();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete email template';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one email template');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} email template(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map(templateId =>
        emailTemplatesApi.delete(templateId)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedIds.size} email template(s) deleted successfully`);
      fetchTemplates();
      clearSelection();
    } catch (error: any) {
      toast.error('Failed to delete some email templates');
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    toast.success('Preview functionality coming soon');
  };

  const columns: Column<EmailTemplate>[] = [
    {
      key: 'template',
      label: 'Template',
      render: (template) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="font-medium text-gray-900 block">
              {template.name}
            </span>
            <span className="text-sm text-gray-500">
              {template.subject}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'triggerType',
      label: 'Trigger Type',
      render: (template) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {TRIGGER_TYPES.find(t => t.value === template.triggerType)?.label || template.triggerType}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (template) => (
        <span className="text-gray-600">
          {new Date(template.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: Action<EmailTemplate>[] = [
    {
      label: 'Preview',
      icon: <Eye className="w-4 h-4" />,
      onClick: (template) => handlePreview(template),
    },
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: (template) => handleEdit(template.id),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (template) => handleDelete(template.id),
      disabled: (template) => deleting === template.id,
      className: 'text-red-600',
    },
  ];

  const editFields: FormField<UpdateTemplateFormData>[] = [
    {
      name: 'name',
      label: 'Template Name',
      type: 'text',
      placeholder: 'Enter template name',
      required: true,
    },
    {
      name: 'subject',
      label: 'Email Subject',
      type: 'text',
      placeholder: 'Enter email subject',
      required: true,
    },
    {
      name: 'body',
      label: 'Email Body',
      type: 'textarea',
      placeholder: 'Enter email body (supports HTML)',
      required: true,
      rows: 8,
    },
    {
      name: 'triggerType',
      label: 'Trigger Type',
      type: 'select',
      options: TRIGGER_TYPES,
      required: true,
    },
  ];

  const createFields: FormField<CreateTemplateFormData>[] = [
    {
      name: 'name',
      label: 'Template Name',
      type: 'text',
      placeholder: 'Enter template name',
      required: true,
    },
    {
      name: 'subject',
      label: 'Email Subject',
      type: 'text',
      placeholder: 'Enter email subject',
      required: true,
    },
    {
      name: 'body',
      label: 'Email Body',
      type: 'textarea',
      placeholder: 'Enter email body (supports HTML)',
      required: true,
      rows: 8,
    },
    {
      name: 'triggerType',
      label: 'Trigger Type',
      type: 'select',
      options: TRIGGER_TYPES,
      required: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Email Templates"
          description="Manage automated email templates"
          breadcrumbs={[{ label: 'Email Templates' }]}
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
                Create Template
              </Button>
            </>
          }
        />

        <ListToolbar
          searchPlaceholder="Search templates by name or subject..."
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
          }}
          statusOptions={[
            { value: 'all', label: 'All Types' },
            ...TRIGGER_TYPES,
          ]}
          statusValue={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />

        <DataTable
          data={templates}
          columns={columns}
          loading={loading}
          emptyTitle="No email templates found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating a new email template'
          }
          onEmptyAction={() => setCreateDrawerOpen(true)}
          emptyActionLabel="Create Template"
          selectable
          selectedIds={selectedIds}
          onSelectItem={toggleSelect}
          onSelectAll={allSelected ? clearSelection : selectAll}
          allSelected={allSelected}
          getItemId={(template) => template.id}
          actions={actions}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={20}
          onPageChange={setPage}
          selectedCount={selectedIds.size}
          bulkActions={
            selectedIds.size > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedIds.size} template(s) selected
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

        {/* Edit Template Drawer */}
        <FormDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={editingTemplate?.name || 'Edit Email Template'}
          description={editingTemplate?.subject || 'Update template details'}
          icon={<Mail className="w-6 h-6" />}
          form={editForm}
          fields={editFields}
          onSubmit={handleUpdateTemplate}
          loading={loadingTemplate}
          mode="edit"
        />

        {/* Create Template Drawer */}
        <FormDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          title="Create New Email Template"
          description="Add a new automated email template"
          icon={<Mail className="w-6 h-6" />}
          form={createForm}
          fields={createFields}
          onSubmit={handleCreateTemplate}
          mode="create"
        />
      </div>
    </DashboardLayout>
  );
}
