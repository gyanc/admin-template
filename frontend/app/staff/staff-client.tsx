'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-header';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { DataTable, Column, Action } from '@/components/shared/data-table';
import { FormDrawer, FormField } from '@/components/shared/form-drawer';
import { StatusBadge } from '@/components/shared/status-badge';
import { Staff, PaginatedResponse } from '@/lib/types';
import { useState, useCallback } from 'react';
import { staffApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Download, Mail, UserCircle2, Phone, Building, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePagedResource } from '@/lib/hooks/use-paged-resource';
import { useEditForm } from '@/lib/hooks/use-edit-form';

const updateStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean(),
});

const createStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().default(true),
});

type UpdateStaffFormData = z.infer<typeof updateStaffSchema>;
type CreateStaffFormData = z.infer<typeof createStaffSchema>;

function normalizeStaff(staffData: any): Staff {
  let firstName = staffData.firstName;
  let lastName = staffData.lastName;
  
  if (!firstName && !lastName && staffData.name) {
    const nameParts = (staffData.name || '').split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  const isActive = staffData.isActive !== undefined 
    ? staffData.isActive 
    : (staffData.status === 'active' || staffData.status === 'ACTIVE');
  
  return {
    id: staffData.id,
    email: staffData.email,
    firstName: firstName || '',
    lastName: lastName || '',
    phone: staffData.phone,
    department: staffData.department,
    isActive,
    createdAt: staffData.createdAt || new Date().toISOString(),
    updatedAt: staffData.updatedAt || new Date().toISOString(),
    roles: staffData.roles,
  };
}

interface StaffClientProps {
  initialData?: PaginatedResponse<Staff>;
  initialPage?: number;
  initialSearch?: string;
  initialStatusFilter?: string;
}

export default function StaffClient({
  initialData,
  initialPage = 1,
  initialSearch = '',
  initialStatusFilter = 'all',
}: StaffClientProps) {
  const normalizeStaffCallback = useCallback((staffData: any) => normalizeStaff(staffData), []);

  const {
    items: staff,
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
  } = usePagedResource<Staff>({
    initialData,
    initialPage,
    initialSearch,
    initialStatus: initialStatusFilter,
    fetcher: async ({ page, limit, search, status }) => {
      const response = await staffApi.list({
        page,
        limit,
        search,
        status,
      });
      return response;
    },
    mapItem: normalizeStaffCallback,
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const editForm = useForm<UpdateStaffFormData>({
    resolver: zodResolver(updateStaffSchema),
  });

  const createForm = useForm<CreateStaffFormData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const staffMapToForm = useCallback((s: Staff | null) => ({
    firstName: s?.firstName || '',
    lastName: s?.lastName || '',
    email: s?.email || '',
    phone: s?.phone || '',
    department: s?.department || '',
    isActive: s?.isActive ?? true,
  }), []);

  useEditForm<UpdateStaffFormData>(
    editingStaff,
    editForm.reset,
    staffMapToForm
  );

  const fetchStaff = useCallback(async () => {
    try {
      await fetchPage();
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to load staff');
    }
  }, [fetchPage]);

  const handleEdit = async (staffId: string) => {
    try {
      setLoadingStaff(true);
      setDrawerOpen(true);
      
      const staffData = await staffApi.getById(staffId);
      const mappedStaff = normalizeStaff(staffData);
      setEditingStaff(mappedStaff);
    } catch (error: any) {
      console.error('Failed to load staff:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load staff';
      toast.error(message);
      setEditingStaff(null);
      setDrawerOpen(false);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleUpdateStaff = async (data: UpdateStaffFormData) => {
    if (!editingStaff) return;

    try {
      await staffApi.update(editingStaff.id, data);
      toast.success('Staff updated successfully');
      setDrawerOpen(false);
      fetchStaff();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update staff';
      toast.error(message);
    }
  };

  const handleCreateStaff = async (data: CreateStaffFormData) => {
    try {
      await staffApi.create(data);
      toast.success('Staff created successfully');
      setCreateDrawerOpen(false);
      createForm.reset();
      fetchStaff();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create staff';
      toast.error(message);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      setDeleting(staffId);
      await staffApi.delete(staffId);
      toast.success('Staff deleted successfully');
      fetchStaff();
      clearSelection();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete staff';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} staff member(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map(staffId =>
        staffApi.delete(staffId)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedIds.size} staff member(s) deleted successfully`);
      fetchStaff();
      clearSelection();
    } catch (error: any) {
      toast.error('Failed to delete some staff members');
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    try {
      const isActive = status === 'active';
      const updatePromises = Array.from(selectedIds).map(staffId =>
        staffApi.update(staffId, { isActive })
      );
      await Promise.all(updatePromises);
      toast.success(`${selectedIds.size} staff member(s) updated successfully`);
      fetchStaff();
      clearSelection();
    } catch (error: any) {
      toast.error('Failed to update some staff members');
    }
  };

  const columns: Column<Staff>[] = [
    {
      key: 'staff',
      label: 'Staff Member',
      render: (staff) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {staff.firstName?.[0]}{staff.lastName?.[0]}
          </div>
          <div>
            <span className="font-medium text-gray-900 block">
              {staff.firstName} {staff.lastName}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {staff.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (staff) => (
        <span className="flex items-center gap-1 text-gray-600">
          <Building className="w-4 h-4" />
          {staff.department || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (staff) => (
        <span className="flex items-center gap-1 text-gray-600">
          <Phone className="w-4 h-4" />
          {staff.phone || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (staff) => (
        <StatusBadge
          label={staff.isActive ? 'Active' : 'Inactive'}
          variant={staff.isActive ? 'success' : 'danger'}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (staff) => (
        <span className="text-gray-600">
          {new Date(staff.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions: Action<Staff>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: (staff) => handleEdit(staff.id),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (staff) => handleDelete(staff.id),
      disabled: (staff) => deleting === staff.id,
      className: 'text-red-600',
    },
  ];

  const editFields: FormField<UpdateStaffFormData>[] = [
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
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'staff@example.com',
      required: true,
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
      placeholder: '+1 (555) 000-0000',
    },
    {
      name: 'department',
      label: 'Department',
      type: 'text',
      placeholder: 'e.g., Engineering, Sales, HR',
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'switch',
      description: 'Enable or disable staff account',
    },
  ];

  const createFields: FormField<CreateStaffFormData>[] = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'staff@example.com',
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
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
      placeholder: '+1 (555) 000-0000',
    },
    {
      name: 'department',
      label: 'Department',
      type: 'text',
      placeholder: 'e.g., Engineering, Sales, HR',
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'switch',
      description: 'Activate staff account immediately',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Staff Management"
          description="Manage staff members, departments, and permissions"
          breadcrumbs={[{ label: 'Staff' }]}
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
                Add Staff
              </Button>
            </>
          }
        />

        <ListToolbar
          searchPlaceholder="Search staff by name, email, or department..."
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
          data={staff}
          columns={columns}
          loading={loading}
          emptyTitle="No staff found"
          emptyDescription={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding a staff member'
          }
          onEmptyAction={() => setCreateDrawerOpen(true)}
          emptyActionLabel="Add Staff"
          selectable
          selectedIds={selectedIds}
          onSelectItem={toggleSelect}
          onSelectAll={allSelected ? clearSelection : selectAll}
          allSelected={allSelected}
          getItemId={(staff) => staff.id}
          actions={actions}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={20}
          onPageChange={setPage}
          selectedCount={selectedIds.size}
          bulkActions={
            selectedIds.size > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-purple-900">
                  {selectedIds.size} staff member(s) selected
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

        {/* Edit Staff Drawer */}
        <FormDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={editingStaff ? `${editingStaff.firstName} ${editingStaff.lastName}` : 'Edit Staff'}
          description={editingStaff?.email}
          icon={<UserCircle2 className="w-6 h-6" />}
          form={editForm}
          fields={editFields}
          onSubmit={handleUpdateStaff}
          loading={loadingStaff}
          mode="edit"
        />

        {/* Create Staff Drawer */}
        <FormDrawer
          open={createDrawerOpen}
          onOpenChange={setCreateDrawerOpen}
          title="Add New Staff Member"
          description="Add a new staff member to the system"
          icon={<UserCircle2 className="w-6 h-6" />}
          form={createForm}
          fields={createFields}
          onSubmit={handleCreateStaff}
          mode="create"
        />
      </div>
    </DashboardLayout>
  );
}
