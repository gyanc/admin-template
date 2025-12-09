import apiClient from '../api-client';
import { User, PaginatedResponse, ListQueryOptions } from '../types';

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export const usersApi = {
  /**
   * List users with pagination and filters
   */
  async list(options: ListQueryOptions = {}) {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', {
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
   * Get a single user by ID
   */
  async getById(id: string) {
    const response = await apiClient.get<{ data: User } | User>(`/users/${id}`);
    return (response.data as { data: User }).data || (response.data as User);
  },

  /**
   * Create a new user
   */
  async create(data: CreateUserDto) {
    const response = await apiClient.post<{ data: User } | User>('/users', data);
    return (response.data as { data: User }).data || (response.data as User);
  },

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserDto) {
    const response = await apiClient.put<{ data: User } | User>(
      `/users/${id}`,
      data
    );
    return (response.data as { data: User }).data || (response.data as User);
  },

  /**
   * Delete a user
   */
  async delete(id: string) {
    await apiClient.delete(`/users/${id}`);
  },

  /**
   * Reset user password
   */
  async resetPassword(id: string) {
    await apiClient.post(`/users/${id}/reset-password`);
  },
};
