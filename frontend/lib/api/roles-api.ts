import apiClient from '../api-client';
import { Role, PaginatedResponse, ListQueryOptions } from '../types';

export interface CreateRoleDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const rolesApi = {
  /**
   * List roles with pagination and filters
   */
  async list(options: ListQueryOptions = {}) {
    const response = await apiClient.get<PaginatedResponse<Role>>('/roles', {
      params: {
        page: options.page || 1,
        limit: options.limit || 20,
        search: options.search,
        status: options.status,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      },
    });
    return response.data;
  },

  /**
   * Get a single role by ID
   */
  async getById(id: string) {
    const response = await apiClient.get<{ data: Role } | Role>(`/roles/${id}`);
    return (response.data as { data: Role }).data || (response.data as Role);
  },

  /**
   * Create a new role
   */
  async create(data: CreateRoleDto) {
    const response = await apiClient.post<{ data: Role } | Role>('/roles', data);
    return (response.data as { data: Role }).data || (response.data as Role);
  },

  /**
   * Update an existing role
   */
  async update(id: string, data: UpdateRoleDto) {
    const response = await apiClient.put<{ data: Role } | Role>(
      `/roles/${id}`,
      data
    );
    return (response.data as { data: Role }).data || (response.data as Role);
  },

  /**
   * Delete a role
   */
  async delete(id: string) {
    await apiClient.delete(`/roles/${id}`);
  },
};
