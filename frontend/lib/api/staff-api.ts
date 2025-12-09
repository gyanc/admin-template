import apiClient from '../api-client';
import { Staff, PaginatedResponse, ListQueryOptions } from '../types';

export interface CreateStaffDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  isActive?: boolean;
}

export interface UpdateStaffDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  isActive?: boolean;
}

export const staffApi = {
  /**
   * List staff members with pagination and filters
   */
  async list(options: ListQueryOptions = {}) {
    const response = await apiClient.get<PaginatedResponse<Staff>>('/staff', {
      params: {
        page: options.page || 1,
        limit: options.limit || 20,
        search: options.search,
        status: options.status,
        department: options.department,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      },
    });
    return response.data;
  },

  /**
   * Get a single staff member by ID
   */
  async getById(id: string) {
    const response = await apiClient.get<{ data: Staff } | Staff>(
      `/staff/${id}`
    );
    return (response.data as { data: Staff }).data || (response.data as Staff);
  },

  /**
   * Create a new staff member
   */
  async create(data: CreateStaffDto) {
    const response = await apiClient.post<{ data: Staff } | Staff>(
      '/staff',
      data
    );
    return (response.data as { data: Staff }).data || (response.data as Staff);
  },

  /**
   * Update an existing staff member
   */
  async update(id: string, data: UpdateStaffDto) {
    const response = await apiClient.put<{ data: Staff } | Staff>(
      `/staff/${id}`,
      data
    );
    return (response.data as { data: Staff }).data || (response.data as Staff);
  },

  /**
   * Delete a staff member
   */
  async delete(id: string) {
    await apiClient.delete(`/staff/${id}`);
  },

  /**
   * Reset staff password
   */
  async resetPassword(id: string) {
    await apiClient.post(`/staff/${id}/reset-password`);
  },
};
