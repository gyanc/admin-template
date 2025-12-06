'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Faq, PaginatedResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Search, Edit2, Trash2, MoreVertical, Loader2, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, [page, searchTerm]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<Faq>>('/faq', {
        params: {
          page,
          limit: 10,
          search: searchTerm || undefined,
        },
      });

      if (response.data.data) {
        setFaqs(response.data.data);
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
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete FAQ';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
            <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
          </div>
          <Link
            href="/faq/create"
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create FAQ
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs by question..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* FAQs Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No FAQs found</p>
            </div>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{faq.answer}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {faq.views} views
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {faq.helpful} helpful
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4" />
                        {faq.notHelpful} not helpful
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!faq.isActive && (
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        Inactive
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <Link
                          href={`/faq/${faq.id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer w-full"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Link>
                        <DropdownMenuItem
                          onClick={() => handleDelete(faq.id)}
                          disabled={deleting === faq.id}
                          className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleting === faq.id ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && faqs.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
