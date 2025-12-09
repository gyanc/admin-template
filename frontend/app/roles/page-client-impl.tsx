'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-header';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { DataTable, Column, Action } from '@/components/shared/data-table';
import { FormDrawer, FormField } from '@/components/shared/form-drawer';
import { StatusBadge } from '@/components/shared/status-badge';
import { Role, PaginatedResponse } from '@/lib/types';
import { useState, useCallback } from 'react';
import { rolesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Download, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePagedResource } from '@/lib/hooks/use-paged-resource';
import { useEditForm } from '@/lib/hooks/use-edit-form';

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

interface RolesClientProps {
  initialData?: PaginatedResponse<Role>;
  initialPage?: number;
  initialSearch?: string;
  initialStatusFilter?: string;
}

export default function RolesClient({
  initialData,
  initialPage = 1,
  initialSearch = '',
  initialStatusFilter = 'all',
}: RolesClientProps) {
  const normalizeRoleCallback = useCallback((role: any) => ({
    ...role,
    isActive: role?.isActive ?? true,
  }), []);

  const {
    items: roles,
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
  } = usePagedResource<Role>({
    initialData,
    initialPage,
    initialSearch,
    initialStatus: initialStatusFilter,
    fetcher: async ({ page, limit, search, status }) => {
      const response = await rolesApi.list({
        page,
        limit,
        search,
        status,
      });
      return response;
    },
    mapItem: normalizeRoleCallback,
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const editForm = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
  });

  const createForm = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const roleMapToForm = useCallback((r: Role | null) => ({
    name: r?.name || '',
    description: r?.description || '',
    isActive: r?.isActive ?? true,
  }), []);

  useEditForm<UpdateRoleFormData>(
    editingRole,
    editForm.reset,
    roleMapToForm
  );

  const fetchRoles = useCallback(async () => {
    try {
      await fetchPage();
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    }
  }, [fetchPage]);

  const handleEdit = async (roleId: string) => {
    try {
      setLoadingRole(true);
      setDrawerOpen(true);
      
      const roleData = await rolesApi.getById(roleId);
      const normalizedRole = {
        ...roleData,
        isActive: roleData.isActive !== undefined ? roleData.isActive : true,
      };
      
      setEditingRole(normalizedRole);
    } catch (error: any) {
      console.error('Failed to load role:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load role';
      toast.error(message);
      setEditingRole(null);
      setDrawerOpen(false);
    } finally {
      setLoadingRole(false);
    }
  };

  const handleUpdateRole = async (data: UpdateRoleFormData) => {
    if (!editingRole) return;

    try {
      await rolesApi.update(editingRole.id, data);
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
      await rolesApi.create(data);
      toast.success('Role created successfully');
      setCreateDrawerOpen(false);
      createForm.reset();
      fetchRoles();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create role';
      toast.error(message);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      setDeleting(roleId);
      await rolesApi.delete(roleId);
      toast.success('Role deleted successfully');
      fetchRoles();
      clearSelection();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete role';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one role');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} role(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map(roleId =>
        rolesApi.delete(roleId)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedIds.size} role(s) deleted successfully`);
      fetchRoles();
      clearSelection();
    } catch (error: any) {
      toast.error('Failed to delete some roles');
    }
  };

  const columns: Column<Role>[] = [
    {
      key: 'role',
      label: 'Role Name',
      render: (role) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-medium text-gray-900 block">
              {role.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (role) => (
        <span className="text-gray-600">{role.description || '—'}</span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (role) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {role.permissions?.length || 0} permissions
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (role) => (
        <StatusBadge
          label={role.isActive ? 'Active' : 'Inactive'}
          variant={role.isActive ? 'success' : 'danger'}
        />
      ),
    },
  ];

  const actions: Action<Role>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: (role) => handleEdit(role.id),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (role) => handleDelete(role.id),
      disabled: (role) => deleting === role.id,
      className: 'text-red-600',
    },
  ];

  const editFields: FormField<UpdateRoleFormData>[] = [
    {
      name: 'name',
      label: 'Role Name',
      type: 'text',
      placeholder: 'Enter role name',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      placeholder: 'Enter role description',
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'switch',
      description: 'Enable or disable role',
    },
  ];

  const createFields: FormField<CreateRoleFormData>[] = [
    {
      name: 'name',
      label: 'Role Name',
      type: 'text',
      placeholder: 'Enter role name',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      placeholder: 'Enter role description',
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'switch',
      description: 'Activate role immediately',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Roles & Permissions"
          description="Manage user roles and their permissions"
          breadcrumbs={[{ label: 'Roles' }]}
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
                Create Role
              </Button>
            </>
          }
        />

        <ListToolbar
          searchPlaceholder="Search roles by name..."
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
          data={roles}
          columns={columns}
          loading={loading}
          emptyTitle="No roles found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating a new role'
          }
          onEmptyAction={() => setCreateDrawerOpen(true)}
          emptyActionLabel="Create Role"
          selectable
          selectedIds={selectedIds}
          onSelectItem={toggleSelect}
          onSelectAll={allSelected ? clearSelection : selectAll}
          allSelected={allSelected}
          getItemId={(role) => role.id}
          actions={actions}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={20}
          onPageChange={setPage}
          selectedCount={selectedIds.size}
          bulkActions={
            selectedIds.size > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-900">
                  {selectedIds.size} role(s) selected
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

        {/* Edit Role Drawer */}
        <FormDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={editingRole?.name || 'Edit Role'}
          description={editingRole?.description || 'No description'}
          icon={<Shield className="w-6 h-6" />}
          form={editForm}
          fields={editFields}
          onSubmit={handleUpdateRole}
          loading={loadingRole}
          mode="edit"
        />

        {/* Create Role Drawer */}
        <FormDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          title="Create New Role"
          description="Add a new role to the system"
          icon={<Shield className="w-6 h-6" />}
          form={createForm}
          fields={createFields}
          onSubmit={handleCreateRole}
          mode="create"
        />
      </div>
    </DashboardLayout>
  );
}
