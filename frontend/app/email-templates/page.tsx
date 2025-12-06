'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmailTemplate, PaginatedResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Search, Edit2, Trash2, MoreVertical, Loader2, Mail, CheckSquare, Square, Download, Eye, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').min(2, 'Template name must be at least 2 characters'),
  subject: z.string().min(1, 'Subject is required').min(3, 'Subject must be at least 3 characters'),
  triggerType: z.string().min(1, 'Trigger type is required'),
});

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').min(2, 'Template name must be at least 2 characters'),
  subject: z.string().min(1, 'Subject is required').min(3, 'Subject must be at least 3 characters'),
  triggerType: z.string().min(1, 'Trigger type is required'),
});

type UpdateTemplateFormData = z.infer<typeof updateTemplateSchema>;
type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UpdateTemplateFormData>({
    resolver: zodResolver(updateTemplateSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreatingTemplate },
    reset: resetCreate,
    setValue: setValueCreate,
    watch: watchCreate,
  } = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
  });

  const triggerTypeValue = watch('triggerType');
  const createTriggerTypeValue = watchCreate('triggerType');

  useEffect(() => {
    fetchTemplates();
  }, [page, searchTerm, triggerFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<EmailTemplate>>('/email-templates', {
        params: {
          page,
          limit: 20,
          search: searchTerm || undefined,
          triggerType: triggerFilter !== 'all' ? triggerFilter : undefined,
        },
      });

      if (response.data.data) {
        setTemplates(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotal(response.data.meta.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      setDeleting(templateId);
      await apiClient.delete(`/email-templates/${templateId}`);
      toast.success('Template deleted successfully');
      fetchTemplates();
      setSelectedTemplates(new Set());
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete template';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.size === 0) {
      toast.error('Please select at least one template');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTemplates.size} template(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedTemplates).map(templateId =>
        apiClient.delete(`/email-templates/${templateId}`)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedTemplates.size} template(s) deleted successfully`);
      fetchTemplates();
      setSelectedTemplates(new Set());
    } catch (error: any) {
      toast.error('Failed to delete some templates');
    }
  };

  const handleSelectAll = () => {
    if (selectedTemplates.size === templates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(templates.map(t => t.id)));
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Get unique trigger types
  const triggerTypes = Array.from(new Set(templates.map(t => t.triggerType).filter(Boolean)));

  const handleEdit = async (templateId: string) => {
    try {
      setLoadingTemplate(true);
      setDrawerOpen(true);
      
      console.log('Fetching email template with ID:', templateId);
      const response = await apiClient.get(`/email-templates/${templateId}`);
      console.log('Email template response:', response.data);
      
      const templateData = response.data?.data || response.data;
      
      if (!templateData) {
        throw new Error('Template data not found in response');
      }
      
      setEditingTemplate(templateData);
      reset({
        name: templateData.name,
        subject: templateData.subject,
        triggerType: templateData.triggerType,
      });
    } catch (error: any) {
      console.error('Failed to load email template:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Failed to load template';
      toast.error(message);
      setEditingTemplate(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleUpdateTemplate = async (data: UpdateTemplateFormData) => {
    if (!editingTemplate) return;

    try {
      await apiClient.put(`/email-templates/${editingTemplate.id}`, data);
      toast.success('Template updated successfully');
      setDrawerOpen(false);
      fetchTemplates();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update template';
      toast.error(message);
    }
  };

  const handleCreateTemplate = async (data: CreateTemplateFormData) => {
    try {
      await apiClient.post('/email-templates', {
        ...data,
        body: '', // Empty body, user can edit later
      });
      toast.success('Template created successfully');
      setCreateDrawerOpen(false);
      resetCreate();
      fetchTemplates();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create template';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Email Templates' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600 mt-1">
              Manage email templates, triggers, and content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search templates by name..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            {/* Trigger Filter */}
            {triggerTypes.length > 0 && (
              <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Triggers</SelectItem>
                  {triggerTypes.map((trigger) => (
                    <SelectItem key={trigger} value={trigger}>
                      {trigger}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedTemplates.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedTemplates.size} template(s) selected
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedTemplates(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No email templates found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || triggerFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new email template'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <button onClick={handleSelectAll} className="flex items-center">
                          {selectedTemplates.size === templates.length ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Trigger
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {templates.map((template) => (
                      <tr
                        key={template.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedTemplates.has(template.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectTemplate(template.id)}
                            className="flex items-center"
                          >
                            {selectedTemplates.has(template.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-medium text-gray-900">{template.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm truncate max-w-xs block">
                            {template.subject}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {template.triggerType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">
                            {new Date(template.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(template.id)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Quick Edit
                              </DropdownMenuItem>
                              <Link href={`/email-templates/${template.id}`}>
                                <DropdownMenuItem>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Full Edit
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(template.id)}
                                disabled={deleting === template.id}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deleting === template.id ? 'Deleting...' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> templates
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Edit Drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            {loadingTemplate ? (
              <div className="flex items-center justify-center p-12 flex-1">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Loading template...</p>
                </div>
              </div>
            ) : editingTemplate ? (
              <div className="flex flex-col h-full overflow-hidden">
                <DrawerHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DrawerTitle>{editingTemplate.name}</DrawerTitle>
                      <DrawerDescription className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {editingTemplate.triggerType}
                        </span>
                      </DrawerDescription>
                    </div>
                    <DrawerClose />
                  </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  <form onSubmit={handleSubmit(handleUpdateTemplate)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold">
                        Template Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        {...register('name')}
                        disabled={isSubmitting}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-semibold">
                        Email Subject <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subject"
                        type="text"
                        {...register('subject')}
                        disabled={isSubmitting}
                        className={errors.subject ? 'border-red-500' : ''}
                        placeholder="Email subject line"
                      />
                      {errors.subject && (
                        <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="triggerType" className="text-sm font-semibold">
                        Trigger Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={triggerTypeValue || editingTemplate.triggerType}
                        onValueChange={(value) => setValue('triggerType', value)}
                      >
                        <SelectTrigger className={errors.triggerType ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select trigger type" />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerTypes.length > 0 ? (
                            triggerTypes.map((trigger) => (
                              <SelectItem key={trigger} value={trigger}>
                                {trigger}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value={editingTemplate.triggerType}>
                              {editingTemplate.triggerType}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors.triggerType && (
                        <p className="text-red-500 text-xs mt-1">{errors.triggerType.message}</p>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> For body content editing, use the "Full Edit" option to access the template editor.
                      </p>
                    </div>
                  </form>
                </div>

                <DrawerFooter className="flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit(handleUpdateTemplate)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DrawerFooter>
              </div>
            ) : (
              <div className="flex items-center justify-center p-12 flex-1">
                <div className="text-center">
                  <p className="text-gray-600 font-medium mb-2">Unable to load template</p>
                  <p className="text-sm text-gray-500 mb-4">Please try again or check your connection</p>
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Create Email Template Drawer */}
        <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <DrawerHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle>Create New Email Template</DrawerTitle>
                    <DrawerDescription>Add a new email template to the system</DrawerDescription>
                  </div>
                  <DrawerClose />
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <form onSubmit={handleSubmitCreate(handleCreateTemplate)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="create-name" className="text-sm font-semibold">
                      Template Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-name"
                      type="text"
                      {...registerCreate('name')}
                      disabled={isCreatingTemplate}
                      className={createErrors.name ? 'border-red-500' : ''}
                    />
                    {createErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-subject" className="text-sm font-semibold">
                      Email Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-subject"
                      type="text"
                      {...registerCreate('subject')}
                      disabled={isCreatingTemplate}
                      className={createErrors.subject ? 'border-red-500' : ''}
                      placeholder="Email subject line"
                    />
                    {createErrors.subject && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.subject.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-triggerType" className="text-sm font-semibold">
                      Trigger Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={createTriggerTypeValue || ''}
                      onValueChange={(value) => setValueCreate('triggerType', value)}
                    >
                      <SelectTrigger className={createErrors.triggerType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select trigger type" />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerTypes.length > 0 ? (
                          triggerTypes.map((trigger) => (
                            <SelectItem key={trigger} value={trigger}>
                              {trigger}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="welcome">Welcome</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {createErrors.triggerType && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.triggerType.message}</p>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You can add body content and edit the template after creation using the "Full Edit" option.
                    </p>
                  </div>
                </form>
              </div>

              <DrawerFooter className="flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDrawerOpen(false);
                    resetCreate();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCreate(handleCreateTemplate)}
                  disabled={isCreatingTemplate}
                >
                  {isCreatingTemplate ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </>
                  )}
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </DashboardLayout>
  );
}
