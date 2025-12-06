'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Role, PaginatedResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Search, Edit2, Trash2, MoreVertical, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, [page, searchTerm]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<Role>>('/roles', {
        params: {
          page,
          limit: 10,
          search: searchTerm || undefined,
        },
      });

      if (response.data.data) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      setDeleting(roleId);
      await apiClient.delete(`/roles/${roleId}`);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete role';
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
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-1">Manage system roles and permissions</p>
          </div>
          <Link
            href="/roles/create"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Role
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles by name..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Roles Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No roles found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Permissions</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-indigo-600" />
                            <span className="font-medium text-gray-900">{role.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {role.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {role.permissions?.length || 0} permissions
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              role.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                              <Link
                                href={`/roles/${role.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer w-full"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </Link>
                              <DropdownMenuItem
                                onClick={() => handleDelete(role.id)}
                                disabled={deleting === role.id}
                                className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                {deleting === role.id ? 'Deleting...' : 'Delete'}
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
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
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
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
