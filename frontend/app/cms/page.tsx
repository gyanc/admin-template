'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CmsPage, PaginatedResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Search, Edit2, Trash2, MoreVertical, Loader2, Globe, FileText, CheckSquare, Square, Download, Eye, Save, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

export default function CMSPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateCmsFormData>({
    resolver: zodResolver(updateCmsSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreatingPage },
    reset: resetCreate,
  } = useForm<CreateCmsFormData>({
    resolver: zodResolver(createCmsSchema),
    defaultValues: {
      isPublished: false,
    },
  });

  useEffect(() => {
    fetchPages();
  }, [page, searchTerm, statusFilter]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<CmsPage>>('/cms', {
        params: {
          page,
          limit: 20,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });

      if (response.data.data) {
        setPages(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotal(response.data.meta.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch CMS pages:', error);
      toast.error('Failed to load CMS pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      setDeleting(pageId);
      await apiClient.delete(`/cms/${pageId}`);
      toast.success('Page deleted successfully');
      fetchPages();
      setSelectedPages(new Set());
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete page';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size === 0) {
      toast.error('Please select at least one page');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPages.size} page(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedPages).map(pageId =>
        apiClient.delete(`/cms/${pageId}`)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedPages.size} page(s) deleted successfully`);
      fetchPages();
      setSelectedPages(new Set());
    } catch (error: any) {
      toast.error('Failed to delete some pages');
    }
  };

  const handleSelectAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages.map(p => p.id)));
    }
  };

  const handleSelectPage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleEdit = async (pageId: string) => {
    try {
      setLoadingPage(true);
      setDrawerOpen(true);
      
      console.log('Fetching CMS page with ID:', pageId);
      const response = await apiClient.get(`/cms/${pageId}`);
      console.log('CMS page response:', response.data);
      
      const pageData = response.data?.data || response.data;
      
      if (!pageData) {
        throw new Error('Page data not found in response');
      }
      
      setEditingPage(pageData);
      reset({
        title: pageData.title,
        slug: pageData.slug,
        isPublished: pageData.isPublished || pageData.status === 'published',
      });
    } catch (error: any) {
      console.error('Failed to load CMS page:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Failed to load page';
      toast.error(message);
      setEditingPage(null);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleUpdatePage = async (data: UpdateCmsFormData) => {
    if (!editingPage) return;

    try {
      await apiClient.put(`/cms/${editingPage.id}`, {
        title: data.title,
        slug: data.slug,
        status: data.isPublished ? 'published' : 'draft',
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
      await apiClient.post('/cms', {
        title: data.title,
        slug: data.slug,
        content: '', // Empty content, user can edit later
        status: data.isPublished ? 'published' : 'draft',
      });
      toast.success('Page created successfully');
      setCreateDrawerOpen(false);
      resetCreate();
      fetchPages();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create page';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'CMS Pages' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CMS Pages</h1>
            <p className="text-gray-600 mt-1">
              Manage website content, pages, and SEO settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Page
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
                placeholder="Search pages by title or slug..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedPages.size > 0 && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-purple-900">
                {selectedPages.size} page(s) selected
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedPages(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pages Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : pages.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No pages found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new CMS page'}
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
                          {selectedPages.size === pages.length ? (
                            <CheckSquare className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Published
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pages.map((cmsPage) => (
                      <tr
                        key={cmsPage.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedPages.has(cmsPage.id) ? 'bg-purple-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectPage(cmsPage.id)}
                            className="flex items-center"
                          >
                            {selectedPages.has(cmsPage.id) ? (
                              <CheckSquare className="w-5 h-5 text-purple-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-medium text-gray-900">{cmsPage.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 font-mono text-sm">/{cmsPage.slug}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              cmsPage.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <Globe className="w-3 h-3" />
                            {cmsPage.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">
                            {cmsPage.publishedAt
                              ? new Date(cmsPage.publishedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
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
                              <DropdownMenuItem onClick={() => handleEdit(cmsPage.id)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Quick Edit
                              </DropdownMenuItem>
                              <Link href={`/cms/${cmsPage.id}`}>
                                <DropdownMenuItem>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Full Edit
                                </DropdownMenuItem>
                              </Link>
                              {cmsPage.isPublished && (
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(cmsPage.id)}
                                disabled={deleting === cmsPage.id}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deleting === cmsPage.id ? 'Deleting...' : 'Delete'}
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
                  <span className="font-medium">{total}</span> pages
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
            {loadingPage ? (
              <div className="flex items-center justify-center p-12 flex-1">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Loading page...</p>
                </div>
              </div>
            ) : editingPage ? (
              <div className="flex flex-col h-full overflow-hidden">
                <DrawerHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DrawerTitle>{editingPage.title}</DrawerTitle>
                      <DrawerDescription className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm">/{editingPage.slug}</span>
                      </DrawerDescription>
                    </div>
                    <DrawerClose />
                  </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  <form onSubmit={handleSubmit(handleUpdatePage)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold">
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          type="text"
                          {...register('title')}
                          disabled={isSubmitting}
                          className={errors.title ? 'border-red-500' : ''}
                        />
                        {errors.title && (
                          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug" className="text-sm font-semibold">
                          Slug <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="slug"
                          type="text"
                          {...register('slug')}
                          disabled={isSubmitting}
                          className={errors.slug ? 'border-red-500' : ''}
                          placeholder="page-slug"
                        />
                        {errors.slug && (
                          <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="isPublished"
                        {...register('isPublished')}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <Label htmlFor="isPublished" className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Published
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          {editingPage.isPublished ? 'Page is live and visible to users' : 'Page is in draft mode'}
                        </p>
                      </div>
                      {editingPage.isPublished && (
                        <Globe className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gray-500 text-xs mb-1">Created</p>
                          <p className="font-medium text-gray-900">
                            {new Date(editingPage.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      {editingPage.publishedAt && (
                        <div className="flex items-start gap-3">
                          <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-gray-500 text-xs mb-1">Published</p>
                            <p className="font-medium text-gray-900">
                              {new Date(editingPage.publishedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> For content editing, use the "Full Edit" option to access the rich text editor.
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
                    onClick={handleSubmit(handleUpdatePage)}
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
                  <p className="text-gray-600 font-medium mb-2">Unable to load page</p>
                  <p className="text-sm text-gray-500 mb-4">Please try again or check your connection</p>
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Create CMS Page Drawer */}
        <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <DrawerHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle>Create New Page</DrawerTitle>
                    <DrawerDescription>Add a new CMS page to the website</DrawerDescription>
                  </div>
                  <DrawerClose />
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <form onSubmit={handleSubmitCreate(handleCreatePage)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="create-title" className="text-sm font-semibold">
                      Page Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-title"
                      type="text"
                      {...registerCreate('title')}
                      disabled={isCreatingPage}
                      className={createErrors.title ? 'border-red-500' : ''}
                    />
                    {createErrors.title && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-slug" className="text-sm font-semibold">
                      Slug <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-slug"
                      type="text"
                      {...registerCreate('slug')}
                      disabled={isCreatingPage}
                      className={createErrors.slug ? 'border-red-500' : ''}
                      placeholder="page-slug"
                    />
                    {createErrors.slug && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.slug.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      URL-friendly identifier (lowercase, numbers, and hyphens only)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="create-isPublished"
                      {...registerCreate('isPublished')}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      disabled={isCreatingPage}
                    />
                    <div className="flex-1">
                      <Label htmlFor="create-isPublished" className="text-sm font-semibold text-gray-900 cursor-pointer">
                        Publish Immediately
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Page will be visible to users immediately
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Note:</strong> You can add content and edit the page after creation using the "Full Edit" option.
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
                  onClick={handleSubmitCreate(handleCreatePage)}
                  disabled={isCreatingPage}
                >
                  {isCreatingPage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Page
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
