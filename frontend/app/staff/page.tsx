'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Staff, PaginatedResponse } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Plus, Search, Edit2, Trash2, MoreVertical, Loader2, UserCheck, CheckSquare, Square, Filter, Download, Mail, Calendar, KeyRound, Shield, Save, CheckCircle2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

// Helper function to normalize staff data from backend
function normalizeStaff(staffData: any): Staff {
  // Handle backend structure: name might be a string that needs to be split
  let firstName = staffData.firstName;
  let lastName = staffData.lastName;
  
  // If backend returns 'name' instead of firstName/lastName, split it
  if (!firstName && !lastName && staffData.name) {
    const nameParts = (staffData.name || '').split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // Map status to isActive if needed
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

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateStaffFormData>({
    resolver: zodResolver(updateStaffSchema),
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreatingStaff },
    reset: resetCreate,
  } = useForm<CreateStaffFormData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      isActive: true,
    },
  });

  useEffect(() => {
    fetchStaff();
  }, [page, searchTerm, statusFilter, departmentFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<Staff>>('/staff', {
        params: {
          page,
          limit: 20,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });

      if (response.data.data) {
        setStaff(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotal(response.data.meta.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (staffId: string) => {
    try {
      setLoadingStaff(true);
      setDrawerOpen(true); // Open drawer first to show loading state
      
      console.log('Fetching staff with ID:', staffId);
      const response = await apiClient.get(`/staff/${staffId}`);
      console.log('Staff response:', response.data);
      
      // Handle different response structures
      const staffData = response.data?.data || response.data;
      
      if (!staffData) {
        throw new Error('Staff data not found in response');
      }
      
      // Normalize staff data from backend
      const mappedStaff = normalizeStaff(staffData);
      
      setEditingStaff(mappedStaff);
      reset({
        firstName: mappedStaff.firstName,
        lastName: mappedStaff.lastName,
        email: mappedStaff.email,
        phone: mappedStaff.phone || '',
        department: mappedStaff.department || '',
        isActive: mappedStaff.isActive,
      });
    } catch (error: any) {
      console.error('Failed to load staff member:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Failed to load staff member';
      toast.error(message);
      // Keep drawer open to show error state
      setEditingStaff(null);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleUpdateStaff = async (data: UpdateStaffFormData) => {
    if (!editingStaff) return;

    try {
      await apiClient.put(`/staff/${editingStaff.id}`, data);
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
      await apiClient.post('/staff', {
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        phone: data.phone || undefined,
        department: data.department || undefined,
      });
      toast.success('Staff created successfully. Temporary password has been generated.');
      setCreateDrawerOpen(false);
      resetCreate();
      fetchStaff();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create staff';
      toast.error(message);
    }
  };

  const handleResetPassword = async () => {
    if (!editingStaff) return;
    
    if (!confirm('Are you sure you want to reset this staff member\'s password? A temporary password will be generated.')) return;
    
    try {
      await apiClient.post(`/staff/${editingStaff.id}/password-reset`);
      toast.success('Password reset email sent to staff member');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      setDeleting(staffId);
      await apiClient.delete(`/staff/${staffId}`);
      toast.success('Staff deleted successfully');
      fetchStaff();
      setSelectedStaff(new Set());
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete staff';
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStaff.size === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStaff.size} staff member(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedStaff).map(staffId =>
        apiClient.delete(`/staff/${staffId}`)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedStaff.size} staff member(s) deleted successfully`);
      fetchStaff();
      setSelectedStaff(new Set());
    } catch (error: any) {
      toast.error('Failed to delete some staff members');
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    if (selectedStaff.size === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    try {
      const updatePromises = Array.from(selectedStaff).map(staffId =>
        apiClient.put(`/staff/${staffId}/status`, { status })
      );
      await Promise.all(updatePromises);
      toast.success(`${selectedStaff.size} staff member(s) updated successfully`);
      fetchStaff();
      setSelectedStaff(new Set());
    } catch (error: any) {
      toast.error('Failed to update some staff members');
    }
  };

  const handleSelectAll = () => {
    if (selectedStaff.size === staff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(staff.map(s => s.id)));
    }
  };

  const handleSelectStaff = (staffId: string) => {
    const newSelected = new Set(selectedStaff);
    if (newSelected.has(staffId)) {
      newSelected.delete(staffId);
    } else {
      newSelected.add(staffId);
    }
    setSelectedStaff(newSelected);
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Get unique departments from staff
  const departments = Array.from(new Set(staff.map(s => s.department).filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Staff Management' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">
              Manage admin staff members, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Staff
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
                placeholder="Search staff by name or email..."
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

            {/* Department Filter */}
            {departments.length > 0 && (
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept || ''} value={dept || ''}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedStaff.size > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-green-900">
                {selectedStaff.size} staff member(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('active')}>
                  Activate
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('inactive')}>
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedStaff(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No staff members found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new staff member'}
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
                          {selectedStaff.size === staff.length ? (
                            <CheckSquare className="w-5 h-5 text-green-600" />
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
                        Department
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
                    {staff.map((member) => (
                      <tr
                        key={member.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedStaff.has(member.id) ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectStaff(member.id)}
                            className="flex items-center"
                          >
                            {selectedStaff.has(member.id) ? (
                              <CheckSquare className="w-5 h-5 text-green-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 block">
                                {member.firstName} {member.lastName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{member.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{member.department || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              member.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">
                            {new Date(member.createdAt).toLocaleDateString('en-US', {
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
                              <DropdownMenuItem onClick={() => handleEdit(member.id)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id)}
                                disabled={deleting === member.id}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deleting === member.id ? 'Deleting...' : 'Delete'}
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
                  <span className="font-medium">{total}</span> staff members
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
            {loadingStaff ? (
              <div className="flex items-center justify-center p-12 flex-1">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Loading staff member...</p>
                </div>
              </div>
            ) : editingStaff ? (
              <div className="flex flex-col h-full overflow-hidden">
                <DrawerHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                      {editingStaff.firstName?.[0]}{editingStaff.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <DrawerTitle>
                        {editingStaff.firstName} {editingStaff.lastName}
                      </DrawerTitle>
                      <DrawerDescription className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" />
                        {editingStaff.email}
                      </DrawerDescription>
                    </div>
                    <DrawerClose />
                  </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  <form onSubmit={handleSubmit(handleUpdateStaff)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                        )}
                      </div>

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
                          <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          disabled={isSubmitting}
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          type="text"
                          {...register('phone')}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="department" className="text-sm font-semibold">
                          Department
                        </Label>
                        <Input
                          id="department"
                          type="text"
                          {...register('department')}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="isActive"
                        {...register('isActive')}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <Label htmlFor="isActive" className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Active Account
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          {editingStaff.isActive ? 'Staff can log in and access the system' : 'Staff account is inactive'}
                        </p>
                      </div>
                      {editingStaff.isActive && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gray-500 text-xs mb-1">Created</p>
                          <p className="font-medium text-gray-900">
                            {new Date(editingStaff.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

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

                <DrawerFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit(handleUpdateStaff)}
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
                  <p className="text-gray-600 font-medium mb-2">Unable to load staff member</p>
                  <p className="text-sm text-gray-500 mb-4">Please try again or check your connection</p>
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Create Staff Drawer */}
        <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <DrawerHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle>Create New Staff Member</DrawerTitle>
                    <DrawerDescription>Add a new staff member to the system</DrawerDescription>
                  </div>
                  <DrawerClose />
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <form onSubmit={handleSubmitCreate(handleCreateStaff)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="create-firstName" className="text-sm font-semibold">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="create-firstName"
                        type="text"
                        {...registerCreate('firstName')}
                        disabled={isCreatingStaff}
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
                        disabled={isCreatingStaff}
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
                      disabled={isCreatingStaff}
                      className={createErrors.email ? 'border-red-500' : ''}
                    />
                    {createErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{createErrors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="create-phone" className="text-sm font-semibold">
                        Phone
                      </Label>
                      <Input
                        id="create-phone"
                        type="text"
                        {...registerCreate('phone')}
                        disabled={isCreatingStaff}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-department" className="text-sm font-semibold">
                        Department
                      </Label>
                      <Input
                        id="create-department"
                        type="text"
                        {...registerCreate('department')}
                        disabled={isCreatingStaff}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Note:</strong> A temporary password will be automatically generated and can be reset later.
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
                  onClick={handleSubmitCreate(handleCreateStaff)}
                  disabled={isCreatingStaff}
                >
                  {isCreatingStaff ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Staff
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
