'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Role, PaginatedResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Search, Edit2, Trash2, MoreVertical, Loader2, Shield, CheckSquare, Square, Download, Save } from 'lucide-react';
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

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  isActive: z.boolean(),
});

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreatingRole },
    reset: resetCreate,
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      isActive: true,
    },
  });

  useEffect(() => {
    fetchRoles();
  }, [page, searchTerm, statusFilter]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<Role>>('/roles', {
        params: {
          page,
          limit: 20,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });

      if (response.data.data) {
        setRoles(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotal(response.data.meta.total || 0);
        }
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
      setSelectedRoles(new Set());
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete role';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRoles.size === 0) {
      toast.error('Please select at least one role');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedRoles.size} role(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedRoles).map(roleId =>
        apiClient.delete(`/roles/${roleId}`)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedRoles.size} role(s) deleted successfully`);
      fetchRoles();
      setSelectedRoles(new Set());
    } catch (error: any) {
      toast.error('Failed to delete some roles');
    }
  };

  const handleSelectAll = () => {
    if (selectedRoles.size === roles.length) {
      setSelectedRoles(new Set());
    } else {
      setSelectedRoles(new Set(roles.map(r => r.id)));
    }
  };

  const handleSelectRole = (roleId: string) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleEdit = async (roleId: string) => {
    try {
      setLoadingRole(true);
      setDrawerOpen(true);
      
      console.log('Fetching role with ID:', roleId);
      const response = await apiClient.get(`/roles/${roleId}`);
      console.log('Role response:', response.data);
      
      const roleData = response.data?.data || response.data;
      
      if (!roleData) {
        throw new Error('Role data not found in response');
      }
      
      setEditingRole(roleData);
      reset({
        name: roleData.name,
        description: roleData.description || '',
        isActive: roleData.isActive,
      });
    } catch (error: any) {
      console.error('Failed to load role:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Failed to load role';
      toast.error(message);
      setEditingRole(null);
    } finally {
      setLoadingRole(false);
    }
  };

  const handleUpdateRole = async (data: UpdateRoleFormData) => {
    if (!editingRole) return;

    try {
      await apiClient.put(`/roles/${editingRole.id}`, data);
      toast.success('Role updated successfully');
      setDrawerOpen(false);
      fetchRoles();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update role';
      toast.error(message);
    }
  };

  const handleCreateRole = async (data: CreateRoleFormData) => {
    try {
      await apiClient.post('/roles', data);
      toast.success('Role created successfully');
      setCreateDrawerOpen(false);
      resetCreate();
      fetchRoles();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create role';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Roles & Permissions' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-1">
              Manage system roles, permissions, and access control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
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
                placeholder="Search roles by name..."
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
          {selectedRoles.size > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-900">
                {selectedRoles.size} role(s) selected
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedRoles(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Roles Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : roles.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No roles found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new role'}
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
                          {selectedRoles.size === roles.length ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Role Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {roles.map((role) => (
                      <tr
                        key={role.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedRoles.has(role.id) ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectRole(role.id)}
                            className="flex items-center"
                          >
                            {selectedRoles.has(role.id) ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-medium text-gray-900">{role.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">
                            {role.description || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {role.permissions?.length || 0} permissions
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(role.id)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Quick Edit
                              </DropdownMenuItem>
                              <Link href={`/roles/${role.id}`}>
                                <DropdownMenuItem>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Manage Permissions
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem
                                onClick={() => handleDelete(role.id)}
                                disabled={deleting === role.id}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
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
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 20, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> roles
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
            {loadingRole ? (
              <div className="flex items-center justify-center p-12 flex-1">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Loading role...</p>
                </div>
              </div>
            ) : editingRole ? (
              <div className="flex flex-col h-full overflow-hidden">
                <DrawerHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DrawerTitle>{editingRole.name}</DrawerTitle>
                      <DrawerDescription className="mt-1">
                        {editingRole.description || 'No description'}
                      </DrawerDescription>
                    </div>
                    <DrawerClose />
                  </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  <form onSubmit={handleSubmit(handleUpdateRole)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold">
                        Role Name <span className="text-red-500">*</span>
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
                      <Label htmlFor="description" className="text-sm font-semibold">
                        Description
                      </Label>
                      <textarea
                        id="description"
                        {...register('description')}
                        disabled={isSubmitting}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter role description..."
                      />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="isActive"
                        {...register('isActive')}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <Label htmlFor="isActive" className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Active
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          {editingRole.isActive ? 'Role is active and can be assigned' : 'Role is inactive'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-900">Permissions</p>
                          <p className="text-xs text-indigo-700 mt-1">
                            {editingRole.permissions?.length || 0} permission(s) assigned
                          </p>
                        </div>
                        <Link href={`/roles/${editingRole.id}`}>
                          <Button variant="outline" size="sm">
                            Manage Permissions
                          </Button>
                        </Link>
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
                    onClick={handleSubmit(handleUpdateRole)}
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
                  <p className="text-gray-600 font-medium mb-2">Unable to load role</p>
                  <p className="text-sm text-gray-500 mb-4">Please try again or check your connection</p>
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Create Role Drawer */}
        <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <DrawerHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle>Create New Role</DrawerTitle>
                    <DrawerDescription>Add a new role to the system</DrawerDescription>
                  </div>
                  <DrawerClose />
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <form onSubmit={handleSubmitCreate(handleCreateRole)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="create-name" className="text-sm font-semibold">
                      Role Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-name"
                      type="text"
                      {...registerCreate('name')}
                      disabled={isCreatingRole}
                      className={createErrors.name ? 'border-red-500' : ''}
                    />
                    {createErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-description" className="text-sm font-semibold">
                      Description
                    </Label>
                    <textarea
                      id="create-description"
                      {...registerCreate('description')}
                      disabled={isCreatingRole}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter role description..."
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="create-isActive"
                      {...registerCreate('isActive')}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      disabled={isCreatingRole}
                    />
                    <div className="flex-1">
                      <Label htmlFor="create-isActive" className="text-sm font-semibold text-gray-900 cursor-pointer">
                        Active
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Role can be assigned to users
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      <strong>Note:</strong> You can assign permissions to this role after creation using the "Manage Permissions" option.
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
                  onClick={handleSubmitCreate(handleCreateRole)}
                  disabled={isCreatingRole}
                >
                  {isCreatingRole ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Role
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
