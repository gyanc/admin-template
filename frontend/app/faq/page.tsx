'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Faq, PaginatedResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Search, Edit2, Trash2, MoreVertical, Loader2, ThumbsUp, ThumbsDown, Eye, HelpCircle, CheckSquare, Square, Download, Filter, Save, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

export default function FAQPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFaqs, setSelectedFaqs] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [loadingFaq, setLoadingFaq] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateFaqFormData>({
    resolver: zodResolver(updateFaqSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreatingFaq },
    reset: resetCreate,
  } = useForm<CreateFaqFormData>({
    resolver: zodResolver(createFaqSchema),
    defaultValues: {
      isActive: true,
      priority: 0,
    },
  });

  useEffect(() => {
    fetchFaqs();
  }, [page, searchTerm, statusFilter, categoryFilter]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<Faq>>('/faq', {
        params: {
          page,
          limit: 20,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        },
      });

      if (response.data.data) {
        setFaqs(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotal(response.data.meta.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      setDeleting(faqId);
      await apiClient.delete(`/faq/${faqId}`);
      toast.success('FAQ deleted successfully');
      fetchFaqs();
      setSelectedFaqs(new Set());
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete FAQ';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFaqs.size === 0) {
      toast.error('Please select at least one FAQ');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedFaqs.size} FAQ(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedFaqs).map(faqId =>
        apiClient.delete(`/faq/${faqId}`)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedFaqs.size} FAQ(s) deleted successfully`);
      fetchFaqs();
      setSelectedFaqs(new Set());
    } catch (error: any) {
      toast.error('Failed to delete some FAQs');
    }
  };

  const handleSelectAll = () => {
    if (selectedFaqs.size === faqs.length) {
      setSelectedFaqs(new Set());
    } else {
      setSelectedFaqs(new Set(faqs.map(f => f.id)));
    }
  };

  const handleSelectFaq = (faqId: string) => {
    const newSelected = new Set(selectedFaqs);
    if (newSelected.has(faqId)) {
      newSelected.delete(faqId);
    } else {
      newSelected.add(faqId);
    }
    setSelectedFaqs(newSelected);
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Get unique categories from FAQs
  const categories = Array.from(new Set(faqs.map(f => {
    if (typeof f.category === 'string') return f.category;
    if (f.category && typeof f.category === 'object' && 'name' in f.category) return f.category.name;
    return null;
  }).filter((cat): cat is string => typeof cat === 'string' && cat !== '')));

  const handleEdit = async (faqId: string) => {
    try {
      setLoadingFaq(true);
      setDrawerOpen(true);
      
      console.log('Fetching FAQ with ID:', faqId);
      const response = await apiClient.get(`/faq/${faqId}`);
      console.log('FAQ response:', response.data);
      
      const faqData = response.data?.data || response.data;
      
      if (!faqData) {
        throw new Error('FAQ data not found in response');
      }
      
      setEditingFaq(faqData);
      reset({
        question: faqData.question,
        answer: faqData.answer,
        isActive: faqData.isActive,
        priority: faqData.priority || 0,
      });
    } catch (error: any) {
      console.error('Failed to load FAQ:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Failed to load FAQ';
      toast.error(message);
      setEditingFaq(null);
    } finally {
      setLoadingFaq(false);
    }
  };

  const handleUpdateFaq = async (data: UpdateFaqFormData) => {
    if (!editingFaq) return;

    try {
      await apiClient.put(`/faq/${editingFaq.id}`, data);
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
      await apiClient.post('/faq', data);
      toast.success('FAQ created successfully');
      setCreateDrawerOpen(false);
      resetCreate();
      fetchFaqs();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create FAQ';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'FAQ Management' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
            <p className="text-gray-600 mt-1">
              Manage frequently asked questions and help content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create FAQ
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
                placeholder="Search FAQs by question..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedFaqs.size > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-orange-900">
                {selectedFaqs.size} FAQ(s) selected
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedFaqs(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* FAQs Grid/Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="p-12 text-center">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No FAQs found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new FAQ'}
              </p>
            </div>
          ) : (
            <>
              <div className="p-6 space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className={`p-6 rounded-lg border transition-all ${
                      selectedFaqs.has(faq.id)
                        ? 'bg-orange-50 border-orange-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <button
                          onClick={() => handleSelectFaq(faq.id)}
                          className="mt-1"
                        >
                          {selectedFaqs.has(faq.id) ? (
                            <CheckSquare className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                            {!faq.isActive && (
                              <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full whitespace-nowrap">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{faq.answer}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            {faq.category && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                {typeof faq.category === 'string' ? faq.category : faq.category?.name || ''}
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {faq.views || 0} views
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              {faq.helpful || 0} helpful
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="w-4 h-4" />
                              {faq.notHelpful || 0} not helpful
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(faq.id)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Quick Edit
                            </DropdownMenuItem>
                            <Link href={`/faq/${faq.id}`}>
                              <DropdownMenuItem>
                                <HelpCircle className="w-4 h-4 mr-2" />
                                Full Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              onClick={() => handleDelete(faq.id)}
                              disabled={deleting === faq.id}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deleting === faq.id ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> FAQs
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
            {loadingFaq ? (
              <div className="flex items-center justify-center p-12 flex-1">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Loading FAQ...</p>
                </div>
              </div>
            ) : editingFaq ? (
              <div className="flex flex-col h-full overflow-hidden">
                <DrawerHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DrawerTitle className="line-clamp-2">{editingFaq.question}</DrawerTitle>
                      <DrawerDescription className="flex items-center gap-2 mt-1">
                        {editingFaq.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                            {typeof editingFaq.category === 'string' ? editingFaq.category : editingFaq.category?.name || ''}
                          </span>
                        )}
                      </DrawerDescription>
                    </div>
                    <DrawerClose />
                  </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  <form onSubmit={handleSubmit(handleUpdateFaq)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="question" className="text-sm font-semibold">
                        Question <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="question"
                        type="text"
                        {...register('question')}
                        disabled={isSubmitting}
                        className={errors.question ? 'border-red-500' : ''}
                      />
                      {errors.question && (
                        <p className="text-red-500 text-xs mt-1">{errors.question.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="answer" className="text-sm font-semibold">
                        Answer <span className="text-red-500">*</span>
                      </Label>
                      <textarea
                        id="answer"
                        {...register('answer')}
                        disabled={isSubmitting}
                        rows={6}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          errors.answer ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.answer && (
                        <p className="text-red-500 text-xs mt-1">{errors.answer.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="priority" className="text-sm font-semibold">
                          Priority (0-100)
                        </Label>
                        <Input
                          id="priority"
                          type="number"
                          min="0"
                          max="100"
                          {...register('priority', { valueAsNumber: true })}
                          disabled={isSubmitting}
                          className={errors.priority ? 'border-red-500' : ''}
                        />
                        {errors.priority && (
                          <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <input
                          type="checkbox"
                          id="isActive"
                          {...register('isActive')}
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                          disabled={isSubmitting}
                        />
                        <div className="flex-1">
                          <Label htmlFor="isActive" className="text-sm font-semibold text-gray-900 cursor-pointer">
                            Active
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">
                            {editingFaq.isActive ? 'FAQ is visible to users' : 'FAQ is hidden'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500 text-xs">Views</p>
                          <p className="font-medium text-gray-900">{editingFaq.views || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500 text-xs">Helpful</p>
                          <p className="font-medium text-gray-900">{editingFaq.helpful || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500 text-xs">Not Helpful</p>
                          <p className="font-medium text-gray-900">{editingFaq.notHelpful || 0}</p>
                        </div>
                      </div>
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
                    onClick={handleSubmit(handleUpdateFaq)}
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
                  <p className="text-gray-600 font-medium mb-2">Unable to load FAQ</p>
                  <p className="text-sm text-gray-500 mb-4">Please try again or check your connection</p>
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Create FAQ Drawer */}
        <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <DrawerHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle>Create New FAQ</DrawerTitle>
                    <DrawerDescription>Add a new frequently asked question</DrawerDescription>
                  </div>
                  <DrawerClose />
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <form onSubmit={handleSubmitCreate(handleCreateFaq)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="create-question" className="text-sm font-semibold">
                      Question <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-question"
                      type="text"
                      {...registerCreate('question')}
                      disabled={isCreatingFaq}
                      className={createErrors.question ? 'border-red-500' : ''}
                    />
                    {createErrors.question && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.question.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-answer" className="text-sm font-semibold">
                      Answer <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="create-answer"
                      {...registerCreate('answer')}
                      disabled={isCreatingFaq}
                      rows={6}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        createErrors.answer ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {createErrors.answer && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.answer.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="create-priority" className="text-sm font-semibold">
                        Priority (0-100)
                      </Label>
                      <Input
                        id="create-priority"
                        type="number"
                        min="0"
                        max="100"
                        {...registerCreate('priority', { valueAsNumber: true })}
                        disabled={isCreatingFaq}
                        className={createErrors.priority ? 'border-red-500' : ''}
                      />
                      {createErrors.priority && (
                        <p className="text-red-500 text-xs mt-1">{createErrors.priority.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="create-isActive"
                        {...registerCreate('isActive')}
                        className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        disabled={isCreatingFaq}
                      />
                      <div className="flex-1">
                        <Label htmlFor="create-isActive" className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Active
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          FAQ will be visible to users
                        </p>
                      </div>
                    </div>
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
                  onClick={handleSubmitCreate(handleCreateFaq)}
                  disabled={isCreatingFaq}
                >
                  {isCreatingFaq ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create FAQ
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
