'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-header';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { EmptyState } from '@/components/shared/empty-state';
import { Permission, Role } from '@/lib/types';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { CheckSquare, Square, Loader2, Eye, Users, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';

interface PermissionWithRoles extends Permission {
  roles?: Role[];
  roleCount?: number;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PermissionWithRoles | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch permissions directly from API
      const permissionsResponse = await apiClient.get<any>('/permissions');
      const permissionsData = Array.isArray(permissionsResponse.data) 
        ? permissionsResponse.data 
        : (permissionsResponse.data as any)?.data || [];
      
      // Transform to match our interface
      const transformedPermissions: PermissionWithRoles[] = permissionsData.map((perm: any) => ({
        id: perm.id,
        name: perm.name || `${perm.resource}:${perm.action}`,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
        roles: perm.roles || [],
        roleCount: perm.roleCount || (perm.roles?.length || 0),
      }));

      setPermissions(transformedPermissions);

      // Also fetch roles for reference
      try {
        const rolesResponse = await apiClient.get<any>('/roles?skip=0&take=1000');
        const rolesData = (rolesResponse.data as any)?.data || rolesResponse.data || [];
        setRoles(rolesData);
      } catch (err) {
        console.warn('Failed to fetch roles:', err);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPermission = (permission: PermissionWithRoles) => {
    setSelectedPermission(permission);
    setDrawerOpen(true);
  };

  // Get unique resources
  const resources = Array.from(new Set(permissions.map(p => p.resource))).sort();

  // Filter permissions
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = 
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesResource = resourceFilter === 'all' || permission.resource === resourceFilter;
    
    return matchesSearch && matchesResource;
  });

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, PermissionWithRoles[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Permissions"
          description="View and manage system permissions and their role assignments"
          breadcrumbs={[{ label: 'Permissions' }]}
        />

        <ListToolbar
          searchPlaceholder="Search permissions by name, resource, or action..."
          searchValue={searchTerm}
          onSearchChange={(value) => setSearchTerm(value)}
        >
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {resources.map((resource) => (
                <SelectItem key={resource} value={resource}>
                  {resource}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ListToolbar>

        {/* Permissions List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <EmptyState
              title="No permissions found"
              description={
                searchTerm || resourceFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Permissions will appear here when roles are assigned'
              }
            />
          ) : (
            Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
              <div key={resource} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200">
                  <h2 className="text-lg font-semibold text-indigo-900 capitalize">
                    {resource} ({resourcePermissions.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {resourcePermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewPermission(permission)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{permission.name}</h3>
                              <p className="text-sm text-gray-500">
                                {permission.resource} • {permission.action}
                              </p>
                            </div>
                          </div>
                          {permission.description && (
                            <p className="text-sm text-gray-600 ml-13">{permission.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {permission.roleCount || 0}
                            </p>
                            <p className="text-xs text-gray-500">Role(s)</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Permission Detail Drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent size="lg" className="flex flex-col max-h-screen overflow-hidden">
            {selectedPermission ? (
              <div className="flex flex-col h-full overflow-hidden">
                <DrawerHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <DrawerTitle>{selectedPermission.name}</DrawerTitle>
                      <DrawerDescription>
                        {selectedPermission.resource} • {selectedPermission.action}
                      </DrawerDescription>
                    </div>
                    <DrawerClose />
                  </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {selectedPermission.description && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">{selectedPermission.description}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Assigned to Roles ({selectedPermission.roleCount || 0})
                    </h3>
                    {selectedPermission.roles && selectedPermission.roles.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPermission.roles.map((role) => (
                          <div
                            key={role.id}
                            className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{role.name}</p>
                                {role.description && (
                                  <p className="text-sm text-gray-600">{role.description}</p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                role.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No roles assigned</p>
                        <p className="text-sm text-gray-500 mt-1">
                          This permission is not assigned to any role
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <DrawerFooter className="flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Close
                  </Button>
                </DrawerFooter>
              </div>
            ) : null}
          </DrawerContent>
        </Drawer>
      </div>
    </DashboardLayout>
  );
}

