'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-header';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { DataTable, Column, Action } from '@/components/shared/data-table';
import { FormDrawer, FormField } from '@/components/shared/form-drawer';
import { StatusBadge } from '@/components/shared/status-badge';
import { User, PaginatedResponse } from '@/lib/types';
import { useState, useCallback } from 'react';
import { usersApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Download, Mail, UserCircle2, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePagedResource } from '@/lib/hooks/use-paged-resource';
import { useEditForm } from '@/lib/hooks/use-edit-form';

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

function normalizeUser(userData: any): User {
  let firstName = userData.firstName;
  let lastName = userData.lastName;
  
  if (!firstName && !lastName && userData.name) {
    const nameParts = (userData.name || '').split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
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

interface UsersClientProps {
  initialData?: PaginatedResponse<User>;
  initialPage?: number;
  initialSearch?: string;
  initialStatusFilter?: string;
}

export function UsersClient({
  initialData,
  initialPage = 1,
  initialSearch = '',
  initialStatusFilter = 'all',
}: UsersClientProps) {
  const normalizeUserCallback = useCallback((userData: any) => normalizeUser(userData), []);

  const {
    items: users,
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
  } = usePagedResource<User>({
    initialData,
    initialPage,
    initialSearch,
    initialStatus: initialStatusFilter,
    fetcher: async ({ page, limit, search, status }) => {
      const response = await usersApi.list({
        page,
        limit,
        search,
        status,
      });
      return response;
    },
    mapItem: normalizeUserCallback,
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const editForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const userMapToForm = useCallback((u: User | null) => ({
    firstName: u?.firstName || '',
    lastName: u?.lastName || '',
    isActive: u?.isActive ?? true,
  }), []);

  useEditForm<UpdateUserFormData>(
    editingUser,
    editForm.reset,
    userMapToForm
  );

  const fetchUsers = useCallback(async () => {
    try {
      await fetchPage();
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    }
  }, [fetchPage]);

  const handleEdit = async (userId: string) => {
    try {
      setLoadingUser(true);
      setDrawerOpen(true);
      
      const userData = await usersApi.getById(userId);
      const mappedUser = normalizeUser(userData);
      setEditingUser(mappedUser);
    } catch (error: any) {
      console.error('Failed to load user:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load user';
      toast.error(message);
      setEditingUser(null);
      setDrawerOpen(false);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleUpdateUser = async (data: UpdateUserFormData) => {
    if (!editingUser) return;

    try {
      await usersApi.update(editingUser.id, data);
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
      await usersApi.create({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        isActive: data.isActive,
      });
      toast.success('User created successfully');
      setCreateDrawerOpen(false);
      createForm.reset();
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm('Are you sure you want to reset this user\'s password? A temporary password will be generated.')) return;
    
    try {
      await usersApi.resetPassword(user.id);
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
      await usersApi.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
      clearSelection();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} user(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map(userId =>
        usersApi.delete(userId)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedIds.size} user(s) deleted successfully`);
      fetchUsers();
      clearSelection();
    } catch (error: any) {
      toast.error('Failed to delete some users');
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      const isActive = status === 'active';
      const updatePromises = Array.from(selectedIds).map(userId =>
        usersApi.update(userId, { isActive })
      );
      await Promise.all(updatePromises);
      toast.success(`${selectedIds.size} user(s) updated successfully`);
      fetchUsers();
      clearSelection();
    } catch (error: any) {
      toast.error('Failed to update some users');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div>
            <span className="font-medium text-gray-900 block">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Role',
      render: (user) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {user.roles?.[0]?.name || 'User'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <StatusBadge
          label={user.isActive ? 'Active' : 'Inactive'}
          variant={user.isActive ? 'success' : 'danger'}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (user) => (
        <span className="text-gray-600">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: Action<User>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: (user) => handleEdit(user.id),
    },
    {
      label: 'Reset Password',
      icon: <KeyRound className="w-4 h-4" />,
      onClick: (user) => handleResetPassword(user),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (user) => handleDelete(user.id),
      disabled: (user) => deleting === user.id,
      className: 'text-red-600',
    },
  ];

  const editFields: FormField<UpdateUserFormData>[] = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter first name',
      required: true,
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter last name',
      required: true,
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'switch',
      description: 'Enable or disable user account',
    },
  ];

  const createFields: FormField<CreateUserFormData>[] = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'user@example.com',
      required: true,
    },
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter first name',
      required: true,
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter last name',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Minimum 8 characters',
      required: true,
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Re-enter password',
      required: true,
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'switch',
      description: 'Activate user account immediately',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Users Management"
          description="Manage user accounts, permissions, and activity"
          breadcrumbs={[{ label: 'Users' }]}
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
                Create User
              </Button>
            </>
          }
        />

        <ListToolbar
          searchPlaceholder="Search users by name or email..."
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
          data={users}
          columns={columns}
          loading={loading}
          emptyTitle="No users found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating a new user'
          }
          onEmptyAction={() => setCreateDrawerOpen(true)}
          emptyActionLabel="Create User"
          selectable
          selectedIds={selectedIds}
          onSelectItem={toggleSelect}
          onSelectAll={allSelected ? clearSelection : selectAll}
          allSelected={allSelected}
          getItemId={(user) => user.id}
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
                  {selectedIds.size} user(s) selected
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
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
            ) : undefined
          }
        />

        {/* Edit User Drawer */}
        <FormDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={editingUser ? `${editingUser.firstName} ${editingUser.lastName}` : 'Edit User'}
          description={editingUser?.email}
          icon={<UserCircle2 className="w-6 h-6" />}
          form={editForm}
          fields={editFields}
          onSubmit={handleUpdateUser}
          loading={loadingUser}
          mode="edit"
          footerExtra={
            editingUser && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleResetPassword(editingUser)}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
            )
          }
        />

        {/* Create User Drawer */}
        <FormDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          title="Create New User"
          description="Add a new user to the system"
          icon={<UserCircle2 className="w-6 h-6" />}
          form={createForm}
          fields={createFields}
          onSubmit={handleCreateUser}
          mode="create"
        />
      </div>
    </DashboardLayout>
  );
}
