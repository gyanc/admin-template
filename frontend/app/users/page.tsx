'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { User, PaginatedResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Search, Edit2, Trash2, MoreVertical, Loader2, Filter, Download, CheckSquare, Square, Mail, Calendar, KeyRound, Shield, Save, CheckCircle2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  isActive: z.boolean(),
});

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  isActive: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;
type CreateUserFormData = z.infer<typeof createUserSchema>;

// Helper function to normalize user data from backend
function normalizeUser(userData: any): User {
  // Handle backend structure: name might be a string that needs to be split
  let firstName = userData.firstName;
  let lastName = userData.lastName;
  
  // If backend returns 'name' instead of firstName/lastName, split it
  if (!firstName && !lastName && userData.name) {
    const nameParts = (userData.name || '').split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // Map status to isActive if needed
  const isActive = userData.isActive !== undefined 
    ? userData.isActive 
    : (userData.status === 'active' || userData.status === 'ACTIVE');
  
  return {
    id: userData.id,
    email: userData.email,
    firstName: firstName || '',
    lastName: lastName || '',
    isActive,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString(),
    roles: userData.roles,
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreatingUser },
    reset: resetCreate,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isActive: true,
    },
  });

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<User>>('/users', {
        params: {
          page,
          limit: 20,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });

      if (response.data.data) {
        setUsers(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotal(response.data.meta.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (userId: string) => {
    try {
      setLoadingUser(true);
      setDrawerOpen(true); // Open drawer first to show loading state
      
      console.log('Fetching user with ID:', userId);
      const response = await apiClient.get(`/users/${userId}`);
      console.log('User response:', response.data);
      
      // Handle different response structures
      const userData = response.data?.data || response.data;
      
      if (!userData) {
        throw new Error('User data not found in response');
      }
      
      // Normalize user data from backend
      const mappedUser = normalizeUser(userData);
      
      setEditingUser(mappedUser);
      reset({
        firstName: mappedUser.firstName,
        lastName: mappedUser.lastName,
        isActive: mappedUser.isActive,
      });
    } catch (error: any) {
      console.error('Failed to load user:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Failed to load user';
      toast.error(message);
      // Keep drawer open to show error state
      setEditingUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleUpdateUser = async (data: UpdateUserFormData) => {
    if (!editingUser) return;

    try {
      await apiClient.put(`/users/${editingUser.id}`, data);
      toast.success('User updated successfully');
      setDrawerOpen(false);
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
    }
  };

  const handleCreateUser = async (data: CreateUserFormData) => {
    try {
      setIsCreating(true);
      await apiClient.post('/users', {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        isActive: data.isActive,
      });
      toast.success('User created successfully');
      setCreateDrawerOpen(false);
      resetCreate();
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;
    
    if (!confirm('Are you sure you want to reset this user\'s password? A temporary password will be generated.')) return;
    
    try {
      await apiClient.post(`/users/${editingUser.id}/password-reset`);
      toast.success('Password reset email sent to user');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setDeleting(userId);
      await apiClient.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
      setSelectedUsers(new Set());
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedUsers).map(userId =>
        apiClient.delete(`/users/${userId}`)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedUsers.size} user(s) deleted successfully`);
      fetchUsers();
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast.error('Failed to delete some users');
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      const updatePromises = Array.from(selectedUsers).map(userId =>
        apiClient.put(`/users/${userId}/status`, { status })
      );
      await Promise.all(updatePromises);
      toast.success(`${selectedUsers.size} user(s) updated successfully`);
      fetchUsers();
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast.error('Failed to update some users');
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Users Management' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-1">
              Manage user accounts, permissions, and activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="hidden sm:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create User
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
                placeholder="Search users by name or email..."
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
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.size} user(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange('active')}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange('inactive')}
                >
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 font-medium">No users found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new user'}
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
                          {selectedUsers.size === users.length ? (
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
                        Email
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
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedUsers.has(user.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectUser(user.id)}
                            className="flex items-center"
                          >
                            {selectedUsers.has(user.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 block">
                                {user.firstName} {user.lastName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{user.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
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
                            <DropdownMenuContent className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(user.id)}
                                disabled={deleting === user.id}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deleting === user.id ? 'Deleting...' : 'Delete'}
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
                  <span className="font-medium">{total}</span> users
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
            {loadingUser ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : editingUser ? (
              <div className="flex flex-col h-full overflow-hidden">
                <DrawerHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                      {editingUser.firstName?.[0]}{editingUser.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <DrawerTitle>
                        {editingUser.firstName} {editingUser.lastName}
                      </DrawerTitle>
                      <DrawerDescription className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" />
                        {editingUser.email}
                      </DrawerDescription>
                    </div>
                    <DrawerClose />
                  </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {/* Edit Form */}
                  <form onSubmit={handleSubmit(handleUpdateUser)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-semibold">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          {...register('firstName')}
                          disabled={isSubmitting}
                          className={errors.firstName ? 'border-red-500' : ''}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <span>•</span> {errors.firstName.message}
                          </p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-semibold">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          {...register('lastName')}
                          disabled={isSubmitting}
                          className={errors.lastName ? 'border-red-500' : ''}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <span>•</span> {errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="isActive"
                        {...register('isActive')}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <Label htmlFor="isActive" className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Active Account
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          {editingUser.isActive ? 'User can log in and access the system' : 'User account is inactive'}
                        </p>
                      </div>
                      {editingUser.isActive && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    {/* User Information Sidebar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-500 text-xs mb-1">Email</p>
                          <p className="font-medium text-gray-900 truncate">{editingUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gray-500 text-xs mb-1">Created</p>
                          <p className="font-medium text-gray-900">
                            {new Date(editingUser.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetPassword}
                        className="flex-1 sm:flex-none"
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Reset Password
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toast('Role assignment coming soon', { icon: 'ℹ️' })}
                        className="flex-1 sm:flex-none"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Assign Roles
                      </Button>
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
                    onClick={handleSubmit(handleUpdateUser)}
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
                  <p className="text-gray-600 font-medium mb-2">Unable to load user</p>
                  <p className="text-sm text-gray-500 mb-4">Please try again or check your connection</p>
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Create User Drawer */}
        <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <DrawerHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle>Create New User</DrawerTitle>
                    <DrawerDescription>Add a new user to the system</DrawerDescription>
                  </div>
                  <DrawerClose />
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <form onSubmit={handleSubmitCreate(handleCreateUser)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="create-firstName" className="text-sm font-semibold">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="create-firstName"
                        type="text"
                        {...registerCreate('firstName')}
                        disabled={isCreatingUser}
                        className={createErrors.firstName ? 'border-red-500' : ''}
                      />
                      {createErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{createErrors.firstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-lastName" className="text-sm font-semibold">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="create-lastName"
                        type="text"
                        {...registerCreate('lastName')}
                        disabled={isCreatingUser}
                        className={createErrors.lastName ? 'border-red-500' : ''}
                      />
                      {createErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{createErrors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-email" className="text-sm font-semibold">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-email"
                      type="email"
                      {...registerCreate('email')}
                      disabled={isCreatingUser}
                      className={createErrors.email ? 'border-red-500' : ''}
                    />
                    {createErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="create-password" className="text-sm font-semibold">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="create-password"
                        type="password"
                        {...registerCreate('password')}
                        disabled={isCreatingUser}
                        className={createErrors.password ? 'border-red-500' : ''}
                      />
                      {createErrors.password && (
                        <p className="text-red-500 text-xs mt-1">{createErrors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-confirmPassword" className="text-sm font-semibold">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="create-confirmPassword"
                        type="password"
                        {...registerCreate('confirmPassword')}
                        disabled={isCreatingUser}
                        className={createErrors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {createErrors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{createErrors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="create-isActive"
                      {...registerCreate('isActive')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      disabled={isCreatingUser}
                    />
                    <div className="flex-1">
                      <Label htmlFor="create-isActive" className="text-sm font-semibold text-gray-900 cursor-pointer">
                        Active Account
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        User can log in and access the system
                      </p>
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
                  onClick={handleSubmitCreate(handleCreateUser)}
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create User
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
